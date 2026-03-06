/**
 * ENGINE3D.JS — OutRun-style Pseudo-3D Racing Engine
 *
 * Renders a curving road from the driver's perspective.
 * The player's top-view car PNG sits at the bottom of the screen.
 * AI cars appear as scaled-down sprites ahead on the road.
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

// ─── Shared read-only constants (used by renderer.js too) ────────────────────
const roadWidth   = 2000;   // world-space road half-width (for renderer compat)
const cameraDepth = 0.84;   // focal length

// Dynamic width/height (renderer.js reads these)
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

// ─── Segment / track data ─────────────────────────────────────────────────────
const SEGMENT_LENGTH = 200;
const DRAW_DISTANCE  = 200;   // segments visible ahead
const CAMERA_HEIGHT  = 1000;  // camera height above road (world units)

// Each segment holds curve & hill data
let segments = [];
let trackLength = 0;

// Track colour themes  [sky1, sky2, grass1, grass2, road1, road2, rumble1, rumble2, dash]
const THEMES = {
    city:    ['#1a1a3e','#3a3a6e', '#1a4a1a','#1e5a1e', '#555','#666', '#cc0000','#ffffff', '#ffff00'],
    desert:  ['#e8a040','#f5c060', '#c8a050','#d4aa60', '#b8a080','#c8b090', '#cc4400','#ffffff', '#ffffff'],
    forest:  ['#1a3a1a','#2a5a2a', '#1a6a1a','#228b22', '#484','#595', '#cc0000','#ffffff', '#ffffff'],
    night:   ['#000010','#000030', '#0a1a0a','#0a200a', '#333','#444', '#ff6600','#ffffff', '#ffffff'],
    coastal: ['#0066aa','#00aaff', '#c8b860','#d4c870', '#888','#999', '#cc0000','#ffffff', '#ffff00'],
};
let currentTheme = THEMES.city;

// ─── Build a track ────────────────────────────────────────────────────────────
function buildTrack(trackName) {
    segments = [];

    // Pick theme by track name
    if      (trackName === 'City Circuit')  currentTheme = THEMES.city;
    else if (trackName === 'Desert Loop')   currentTheme = THEMES.desert;
    else if (trackName === 'Forest Trail')  currentTheme = THEMES.forest;
    else if (trackName === 'Mountain Pass') currentTheme = THEMES.night;
    else if (trackName === 'Coastal Road')  currentTheme = THEMES.coastal;
    else                                    currentTheme = THEMES.city;

    // Define a simple segment recipe: [count, curve, hill]
    const recipe = [
        [60,  0,    0   ],   // straight start
        [40,  0.3,  0   ],   // gentle right
        [30, -0.5,  0   ],   // left bend
        [50,  0,    0.5 ],   // uphill straight
        [30,  0.4,  0.5 ],   // right + uphill
        [40,  0,   -0.4 ],   // downhill
        [60, -0.3,  0   ],   // left bend
        [30,  0,    0   ],   // straight
        [40,  0.6,  0   ],   // sharp right
        [40, -0.6,  0   ],   // sharp left
        [60,  0,    0   ],   // straight finish
    ];

    for (const [count, curve, hill] of recipe) {
        for (let i = 0; i < count; i++) {
            segments.push({
                index:  segments.length,
                curve:  curve,
                hill:   hill,
                color:  Math.floor(segments.length / 3) % 2,
            });
        }
    }

    trackLength = segments.length * SEGMENT_LENGTH;
}

// ─── Player state (driven by game.js via window.gameState) ────────────────────
let playerPos  = 0;
let playerX    = 0;
let cameraX    = 0;

// ─── Main render ──────────────────────────────────────────────────────────────
function render() {
    if (!window._engineRunning) return;

    if (window.gameState && window.gameState.playerCar) {
        const pc = window.gameState.playerCar;
        playerX = (pc.x || 0) / roadWidth;
        const spd = Math.max(0, pc.speed || 0);
        playerPos = (playerPos + spd * 0.016 * SEGMENT_LENGTH * 0.004) % trackLength;
        if (playerPos < 0) playerPos += trackLength;
        cameraX += (playerX - cameraX) * 0.1;
    }

    width  = canvas.width;
    height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
    skyGrad.addColorStop(0,   currentTheme[0]);
    skyGrad.addColorStop(0.6, currentTheme[1]);
    skyGrad.addColorStop(1,   currentTheme[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Sun
    drawSun();

    // 3. Road
    const horizon    = Math.floor(height * 0.48);
    const baseIdx    = Math.floor(playerPos / SEGMENT_LENGTH);
    const baseOffset = playerPos % SEGMENT_LENGTH;

    let camX   = cameraX;
    let xAccum = 0;
    let yAccum = horizon;

    const screenSegs = [];

    for (let n = 0; n < DRAW_DISTANCE; n++) {
        const seg = segments[(baseIdx + n) % segments.length];
        const z      = (n + 1 - baseOffset / SEGMENT_LENGTH);
        const scale  = cameraDepth / z;
        const roadW  = scale * (width * 0.55);
        screenSegs.push({ seg, screenX: width / 2 + xAccum, screenY: yAccum, roadW, scale, z });
        xAccum -= camX * scale * width * 0.5 * seg.curve;
        yAccum -= scale * CAMERA_HEIGHT * seg.hill * 0.4;
        camX   += seg.curve * 0.05;
    }

    for (let i = screenSegs.length - 1; i >= 0; i--) {
        const curr = screenSegs[i];
        const next = screenSegs[i - 1] || curr;
        const c = curr.seg.color;

        // Grass
        ctx.fillStyle = currentTheme[2 + c];
        ctx.fillRect(0, next.screenY, width, curr.screenY - next.screenY);

        // Rumble
        drawTrapezoid(next.screenX, next.screenY, next.roadW * 1.18,
                      curr.screenX, curr.screenY, curr.roadW * 1.18, currentTheme[6 + c]);

        // Road
        drawTrapezoid(next.screenX, next.screenY, next.roadW,
                      curr.screenX, curr.screenY, curr.roadW, currentTheme[4 + c]);

        // Centre dashes
        if (curr.seg.index % 6 < 3) {
            drawTrapezoid(next.screenX, next.screenY, next.roadW * 0.03,
                          curr.screenX, curr.screenY, curr.roadW * 0.03, currentTheme[8]);
        }

        drawAICarsOnSegment(curr, i);
    }

    // 4. Player car
    drawPlayerCar();

    requestAnimationFrame(render);
}

function drawTrapezoid(x1, y1, w1, x2, y2, w2, color) {
    if (y1 === y2) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1);
    ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2);
    ctx.lineTo(x1 + w1, y1);
    ctx.closePath();
    ctx.fill();
}

function drawSun() {
    const sx = width * 0.72, sy = height * 0.18, sr = height * 0.07;
    const isDark = (currentTheme === THEMES.night);
    const col  = isDark ? '#ffffcc' : '#ffe040';
    const glow = isDark ? 'rgba(255,255,200,0.15)' : 'rgba(255,220,0,0.18)';
    const grad = ctx.createRadialGradient(sx, sy, sr * 0.3, sx, sy, sr * 2.5);
    grad.addColorStop(0, col);
    grad.addColorStop(0.3, glow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(sx, sy, sr * 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
}

function drawPlayerCar() {
    if (!window.gameState || !window.gameState.playerCar) return;
    const pc      = window.gameState.playerCar;
    const carType = pc.carType || 'bmw_m4';
    const model   = carModels[carType];
    if (!model || !model.img.complete || model.img.naturalWidth === 0) return;

    const carW = width  * 0.14;
    const carH = carW * (model.img.naturalHeight / model.img.naturalWidth);
    const sway = (pc.steerAngle || 0) * 18;

    ctx.save();
    ctx.translate(width / 2 + sway, height - carH / 2 - height * 0.02);
    ctx.rotate((pc.steerAngle || 0) * 0.08);
    if (pc.shielded) { ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 30; }
    if (pc.damageFlash > 0) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() * 0.04);
    ctx.drawImage(model.img, -carW / 2, -carH / 2, carW, carH);
    ctx.restore();

    if (Math.abs(pc.speed) > 150) drawSpeedLines(pc.speed);
}

function drawSpeedLines(speed) {
    const intensity = Math.min(1, (Math.abs(speed) - 150) / 200);
    ctx.save();
    ctx.globalAlpha = 0.12 * intensity;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * width;
        const y = height * 0.4 + Math.random() * height * 0.55;
        const len = 40 + Math.random() * 80;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    }
    ctx.restore();
}

function drawAICarsOnSegment(screenSeg, segIdx) {
    if (!window.gameState || !window.gameState.aiCars) return;
    window.gameState.aiCars.forEach(aiObj => {
        const ai = aiObj.car || aiObj;
        const aiSegIdx = Math.floor((ai._trackPos || 0) / SEGMENT_LENGTH) % segments.length;
        const baseIdx  = Math.floor(playerPos / SEGMENT_LENGTH);
        const relIdx   = (aiSegIdx - baseIdx + segments.length) % segments.length;
        if (relIdx !== segIdx || relIdx >= DRAW_DISTANCE) return;
        const carType = ai.carType || 'bmw_m4';
        const model   = carModels[carType];
        if (!model || !model.img.complete || model.img.naturalWidth === 0) return;
        const carW = screenSeg.roadW * 1.1;
        const carH = carW * (model.img.naturalHeight / Math.max(1, model.img.naturalWidth));
        const lateralOffset = (ai.x || 0) / roadWidth * screenSeg.roadW;
        ctx.drawImage(model.img,
            screenSeg.screenX + lateralOffset - carW / 2,
            screenSeg.screenY - carH, carW, carH);
    });
}

// Legacy project() for renderer.js compatibility
function project(p, cameraX, cameraY, cameraZ) {
    const dz    = (p.z - cameraZ) || 0.001;
    const scale = cameraDepth / dz;
    return {
        x: Math.round(width  / 2 + scale * (p.x - cameraX) * width  / 2),
        y: Math.round(height / 2 - scale * (p.y - cameraY) * height / 2),
        w: Math.round(scale * roadWidth * width / 2),
    };
}

// ─── Public API ───────────────────────────────────────────────────────────────
window.buildTrack = buildTrack;

window.startEngine3D = function (trackName) {
    buildTrack(trackName || (window.gameState && window.gameState.trackName) || 'City Circuit');
    window._engineRunning = true;
    resizeCanvas();
    render();
};

window.stopEngine3D = function () {
    window._engineRunning = false;
};
