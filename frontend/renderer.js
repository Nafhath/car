/* ========================================
   NEON DRIFT — Game Manager & Renderer v2
   Realistic visuals, power-ups, decorations
   ======================================== */

// ============= MAIN GAME =============
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.keys = { up: false, down: false, left: false, right: false, space: false };
        this.lastTime = 0; this.animFrame = null;

        // Track
        const cp = generateTrack();
        this.trackCenter = catmullRomSpline(cp, 25);
        const hw = 70;
        const edges = buildTrackEdges(this.trackCenter, hw);
        this.trackInner = edges.inner; this.trackOuter = edges.outer;
        this.trackWidth = hw * 2;

        // Checkpoints
        this.checkpoints = [];
        const cpI = Math.floor(this.trackCenter.length / 8);
        for (let i = 0; i < 8; i++) this.checkpoints.push(i * cpI);

        this.playerCar = null; this.aiCars = [];
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.powerups = []; this.decorations = this.generateDecorations();
        this.isMultiplayer = false;

        this.resize();
        this.setupEventListeners();
        this.setupNetwork();
    }

    generateDecorations() {
        const decs = [], n = this.trackCenter.length;
        for (let i = 0; i < n; i += 6) {
            const prev = this.trackCenter[(i - 1 + n) % n], curr = this.trackCenter[i], next = this.trackCenter[(i + 1) % n];
            const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const outerDist = 100 + Math.random() * 80;
            const r = Math.random();
            // Trees with trunk+canopy
            if (r < 0.35) {
                decs.push({ type: 'pine', x: curr.x - nx * outerDist, y: curr.y - ny * outerDist, size: 10 + Math.random() * 14, shade: Math.random() });
                decs.push({ type: 'pine', x: curr.x + nx * outerDist, y: curr.y + ny * outerDist, size: 10 + Math.random() * 14, shade: Math.random() });
            } else if (r < 0.5) {
                // Lamp posts along track edge
                decs.push({ type: 'lamp', x: curr.x - nx * (82 + Math.random() * 10), y: curr.y - ny * (82 + Math.random() * 10) });
            } else if (r < 0.6) {
                // Barrier/tire wall
                decs.push({ type: 'barrier', x: curr.x - nx * 78, y: curr.y - ny * 78, angle: Math.atan2(dy, dx) });
            } else if (r < 0.68 && i % 48 === 0) {
                // Grandstand/building
                decs.push({ type: 'building', x: curr.x - nx * (130 + Math.random() * 40), y: curr.y - ny * (130 + Math.random() * 40), w: 40 + Math.random() * 30, h: 25 + Math.random() * 20, hue: Math.random() * 360 });
            } else if (r < 0.8) {
                // Rocks
                decs.push({ type: 'rock', x: curr.x + nx * (outerDist + 10), y: curr.y + ny * (outerDist + 10), size: 4 + Math.random() * 8 });
            } else {
                // Bush
                decs.push({ type: 'bush', x: curr.x - nx * (outerDist - 10), y: curr.y - ny * (outerDist - 10), size: 5 + Math.random() * 8, shade: Math.random() });
            }
        }
        return decs;
    }

    spawnPowerups() {
        this.powerups = [];
        const n = this.trackCenter.length;
        const interval = Math.floor(n / CONFIG.POWERUP_COUNT);
        for (let i = 0; i < CONFIG.POWERUP_COUNT; i++) {
            const idx = (i * interval + Math.floor(Math.random() * 30)) % n;
            const p = this.trackCenter[idx];
            this.powerups.push({
                x: p.x + (Math.random() - 0.5) * 40, y: p.y + (Math.random() - 0.5) * 40,
                type: POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)],
                active: true, respawnTimer: 0, bobPhase: Math.random() * Math.PI * 2
            });
        }
    }

    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => {
            this.handleKey(e.code, true);
            if (e.code === 'Escape' && gameState.screen === 'game') this.togglePause();
            // Prevent arrow key scrolling
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => this.handleKey(e.code, false));

        document.getElementById('singleplayer-btn').addEventListener('click', () => { this.isMultiplayer = false; this.startRace(); });
        document.getElementById('multiplayer-btn').addEventListener('click', () => this.joinLobby());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('quit-btn').addEventListener('click', () => this.goToMenu());
        document.getElementById('restart-btn').addEventListener('click', () => { if (this.isMultiplayer) this.goToMenu(); else this.startRace(); });
        document.getElementById('menu-btn').addEventListener('click', () => this.goToMenu());
        document.getElementById('ready-btn').addEventListener('click', () => network.toggleReady());
        document.getElementById('start-race-btn').addEventListener('click', () => network.startRace());
        document.getElementById('lobby-back-btn').addEventListener('click', () => this.goToMenu());

        // Car selection
        document.querySelectorAll('.car-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.car-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.selectedCar = btn.dataset.car;
            });
        });

        // Color swatches
        document.querySelectorAll('.color-swatch').forEach(sw => {
            sw.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                sw.classList.add('selected');
                gameState.selectedColor = sw.dataset.color;
                document.getElementById('custom-color').value = sw.dataset.color;
            });
        });
        document.getElementById('custom-color').addEventListener('input', (e) => {
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            gameState.selectedColor = e.target.value;
        });

        // Mobile touch controls
        this.setupTouchControls();
    }

    setupTouchControls() {
        const touchMap = [
            { id: 'touch-left', key: 'left' },
            { id: 'touch-right', key: 'right' },
            { id: 'touch-gas', key: 'up' },
            { id: 'touch-brake', key: 'down' },
            { id: 'touch-handbrake', key: 'space' },
        ];

        touchMap.forEach(({ id, key }) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            const onStart = (e) => {
                e.preventDefault();
                this.keys[key] = true;
                btn.classList.add('active');
            };
            const onEnd = (e) => {
                e.preventDefault();
                this.keys[key] = false;
                btn.classList.remove('active');
            };

            btn.addEventListener('touchstart', onStart, { passive: false });
            btn.addEventListener('touchend', onEnd, { passive: false });
            btn.addEventListener('touchcancel', onEnd, { passive: false });

            // Also support mouse for testing on desktop
            btn.addEventListener('mousedown', onStart);
            btn.addEventListener('mouseup', onEnd);
            btn.addEventListener('mouseleave', onEnd);
        });

        // Prevent zoom/scroll on canvas during gameplay
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    }

    handleKey(code, pressed) {
        switch (code) {
            case 'ArrowUp': this.keys.up = pressed; break;
            case 'ArrowDown': this.keys.down = pressed; break;
            case 'ArrowLeft': this.keys.left = pressed; break;
            case 'ArrowRight': this.keys.right = pressed; break;
            case 'Space': this.keys.space = pressed; break;
        }
    }

    showScreen(name) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(name + '-screen').classList.add('active');
        gameState.screen = name;
    }
    goToMenu() {
        this.showScreen('start');
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        gameState.paused = false;
        this.isMultiplayer = false;
        network.stopSending();
        document.getElementById('pause-overlay').classList.add('hidden');
    }

    // ============= NETWORK =============
    setupNetwork() {
        network.connect();

        network.on('connected', () => {
            document.getElementById('connection-status').textContent = '✅ Connected to server';
            document.getElementById('connection-status').classList.remove('error');
        });
        network.on('disconnected', () => {
            document.getElementById('connection-status').textContent = '❌ Disconnected';
            document.getElementById('connection-status').classList.add('error');
        });
        network.on('joined', (msg) => this.updateLobbyUI());
        network.on('player_joined', () => this.updateLobbyUI());
        network.on('player_left', () => this.updateLobbyUI());
        network.on('player_ready', () => this.updateLobbyUI());
        network.on('player_updated', () => this.updateLobbyUI());
        network.on('host_changed', () => this.updateLobbyUI());

        network.on('race_starting', (msg) => {
            this.startMultiplayerRace(msg.startTime);
        });

        network.on('powerup_removed', (msg) => {
            if (this.powerups[msg.powerupIndex]) {
                this.powerups[msg.powerupIndex].active = false;
                this.powerups[msg.powerupIndex].respawnTimer = CONFIG.POWERUP_RESPAWN;
            }
        });

        network.on('back_to_lobby', () => {
            network.stopSending();
            this.showScreen('lobby');
            this.updateLobbyUI();
        });
    }

    joinLobby() {
        this.isMultiplayer = true;
        const name = document.getElementById('player-name').value.trim() || 'Racer';
        const c1 = gameState.selectedColor;
        const c2 = this.darkenColor(c1, 0.6);
        this.showScreen('lobby');

        if (network.connected) {
            network.joinRoom(name, gameState.selectedCar, c1, c2);
        } else {
            // Retry connection
            network.connect();
            setTimeout(() => {
                if (network.connected) network.joinRoom(name, gameState.selectedCar, c1, c2);
            }, 1500);
        }
    }

    updateLobbyUI() {
        const container = document.getElementById('lobby-players');
        container.innerHTML = '';

        network.players.forEach(p => {
            const isYou = p.id === network.playerId;
            const isHost = p.id === network.hostId;
            const card = document.createElement('div');
            card.className = 'lobby-player-card' + (p.ready ? ' ready' : '') + (isYou ? ' is-you' : '');
            card.innerHTML = `
                <div class="player-card-left">
                    <div class="player-color-dot" style="background:${p.color1}"></div>
                    <div>
                        <div class="player-card-name">${p.name}${isYou ? ' (You)' : ''}${isHost ? '<span class="player-card-host">👑 HOST</span>' : ''}</div>
                        <div class="player-card-car">${p.carType}</div>
                    </div>
                </div>
                <div class="player-card-status ${p.ready ? 'ready-status' : 'waiting'}">
                    ${p.ready ? 'READY' : 'WAITING'}
                </div>`;
            container.appendChild(card);
        });

        // Show/hide start button for host
        const startBtn = document.getElementById('start-race-btn');
        startBtn.style.display = network.isHost ? 'inline-block' : 'none';
    }

    startMultiplayerRace(startTime) {
        // Reset game state
        gameState.raceStarted = false; gameState.raceFinished = false;
        gameState.totalTime = 0; gameState.lapTimes = []; gameState.bestLap = Infinity;
        gameState.currentLap = 1; gameState.maxSpeed = 0;
        gameState.driftScore = 0; gameState.currentDriftScore = 0; gameState.isDrifting = false;
        gameState.paused = false; gameState.powerupsUsed = 0;
        this.checkpointsHit = new Set(); this.lapStartTime = 0;

        // Place players at staggered start positions
        const myIndex = network.players.findIndex(p => p.id === network.playerId);
        const sp = this.trackCenter[0], np = this.trackCenter[1];
        const sa = Math.atan2(np.x - sp.x, -(np.y - sp.y));
        const dx = Math.sin(sa), dy = -Math.cos(sa);

        const myInfo = network.players.find(p => p.id === network.playerId);
        const c1 = myInfo ? myInfo.color1 : gameState.selectedColor;
        const c2 = myInfo ? myInfo.color2 : this.darkenColor(c1, 0.6);
        this.playerCar = new Car(
            sp.x - dy * myIndex * 50,
            sp.y + dx * myIndex * 50,
            sa, gameState.selectedCar, c1, c2
        );

        // No AI in multiplayer
        this.aiCars = [];
        this.spawnPowerups();
        this.showScreen('game');
        document.getElementById('pause-overlay').classList.add('hidden');

        // Synchronized countdown based on server time
        const delay = Math.max(0, startTime - Date.now());
        setTimeout(() => this.startCountdown(), delay > 1000 ? delay - 3500 : 0);

        // Start sending position updates
        network.startSending(
            () => this.playerCar,
            () => gameState.currentLap
        );
    }
    togglePause() {
        gameState.paused = !gameState.paused;
        document.getElementById('pause-overlay').classList.toggle('hidden');
        if (!gameState.paused) { this.lastTime = performance.now(); this.loop(this.lastTime); }
    }

    darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
    }

    startRace() {
        // Single-player mode
        this.isMultiplayer = false;
        gameState.raceStarted = false; gameState.raceFinished = false;
        gameState.totalTime = 0; gameState.lapTimes = []; gameState.bestLap = Infinity;
        gameState.currentLap = 1; gameState.maxSpeed = 0;
        gameState.driftScore = 0; gameState.currentDriftScore = 0; gameState.isDrifting = false;
        gameState.paused = false; gameState.powerupsUsed = 0;
        this.checkpointsHit = new Set(); this.lapStartTime = 0;

        const sp = this.trackCenter[0], np = this.trackCenter[1];
        const sa = Math.atan2(np.x - sp.x, -(np.y - sp.y));
        const c1 = gameState.selectedColor;
        const c2 = this.darkenColor(c1, 0.6);
        this.playerCar = new Car(sp.x, sp.y, sa, gameState.selectedCar, c1, c2);

        this.aiCars = [];
        const aiTypes = Object.keys(CONFIG.cars);
        const aiColors = ['#00f0ff', '#ff2d95', '#39ff14', '#ffd700', '#ff4444'];
        for (let i = 0; i < 5; i++) {
            const off = (i + 1) * 30;
            const si = this.trackCenter.length - off;
            const ap = this.trackCenter[si % this.trackCenter.length];
            const an = this.trackCenter[(si + 1) % this.trackCenter.length];
            const aa = Math.atan2(an.x - ap.x, -(an.y - ap.y));
            const at = aiTypes[(i + 1) % aiTypes.length];
            const ac = aiColors[i % aiColors.length];
            this.aiCars.push(new AICar(ap.x, ap.y - (i + 1) * 60, aa, at, this.trackCenter, si % this.trackCenter.length, ac, this.darkenColor(ac, 0.6)));
        }

        this.spawnPowerups();
        this.showScreen('game');
        document.getElementById('pause-overlay').classList.add('hidden');
        this.startCountdown();
    }

    startCountdown() {
        const el = document.getElementById('countdown'), txt = document.getElementById('countdown-text');
        el.classList.remove('hidden');
        let c = 3; txt.textContent = c;
        gameState.countdown = setInterval(() => {
            c--;
            if (c > 0) txt.textContent = c;
            else if (c === 0) { txt.textContent = 'GO!'; txt.style.color = '#39ff14'; }
            else { clearInterval(gameState.countdown); el.classList.add('hidden'); txt.style.color = ''; gameState.raceStarted = true; this.lapStartTime = performance.now(); }
        }, 1000);
        this.lastTime = performance.now();
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
        this.loop(this.lastTime);
    }

    loop(ts) {
        if (gameState.screen !== 'game' || gameState.paused) return;
        const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
        this.lastTime = ts;
        if (gameState.raceStarted && !gameState.raceFinished) this.update(dt);
        // Interpolate remote players
        if (this.isMultiplayer) network.interpolateRemotePlayers(dt);
        this.render(); this.updateHUD(); this.renderMinimap();
        this.animFrame = requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        this.playerCar.update(dt, this.keys);
        gameState.totalTime += dt;
        const sk = Math.abs(this.playerCar.speed) * 3.6;
        if (sk > gameState.maxSpeed) gameState.maxSpeed = sk;

        if (this.playerCar.drifting) { gameState.currentDriftScore += Math.abs(this.playerCar.slipAngle) * dt * 100; gameState.isDrifting = true; }
        else { if (gameState.isDrifting && gameState.currentDriftScore > 5) gameState.driftScore += Math.floor(gameState.currentDriftScore); gameState.currentDriftScore = 0; gameState.isDrifting = false; }

        const dEl = document.getElementById('drift-indicator');
        if (gameState.isDrifting && gameState.currentDriftScore > 5) { dEl.classList.remove('hidden'); document.getElementById('drift-score').textContent = '+' + Math.floor(gameState.currentDriftScore); }
        else dEl.classList.add('hidden');

        this.aiCars.forEach(ai => ai.update(dt));
        this.enforceTrackBounds(this.playerCar);
        this.aiCars.forEach(ai => this.enforceTrackBounds(ai.car));
        this.checkCarCollisions();
        this.updatePowerups(dt);
        this.updateCheckpoints();

        // Active power-up HUD
        const apEl = document.getElementById('active-powerup');
        if (this.playerCar.activePowerup) {
            apEl.classList.remove('hidden');
            document.getElementById('active-powerup-icon').textContent = this.playerCar.activePowerup.icon;
            document.getElementById('powerup-timer-fill').style.width = (this.playerCar.powerupTimer / this.playerCar.powerupDuration * 100) + '%';
        } else apEl.classList.add('hidden');

        // Slow opponents power-up
        if (this.playerCar.activePowerup && this.playerCar.activePowerup.id === 'slow') {
            this.aiCars.forEach(ai => { ai.car.speedMultiplier = 0.6; });
        } else {
            this.aiCars.forEach(ai => { if (!ai.car.activePowerup || ai.car.activePowerup.id !== 'speed') ai.car.speedMultiplier = 1; });
        }
    }

    updatePowerups(dt) {
        this.powerups.forEach(pu => {
            pu.bobPhase += dt * 3;
            if (!pu.active) {
                pu.respawnTimer -= dt;
                if (pu.respawnTimer <= 0) {
                    pu.active = true;
                    pu.type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
                }
                return;
            }
            const dx = this.playerCar.x - pu.x, dy = this.playerCar.y - pu.y;
            if (Math.sqrt(dx * dx + dy * dy) < 35) {
                this.playerCar.applyPowerup(pu.type);
                pu.active = false; pu.respawnTimer = CONFIG.POWERUP_RESPAWN;
                gameState.powerupsUsed++;
                this.showPowerupNotification(pu.type);
                // Notify network
                if (this.isMultiplayer) {
                    const idx = this.powerups.indexOf(pu);
                    network.sendPowerupPicked(idx);
                }
            }
        });
    }

    showPowerupNotification(type) {
        const el = document.getElementById('powerup-notification');
        document.getElementById('powerup-icon').textContent = type.icon;
        document.getElementById('powerup-text').textContent = type.name;
        el.style.borderColor = type.color; el.style.color = type.color;
        el.classList.remove('hidden');
        setTimeout(() => el.classList.add('hidden'), 2000);
    }

    enforceTrackBounds(car) {
        let minDist = Infinity, closestIdx = 0;
        const sr = 60;
        let ss = (car._lastTrackIdx || 0) - sr, se = (car._lastTrackIdx || 0) + sr;
        if (!car._lastTrackIdx) { ss = 0; se = this.trackCenter.length; }
        for (let i = ss; i < se; i++) {
            const idx = ((i % this.trackCenter.length) + this.trackCenter.length) % this.trackCenter.length;
            const p = this.trackCenter[idx], dx = car.x - p.x, dy = car.y - p.y, d = dx * dx + dy * dy;
            if (d < minDist) { minDist = d; closestIdx = idx; }
        }
        car._lastTrackIdx = closestIdx;
        const dist = Math.sqrt(minDist), maxDist = this.trackWidth / 2 - car.width / 2;
        if (dist > maxDist) {
            const cp = this.trackCenter[closestIdx], dx = car.x - cp.x, dy = car.y - cp.y, len = dist || 1;
            const nx = dx / len, ny = dy / len;
            car.x = cp.x + nx * maxDist; car.y = cp.y + ny * maxDist;
            const dot = car.velocity.x * nx + car.velocity.y * ny;
            if (dot > 0) { car.velocity.x -= nx * dot * 1.5; car.velocity.y -= ny * dot * 1.5; car.speed *= 0.7; }
        }
    }

    checkCarCollisions() {
        const all = [this.playerCar, ...this.aiCars.map(a => a.car)];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
            const a = all[i], b = all[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy), md = 40;
            if (dist < md && dist > 0) {
                const nx = dx / dist, ny = dy / dist, ol = md - dist;
                if (!a.shielded) { a.x -= nx * ol * 0.5; a.y -= ny * ol * 0.5; }
                if (!b.shielded) { b.x += nx * ol * 0.5; b.y += ny * ol * 0.5; }
                const rvx = a.velocity.x - b.velocity.x, rvy = a.velocity.y - b.velocity.y, rd = rvx * nx + rvy * ny;
                if (rd > 0) {
                    const mA = a.config.mass, mB = b.config.mass, tm = mA + mB;
                    if (!a.shielded) { a.velocity.x -= (2 * mB / tm) * rd * nx * 0.6; a.velocity.y -= (2 * mB / tm) * rd * ny * 0.6; }
                    if (!b.shielded) { b.velocity.x += (2 * mA / tm) * rd * nx * 0.6; b.velocity.y += (2 * mA / tm) * rd * ny * 0.6; }
                }
            }
        }
    }

    updateCheckpoints() {
        const car = this.playerCar;
        for (let i = 0; i < this.checkpoints.length; i++) {
            const cp = this.trackCenter[this.checkpoints[i]], dx = car.x - cp.x, dy = car.y - cp.y;
            if (Math.sqrt(dx * dx + dy * dy) < 100) this.checkpointsHit.add(i);
        }
        const f = this.trackCenter[0], fd = Math.sqrt((car.x - f.x) ** 2 + (car.y - f.y) ** 2);
        if (fd < 80 && this.checkpointsHit.size >= this.checkpoints.length - 1 && gameState.totalTime > 3) {
            const lt = (performance.now() - this.lapStartTime) / 1000;
            gameState.lapTimes.push(lt);
            if (lt < gameState.bestLap) gameState.bestLap = lt;
            if (gameState.currentLap >= CONFIG.TOTAL_LAPS) this.finishRace();
            else {
                gameState.currentLap++;
                this.checkpointsHit = new Set();
                this.lapStartTime = performance.now();
                if (this.isMultiplayer) network.sendLapComplete(gameState.currentLap);
            }
        }
    }

    finishRace() {
        gameState.raceFinished = true;
        if (this.isMultiplayer) {
            network.sendRaceFinished(gameState.totalTime);
            network.stopSending();
        }
        setTimeout(() => {
            document.getElementById('final-time').textContent = this.formatTime(gameState.totalTime);
            document.getElementById('final-best-lap').textContent = this.formatTime(gameState.bestLap);
            document.getElementById('final-max-speed').textContent = Math.floor(gameState.maxSpeed) + ' km/h';
            document.getElementById('final-drift-score').textContent = Math.floor(gameState.driftScore);
            document.getElementById('final-powerups').textContent = gameState.powerupsUsed;
            this.showScreen('finish');
        }, 1500);
    }

    // ============= RENDER =============
    render() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        if (this.playerCar) {
            this.camera.x += (this.playerCar.x - this.camera.x) * 0.08;
            this.camera.y += (this.playerCar.y - this.camera.y) * 0.08;
            const sr = Math.abs(this.playerCar.speed) / this.playerCar.config.maxSpeed;
            this.camera.targetZoom = 1.1 - sr * 0.3;
            this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * 0.05;
        }
        ctx.save(); ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0d1a0d'; ctx.fillRect(0, 0, w, h);
        ctx.translate(w / 2, h / 2); ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        this.renderBackground(ctx);
        this.renderTrack(ctx);
        this.renderTireMarks(ctx);
        this.renderDecorations(ctx);
        this.renderFinishLine(ctx);
        this.renderPowerups(ctx);
        this.aiCars.forEach(ai => this.renderCar(ctx, ai.car, 0.85));
        // Render remote multiplayer players
        if (this.isMultiplayer) {
            network.remotePlayers.forEach(rp => {
                this.renderRemoteCar(ctx, rp, 0.85);
            });
        }
        if (this.playerCar) this.renderCar(ctx, this.playerCar, 1);
        if (this.playerCar) { this.renderParticles(ctx, this.playerCar); this.aiCars.forEach(ai => this.renderParticles(ctx, ai.car)); }
        ctx.restore();
    }

    renderBackground(ctx) {
        const gs = 100;
        const sx = Math.floor((this.camera.x - 1200) / gs) * gs, sy = Math.floor((this.camera.y - 800) / gs) * gs;
        const ex = this.camera.x + 1200, ey = this.camera.y + 800;
        ctx.strokeStyle = 'rgba(30,60,30,0.3)'; ctx.lineWidth = 0.5;
        for (let x = sx; x < ex; x += gs) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, ey); ctx.stroke(); }
        for (let y = sy; y < ey; y += gs) { ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(ex, y); ctx.stroke(); }
    }

    renderTrack(ctx) {
        const n = this.trackCenter.length;
        ctx.beginPath();
        ctx.moveTo(this.trackOuter[0].x, this.trackOuter[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(this.trackOuter[i].x, this.trackOuter[i].y);
        ctx.closePath();
        ctx.moveTo(this.trackInner[0].x, this.trackInner[0].y);
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(this.trackInner[i].x, this.trackInner[i].y);
        ctx.closePath();
        ctx.fillStyle = '#2a2a2a'; ctx.fill();

        // Outer curb - red/white stripes
        ctx.beginPath();
        ctx.moveTo(this.trackOuter[0].x, this.trackOuter[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(this.trackOuter[i].x, this.trackOuter[i].y);
        ctx.closePath();
        ctx.strokeStyle = '#ff2d95'; ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(255,45,149,0.6)'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;

        // Inner curb
        ctx.beginPath();
        ctx.moveTo(this.trackInner[0].x, this.trackInner[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(this.trackInner[i].x, this.trackInner[i].y);
        ctx.closePath();
        ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(0,240,255,0.6)'; ctx.shadowBlur = 12; ctx.stroke(); ctx.shadowBlur = 0;

        // Center dashes
        ctx.setLineDash([20, 30]); ctx.beginPath();
        ctx.moveTo(this.trackCenter[0].x, this.trackCenter[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(this.trackCenter[i].x, this.trackCenter[i].y);
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
    }

    renderTireMarks(ctx) {
        [this.playerCar, ...this.aiCars.map(a => a.car)].forEach(car => {
            if (!car) return;
            car.tireMarks.forEach(m => { ctx.beginPath(); ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = `rgba(20,20,20,${m.alpha * 0.7})`; ctx.fill(); });
        });
    }

    renderDecorations(ctx) {
        this.decorations.forEach(d => {
            switch (d.type) {
                case 'pine': {
                    // Trunk
                    ctx.fillStyle = '#3d2b1f';
                    ctx.fillRect(d.x - 2, d.y - 2, 4, 8);
                    // Canopy layers
                    const s = d.shade;
                    for (let layer = 0; layer < 3; layer++) {
                        const ls = d.size - layer * 3;
                        const ly = d.y - layer * 5 - 4;
                        ctx.beginPath(); ctx.moveTo(d.x, ly - ls); ctx.lineTo(d.x + ls * 0.7, ly + ls * 0.3); ctx.lineTo(d.x - ls * 0.7, ly + ls * 0.3); ctx.closePath();
                        ctx.fillStyle = `rgb(${Math.floor(20 + s * 50)},${Math.floor(70 + s * 60)},${Math.floor(20 + s * 30)})`;
                        ctx.fill();
                    }
                    break;
                }
                case 'lamp': {
                    ctx.fillStyle = '#555'; ctx.fillRect(d.x - 1.5, d.y - 12, 3, 12);
                    ctx.beginPath(); ctx.arc(d.x, d.y - 14, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,240,180,0.9)'; ctx.fill();
                    ctx.shadowColor = 'rgba(255,240,180,0.5)'; ctx.shadowBlur = 15;
                    ctx.beginPath(); ctx.arc(d.x, d.y - 14, 6, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255,240,180,0.15)'; ctx.fill();
                    ctx.shadowBlur = 0;
                    break;
                }
                case 'barrier': {
                    ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle);
                    for (let t = 0; t < 4; t++) {
                        ctx.fillStyle = t % 2 === 0 ? '#dd3333' : '#eeeeee';
                        ctx.beginPath(); ctx.arc(t * 7 - 10, 0, 4, 0, Math.PI * 2); ctx.fill();
                    }
                    ctx.restore();
                    break;
                }
                case 'building': {
                    ctx.fillStyle = `hsl(${d.hue},20%,18%)`; ctx.fillRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                    ctx.strokeStyle = `hsl(${d.hue},40%,35%)`; ctx.lineWidth = 1; ctx.strokeRect(d.x - d.w / 2, d.y - d.h / 2, d.w, d.h);
                    // Windows
                    const wc = Math.floor(d.w / 10), wr = Math.floor(d.h / 10);
                    for (let wx = 0; wx < wc; wx++) for (let wy = 0; wy < wr; wy++) {
                        const lit = Math.random() > 0.3;
                        ctx.fillStyle = lit ? `rgba(255,240,180,0.7)` : `rgba(50,50,80,0.5)`;
                        ctx.fillRect(d.x - d.w / 2 + 4 + wx * 10, d.y - d.h / 2 + 4 + wy * 10, 5, 5);
                    }
                    break;
                }
                case 'rock': {
                    ctx.fillStyle = '#555'; ctx.beginPath();
                    ctx.ellipse(d.x, d.y, d.size, d.size * 0.7, 0.3, 0, Math.PI * 2);
                    ctx.fill(); ctx.strokeStyle = '#444'; ctx.lineWidth = 0.5; ctx.stroke();
                    break;
                }
                case 'bush': {
                    const s = d.shade;
                    ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgb(${Math.floor(30 + s * 40)},${Math.floor(80 + s * 50)},${Math.floor(25 + s * 25)})`;
                    ctx.fill();
                    ctx.beginPath(); ctx.arc(d.x + d.size * 0.5, d.y - d.size * 0.3, d.size * 0.7, 0, Math.PI * 2);
                    ctx.fillStyle = `rgb(${Math.floor(25 + s * 35)},${Math.floor(70 + s * 45)},${Math.floor(20 + s * 20)})`;
                    ctx.fill();
                    break;
                }
            }
        });
    }

    renderFinishLine(ctx) {
        const fp = this.trackCenter[0], n = this.trackCenter.length;
        const prev = this.trackCenter[n - 1], next = this.trackCenter[1];
        const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len, hw = this.trackWidth / 2, segs = 8, sw = hw * 2 / segs;
        for (let i = 0; i < segs; i++) {
            const r = (i / segs) - 0.5, x = fp.x + nx * hw * 2 * r, y = fp.y + ny * hw * 2 * r;
            ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(dy, dx));
            ctx.fillStyle = i % 2 === 0 ? '#fff' : '#111'; ctx.fillRect(-sw / 2, -8, sw, 8);
            ctx.fillStyle = i % 2 === 1 ? '#fff' : '#111'; ctx.fillRect(-sw / 2, 0, sw, 8);
            ctx.restore();
        }
    }

    renderPowerups(ctx) {
        const t = performance.now() / 1000;
        this.powerups.forEach(pu => {
            if (!pu.active) return;
            const bob = Math.sin(pu.bobPhase + t * 3) * 4;
            const pulse = 0.9 + Math.sin(t * 4 + pu.bobPhase) * 0.1;
            ctx.save(); ctx.translate(pu.x, pu.y + bob); ctx.scale(pulse, pulse);
            // Mystery box
            const sz = 18;
            ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-sz - 2, -sz + 4, sz * 2 + 4, sz * 2);
            // Box body with gradient
            const g = ctx.createLinearGradient(-sz, -sz, sz, sz);
            g.addColorStop(0, '#ffd700'); g.addColorStop(0.5, '#ffaa00'); g.addColorStop(1, '#ff6600');
            ctx.fillStyle = g; ctx.fillRect(-sz, -sz, sz * 2, sz * 2);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(-sz, -sz, sz * 2, sz * 2);
            // Question mark
            ctx.fillStyle = '#fff'; ctx.font = 'bold 20px Orbitron, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('?', 0, 1);
            // Glow
            ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
            ctx.strokeStyle = 'rgba(255,215,0,0.3)'; ctx.lineWidth = 3;
            ctx.strokeRect(-sz - 3, -sz - 3, sz * 2 + 6, sz * 2 + 6);
            ctx.shadowBlur = 0;
            ctx.restore();
        });
    }

    renderCar(ctx, car, alpha) {
        ctx.save();
        ctx.translate(car.x, car.y); ctx.rotate(car.angle);
        const sc = car.miniScale || 1; ctx.scale(sc, sc);
        ctx.globalAlpha = alpha;
        const w = car.width, h = car.height;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(3, 3, w * 0.6, h * 0.52, 0, 0, Math.PI * 2); ctx.fill();

        // Wheels (4 wheels with visible rotation)
        const wheelW = 5, wheelH = 10;
        const wheelPositions = [
            { x: -w / 2 - 1, y: -h * 0.28, steer: true },
            { x: w / 2 + 1, y: -h * 0.28, steer: true },
            { x: -w / 2 - 1, y: h * 0.3, steer: false },
            { x: w / 2 + 1, y: h * 0.3, steer: false },
        ];
        wheelPositions.forEach(wp => {
            ctx.save(); ctx.translate(wp.x, wp.y);
            if (wp.steer) ctx.rotate(car.visualWheelAngle || 0);
            ctx.fillStyle = '#222'; ctx.fillRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH);
            ctx.fillStyle = '#444'; ctx.fillRect(-wheelW / 2 + 1, -wheelH / 2 + 1, wheelW - 2, 2);
            ctx.fillRect(-wheelW / 2 + 1, wheelH / 2 - 3, wheelW - 2, 2);
            ctx.restore();
        });

        // Car body
        const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGrad.addColorStop(0, car.color1); bodyGrad.addColorStop(1, car.color2);
        ctx.fillStyle = bodyGrad;

        // Body shape depends on type
        const bs = car.config.bodyStyle;
        ctx.beginPath();
        if (bs === 'supercar') {
            ctx.moveTo(0, -h / 2); ctx.bezierCurveTo(w * 0.4, -h / 2 + 4, w / 2, -h / 3, w / 2, -h / 6);
            ctx.lineTo(w / 2, h / 3); ctx.bezierCurveTo(w / 2, h / 2 - 4, w / 4, h / 2, 0, h / 2);
            ctx.bezierCurveTo(-w / 4, h / 2, -w / 2, h / 2 - 4, -w / 2, h / 3);
            ctx.lineTo(-w / 2, -h / 6); ctx.bezierCurveTo(-w / 2, -h / 3, -w * 0.4, -h / 2 + 4, 0, -h / 2);
        } else if (bs === 'truck') {
            ctx.roundRect(-w / 2, -h / 2, w, h, 4);
        } else if (bs === 'muscle') {
            ctx.moveTo(0, -h / 2 + 2); ctx.lineTo(w / 2 - 2, -h / 2 + 8); ctx.lineTo(w / 2, 0);
            ctx.lineTo(w / 2, h / 3); ctx.lineTo(w / 2 - 3, h / 2); ctx.lineTo(-w / 2 + 3, h / 2);
            ctx.lineTo(-w / 2, h / 3); ctx.lineTo(-w / 2, 0); ctx.lineTo(-w / 2 + 2, -h / 2 + 8);
        } else if (bs === 'rally') {
            ctx.moveTo(0, -h / 2); ctx.bezierCurveTo(w * 0.45, -h / 2 + 5, w / 2, -h / 4, w / 2, 0);
            ctx.lineTo(w / 2 - 2, h / 3); ctx.bezierCurveTo(w / 2 - 2, h / 2 - 2, w / 4, h / 2, 0, h / 2);
            ctx.bezierCurveTo(-w / 4, h / 2, -w / 2 + 2, h / 2 - 2, -w / 2 + 2, h / 3);
            ctx.lineTo(-w / 2, 0); ctx.bezierCurveTo(-w / 2, -h / 4, -w * 0.45, -h / 2 + 5, 0, -h / 2);
        } else {
            // sport & drift
            ctx.moveTo(0, -h / 2); ctx.bezierCurveTo(w / 2, -h / 2 + 6, w / 2, -h / 4, w / 2, 0);
            ctx.lineTo(w / 2, h / 3); ctx.bezierCurveTo(w / 2, h / 2 - 3, w / 4, h / 2, 0, h / 2);
            ctx.bezierCurveTo(-w / 4, h / 2, -w / 2, h / 2 - 3, -w / 2, h / 3);
            ctx.lineTo(-w / 2, 0); ctx.bezierCurveTo(-w / 2, -h / 4, -w / 2, -h / 2 + 6, 0, -h / 2);
        }
        ctx.closePath(); ctx.fill();

        // Side panel line
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(-w * 0.35, -h * 0.15); ctx.lineTo(-w * 0.35, h * 0.25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * 0.35, -h * 0.15); ctx.lineTo(w * 0.35, h * 0.25); ctx.stroke();

        // Windshield
        ctx.fillStyle = 'rgba(100,180,255,0.45)';
        ctx.beginPath(); ctx.ellipse(0, -h / 6, w * 0.28, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();

        // Rear window
        ctx.fillStyle = 'rgba(80,140,200,0.3)';
        ctx.beginPath(); ctx.ellipse(0, h * 0.18, w * 0.22, h * 0.06, 0, 0, Math.PI * 2); ctx.fill();

        // Spoiler for sport/drift/supercar/rally
        if (['sport', 'drift', 'supercar', 'rally'].includes(bs)) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-w * 0.4, h / 2 - 4, w * 0.8, 3);
        }

        // Hood scoop for muscle
        if (bs === 'muscle') { ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-3, -h * 0.35, 6, 10); }

        // Headlights
        ctx.fillStyle = `rgba(255,255,220,${0.85 * car.headlightFlicker})`;
        ctx.shadowColor = 'rgba(255,255,200,0.9)'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.ellipse(-w * 0.3, -h / 2 + 5, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w * 0.3, -h / 2 + 5, 3.5, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Headlight beams
        ctx.globalAlpha = alpha * 0.08;
        ctx.fillStyle = 'rgba(255,255,200,1)';
        ctx.beginPath(); ctx.moveTo(-w * 0.3, -h / 2); ctx.lineTo(-w * 0.5, -h / 2 - 40); ctx.lineTo(-w * 0.1, -h / 2 - 40); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(w * 0.3, -h / 2); ctx.lineTo(w * 0.1, -h / 2 - 40); ctx.lineTo(w * 0.5, -h / 2 - 40); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = alpha;

        // Taillights
        ctx.shadowColor = 'rgba(255,0,0,0.9)'; ctx.shadowBlur = 8;
        ctx.fillStyle = car.brake > 0 ? 'rgba(255,20,20,1)' : 'rgba(255,30,30,0.5)';
        ctx.beginPath(); ctx.roundRect(-w * 0.38, h / 2 - 6, 6, 4, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(w * 0.38 - 6, h / 2 - 6, 6, 4, 1); ctx.fill();
        ctx.shadowBlur = 0;

        // Neon underglow
        ctx.globalAlpha = alpha * 0.25;
        ctx.strokeStyle = car.color1; ctx.lineWidth = 2;
        ctx.shadowColor = car.color1; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.7, h * 0.58, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;

        // Shield glow
        if (car.shielded) {
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 25;
            ctx.beginPath(); ctx.ellipse(0, 0, w * 0.85, h * 0.65, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = 1; ctx.restore();
    }

    renderRemoteCar(ctx, rp, alpha) {
        // Lightweight render for network players (no full Car object)
        const cfg = CONFIG.cars[rp.carType] || CONFIG.cars.sport;
        const w = cfg.width, h = cfg.height;
        const sc = rp.miniScale || 1;
        ctx.save();
        ctx.translate(rp.x, rp.y); ctx.rotate(rp.angle);
        ctx.scale(sc, sc); ctx.globalAlpha = alpha;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(3, 3, w * 0.6, h * 0.52, 0, 0, Math.PI * 2); ctx.fill();

        // Body
        const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGrad.addColorStop(0, rp.color1); bodyGrad.addColorStop(1, rp.color2);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2); ctx.bezierCurveTo(w / 2, -h / 2 + 6, w / 2, -h / 4, w / 2, 0);
        ctx.lineTo(w / 2, h / 3); ctx.bezierCurveTo(w / 2, h / 2 - 3, w / 4, h / 2, 0, h / 2);
        ctx.bezierCurveTo(-w / 4, h / 2, -w / 2, h / 2 - 3, -w / 2, h / 3);
        ctx.lineTo(-w / 2, 0); ctx.bezierCurveTo(-w / 2, -h / 4, -w / 2, -h / 2 + 6, 0, -h / 2);
        ctx.closePath(); ctx.fill();

        // Windshield
        ctx.fillStyle = 'rgba(100,180,255,0.4)';
        ctx.beginPath(); ctx.ellipse(0, -h / 6, w * 0.28, h * 0.1, 0, 0, Math.PI * 2); ctx.fill();

        // Headlights
        ctx.fillStyle = 'rgba(255,255,220,0.8)';
        ctx.shadowColor = 'rgba(255,255,200,0.8)'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.ellipse(-w * 0.3, -h / 2 + 5, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w * 0.3, -h / 2 + 5, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Taillights
        ctx.fillStyle = rp.brake > 0 ? 'rgba(255,20,20,1)' : 'rgba(255,30,30,0.5)';
        ctx.shadowColor = 'rgba(255,0,0,0.6)'; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.ellipse(-w * 0.3, h / 2 - 5, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(w * 0.3, h / 2 - 5, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Neon underglow
        ctx.globalAlpha = alpha * 0.25;
        ctx.strokeStyle = rp.color1; ctx.lineWidth = 2;
        ctx.shadowColor = rp.color1; ctx.shadowBlur = 15;
        ctx.beginPath(); ctx.ellipse(0, 0, w * 0.65, h * 0.55, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;

        // Shield
        if (rp.shielded) {
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 3;
            ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.ellipse(0, 0, w * 0.8, h * 0.6, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Name tag above car
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.font = 'bold 10px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        const name = rp.name || 'Player';
        const tw = ctx.measureText(name).width;
        ctx.fillRect(-tw / 2 - 4, -h / 2 - 22, tw + 8, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(name, 0, -h / 2 - 10);

        ctx.globalAlpha = 1; ctx.restore();
    }

    renderParticles(ctx, car) {
        car.particles.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,${Math.floor(100 + p.life * 155)},${Math.floor(p.life * 50)},${p.life * 0.5})`;
            ctx.fill();
        });
    }

    updateHUD() {
        if (!this.playerCar) return;
        const sk = Math.abs(this.playerCar.speed) * 3.6, ds = Math.floor(Math.max(0, sk));
        document.getElementById('speed-number').textContent = ds;
        const msk = this.playerCar.config.maxSpeed * 3.6, sr = ds / msk;
        const circ = 2 * Math.PI * 90;
        document.getElementById('speed-fill').style.strokeDashoffset = circ * (1 - sr);
        const f = document.getElementById('speed-fill');
        f.classList.remove('warning', 'danger');
        if (sr > 0.85) f.classList.add('danger'); else if (sr > 0.65) f.classList.add('warning');
        document.getElementById('gear-indicator').textContent = this.playerCar.speed < -5 ? 'R' : (this.playerCar.speed < 3 ? 'N' : this.playerCar.gear);
        document.getElementById('lap-counter').textContent = `${gameState.currentLap} / ${CONFIG.TOTAL_LAPS}`;
        document.getElementById('race-time').textContent = this.formatTime(gameState.totalTime);
        document.getElementById('best-lap').textContent = gameState.bestLap < Infinity ? this.formatTime(gameState.bestLap) : '--:--.--';

        const pp = this.getTrackProgress(this.playerCar);
        let pos = 1;
        this.aiCars.forEach(ai => { if (this.getTrackProgress(ai.car) > pp) pos++; });
        // Include remote players in position
        if (this.isMultiplayer) {
            network.remotePlayers.forEach(rp => { if (this.getTrackProgress(rp) > pp) pos++; });
        }
        const suf = ['st', 'nd', 'rd', 'th'];
        document.getElementById('position').innerHTML = `${pos}<sup>${suf[pos - 1] || 'th'}</sup>`;
    }

    getTrackProgress(car) {
        let md = Infinity, ci = 0;
        for (let i = 0; i < this.trackCenter.length; i += 10) {
            const p = this.trackCenter[i], dx = car.x - p.x, dy = car.y - p.y, d = dx * dx + dy * dy;
            if (d < md) { md = d; ci = i; }
        }
        return ci;
    }

    renderMinimap() {
        const ctx = this.minimapCtx, cw = this.minimapCanvas.width, ch = this.minimapCanvas.height;
        ctx.clearRect(0, 0, cw, ch); ctx.fillStyle = 'rgba(10,10,30,0.8)'; ctx.fillRect(0, 0, cw, ch);
        let mnX = Infinity, mxX = -Infinity, mnY = Infinity, mxY = -Infinity;
        this.trackCenter.forEach(p => { if (p.x < mnX) mnX = p.x; if (p.x > mxX) mxX = p.x; if (p.y < mnY) mnY = p.y; if (p.y > mxY) mxY = p.y; });
        const tw = mxX - mnX, th = mxY - mnY, sc = Math.min((cw - 20) / tw, (ch - 20) / th);
        const ox = (cw - tw * sc) / 2, oy = (ch - th * sc) / 2;
        const tm = p => ({ x: (p.x - mnX) * sc + ox, y: (p.y - mnY) * sc + oy });

        ctx.beginPath();
        const s = tm(this.trackCenter[0]); ctx.moveTo(s.x, s.y);
        for (let i = 1; i < this.trackCenter.length; i += 3) { const m = tm(this.trackCenter[i]); ctx.lineTo(m.x, m.y); }
        ctx.closePath(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; ctx.stroke();

        // Power-up dots on minimap
        this.powerups.forEach(pu => { if (!pu.active) return; const mp = tm(pu); ctx.beginPath(); ctx.arc(mp.x, mp.y, 2, 0, Math.PI * 2); ctx.fillStyle = '#ffd700'; ctx.fill(); });

        if (this.playerCar) {
            const pp = tm(this.playerCar); ctx.beginPath(); ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = this.playerCar.color1; ctx.shadowColor = this.playerCar.color1; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0;
        }
        this.aiCars.forEach(ai => {
            const ap = tm(ai.car); ctx.beginPath(); ctx.arc(ap.x, ap.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = ai.car.color1; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
        });
        // Remote players on minimap
        if (this.isMultiplayer) {
            network.remotePlayers.forEach(rp => {
                const rpp = tm(rp); ctx.beginPath(); ctx.arc(rpp.x, rpp.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = rp.color1 || '#fff'; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1;
            });
        }
    }

    formatTime(s) {
        if (!isFinite(s)) return '--:--.--';
        return `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;
    }
}

// ============= INIT =============
const game = new Game();
