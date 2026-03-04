/* ========================================
   NEON DRIFT — Multiplayer Server
   WebSocket server for Render deployment
   ======================================== */

const http = require('http');
const { WebSocketServer } = require('ws');
const os = require('os');

const PORT = process.env.PORT || 3000;

// Simple HTTP server for health check (Render needs this)
const server = http.createServer((req, res) => {
    // CORS headers for cross-origin requests from Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            game: 'Neon Drift',
            players: getTotalPlayers(),
            uptime: Math.floor(process.uptime()),
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const wss = new WebSocketServer({ server });

// ============= GAME STATE =============
const rooms = new Map();
const DEFAULT_ROOM = 'main';

function getTotalPlayers() {
    let count = 0;
    rooms.forEach(r => count += r.players.size);
    return count;
}

function getOrCreateRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, {
            id: roomId,
            players: new Map(),
            state: 'lobby',
            hostId: null,
            raceStartTime: null,
            powerupStates: [],
        });
    }
    return rooms.get(roomId);
}

// ============= WEBSOCKET HANDLING =============
let nextPlayerId = 1;

wss.on('connection', (ws) => {
    const playerId = 'player_' + nextPlayerId++;
    let playerRoom = null;

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    ws.send(JSON.stringify({ type: 'welcome', playerId }));

    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data);
            handleMessage(ws, playerId, msg);
        } catch (e) { /* ignore */ }
    });

    ws.on('close', () => {
        if (playerRoom) {
            const room = rooms.get(playerRoom);
            if (room) {
                room.players.delete(playerId);
                if (room.hostId === playerId && room.players.size > 0) {
                    room.hostId = room.players.keys().next().value;
                    broadcastToRoom(room.id, { type: 'host_changed', hostId: room.hostId });
                }
                broadcastToRoom(room.id, {
                    type: 'player_left', playerId, players: getPlayerList(room)
                });
                if (room.players.size === 0) rooms.delete(room.id);
            }
        }
        console.log(`Player ${playerId} disconnected`);
    });

    function handleMessage(ws, playerId, msg) {
        switch (msg.type) {
            case 'join': {
                const room = getOrCreateRoom(DEFAULT_ROOM);
                playerRoom = room.id;
                const player = {
                    id: playerId, ws,
                    name: msg.name || ('Racer ' + playerId.split('_')[1]),
                    carType: msg.carType || 'sport',
                    color1: msg.color1 || '#ff2d95',
                    color2: msg.color2 || '#ff6a00',
                    ready: false,
                    x: 0, y: 0, angle: 0, speed: 0,
                    drifting: false, gear: 1, brake: 0,
                    activePowerup: null, shielded: false, miniScale: 1,
                    lap: 1, finished: false, finishTime: 0,
                };
                room.players.set(playerId, player);
                if (!room.hostId) room.hostId = playerId;
                ws.send(JSON.stringify({
                    type: 'joined', roomId: room.id, playerId,
                    hostId: room.hostId, players: getPlayerList(room), roomState: room.state,
                }));
                broadcastToRoom(room.id, {
                    type: 'player_joined', players: getPlayerList(room), hostId: room.hostId,
                }, playerId);
                console.log(`${player.name} (${playerId}) joined`);
                break;
            }
            case 'update_car': {
                const room = rooms.get(playerRoom); if (!room) return;
                const player = room.players.get(playerId); if (!player) return;
                if (msg.carType) player.carType = msg.carType;
                if (msg.color1) player.color1 = msg.color1;
                if (msg.color2) player.color2 = msg.color2;
                if (msg.name) player.name = msg.name;
                broadcastToRoom(room.id, { type: 'player_updated', players: getPlayerList(room) });
                break;
            }
            case 'ready': {
                const room = rooms.get(playerRoom); if (!room) return;
                const player = room.players.get(playerId); if (!player) return;
                player.ready = !player.ready;
                broadcastToRoom(room.id, {
                    type: 'player_ready', playerId, ready: player.ready, players: getPlayerList(room),
                });
                break;
            }
            case 'start_race': {
                const room = rooms.get(playerRoom);
                if (!room || room.hostId !== playerId) return;
                let allReady = true;
                room.players.forEach(p => { if (!p.ready) allReady = false; });
                if (!allReady && room.players.size > 1) return;
                room.state = 'countdown';
                room.raceStartTime = Date.now() + 4000;
                room.powerupStates = [];
                broadcastToRoom(room.id, { type: 'race_starting', startTime: room.raceStartTime });
                setTimeout(() => { if (room.state === 'countdown') room.state = 'racing'; }, 4500);
                console.log(`Race starting!`);
                break;
            }
            case 'position': {
                const room = rooms.get(playerRoom); if (!room) return;
                const player = room.players.get(playerId); if (!player) return;
                Object.assign(player, {
                    x: msg.x, y: msg.y, angle: msg.angle, speed: msg.speed,
                    drifting: msg.drifting, gear: msg.gear, brake: msg.brake,
                    activePowerup: msg.activePowerup, shielded: msg.shielded,
                    miniScale: msg.miniScale, lap: msg.lap || 1,
                });
                broadcastToRoom(room.id, {
                    type: 'player_position', playerId,
                    x: msg.x, y: msg.y, angle: msg.angle, speed: msg.speed,
                    drifting: msg.drifting, gear: msg.gear, brake: msg.brake,
                    activePowerup: msg.activePowerup, shielded: msg.shielded,
                    miniScale: msg.miniScale, lap: msg.lap,
                }, playerId);
                break;
            }
            case 'powerup_picked': {
                const room = rooms.get(playerRoom); if (!room) return;
                room.powerupStates.push(msg.powerupIndex);
                broadcastToRoom(room.id, {
                    type: 'powerup_removed', powerupIndex: msg.powerupIndex, playerId,
                }, playerId);
                break;
            }
            case 'lap_complete': {
                const room = rooms.get(playerRoom); if (!room) return;
                broadcastToRoom(room.id, { type: 'player_lap', playerId, lap: msg.lap });
                break;
            }
            case 'race_finished': {
                const room = rooms.get(playerRoom); if (!room) return;
                const player = room.players.get(playerId); if (!player) return;
                player.finished = true; player.finishTime = msg.time;
                broadcastToRoom(room.id, {
                    type: 'player_finished', playerId, name: player.name,
                    time: msg.time, players: getPlayerList(room),
                });
                let allFinished = true;
                room.players.forEach(p => { if (!p.finished) allFinished = false; });
                if (allFinished) {
                    room.state = 'finished';
                    broadcastToRoom(room.id, { type: 'race_over', players: getPlayerList(room) });
                }
                break;
            }
            case 'return_to_lobby': {
                const room = rooms.get(playerRoom);
                if (!room || room.hostId !== playerId) return;
                room.state = 'lobby'; room.powerupStates = [];
                room.players.forEach(p => {
                    p.ready = false; p.finished = false; p.finishTime = 0; p.lap = 1;
                });
                broadcastToRoom(room.id, { type: 'back_to_lobby', players: getPlayerList(room) });
                break;
            }
        }
    }
});

// ============= HELPERS =============
function getPlayerList(room) {
    const list = [];
    room.players.forEach(p => {
        list.push({
            id: p.id, name: p.name, carType: p.carType,
            color1: p.color1, color2: p.color2, ready: p.ready,
            lap: p.lap, finished: p.finished, finishTime: p.finishTime,
        });
    });
    return list;
}

function broadcastToRoom(roomId, msg, excludeId) {
    const room = rooms.get(roomId); if (!room) return;
    const data = JSON.stringify(msg);
    room.players.forEach(player => {
        if (player.id !== excludeId && player.ws.readyState === 1) player.ws.send(data);
    });
}

// Heartbeat
const heartbeat = setInterval(() => {
    wss.clients.forEach(ws => {
        if (!ws.isAlive) return ws.terminate();
        ws.isAlive = false; ws.ping();
    });
}, 30000);
wss.on('close', () => clearInterval(heartbeat));

// ============= START =============
server.listen(PORT, () => {
    console.log('\n====================================');
    console.log('  🏎️  NEON DRIFT — Multiplayer Server');
    console.log('====================================');
    console.log(`  Port: ${PORT}`);
    console.log('====================================\n');
});
