/**
 * ENGINE2D.JS — Ultra-Performance 2D Top-Down Racing Renderer
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = canvas.width;
let height = canvas.height;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const carModels = {};
Object.keys(CONFIG?.cars || {}).forEach(k => {
    const img = new Image();
    img.src = `assets/${k}.png`;
    carModels[k] = { img };
});

const TRACK_THEMES = {
    'City Circuit': {
        bg: '#1a1a1a', ground: '#2d3a2d',
        track: '#333', curb: '#cc0000', curbAlt: '#ffffff',
        decorations: ['building', 'lamp', 'barrier']
    },
    'Mountain Pass': {
        bg: '#1a2a1a', ground: '#2d4a2d',
        track: '#4a4a4a', curb: '#cc4400', curbAlt: '#ffffff',
        decorations: ['pine', 'rock', 'mountain']
    },
    'Coastal Road': {
        bg: '#1a4a6a', ground: '#1a3a2a',
        track: '#444a44', curb: '#cc0000', curbAlt: '#ffff00',
        decorations: ['pine', 'rock', 'bush']
    },
    'Desert Loop': {
        bg: '#c8a050', ground: '#a08050',
        track: '#8a7a5a', curb: '#cc4400', curbAlt: '#ffffff',
        decorations: ['cactus', 'rock', 'dune']
    },
    'Forest Trail': {
        bg: '#1a2a1a', ground: '#223522',
        track: '#3d453d', curb: '#228b22', curbAlt: '#ffffff',
        decorations: ['pine', 'bush', 'oak']
    },
    'Stadium Oval': {
        bg: '#111', ground: '#2d3a2d',
        track: '#333333', curb: '#ff2d95', curbAlt: '#00f0ff',
        decorations: ['grandstand', 'lamp', 'barrier']
    }
};

// Simplified Terrain (Solid color with grid for performance)
function renderTerrain(ctx, camera, themeName) {
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, width, height);

    const cx = camera.x, cy = camera.y;
    const gs = 200;
    const zoom = camera.zoom || 1;
    const pad = 1.2;
    
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    const sx = Math.floor((cx - width * pad / zoom) / gs) * gs;
    const sy = Math.floor((cy - height * pad / zoom) / gs) * gs;
    const ex = cx + width * pad / zoom;
    const ey = cy + height * pad / zoom;

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = sx; x < ex; x += gs) {
        ctx.moveTo(x, sy); ctx.lineTo(x, ey);
    }
    for (let y = sy; y < ey; y += gs) {
        ctx.moveTo(sx, y); ctx.lineTo(ex, y);
    }
    ctx.stroke();
    ctx.restore();
}

function generateDecorations(trackCenter, trackOuter, trackInner, themeName) {
    const decs = [];
    const n = trackCenter.length;
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];

    for (let i = 0; i < n; i += 20) {
        const curr = trackCenter[i], next = trackCenter[(i + 1) % n];
        const dx = next.x - curr.x, dy = next.y - curr.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const dist = 120 + Math.random() * 100;
        const side = Math.random() > 0.5 ? 1 : -1;
        const r = Math.random();

        if (theme.decorations.includes('pine') && r < 0.3) {
            decs.push({ type: 'pine', x: curr.x - nx * dist * side, y: curr.y - ny * dist * side, size: 10 + Math.random() * 8 });
        } else if (theme.decorations.includes('building') && r < 0.25) {
            decs.push({ type: 'building', x: curr.x - nx * dist * side, y: curr.y - ny * dist * side, w: 40 + Math.random() * 20, h: 30 + Math.random() * 20 });
        } else if (theme.decorations.includes('rock') && r < 0.4) {
            decs.push({ type: 'rock', x: curr.x + nx * (dist + 30) * side, y: curr.y + ny * (dist + 30) * side, size: 6 + Math.random() * 8 });
        }
    }
    return decs;
}

function renderDecorations(ctx, decs, camera) {
    const cx = camera.x, cy = camera.y;
    const zoom = camera.zoom || 1;
    const vw = (width / zoom) * 0.7, vh = (height / zoom) * 0.7;

    decs.forEach(d => {
        if (d.x < cx - vw || d.x > cx + vw || d.y < cy - vh || d.y > cy + vh) return;

        ctx.save();
        ctx.translate(d.x, d.y);
        switch (d.type) {
            case 'pine':
                ctx.fillStyle = '#1a3a1a';
                ctx.beginPath(); ctx.moveTo(0, -d.size); ctx.lineTo(d.size * 0.7, d.size * 0.5); ctx.lineTo(-d.size * 0.7, d.size * 0.5); ctx.fill();
                break;
            case 'building':
                ctx.fillStyle = '#222233'; ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
                ctx.strokeStyle = '#444'; ctx.strokeRect(-d.w / 2, -d.h / 2, d.w, d.h);
                break;
            case 'rock':
                ctx.fillStyle = '#444'; ctx.beginPath(); ctx.arc(0, 0, d.size, 0, Math.PI * 2); ctx.fill();
                break;
        }
        ctx.restore();
    });
}

function renderTrack(ctx, trackCenter, trackInner, trackOuter, themeName) {
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];
    const n = trackCenter.length;

    // Road Body
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x, trackOuter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x, trackOuter[i].y);
    ctx.closePath();
    ctx.moveTo(trackInner[0].x, trackInner[0].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(trackInner[i].x, trackInner[i].y);
    ctx.closePath();
    ctx.fillStyle = theme.track;
    ctx.fill();

    // Curbs (Optimized - no shadows)
    ctx.strokeStyle = theme.curb;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x, trackOuter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x, trackOuter[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = theme.curbAlt;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trackInner[0].x, trackInner[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackInner[i].x, trackInner[i].y);
    ctx.closePath();
    ctx.stroke();
}

function renderFinishLine(ctx, trackCenter, trackWidth) {
    const fp = trackCenter[0], next = trackCenter[1];
    const dx = next.x - fp.x, dy = next.y - fp.y;
    ctx.save();
    ctx.translate(fp.x, fp.y);
    ctx.rotate(Math.atan2(dy, dx));
    ctx.fillStyle = '#fff';
    ctx.fillRect(-5, -trackWidth / 2, 10, trackWidth);
    ctx.restore();
}

function renderCar(ctx, car, alpha) {
    const carType = car.carType || 'bmw_m4';
    const model = carModels[carType];
    const cfg = car.config || CONFIG?.cars?.[carType];
    const w = cfg?.width || 24;
    const h = cfg?.height || 46;

    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    ctx.globalAlpha = alpha ?? 1;

    if (model?.img?.complete && model.img.naturalWidth > 0) {
        const scale = (car.miniScale || 1) * 1.25;
        ctx.drawImage(model.img, -w*scale / 2, -h*scale / 2, w*scale, h*scale);
    } else {
        ctx.fillStyle = car.color1 || '#0066ff';
        ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    if (car.shielded) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, h * 0.6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}

function renderMinimap() {
    const mc = document.getElementById('minimapCanvas');
    const gs = window.gameState;
    if (!mc || !gs?.trackCenter?.length) return;
    
    const mctx = mc.getContext('2d');
    const mw = mc.width, mh = mc.height;
    mctx.clearRect(0, 0, mw, mh);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    gs.trackCenter.forEach(p => {
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
    });

    const pad = 10;
    const scale = Math.min((mw - pad*2) / (maxX - minX || 1), (mh - pad*2) / (maxY - minY || 1));
    const tx = x => pad + (x - minX) * scale;
    const ty = y => pad + (y - minY) * scale;

    mctx.strokeStyle = 'rgba(255,255,255,0.3)';
    mctx.lineWidth = 2;
    mctx.beginPath();
    mctx.moveTo(tx(gs.trackCenter[0].x), ty(gs.trackCenter[0].y));
    gs.trackCenter.forEach(p => mctx.lineTo(tx(p.x), ty(p.y)));
    mctx.closePath();
    mctx.stroke();

    (gs.aiCars || []).forEach(ai => {
        const c = ai.car || ai;
        mctx.fillStyle = '#ff2d95';
        mctx.beginPath(); mctx.arc(tx(c.x), ty(c.y), 2, 0, Math.PI * 2); mctx.fill();
    });

    if (gs.playerCar) {
        mctx.fillStyle = '#00f0ff';
        mctx.beginPath(); mctx.arc(tx(gs.playerCar.x), ty(gs.playerCar.y), 4, 0, Math.PI * 2); mctx.fill();
    }
}

let decorations = [];

window.render2DScene = function() {
    if (!window._engine2DRunning) return;

    const gs = window.gameState;
    if (!gs?.trackCenter) return;

    const pc = gs.playerCar;
    const camera = gs.camera || { x: 0, y: 0, zoom: 1 };
    
    if (pc) {
        camera.x += (pc.x - camera.x) * 0.15;
        camera.y += (pc.y - camera.y) * 0.15;
        const sr = Math.abs(pc.speed) / (pc.config?.maxSpeed || 280);
        camera.targetZoom = 1.1 - sr * 0.2;
        camera.zoom += ((camera.targetZoom || 1) - camera.zoom) * 0.1;
    }
    gs.camera = camera;

    // 1. Render Terrain (Background)
    renderTerrain(ctx, camera, gs.trackName);

    // 2. Transformed World Space
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    renderTrack(ctx, gs.trackCenter, gs.trackInner, gs.trackOuter, gs.trackName);
    if (decorations.length > 0) renderDecorations(ctx, decorations, camera);
    renderFinishLine(ctx, gs.trackCenter, gs.trackWidth || 140);

    (gs.aiCars || []).forEach(ai => { if (ai?.car) renderCar(ctx, ai.car, 0.9); });
    if (pc) renderCar(ctx, pc, 1);

    ctx.restore();

    // 3. UI Layer
    renderMinimap();
};

window.startEngine2D = function (trackName, trackCenter, trackInner, trackOuter, trackWidth) {
    window._engine2DRunning = true;
    if (trackCenter) {
        window.gameState = window.gameState || {};
        window.gameState.trackCenter = trackCenter;
        window.gameState.trackInner = trackInner;
        window.gameState.trackOuter = trackOuter;
        window.gameState.trackWidth = trackWidth || 140;
        window.gameState.trackName = trackName || 'Forest Trail';
        window.gameState.camera = { x: trackCenter[0]?.x || 0, y: trackCenter[0]?.y || 0, zoom: 1, targetZoom: 1 };
        decorations = generateDecorations(trackCenter, trackOuter, trackInner, window.gameState.trackName);
    }
    resizeCanvas();
};

window.stopEngine2D = function () { window._engine2DRunning = false; };

window.setEngine2DTrack = function (trackName, trackCenter, trackInner, trackOuter, trackWidth) {
    if (window.gameState) {
        window.gameState.trackCenter = trackCenter;
        window.gameState.trackInner = trackInner;
        window.gameState.trackOuter = trackOuter;
        window.gameState.trackName = trackName || 'Forest Trail';
        decorations = generateDecorations(trackCenter, trackOuter, trackInner, window.gameState.trackName);
    }
};
