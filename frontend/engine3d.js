/**
 * ENGINE3D.JS — Top-Down 2D Racing Renderer
 *
 * Camera follows the player from above.
 * Top-view car PNGs rotate and race on the track.
 * This is the correct renderer for top-view car assets.
 */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ─── Canvas sizing ────────────────────────────────────────────────────────────
function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─── Compat constants (renderer.js may reference these) ─────────────────────
const roadWidth   = 2000;
const cameraDepth = 0.84;
let width  = canvas.width;
let height = canvas.height;
window.addEventListener('resize', () => { width = canvas.width; height = canvas.height; });

// ─── Car sprite assets ───────────────────────────────────────────────────────
const carModels = {
    bmw_m4:        { img: new Image() },
    mercedes_amg:  { img: new Image() },
    toyota_supra:  { img: new Image() },
    bugatti_chiron:{ img: new Image() },
    lamborghini:   { img: new Image() },
    ferrari_f40:   { img: new Image() },
    porsche_911:   { img: new Image() },
    mclaren_p1:    { img: new Image() },
    ford_mustang:  { img: new Image() },
    nissan_gtr:    { img: new Image() },
    subaru_wrx:    { img: new Image() },
    f1_racer:      { img: new Image() },
    monster_truck: { img: new Image() },
    kawasaki_ninja:{ img: new Image() },
    ducati_v4:     { img: new Image() },
    heavy_duty:    { img: new Image() },
    formula_one:   { img: new Image() },
    offroad_legend:{ img: new Image() },
};
Object.keys(carModels).forEach(k => { carModels[k].img.src = `assets/${k}.png`; });

// ─── Track theme colours ──────────────────────────────────────────────────────
const THEMES = {
    'City Circuit':  { bg: '#1a1a2e', road: '#444455', kerb1: '#cc2200', kerb2: '#ffffff', grass: '#1a3a1a', line: '#ffff00' },
    'Desert Loop':   { bg: '#c8a050', road: '#b89060', kerb1: '#cc4400', kerb2: '#ffffff', grass: '#d4b870', line: '#ffffff' },
    'Forest Trail':  { bg: '#0d2b0d', road: '#3a4a3a', kerb1: '#cc2200', kerb2: '#ffffff', grass: '#1a5a1a', line: '#ffffff' },
    'Mountain Pass': { bg: '#0a0a18', road: '#333344', kerb1: '#ff6600', kerb2: '#ffffff', grass: '#0a200a', line: '#ffffff' },
    'Coastal Road':  { bg: '#0055aa', road: '#778899', kerb1: '#cc2200', kerb2: '#ffffff', grass: '#c8b860', line: '#ffff00' },
    'Stadium Oval':  { bg: '#111122', road: '#555566', kerb1: '#cc2200', kerb2: '#ffffff', grass: '#1a3a1a', line: '#ffff00' },
};
let theme = THEMES['City Circuit'];

// Track center-line (set by startEngine3D)
let trackCenter = [];
let trackInner  = [];
let trackOuter  = [];
let trackHalfW  = 70;

// Camera smoothed position
let camX = 0, camY = 0;
const CAM_ZOOM = 1.0; // pixels per world unit — tweak to taste

// ─── Particle pool ────────────────────────────────────────────────────────────
const particles = [];
let lastParticleTime = 0;

function spawnTireSmoke(x, y) {
    for (let i = 0; i < 3; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            life: 1, maxLife: 0.6 + Math.random() * 0.4,
            r: 4 + Math.random() * 6,
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x    += p.vx * dt;
        p.y    += p.vy * dt;
        p.life -= dt / p.maxLife;
        p.r    *= 1.02;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles(ox, oy) {
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life * 0.35;
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.arc(p.x - ox, p.y - oy, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ─── Draw track ───────────────────────────────────────────────────────────────
function drawTrack(ox, oy) {
    if (!trackCenter.length) return;
    const n = trackCenter.length;

    // 1. Outer grass fill (just clear the whole bg)
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Outer grass band (slightly lighter)
    ctx.fillStyle = theme.grass;
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x - ox, trackOuter[0].y - oy);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x - ox, trackOuter[i].y - oy);
    ctx.closePath();
    ctx.fill();

    // 3. Road surface
    ctx.fillStyle = theme.road;
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x - ox, trackOuter[0].y - oy);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x - ox, trackOuter[i].y - oy);
    ctx.closePath();
    ctx.fill();

    // 4. Inner grass (cutout)
    ctx.fillStyle = theme.grass;
    ctx.beginPath();
    ctx.moveTo(trackInner[0].x - ox, trackInner[0].y - oy);
    for (let i = 1; i < n; i++) ctx.lineTo(trackInner[i].x - ox, trackInner[i].y - oy);
    ctx.closePath();
    ctx.fill();

    // 5. Kerb stripes along edges
    const kerbW = 8;
    for (let i = 0; i < n; i++) {
        const col = Math.floor(i / 4) % 2 === 0 ? theme.kerb1 : theme.kerb2;
        const next = (i + 1) % n;
        // Outer kerb
        ctx.strokeStyle = col;
        ctx.lineWidth   = kerbW;
        ctx.beginPath();
        ctx.moveTo(trackOuter[i].x - ox, trackOuter[i].y - oy);
        ctx.lineTo(trackOuter[next].x - ox, trackOuter[next].y - oy);
        ctx.stroke();
        // Inner kerb
        ctx.beginPath();
        ctx.moveTo(trackInner[i].x - ox, trackInner[i].y - oy);
        ctx.lineTo(trackInner[next].x - ox, trackInner[next].y - oy);
        ctx.stroke();
    }

    // 6. Centre dashes
    ctx.strokeStyle = theme.line;
    ctx.lineWidth   = 2;
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(trackCenter[0].x - ox, trackCenter[0].y - oy);
    for (let i = 1; i < n; i++) ctx.lineTo(trackCenter[i].x - ox, trackCenter[i].y - oy);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // 7. Start/Finish line
    drawFinishLine(ox, oy);
}

function drawFinishLine(ox, oy) {
    if (!trackCenter.length) return;
    const n    = trackCenter.length;
    const p0   = trackInner[0];
    const p1   = trackOuter[0];
    const next = trackInner[1];

    const dx = next.x - p0.x, dy = next.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx  = -dy / len, ny = dx / len;

    const squares = 8;
    const segLen  = Math.sqrt((p1.x-p0.x)**2 + (p1.y-p0.y)**2) / squares;

    for (let i = 0; i < squares; i++) {
        const t0 = i / squares, t1 = (i + 1) / squares;
        const ax = p0.x + (p1.x - p0.x) * t0 - ox;
        const ay = p0.y + (p1.y - p0.y) * t0 - oy;
        const bx = p0.x + (p1.x - p0.x) * t1 - ox;
        const by = p0.y + (p1.y - p0.y) * t1 - oy;

        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + nx * 12, by + ny * 12);
        ctx.lineTo(ax + nx * 12, ay + ny * 12);
        ctx.closePath();
        ctx.fill();
    }
}

// ─── Draw a single car ────────────────────────────────────────────────────────
function drawCar(car, ox, oy, isPlayer) {
    const model = carModels[car.carType];
    if (!model || !model.img.complete || model.img.naturalWidth === 0) {
        // Fallback rectangle
        ctx.save();
        ctx.translate(car.x - ox, car.y - oy);
        ctx.rotate(car.angle);
        ctx.fillStyle = car.color1 || '#00f0ff';
        const w = (car.width  || 24) * (car.miniScale || 1);
        const h = (car.height || 46) * (car.miniScale || 1);
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
        return;
    }

    const scale = car.miniScale || 1;
    const dw = model.img.naturalWidth;
    const dh = model.img.naturalHeight;
    const aspect = dh / dw;
    const carW = (car.width  || 24) * scale;
    const carH = carW * aspect;

    ctx.save();
    ctx.translate(car.x - ox, car.y - oy);
    ctx.rotate(car.angle);

    // Shield glow
    if (car.shielded) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur  = 18;
    }
    // Damage flash
    if (car.damageFlash > 0) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.04);
    }

    ctx.drawImage(model.img, -carW / 2, -carH / 2, carW, carH);

    // Player indicator arrow above car
    if (isPlayer) {
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
        ctx.fillStyle   = '#00f0ff';
        const arrowY = -carH / 2 - 14;
        ctx.beginPath();
        ctx.moveTo(0,         arrowY - 8);
        ctx.lineTo(-6,        arrowY);
        ctx.lineTo(6,         arrowY);
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();

    // Tire smoke when drifting
    if (car.drifting && Math.abs(car.speed) > 40) {
        if (performance.now() - lastParticleTime > 30) {
            spawnTireSmoke(car.x, car.y);
            lastParticleTime = performance.now();
        }
    }
}

// ─── Draw tire marks ──────────────────────────────────────────────────────────
function drawTireMarks(car, ox, oy) {
    if (!car.tireMarks || !car.tireMarks.length) return;
    ctx.save();
    for (let i = 0; i < car.tireMarks.length - 1; i++) {
        const m = car.tireMarks[i];
        ctx.beginPath();
        ctx.arc(m.x - ox, m.y - oy, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${m.alpha * 0.35})`;
        ctx.fill();
    }
    ctx.restore();
}

// ─── Draw minimap ─────────────────────────────────────────────────────────────
function drawMinimap() {
    const mc = document.getElementById('minimapCanvas');
    if (!mc || !trackCenter.length) return;
    const mctx = mc.getContext('2d');
    const mw   = mc.width, mh = mc.height;

    mctx.clearRect(0, 0, mw, mh);

    // Scale track to minimap
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of trackCenter) {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    }
    const pad  = 8;
    const scaleX = (mw - pad * 2) / (maxX - minX || 1);
    const scaleY = (mh - pad * 2) / (maxY - minY || 1);
    const sc   = Math.min(scaleX, scaleY);

    const tx = p => pad + (p.x - minX) * sc;
    const ty = p => pad + (p.y - minY) * sc;

    // Road strip
    mctx.strokeStyle = '#666677';
    mctx.lineWidth   = 6;
    mctx.beginPath();
    mctx.moveTo(tx(trackCenter[0]), ty(trackCenter[0]));
    for (const p of trackCenter) mctx.lineTo(tx(p), ty(p));
    mctx.closePath();
    mctx.stroke();

    // Finish line dot
    mctx.fillStyle = '#ffffff';
    mctx.beginPath();
    mctx.arc(tx(trackCenter[0]), ty(trackCenter[0]), 3, 0, Math.PI * 2);
    mctx.fill();

    // Player dot
    if (window.gameState && window.gameState.playerCar) {
        const pc = window.gameState.playerCar;
        mctx.fillStyle = '#00f0ff';
        mctx.beginPath();
        mctx.arc(tx(pc), ty(pc), 4, 0, Math.PI * 2);
        mctx.fill();
    }

    // AI dots
    if (window.gameState && window.gameState.aiCars) {
        window.gameState.aiCars.forEach(ai => {
            const c = ai.car || ai;
            mctx.fillStyle = '#ff2d95';
            mctx.beginPath();
            mctx.arc(tx(c), ty(c), 3, 0, Math.PI * 2);
            mctx.fill();
        });
    }
}

// ─── Main render loop ─────────────────────────────────────────────────────────
let _lastRenderTime = 0;

function render(ts) {
    if (!window._engineRunning) return;
    requestAnimationFrame(render);

    const dt = Math.min((ts - _lastRenderTime) / 1000, 0.05);
    _lastRenderTime = ts;

    width  = canvas.width;
    height = canvas.height;

    // Smooth camera follow
    if (window.gameState && window.gameState.playerCar) {
        const pc = window.gameState.playerCar;
        camX += (pc.x - camX) * 12 * dt;
        camY += (pc.y - camY) * 12 * dt;
    }

    // World-to-screen offset (centre of canvas = camera)
    const ox = camX - width  / 2;
    const oy = camY - height / 2;

    // Update particles
    updateParticles(dt);

    // Draw background + track
    drawTrack(ox, oy);

    // Tire marks for player
    if (window.gameState && window.gameState.playerCar) {
        drawTireMarks(window.gameState.playerCar, ox, oy);
    }

    // Tire marks for AI
    if (window.gameState && window.gameState.aiCars) {
        window.gameState.aiCars.forEach(ai => drawTireMarks(ai.car || ai, ox, oy));
    }

    // Particles
    drawParticles(ox, oy);

    // Draw AI cars (back to front by y for overlap)
    if (window.gameState && window.gameState.aiCars) {
        const sorted = [...window.gameState.aiCars].sort((a, b) => {
            const ca = a.car || a, cb = b.car || b;
            return ca.y - cb.y;
        });
        sorted.forEach(ai => drawCar(ai.car || ai, ox, oy, false));
    }

    // Draw player car last (always on top)
    if (window.gameState && window.gameState.playerCar) {
        drawCar(window.gameState.playerCar, ox, oy, true);
    }

    // Minimap update (every 3 frames to save CPU)
    if (Math.floor(ts / 50) % 3 === 0) drawMinimap();
}

// ─── Legacy project() for renderer.js compat ─────────────────────────────────
function project(p, cx, cy, cz) {
    const dz = (p.z - cz) || 0.001;
    const sc = cameraDepth / dz;
    return {
        x: Math.round(width  / 2 + sc * (p.x - cx) * width  / 2),
        y: Math.round(height / 2 - sc * (p.y - cy) * height / 2),
        w: Math.round(sc * roadWidth * width / 2),
    };
}

// ─── Public API ───────────────────────────────────────────────────────────────
window.buildTrack = function(trackName) {
    theme = THEMES[trackName] || THEMES['City Circuit'];
    // Track geometry is provided by game.js via startEngine3D
};

window.startEngine3D = function(trackName, tc, ti, to, hw) {
    theme       = THEMES[trackName] || THEMES['City Circuit'];
    trackCenter = tc  || trackCenter;
    trackInner  = ti  || trackInner;
    trackOuter  = to  || trackOuter;
    trackHalfW  = hw  || trackHalfW;

    // Seed camera on player start position
    if (window.gameState && window.gameState.playerCar) {
        camX = window.gameState.playerCar.x;
        camY = window.gameState.playerCar.y;
    }

    window._engineRunning = true;
    resizeCanvas();
    requestAnimationFrame(render);
};

window.stopEngine3D = function() {
    window._engineRunning = false;
};

// Also let game.js pass track data separately (for restarts)
window.setEngine3DTrack = function(trackName, tc, ti, to, hw) {
    theme       = THEMES[trackName] || THEMES['City Circuit'];
    trackCenter = tc  || trackCenter;
    trackInner  = ti  || trackInner;
    trackOuter  = to  || trackOuter;
    trackHalfW  = hw  || trackHalfW;
};
