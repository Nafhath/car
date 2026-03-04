/* ========================================
   NEON DRIFT — Network Client
   WebSocket multiplayer connection manager
   
   DEPLOYMENT CONFIG:
   - For local dev: leave WS_URL as null (auto-detects)
   - For production: set WS_URL to your Render backend URL
     e.g., 'wss://neon-drift-server.onrender.com'
   ======================================== */

// ⚡ SET YOUR RENDER BACKEND URL HERE FOR PRODUCTION ⚡
const WS_URL = 'wss://car-i729.onrender.com';

function getWebSocketURL() {
    // If explicitly configured, use that
    if (WS_URL) return WS_URL;
    // Auto-detect from page origin (works for local dev)
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${location.host}`;
}

class NetworkManager {
    constructor() {
        this.ws = null;
        this.playerId = null;
        this.hostId = null;
        this.roomId = null;
        this.connected = false;
        this.players = [];
        this.remotePlayers = new Map(); // id -> interpolated state
        this.isMultiplayer = false;
        this.callbacks = {};
        this.sendInterval = null;
        this.playerName = '';
    }

    connect() {
        const url = getWebSocketURL();
        try {
            this.ws = new WebSocket(url);
        } catch (e) {
            console.log('WebSocket not available, single-player mode');
            return;
        }

        this.ws.onopen = () => {
            this.connected = true;
            console.log('Connected to server');
            this.emit('connected');
        };

        this.ws.onclose = () => {
            this.connected = false;
            this.isMultiplayer = false;
            this.stopSending();
            console.log('Disconnected from server');
            this.emit('disconnected');
        };

        this.ws.onerror = () => {
            console.log('WebSocket error — running in single-player mode');
        };

        this.ws.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                this.handleMessage(msg);
            } catch (err) { /* ignore */ }
        };
    }

    handleMessage(msg) {
        switch (msg.type) {
            case 'welcome':
                this.playerId = msg.playerId;
                this.emit('welcome', msg);
                break;

            case 'joined':
                this.roomId = msg.roomId;
                this.hostId = msg.hostId;
                this.players = msg.players;
                this.isMultiplayer = true;
                this.emit('joined', msg);
                break;

            case 'player_joined':
                this.players = msg.players;
                this.hostId = msg.hostId;
                this.emit('player_joined', msg);
                break;

            case 'player_left':
                this.players = msg.players;
                this.remotePlayers.delete(msg.playerId);
                this.emit('player_left', msg);
                break;

            case 'player_updated':
                this.players = msg.players;
                this.emit('player_updated', msg);
                break;

            case 'player_ready':
                this.players = msg.players;
                this.emit('player_ready', msg);
                break;

            case 'host_changed':
                this.hostId = msg.hostId;
                this.emit('host_changed', msg);
                break;

            case 'race_starting':
                this.emit('race_starting', msg);
                break;

            case 'player_position':
                this.updateRemotePlayer(msg);
                break;

            case 'powerup_removed':
                this.emit('powerup_removed', msg);
                break;

            case 'player_lap':
                this.emit('player_lap', msg);
                break;

            case 'player_finished':
                this.players = msg.players;
                this.emit('player_finished', msg);
                break;

            case 'race_over':
                this.players = msg.players;
                this.emit('race_over', msg);
                break;

            case 'back_to_lobby':
                this.players = msg.players;
                this.remotePlayers.clear();
                this.emit('back_to_lobby', msg);
                break;
        }
    }

    updateRemotePlayer(msg) {
        let rp = this.remotePlayers.get(msg.playerId);
        if (!rp) {
            const pInfo = this.players.find(p => p.id === msg.playerId);
            rp = {
                id: msg.playerId,
                name: pInfo ? pInfo.name : 'Unknown',
                carType: pInfo ? pInfo.carType : 'sport',
                color1: pInfo ? pInfo.color1 : '#ff2d95',
                color2: pInfo ? pInfo.color2 : '#ff6a00',
                targetX: msg.x, targetY: msg.y, targetAngle: msg.angle,
                x: msg.x, y: msg.y, angle: msg.angle,
                speed: msg.speed, drifting: msg.drifting,
                gear: msg.gear, brake: msg.brake,
                activePowerup: msg.activePowerup,
                shielded: msg.shielded, miniScale: msg.miniScale,
                lap: msg.lap || 1,
                lastUpdate: performance.now(),
            };
            this.remotePlayers.set(msg.playerId, rp);
        } else {
            rp.targetX = msg.x;
            rp.targetY = msg.y;
            rp.targetAngle = msg.angle;
            rp.speed = msg.speed;
            rp.drifting = msg.drifting;
            rp.gear = msg.gear;
            rp.brake = msg.brake;
            rp.activePowerup = msg.activePowerup;
            rp.shielded = msg.shielded;
            rp.miniScale = msg.miniScale;
            rp.lap = msg.lap || 1;
            rp.lastUpdate = performance.now();
        }
    }

    interpolateRemotePlayers(dt) {
        const lerpSpeed = 12;
        this.remotePlayers.forEach(rp => {
            rp.x += (rp.targetX - rp.x) * lerpSpeed * dt;
            rp.y += (rp.targetY - rp.y) * lerpSpeed * dt;
            let angleDiff = rp.targetAngle - rp.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            rp.angle += angleDiff * lerpSpeed * dt;
        });
    }

    // ============= SEND METHODS =============
    send(msg) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    joinRoom(name, carType, color1, color2) {
        this.playerName = name;
        this.send({ type: 'join', name, carType, color1, color2 });
    }

    updateCar(carType, color1, color2, name) {
        this.send({ type: 'update_car', carType, color1, color2, name });
    }

    toggleReady() { this.send({ type: 'ready' }); }
    startRace() { this.send({ type: 'start_race' }); }

    sendPosition(car, lap) {
        this.send({
            type: 'position',
            x: car.x, y: car.y, angle: car.angle,
            speed: car.speed, drifting: car.drifting,
            gear: car.gear, brake: car.brake,
            activePowerup: car.activePowerup ? car.activePowerup.id : null,
            shielded: car.shielded, miniScale: car.miniScale,
            lap: lap,
        });
    }

    sendPowerupPicked(index) { this.send({ type: 'powerup_picked', powerupIndex: index }); }
    sendLapComplete(lap) { this.send({ type: 'lap_complete', lap }); }
    sendRaceFinished(time) { this.send({ type: 'race_finished', time }); }
    returnToLobby() { this.send({ type: 'return_to_lobby' }); }

    startSending(getCarFn, getLapFn) {
        this.stopSending();
        this.sendInterval = setInterval(() => {
            const car = getCarFn();
            const lap = getLapFn();
            if (car) this.sendPosition(car, lap);
        }, 33);
    }

    stopSending() {
        if (this.sendInterval) { clearInterval(this.sendInterval); this.sendInterval = null; }
    }

    // ============= EVENT SYSTEM =============
    on(event, fn) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(fn);
    }

    emit(event, data) {
        if (this.callbacks[event]) this.callbacks[event].forEach(fn => fn(data));
    }

    get isHost() { return this.playerId === this.hostId; }
    get playerCount() { return this.players.length; }
}

const network = new NetworkManager();
