/* ========================================
   NEON DRIFT v3 — Game Manager & Renderer
   Bikes, F1, Weapons, Pit Stops, Spectators
   ======================================== */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.keys = { up: false, down: false, left: false, right: false, space: false, fire: false };
        this.lastTime = 0; this.animFrame = null;

        this.buildTrack();
        this.playerCar = null; this.aiCars = [];
        this.camera = { x: 0, y: 0, zoom: 1, targetZoom: 1 };
        this.powerups = []; this.isMultiplayer = false;
        this.resize();
        this.setupEventListeners();
        this.setupNetwork();
    }

    buildTrack() {
        const t = generateTrack();
        this.trackTemplate = t;
        this.trackCenter = catmullRomSpline(t.points, 25);
        const hw = 70;
        const edges = buildTrackEdges(this.trackCenter, hw);
        this.trackInner = edges.inner; this.trackOuter = edges.outer;
        this.trackWidth = hw * 2;
        this.checkpoints = [];
        const cpI = Math.floor(this.trackCenter.length / 8);
        for (let i = 0; i < 8; i++) this.checkpoints.push(i * cpI);
        this.decorations = this.generateDecorations();
        this.shortcuts = generateShortcuts(this.trackCenter, this.trackCenter.length);
        this.pitLane = generatePitLane(this.trackCenter, this.trackWidth / 2);
    }

    generateDecorations() {
        const decs = [], n = this.trackCenter.length;
        for (let i = 0; i < n; i += 5) {
            const prev = this.trackCenter[(i - 1 + n) % n], curr = this.trackCenter[i], next = this.trackCenter[(i + 1) % n];
            const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len, ny = dx / len;
            const outerDist = 100 + Math.random() * 80;
            const r = Math.random();
            if (r < 0.25) {
                decs.push({ type: 'pine', x: curr.x - nx * outerDist, y: curr.y - ny * outerDist, size: 10 + Math.random() * 14, shade: Math.random() });
                decs.push({ type: 'pine', x: curr.x + nx * outerDist, y: curr.y + ny * outerDist, size: 10 + Math.random() * 14, shade: Math.random() });
            } else if (r < 0.35) {
                decs.push({ type: 'lamp', x: curr.x - nx * (82 + Math.random() * 10), y: curr.y - ny * (82 + Math.random() * 10) });
            } else if (r < 0.42) {
                decs.push({ type: 'barrier', x: curr.x - nx * 78, y: curr.y - ny * 78, angle: Math.atan2(dy, dx) });
            } else if (r < 0.48 && i % 40 === 0) {
                decs.push({ type: 'building', x: curr.x - nx * (130 + Math.random() * 40), y: curr.y - ny * (130 + Math.random() * 40), w: 40 + Math.random() * 30, h: 25 + Math.random() * 20, hue: Math.random() * 360 });
            } else if (r < 0.55) {
                decs.push({ type: 'rock', x: curr.x + nx * (outerDist + 10), y: curr.y + ny * (outerDist + 10), size: 4 + Math.random() * 8 });
            } else if (r < 0.62) {
                decs.push({ type: 'bush', x: curr.x - nx * (outerDist - 10), y: curr.y - ny * (outerDist - 10), size: 5 + Math.random() * 8, shade: Math.random() });
            } else if (r < 0.68 && i % 60 === 0) {
                // Grandstand with spectators
                const gx = curr.x - nx * (150 + Math.random() * 30);
                const gy = curr.y - ny * (150 + Math.random() * 30);
                decs.push({ type: 'grandstand', x: gx, y: gy, w: 60 + Math.random() * 30, h: 30, angle: Math.atan2(dy, dx), spectators: 5 + Math.floor(Math.random() * 8) });
            } else if (r < 0.72 && i % 30 === 0) {
                // Billboard
                decs.push({ type: 'billboard', x: curr.x + nx * (outerDist + 20), y: curr.y + ny * (outerDist + 20), angle: Math.atan2(dy, dx), hue: Math.random() * 360 });
            } else if (r < 0.78) {
                // Spectator group
                decs.push({ type: 'spectators', x: curr.x - nx * (90 + Math.random() * 20), y: curr.y - ny * (90 + Math.random() * 20), count: 2 + Math.floor(Math.random() * 4), phase: Math.random() * Math.PI * 2 });
            } else if (r < 0.85) {
                // Large Stone
                decs.push({ type: 'stone', x: curr.x + nx * (outerDist + 15), y: curr.y + ny * (outerDist + 15), size: 12 + Math.random() * 10 });
            } else if (r < 0.92) {
                // Dense Tree
                decs.push({ type: 'tree', x: curr.x - nx * (outerDist + 20), y: curr.y - ny * (outerDist + 20), size: 15 + Math.random() * 10 });
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
            if (e.code === 'KeyF' && this.playerCar) this.fireWeapon();
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => this.handleKey(e.code, false));

        document.getElementById('singleplayer-btn').addEventListener('click', () => { this.isMultiplayer = false; this.startRace(); });
        document.getElementById('multiplayer-btn')?.addEventListener('click', () => this.joinLobby());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('quit-btn').addEventListener('click', () => this.goToMenu());
        document.getElementById('restart-btn').addEventListener('click', () => { if (this.isMultiplayer) this.goToMenu(); else this.startRace(); });
        document.getElementById('menu-btn').addEventListener('click', () => this.goToMenu());
        document.getElementById('ready-btn')?.addEventListener('click', () => network.toggleReady());
        document.getElementById('start-race-btn')?.addEventListener('click', () => network.startRace());
        document.getElementById('lobby-back-btn')?.addEventListener('click', () => this.goToMenu());

        // Car selection
        document.querySelectorAll('.car-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.car-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.selectedCar = btn.dataset.car;
            });
        });
        // Difficulty
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.difficulty = btn.dataset.diff;
                CONFIG.difficulty = btn.dataset.diff;
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
        this.setupTouchControls();
    }

    setupTouchControls() {
        const touchMap = [
            { id: 'touch-left', key: 'left' }, { id: 'touch-right', key: 'right' },
            { id: 'touch-gas', key: 'up' }, { id: 'touch-brake', key: 'down' },
            { id: 'touch-handbrake', key: 'space' },
        ];
        touchMap.forEach(({ id, key }) => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const onStart = (e) => { e.preventDefault(); this.keys[key] = true; btn.classList.add('active'); };
            const onEnd = (e) => { e.preventDefault(); this.keys[key] = false; btn.classList.remove('active'); };
            btn.addEventListener('touchstart', onStart, { passive: false });
            btn.addEventListener('touchend', onEnd, { passive: false });
            btn.addEventListener('touchcancel', onEnd, { passive: false });
            btn.addEventListener('mousedown', onStart);
            btn.addEventListener('mouseup', onEnd);
            btn.addEventListener('mouseleave', onEnd);
        });
        // Fire button
        const fireBtn = document.getElementById('touch-fire');
        if (fireBtn) {
            const onFire = (e) => { e.preventDefault(); this.fireWeapon(); };
            fireBtn.addEventListener('touchstart', onFire, { passive: false });
            fireBtn.addEventListener('click', onFire);
        }
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
            case 'KeyK': this.keys.shoot = pressed; break;
        }
    }

    fireWeapon() {
        if (!this.playerCar || !this.playerCar.heldWeapon) return;
        const p = this.playerCar.fireWeapon();
        if (p) {
            projectiles.push(p);
            this.showPowerupNotification(p.type === 'missile' ? { icon: '🚀', name: 'MISSILE FIRED!', color: '#ff4444' } :
                p.type === 'oil' ? { icon: '🛢️', name: 'OIL DROPPED!', color: '#333' } :
                    { icon: '💥', name: 'EMP BLAST!', color: '#00f0ff' });
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

    setupNetwork() {
        network.connect();
        network.on('connected', () => { const el = document.getElementById('connection-status'); if (el) { el.textContent = '✅ Connected'; el.classList.remove('error'); } });
        network.on('disconnected', () => { const el = document.getElementById('connection-status'); if (el) { el.textContent = '❌ Disconnected'; el.classList.add('error'); } });
        network.on('joined', () => this.updateLobbyUI());
        network.on('player_joined', () => this.updateLobbyUI());
        network.on('player_left', () => this.updateLobbyUI());
        network.on('player_ready', () => this.updateLobbyUI());
        network.on('player_updated', () => this.updateLobbyUI());
        network.on('host_changed', () => this.updateLobbyUI());
        network.on('race_starting', (msg) => this.startMultiplayerRace(msg.startTime));
        network.on('powerup_removed', (msg) => { if (this.powerups[msg.powerupIndex]) { this.powerups[msg.powerupIndex].active = false; this.powerups[msg.powerupIndex].respawnTimer = CONFIG.POWERUP_RESPAWN; } });
        network.on('back_to_lobby', () => { network.stopSending(); this.showScreen('lobby'); this.updateLobbyUI(); });
    }

    joinLobby() {
        this.isMultiplayer = true;
        const name = document.getElementById('player-name').value.trim() || 'Racer';
        const c1 = gameState.selectedColor, c2 = this.darkenColor(c1, 0.6);
        this.showScreen('lobby');
        if (network.connected) network.joinRoom(name, gameState.selectedCar, c1, c2);
        else { network.connect(); setTimeout(() => { if (network.connected) network.joinRoom(name, gameState.selectedCar, c1, c2); }, 1500); }
    }

    updateLobbyUI() {
        const container = document.getElementById('lobby-players');
        if (!container) return;
        container.innerHTML = '';
        network.players.forEach(p => {
            const isYou = p.id === network.playerId, isHost = p.id === network.hostId;
            const card = document.createElement('div');
            card.className = 'lobby-player-card' + (p.ready ? ' ready' : '') + (isYou ? ' is-you' : '');
            card.innerHTML = `<div class="player-card-left"><div class="player-color-dot" style="background:${p.color1}"></div><div><div class="player-card-name">${p.name}${isYou ? ' (You)' : ''}${isHost ? '<span class="player-card-host">👑 HOST</span>' : ''}</div><div class="player-card-car">${p.carType}</div></div></div><div class="player-card-status ${p.ready ? 'ready-status' : 'waiting'}">${p.ready ? 'READY' : 'WAITING'}</div>`;
            container.appendChild(card);
        });
        const startBtn = document.getElementById('start-race-btn');
        if (startBtn) startBtn.style.display = network.isHost ? 'inline-block' : 'none';
    }

    startMultiplayerRace(startTime) {
        gameState.raceStarted = false; gameState.raceFinished = false;
        gameState.totalTime = 0; gameState.lapTimes = []; gameState.bestLap = Infinity;
        gameState.currentLap = 1; gameState.maxSpeed = 0;
        gameState.driftScore = 0; gameState.currentDriftScore = 0; gameState.isDrifting = false;
        gameState.paused = false; gameState.powerupsUsed = 0;
        this.checkpointsHit = new Set(); this.lapStartTime = 0;
        const myIndex = network.players.findIndex(p => p.id === network.playerId);
        const sp = this.trackCenter[0], np = this.trackCenter[1];
        const sa = Math.atan2(np.x - sp.x, -(np.y - sp.y));
        const dx = Math.sin(sa), dy = -Math.cos(sa);
        const myInfo = network.players.find(p => p.id === network.playerId);
        const c1 = myInfo ? myInfo.color1 : gameState.selectedColor;
        const c2 = myInfo ? myInfo.color2 : this.darkenColor(c1, 0.6);
        this.playerCar = new Car(sp.x - dy * myIndex * 50, sp.y + dx * myIndex * 50, sa, gameState.selectedCar, c1, c2);
        this.aiCars = [];
        this.spawnPowerups();
        this.showScreen('game');
        document.getElementById('track-name').textContent = this.trackTemplate.name;
        document.getElementById('pause-overlay').classList.add('hidden');
        const delay = Math.max(0, startTime - Date.now());
        setTimeout(() => this.startCountdown(), delay > 1000 ? delay - 3500 : 0);
        network.startSending(() => this.playerCar, () => gameState.currentLap);
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
        // New track each race
        this.buildTrack();
        this.isMultiplayer = false;
        gameState.raceStarted = false; gameState.raceFinished = false;
        gameState.totalTime = 0; gameState.lapTimes = []; gameState.bestLap = Infinity;
        gameState.currentLap = 1; gameState.maxSpeed = 0;
        gameState.driftScore = 0; gameState.currentDriftScore = 0; gameState.isDrifting = false;
        gameState.paused = false; gameState.powerupsUsed = 0;
        this.checkpointsHit = new Set(); this.lapStartTime = 0;
        projectiles.length = 0;

        const sp = this.trackCenter[0], np = this.trackCenter[1];
        const sa = Math.atan2(np.x - sp.x, -(np.y - sp.y));
        const c1 = gameState.selectedColor, c2 = this.darkenColor(c1, 0.6);
        this.playerCar = new Car(sp.x, sp.y, sa, gameState.selectedCar, c1, c2);

        this.aiCars = [];
        const aiTypes = Object.keys(CONFIG.cars);
        const aiColors = ['#00f0ff', '#ff2d95', '#39ff14', '#ffd700', '#ff4444', '#b829ff', '#ff8c00'];
        const aiCount = CONFIG.difficulty === 'easy' ? 4 : CONFIG.difficulty === 'hard' ? 7 : 5;
        for (let i = 0; i < aiCount; i++) {
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
        document.getElementById('track-name').textContent = this.trackTemplate.name;
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
        this.updateProjectiles(dt);
        this.updateBullets(dt);
        this.updatePitStop(dt);
        this.updateCheckpoints();

        // Active power-up HUD
        const apEl = document.getElementById('active-powerup');
        if (this.playerCar.activePowerup) {
            apEl.classList.remove('hidden');
            document.getElementById('active-powerup-icon').textContent = this.playerCar.activePowerup.icon;
            document.getElementById('powerup-timer-fill').style.width = (this.playerCar.powerupTimer / this.playerCar.powerupDuration * 100) + '%';
        } else apEl.classList.add('hidden');

        // Weapon HUD
        const ws = document.getElementById('weapon-slot');
        const wi = document.getElementById('weapon-icon');
        if (this.playerCar.heldWeapon) { wi.textContent = this.playerCar.heldWeapon.icon; ws.classList.add('has-weapon'); }
        else { wi.textContent = '—'; ws.classList.remove('has-weapon'); }

        // Health HUD
        for (let i = 1; i <= 3; i++) {
            const hEl = document.getElementById('h' + i);
            if (hEl) { if (i > this.playerCar.health) hEl.classList.add('lost'); else hEl.classList.remove('lost'); }
        }

        // Slow opponents power-up
        if (this.playerCar.activePowerup && this.playerCar.activePowerup.id === 'slow') {
            this.aiCars.forEach(ai => { ai.car.speedMultiplier = 0.6; });
        } else {
            this.aiCars.forEach(ai => { if (!ai.car.activePowerup || ai.car.activePowerup.id !== 'speed') ai.car.speedMultiplier = 1; });
        }

        // Check if player is eliminated
        if (this.playerCar.health <= 0) { this.finishRace(); }
    }

    updateBullets(dt) {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.update(dt);
            if (!b.active) { bullets.splice(i, 1); continue; }

            // Check hits on AI
            this.aiCars.forEach(ai => {
                const dx = ai.car.x - b.x, dy = ai.car.y - b.y;
                if (Math.sqrt(dx * dx + dy * dy) < 25) {
                    ai.car.takeDamage(5); // Machine gun does 5 damage
                    b.active = false;
                }
            });
            // Check hits on player (if AI shoots, but they don't yet)
        }
    }

    updateProjectiles(dt) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            p.update(dt);
            if (!p.active) { projectiles.splice(i, 1); continue; }
            // Check hits on AI cars
            this.aiCars.forEach(ai => {
                const dx = ai.car.x - p.x, dy = ai.car.y - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < p.radius + 20) {
                    if (p.type === 'missile') { ai.car.takeDamage(); ai.car.stunned = true; ai.car.stunTimer = 1.5; p.active = false; }
                    else if (p.type === 'oil') { ai.car.oilSlow = true; ai.car.oilTimer = 3; }
                    else if (p.type === 'emp') { ai.car.stunned = true; ai.car.stunTimer = 2; }
                }
            });
            // Check if player hit by oil/emp (from AI in future)
        }
    }

    updatePitStop(dt) {
        if (!this.pitLane) return;
        const pc = this.pitLane.center;
        const dx = this.playerCar.x - pc.x, dy = this.playerCar.y - pc.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pitEl = document.getElementById('pit-indicator');

        if (dist < 60 && Math.abs(this.playerCar.speed) < 30 && this.playerCar.health < CONFIG.MAX_HEALTH) {
            if (!this.playerCar.inPit) { this.playerCar.inPit = true; this.playerCar.pitTimer = 0; }
            this.playerCar.pitTimer += dt;
            pitEl.classList.remove('hidden');
            document.getElementById('pit-bar-fill').style.width = (this.playerCar.pitTimer / CONFIG.PIT_STOP_TIME * 100) + '%';
            if (this.playerCar.pitTimer >= CONFIG.PIT_STOP_TIME) {
                this.playerCar.health = Math.min(CONFIG.MAX_HEALTH, this.playerCar.health + CONFIG.PIT_HEAL_AMOUNT);
                this.playerCar.inPit = false; this.playerCar.pitTimer = 0;
                pitEl.classList.add('hidden');
            }
        } else {
            this.playerCar.inPit = false; this.playerCar.pitTimer = 0;
            pitEl.classList.add('hidden');
        }
    }

    updatePowerups(dt) {
        this.powerups.forEach(pu => {
            pu.bobPhase += dt * 3;
            if (!pu.active) { pu.respawnTimer -= dt; if (pu.respawnTimer <= 0) { pu.active = true; pu.type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]; } return; }
            const dx = this.playerCar.x - pu.x, dy = this.playerCar.y - pu.y;
            if (Math.sqrt(dx * dx + dy * dy) < 35) {
                this.playerCar.applyPowerup(pu.type);
                pu.active = false; pu.respawnTimer = CONFIG.POWERUP_RESPAWN;
                gameState.powerupsUsed++;
                this.showPowerupNotification(pu.type);
                if (this.isMultiplayer) { const idx = this.powerups.indexOf(pu); network.sendPowerupPicked(idx); }
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
                // Damage on high-speed collision
                const impactSpeed = Math.abs(rd);
                if (impactSpeed > 80) {
                    if (!a.shielded) a.takeDamage();
                    if (!b.shielded) b.takeDamage();
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
            else { gameState.currentLap++; this.checkpointsHit = new Set(); this.lapStartTime = performance.now(); if (this.isMultiplayer) network.sendLapComplete(gameState.currentLap); }
        }
    }

    finishRace() {
        gameState.raceFinished = true;
        if (this.isMultiplayer) { network.sendRaceFinished(gameState.totalTime); network.stopSending(); }
        setTimeout(() => {
            document.getElementById('final-time').textContent = this.formatTime(gameState.totalTime);
            document.getElementById('final-best-lap').textContent = this.formatTime(gameState.bestLap);
            document.getElementById('final-max-speed').textContent = Math.floor(gameState.maxSpeed) + ' km/h';
            document.getElementById('final-drift-score').textContent = Math.floor(gameState.driftScore);
            document.getElementById('final-powerups').textContent = gameState.powerupsUsed;
            this.showScreen('finish');
        }, 1500);
    }

    formatTime(s) { if (!isFinite(s)) return '--:--.--'; const m = Math.floor(s / 60); return `${String(m).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`; }

    render() {
        const ctx = this.ctx, canvas = this.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Camera follow
        if (this.playerCar) {
            const tc = this.playerCar;
            this.camera.x += (tc.x - this.camera.x) * 0.1;
            this.camera.y += (tc.y - this.camera.y) * 0.1;
        }

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);

        this.drawTrack();
        this.drawDecorations();
        this.drawPowerups();
        this.drawProjectiles();
        this.drawBullets();

        this.aiCars.forEach(ai => this.drawCar(ai.car));
        if (this.playerCar) this.drawCar(this.playerCar);

        ctx.restore();
    }

    drawTrack() {
        const ctx = this.ctx;
        // Asphalt
        ctx.beginPath();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = this.trackWidth;
        ctx.lineJoin = 'round';
        ctx.moveTo(this.trackCenter[0].x, this.trackCenter[0].y);
        for (let i = 1; i < this.trackCenter.length; i++) ctx.lineTo(this.trackCenter[i].x, this.trackCenter[i].y);
        ctx.closePath();
        ctx.stroke();

        // Inner/Outer Neon Edges
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(this.trackInner[0].x, this.trackInner[0].y);
        for (let i = 1; i < this.trackInner.length; i++) ctx.lineTo(this.trackInner[i].x, this.trackInner[i].y);
        ctx.closePath(); ctx.stroke();

        ctx.strokeStyle = '#ff2d95';
        ctx.shadowColor = '#ff2d95';
        ctx.beginPath();
        ctx.moveTo(this.trackOuter[0].x, this.trackOuter[0].y);
        for (let i = 1; i < this.trackOuter.length; i++) ctx.lineTo(this.trackOuter[i].x, this.trackOuter[i].y);
        ctx.closePath(); ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawDecorations() {
        const ctx = this.ctx;
        this.decorations.forEach(d => {
            ctx.shadowBlur = 5;
            if (d.type === 'pine' || d.type === 'tree') {
                ctx.fillStyle = d.type === 'pine' ? `rgb(0, ${150 + d.shade * 50}, 0)` : '#2d5a27';
                ctx.shadowColor = ctx.fillStyle;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y - d.size * 2);
                ctx.lineTo(d.x - d.size, d.y + d.size);
                ctx.lineTo(d.x + d.size, d.y + d.size);
                ctx.fill();
            } else if (d.type === 'rock' || d.type === 'stone') {
                ctx.fillStyle = d.type === 'rock' ? '#666' : '#888';
                ctx.shadowColor = ctx.fillStyle;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (d.type === 'lamp') {
                ctx.fillStyle = '#fff'; ctx.shadowBlur = 15; ctx.shadowColor = '#fff';
                ctx.fillRect(d.x - 2, d.y - 2, 4, 4);
            } else if (d.type === 'barrier') {
                ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.angle);
                ctx.fillStyle = '#ff2d95'; ctx.fillRect(-10, -2, 20, 4);
                ctx.restore();
            } else {
                ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(d.x, d.y, 5, 0, Math.PI * 2); ctx.fill();
            }
            ctx.shadowBlur = 0;
        });
    }

    drawCar(car) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);

        // Body
        ctx.fillStyle = car.color1;
        ctx.shadowBlur = car.damageFlash > 0 ? 20 : 5;
        ctx.shadowColor = car.color1;
        ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);

        // Roof/Details
        ctx.fillStyle = car.color2;
        ctx.fillRect(-car.width / 4, -car.height / 4, car.width / 2, car.height / 2);

        // Shield
        if (car.shielded) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, car.height * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // Tire marks
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 4;
        car.tireMarks.forEach(m => {
            ctx.globalAlpha = m.alpha * 0.5;
            ctx.fillRect(m.x - 2, m.y - 2, 4, 4);
        });
        ctx.globalAlpha = 1;
    }

    drawProjectiles() {
        const ctx = this.ctx;
        projectiles.forEach(p => {
            ctx.fillStyle = p.type === 'missile' ? '#ff4444' : '#333';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawBullets() {
        const ctx = this.ctx;
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 10; ctx.shadowColor = '#ffff00';
        bullets.forEach(b => {
            ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
        });
        ctx.shadowBlur = 0;
    }

    updateHUD() {
        if (!this.playerCar) return;
        const car = this.playerCar;
        const speed = Math.abs(car.speed) * 3.6;
        document.getElementById('speed-number').textContent = Math.floor(speed);
        document.getElementById('speed-fill').style.strokeDasharray = `${(speed / car.config.maxSpeed) * 565}, 565`;
        document.getElementById('gear-indicator').textContent = car.gear;
        document.getElementById('lap-counter').textContent = `${gameState.currentLap} / ${CONFIG.TOTAL_LAPS}`;
        document.getElementById('race-time').textContent = this.formatTime(gameState.totalTime);
        document.getElementById('best-lap').textContent = this.formatTime(gameState.bestLap);

        // Position estimation
        let pos = 1;
        this.aiCars.forEach(ai => { if (ai.car.distance > car.distance) pos++; });
        document.getElementById('position').innerHTML = `${pos}<sup>${pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'}</sup>`;
    }

    renderMinimap() {
        const ctx = this.minimapCtx, canvas = this.minimapCanvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        const scale = 0.05;
        ctx.scale(scale, scale);
        ctx.translate(-this.camera.x, -this.camera.y);

        // Draw track
        ctx.strokeStyle = '#444'; ctx.lineWidth = 40;
        ctx.beginPath();
        ctx.moveTo(this.trackCenter[0].x, this.trackCenter[0].y);
        for (let i = 1; i < this.trackCenter.length; i++) ctx.lineTo(this.trackCenter[i].x, this.trackCenter[i].y);
        ctx.closePath(); ctx.stroke();

        // Draw players
        ctx.fillStyle = '#fff';
        if (this.playerCar) ctx.fillRect(this.playerCar.x - 20, this.playerCar.y - 20, 40, 40);
        ctx.fillStyle = '#ff0000';
        this.aiCars.forEach(ai => ctx.fillRect(ai.car.x - 20, ai.car.y - 20, 40, 40));
        ctx.restore();
    }

    drawPowerups() {
        const ctx = this.ctx;
        this.powerups.forEach(pu => {
            if (!pu.active) return;
            ctx.fillStyle = pu.type.color;
            ctx.shadowBlur = 10; ctx.shadowColor = pu.type.color;
            ctx.beginPath();
            ctx.arc(pu.x, pu.y + Math.sin(pu.bobPhase) * 5, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(pu.type.icon, pu.x, pu.y + 6 + Math.sin(pu.bobPhase) * 5);
        });
        ctx.shadowBlur = 0;
    }
}

// Start game on load
window.addEventListener('load', () => {
    window.game = new Game();
});
