/**
 * ENGINE2D.JS — Optimized 2D Top-Down Racing Renderer
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
        ground: ['#2d3a2d', '#3d4a3d', '#4a5a4a', '#5a6a5a'],
        track: '#3a3a3a', curb: '#cc0000', curbAlt: '#ffffff',
        water: null, sand: null,
        decorations: ['building', 'lamp', 'barrier']
    },
    'Mountain Pass': {
        ground: ['#1a2a1a', '#2d4a2d', '#3d5a3d', '#5a6a4a', '#6a7a5a', '#8a9a8a', '#aab0aa'],
        track: '#4a4a4a', curb: '#cc4400', curbAlt: '#ffffff',
        water: null, sand: null,
        decorations: ['pine', 'rock', 'mountain']
    },
    'Coastal Road': {
        ground: ['#1a3a2a', '#2a4a3a', '#3a5a4a'],
        track: '#444a44', curb: '#cc0000', curbAlt: '#ffff00',
        water: '#1a4a6a', sand: '#c4a060',
        decorations: ['pine', 'rock', 'bush']
    },
    'Desert Loop': {
        ground: ['#a08050', '#b09060', '#c0a070', '#d4b080', '#e0c090'],
        track: '#8a7a5a', curb: '#cc4400', curbAlt: '#ffffff',
        water: null, sand: '#c8a050',
        decorations: ['cactus', 'rock', 'dune']
    },
    'Forest Trail': {
        ground: ['#1a2a1a', '#223522', '#2a4030', '#3a5040'],
        track: '#3d453d', curb: '#228b22', curbAlt: '#ffffff',
        water: '#1a3a4a', sand: null,
        decorations: ['pine', 'bush', 'oak']
    },
    'Stadium Oval': {
        ground: ['#2d3a2d', '#3d4d3d'],
        track: '#333333', curb: '#ff2d95', curbAlt: '#00f0ff',
        water: null, sand: null,
        decorations: ['grandstand', 'lamp', 'barrier']
    }
};

function noise2D(x, y, seed = 12345) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
    return n - Math.floor(n);
}

function smoothNoise(x, y, scale, seed) {
    const sx = x * scale, sy = y * scale;
    const ix = Math.floor(sx), iy = Math.floor(sy);
    const fx = sx - ix, fy = sy - iy;
    const a = noise2D(ix, iy, seed);
    const b = noise2D(ix + 1, iy, seed);
    const c = noise2D(ix, iy + 1, seed);
    const d = noise2D(ix + 1, iy + 1, seed);
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return a * (1 - ux) * (1 - uy) + b * ux * (1 - uy) + c * (1 - ux) * uy + d * ux * uy;
}

function getElevation(x, y, theme) {
    const n1 = smoothNoise(x, y, 0.002, 1);
    const n2 = smoothNoise(x, y, 0.008, 2) * 0.5;
    return n1 + n2;
}

function renderTerrain(ctx, camera, themeName) {
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];
    const cx = camera.x, cy = camera.y;
    const gs = 150; // High performance grid
    const pad = 1.2;
    const zoom = camera.zoom || 1;
    const sx = Math.floor((cx - width * pad / zoom) / gs) * gs;
    const sy = Math.floor((cy - height * pad / zoom) / gs) * gs;
    const ex = cx + width * pad / zoom;
    const ey = cy + height * pad / zoom;

    for (let x = sx; x < ex; x += gs) {
        for (let y = sy; y < ey; y += gs) {
            const elev = getElevation(x, y, themeName);
            const idx = Math.min(Math.floor(elev * theme.ground.length), theme.ground.length - 1);
            ctx.fillStyle = theme.ground[idx];
            ctx.fillRect(x, y, gs + 1, gs + 1);
        }
    }

    if (theme.water) {
        ctx.fillStyle = theme.water;
        ctx.globalAlpha = 0.5;
        const wgs = gs * 3;
        for (let x = sx; x < ex; x += wgs) {
            for (let y = sy; y < ey; y += wgs) {
                const n = smoothNoise(x * 0.001, y * 0.001, 1, 99);
                if (n > 0.75) ctx.fillRect(x - gs, y - gs, wgs * 2, wgs * 2);
            }
        }
        ctx.globalAlpha = 1;
    }
}

function generateDecorations(trackCenter, trackOuter, trackInner, themeName) {
    const decs = [];
    const n = trackCenter.length;
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];

    for (let i = 0; i < n; i += 15) {
        const prev = trackCenter[(i - 1 + n) % n], curr = trackCenter[i], next = trackCenter[(i + 1) % n];
        const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const dist = 100 + Math.random() * 150;
        const side = Math.random() > 0.5 ? 1 : -1;
        const r = Math.random();

        if (theme.decorations.includes('pine') && r < 0.4) {
            decs.push({ type: 'pine', x: curr.x - nx * dist * side, y: curr.y - ny * dist * side, size: 8 + Math.random() * 10 });
        } else if (theme.decorations.includes('building') && r < 0.3) {
            decs.push({ type: 'building', x: curr.x - nx * dist * side, y: curr.y - ny * dist * side, w: 40 + Math.random() * 30, h: 25 + Math.random() * 25, lights: Array.from({length:6}, () => Math.random() > 0.4) });
        } else if (theme.decorations.includes('rock') && r < 0.4) {
            decs.push({ type: 'rock', x: curr.x + nx * (dist + 30) * side, y: curr.y + ny * (dist + 30) * side, size: 6 + Math.random() * 12 });
        } else if (theme.decorations.includes('bush') && r < 0.4) {
            decs.push({ type: 'bush', x: curr.x + nx * dist * side, y: curr.y - ny * dist * side, size: 7 + Math.random() * 10 });
        } else if (theme.decorations.includes('lamp') && r < 0.2) {
            decs.push({ type: 'lamp', x: curr.x - nx * 90 * side, y: curr.y - ny * 90 * side });
        }
    }
    return decs;
}

function renderDecorations(ctx, decs, camera) {
    const cx = camera.x, cy = camera.y;
    const zoom = camera.zoom || 1;
    const pad = 1.1;
    const vw = (width / zoom) * pad, vh = (height / zoom) * pad;

    decs.forEach(d => {
        if (d.x < cx - vw || d.x > cx + vw || d.y < cy - vh || d.y > cy + vh) return;

        ctx.save();
        ctx.translate(d.x, d.y);
        switch (d.type) {
            case 'pine':
                ctx.fillStyle = '#3d2b1f'; ctx.fillRect(-2, -2, 4, 10);
                ctx.fillStyle = '#1a4a1a';
                for (let L = 0; L < 3; L++) {
                    const s = (d.size || 12) - L * 4;
                    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, s * 0.3); ctx.lineTo(-s * 0.7, s * 0.3);
                    ctx.closePath(); ctx.fill();
                }
                break;
            case 'building':
                ctx.fillStyle = '#333344'; ctx.fillRect(-(d.w || 30) / 2, -(d.h || 25) / 2, d.w || 30, d.h || 25);
                ctx.strokeStyle = '#555'; ctx.strokeRect(-(d.w || 30) / 2, -(d.h || 25) / 2, d.w || 30, d.h || 25);
                if (d.lights) d.lights.forEach((on, i) => {
                    ctx.fillStyle = on ? '#ffdd88' : '#222233';
                    const wx = i % 3, wy = Math.floor(i / 3);
                    ctx.fillRect(-(d.w || 30) / 2 + 6 + wx * 10, -(d.h || 25) / 2 + 6 + wy * 10, 6, 6);
                });
                break;
            case 'rock':
                ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.ellipse(0, 0, d.size || 8, (d.size || 8) * 0.7, 0.3, 0, Math.PI * 2); ctx.fill();
                break;
            case 'bush':
                ctx.fillStyle = '#2a5a2a'; ctx.beginPath(); ctx.arc(0, 0, d.size || 8, 0, Math.PI * 2); ctx.fill();
                break;
            case 'lamp':
                ctx.fillStyle = '#444'; ctx.fillRect(-2, -14, 4, 14);
                ctx.fillStyle = '#ffdd66'; ctx.beginPath(); ctx.arc(0, -16, 5, 0, Math.PI * 2); ctx.fill();
                break;
        }
        ctx.restore();
    });
}

function renderTrack(ctx, trackCenter, trackInner, trackOuter, themeName) {
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];
    const n = trackCenter.length;

    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x, trackOuter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x, trackOuter[i].y);
    ctx.closePath();
    ctx.moveTo(trackInner[0].x, trackInner[0].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(trackInner[i].x, trackInner[i].y);
    ctx.closePath();
    ctx.fillStyle = theme.track;
    ctx.fill();

    ctx.strokeStyle = theme.curb;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x, trackOuter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x, trackOuter[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = theme.curbAlt;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(trackInner[0].x, trackInner[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackInner[i].x, trackInner[i].y);
    ctx.closePath();
    ctx.stroke();
}

function renderFinishLine(ctx, trackCenter, trackWidth) {
    const fp = trackCenter[0], n = trackCenter.length;
    const prev = trackCenter[n - 1], next = trackCenter[1];
    const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / len, ny = dx / len, hw = trackWidth / 2, segs = 10, sw = hw * 2 / segs;
    for (let i = 0; i < segs; i++) {
        const r = (i / segs) - 0.5;
        ctx.save();
        ctx.translate(fp.x + nx * hw * 2 * r, fp.y + ny * hw * 2 * r);
        ctx.rotate(Math.atan2(dy, dx));
        ctx.fillStyle = i % 2 === 0 ? '#fff' : '#111';
        ctx.fillRect(-sw / 2, -10, sw, 10);
        ctx.fillStyle = i % 2 === 1 ? '#fff' : '#111';
        ctx.fillRect(-sw / 2, 0, sw, 10);
        ctx.restore();
    }
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
        const scale = (car.miniScale || 1) * 1.2;
        const sw = w * scale, sh = h * scale;
        ctx.drawImage(model.img, -sw / 2, -sh / 2, sw, sh);
    } else {
        ctx.fillStyle = car.color1 || '#0066ff';
        ctx.fillRect(-w / 2, -h / 2, w, h);
    }

    if (car.shielded) {
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, h * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.restore();
}

function renderProjectiles(ctx, projectiles, bullets) {
    (projectiles || []).forEach(p => {
        if (!p.active) return;
        ctx.fillStyle = p.type === 'missile' ? '#f44' : 'rgba(40,30,20,0.7)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius || 6, 0, Math.PI * 2); ctx.fill();
    });
    (bullets || []).forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = '#ff8'; ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    });
}

let decorations = [];

window.render2DScene = function() {
    if (!window._engine2DRunning) return;

    const gs = window.gameState;
    if (!gs?.trackCenter || !gs?.trackInner || !gs?.trackOuter) return;

    const pc = gs.playerCar;
    const camera = gs.camera || { x: 0, y: 0, zoom: 1 };
    
    // Smooth Camera (delta-time independent enough for 60fps)
    if (pc) {
        camera.x += (pc.x - camera.x) * 0.1;
        camera.y += (pc.y - camera.y) * 0.1;
        const sr = Math.abs(pc.speed) / (pc.config?.maxSpeed || 280);
        camera.targetZoom = 1.1 - sr * 0.2;
        camera.zoom += ((camera.targetZoom || 1) - camera.zoom) * 0.05;
    }
    gs.camera = camera;

    width = canvas.width; height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    renderTerrain(ctx, camera, gs.trackName || 'Forest Trail');
    renderTrack(ctx, gs.trackCenter, gs.trackInner, gs.trackOuter, gs.trackName || 'Forest Trail');
    
    if (decorations.length > 0) renderDecorations(ctx, decorations, camera);
    renderFinishLine(ctx, gs.trackCenter, gs.trackWidth || 140);

    (gs.aiCars || []).forEach(ai => { if (ai?.car) renderCar(ctx, ai.car, 0.9); });
    if (pc) renderCar(ctx, pc, 1);

    renderProjectiles(ctx, window.projectiles || [], window.bullets || []);
    ctx.restore();
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
        decorations = generateDecorations(trackCenter, trackOuter, trackInner, trackName || 'Forest Trail');
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
        decorations = generateDecorations(trackCenter, trackOuter, trackInner, trackName || 'Forest Trail');
    }
};
