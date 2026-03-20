/**
 * ENGINE2D.JS — 2D Top-Down Racing Renderer
 *
 * Renders realistic tracks with terrain (mountains, hills, forests) in top-down view.
 * Uses top-view car PNG sprites from assets folder.
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

// ─── Car sprite assets (top-view PNGs) ─────────────────────────────────────
const carModels = {};
Object.keys(CONFIG?.cars || {}).forEach(k => {
    const img = new Image();
    img.src = `assets/${k}.png`;
    carModels[k] = { img };
});

// ─── Track themes (terrain colors for different environments) ───────────────
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

// Simple noise for terrain
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
    const n3 = smoothNoise(x, y, 0.02, 3) * 0.25;
    return n1 + n2 + n3;
}

// ─── Terrain rendering ─────────────────────────────────────────────────────
function renderTerrain(ctx, camera, themeName) {
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];
    const cx = camera.x, cy = camera.y;
    const gs = 60;
    const pad = 1.5;
    const sx = Math.floor((cx - width * pad / camera.zoom) / gs) * gs;
    const sy = Math.floor((cy - height * pad / camera.zoom) / gs) * gs;
    const ex = cx + width * pad / camera.zoom;
    const ey = cy + height * pad / camera.zoom;

    for (let x = sx; x < ex; x += gs) {
        for (let y = sy; y < ey; y += gs) {
            const elev = getElevation(x, y, themeName);
            const idx = Math.min(Math.floor(elev * theme.ground.length), theme.ground.length - 1);
            ctx.fillStyle = theme.ground[idx];
            ctx.fillRect(x, y, gs + 1, gs + 1);
        }
    }

    // Water / lakes for coastal
    if (theme.water) {
        ctx.fillStyle = theme.water;
        ctx.globalAlpha = 0.6;
        for (let x = sx; x < ex; x += gs * 2) {
            for (let y = sy; y < ey; y += gs * 2) {
                const n = smoothNoise(x * 0.001, y * 0.001, 1, 99);
                if (n > 0.7) {
                    ctx.fillRect(x - gs, y - gs, gs * 4, gs * 4);
                }
            }
        }
        ctx.globalAlpha = 1;
    }

    // Sand strips for desert
    if (theme.sand) {
        ctx.fillStyle = theme.sand;
        ctx.globalAlpha = 0.4;
        for (let x = sx; x < ex; x += gs) {
            for (let y = sy; y < ey; y += gs) {
                const n = smoothNoise(x * 0.003, y * 0.003, 1, 77);
                if (n > 0.5) ctx.fillRect(x, y, gs + 1, gs + 1);
            }
        }
        ctx.globalAlpha = 1;
    }
}

// ─── Decorations ───────────────────────────────────────────────────────────
function generateDecorations(trackCenter, trackOuter, trackInner, themeName) {
    const decs = [];
    const n = trackCenter.length;
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];

    for (let i = 0; i < n; i += 4) {
        const prev = trackCenter[(i - 1 + n) % n], curr = trackCenter[i], next = trackCenter[(i + 1) % n];
        const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const dist = 90 + Math.random() * 120;
        const r = Math.random();

        if (theme.decorations.includes('pine') && r < 0.4) {
            decs.push({ type: 'pine', x: curr.x - nx * dist * (Math.random() > 0.5 ? 1 : -1), y: curr.y - ny * dist * (Math.random() > 0.5 ? 1 : -1), size: 8 + Math.random() * 10 });
        } else if (theme.decorations.includes('building') && r < 0.35) {
            decs.push({ type: 'building', x: curr.x - nx * dist, y: curr.y - ny * dist, w: 35 + Math.random() * 25, h: 20 + Math.random() * 20 });
        } else if (theme.decorations.includes('rock') && r < 0.5) {
            decs.push({ type: 'rock', x: curr.x + nx * (dist + 20) * (Math.random() > 0.5 ? 1 : -1), y: curr.y + ny * (dist + 20) * (Math.random() > 0.5 ? 1 : -1), size: 5 + Math.random() * 10 });
        } else if (theme.decorations.includes('bush') && r < 0.45) {
            decs.push({ type: 'bush', x: curr.x + nx * dist * (Math.random() > 0.5 ? 1 : -1), y: curr.y + ny * dist * (Math.random() > 0.5 ? 1 : -1), size: 6 + Math.random() * 8 });
        } else if (theme.decorations.includes('lamp') && r < 0.3) {
            decs.push({ type: 'lamp', x: curr.x - nx * 85, y: curr.y - ny * 85 });
        } else if (theme.decorations.includes('barrier') && r < 0.25) {
            decs.push({ type: 'barrier', x: curr.x - nx * 75, y: curr.y - ny * 75, angle: Math.atan2(dy, dx) });
        } else if (theme.decorations.includes('grandstand') && i % 60 === 0) {
            decs.push({ type: 'grandstand', x: curr.x - nx * 150, y: curr.y - ny * 150, w: 60, h: 35 });
        } else if (theme.decorations.includes('cactus') && r < 0.35) {
            decs.push({ type: 'cactus', x: curr.x + nx * dist * (Math.random() > 0.5 ? 1 : -1), y: curr.y + ny * dist * (Math.random() > 0.5 ? 1 : -1) });
        } else if (theme.decorations.includes('mountain') && r < 0.2) {
            decs.push({ type: 'mountain', x: curr.x - nx * (dist + 100), y: curr.y - ny * (dist + 100), size: 40 + Math.random() * 50 });
        }
    }
    return decs;
}

function renderDecorations(ctx, decs, themeName) {
    decs.forEach(d => {
        ctx.save();
        ctx.translate(d.x, d.y);
        switch (d.type) {
            case 'pine':
                ctx.fillStyle = '#3d2b1f';
                ctx.fillRect(-2, -2, 4, 10);
                ctx.fillStyle = '#1a4a1a';
                for (let L = 0; L < 3; L++) {
                    const s = (d.size || 12) - L * 4;
                    ctx.beginPath();
                    ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, s * 0.3); ctx.lineTo(-s * 0.7, s * 0.3);
                    ctx.closePath(); ctx.fill();
                }
                break;
            case 'building':
                ctx.fillStyle = '#333344';
                ctx.fillRect(-(d.w || 30) / 2, -(d.h || 25) / 2, d.w || 30, d.h || 25);
                ctx.strokeStyle = '#555';
                ctx.strokeRect(-(d.w || 30) / 2, -(d.h || 25) / 2, d.w || 30, d.h || 25);
                for (let wx = 0; wx < 3; wx++) for (let wy = 0; wy < 2; wy++) {
                    ctx.fillStyle = Math.random() > 0.3 ? '#ffdd88' : '#444455';
                    ctx.fillRect(-(d.w || 30) / 2 + 6 + wx * 10, -(d.h || 25) / 2 + 6 + wy * 10, 6, 6);
                }
                break;
            case 'rock':
                ctx.fillStyle = '#5a5a5a';
                ctx.beginPath();
                ctx.ellipse(0, 0, d.size || 8, (d.size || 8) * 0.7, 0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'bush':
                ctx.fillStyle = '#2a5a2a';
                ctx.beginPath();
                ctx.arc(0, 0, d.size || 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'lamp':
                ctx.fillStyle = '#444';
                ctx.fillRect(-2, -14, 4, 14);
                ctx.fillStyle = '#ffdd66';
                ctx.beginPath();
                ctx.arc(0, -16, 5, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'barrier':
                ctx.rotate(d.angle || 0);
                for (let t = 0; t < 5; t++) {
                    ctx.fillStyle = t % 2 === 0 ? '#cc3333' : '#ffffff';
                    ctx.beginPath();
                    ctx.arc(t * 8 - 16, 0, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
            case 'grandstand':
                ctx.fillStyle = '#2a2a3a';
                ctx.fillRect(-(d.w || 60) / 2, -(d.h || 35) / 2, d.w || 60, d.h || 35);
                ctx.fillStyle = '#444';
                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 8; col++) {
                        ctx.fillRect(-28 + col * 8, -15 + row * 6, 5, 4);
                    }
                }
                break;
            case 'cactus':
                ctx.fillStyle = '#2a4a2a';
                ctx.fillRect(-4, -20, 8, 24);
                ctx.fillRect(-4, -20, 6, 8);
                ctx.fillRect(2, -8, 6, 8);
                ctx.fillStyle = '#3a6a3a';
                ctx.beginPath();
                ctx.ellipse(0, -22, 6, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'mountain':
                const sz = d.size || 50;
                ctx.fillStyle = '#6a7a6a';
                ctx.beginPath();
                ctx.moveTo(0, sz * 0.3);
                ctx.lineTo(-sz * 0.8, sz * 0.3);
                ctx.lineTo(-sz * 0.3, -sz * 0.2);
                ctx.lineTo(0, -sz * 0.5);
                ctx.lineTo(sz * 0.3, -sz * 0.2);
                ctx.lineTo(sz * 0.8, sz * 0.3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#5a6a5a';
                ctx.stroke();
                ctx.fillStyle = '#8a9a8a';
                ctx.beginPath();
                ctx.moveTo(0, -sz * 0.5);
                ctx.lineTo(-sz * 0.2, sz * 0.2);
                ctx.lineTo(sz * 0.2, sz * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
        }
        ctx.restore();
    });
}

// ─── Track rendering ───────────────────────────────────────────────────────
function renderTrack(ctx, trackCenter, trackInner, trackOuter, themeName) {
    const theme = TRACK_THEMES[themeName] || TRACK_THEMES['Forest Trail'];
    const n = trackCenter.length;

    // Soft shoulder to separate asphalt from terrain.
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x, trackOuter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x, trackOuter[i].y);
    ctx.closePath();
    ctx.stroke();

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
    ctx.shadowColor = theme.curb;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(trackOuter[0].x, trackOuter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackOuter[i].x, trackOuter[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = theme.curbAlt;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(trackInner[0].x, trackInner[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackInner[i].x, trackInner[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.setLineDash([14, 20]);
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(trackCenter[0].x, trackCenter[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(trackCenter[i].x, trackCenter[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
}

// ─── Finish line ───────────────────────────────────────────────────────────
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

// ─── Tire marks ────────────────────────────────────────────────────────────
function renderTireMarks(ctx, cars) {
    cars.forEach(car => {
        if (!car?.tireMarks) return;
        // Fade older marks and keep capped so the track doesn't turn into solid black.
        for (let i = car.tireMarks.length - 1; i >= 0; i--) {
            const m = car.tireMarks[i];
            m.alpha = (m.alpha ?? 0.45) * 0.992;
            if (m.alpha < 0.06) car.tireMarks.splice(i, 1);
        }
        const MAX_MARKS = 700;
        if (car.tireMarks.length > MAX_MARKS) {
            car.tireMarks.splice(0, car.tireMarks.length - MAX_MARKS);
        }

        car.tireMarks.forEach(m => {
            ctx.beginPath();
            ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(20,20,20,${Math.min(0.38, (m.alpha || 0.1) * 0.62)})`;
            ctx.fill();
        });
    });
}

// ─── Car rendering (top-view PNG sprites) ───────────────────────────────────
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
        ctx.ellipse(0, 0, w * 0.6, h * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

function renderCarLabel(ctx, car, text, isPlayer = false) {
    if (!car || !text) return;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = isPlayer ? '700 12px Rajdhani, sans-serif' : '600 11px Rajdhani, sans-serif';
    const y = -((car.height || 46) * 0.75) - 8;

    // Soft dark outline for readability on any terrain.
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(10,14,24,0.9)';
    ctx.strokeText(text, 0, y);

    ctx.fillStyle = isPlayer ? '#a6ff00' : '#ffffff';
    ctx.fillText(text, 0, y);
    ctx.restore();
}

// ─── Projectiles & bullets ──────────────────────────────────────────────────
function renderProjectiles(ctx, projectiles, bullets) {
    (projectiles || []).forEach(p => {
        if (!p.active) return;
        if (p.type === 'missile') {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'oil') {
            ctx.fillStyle = 'rgba(40,30,20,0.7)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 20, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'emp') {
            ctx.fillStyle = `rgba(0,240,255,${p.life * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius || 60, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    (bullets || []).forEach(b => {
        if (!b.active) return;
        ctx.fillStyle = '#ffff88';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ─── Main render loop ──────────────────────────────────────────────────────
let decorations = [];

function render() {
    if (!window._engine2DRunning) return;

    const gs = window.gameState;
    if (!gs?.trackCenter || !gs?.trackInner || !gs?.trackOuter) {
        requestAnimationFrame(render);
        return;
    }

    const pc = gs.playerCar;
    const camera = gs.camera || { x: 0, y: 0, zoom: 1 };
    if (pc) {
        const fwdX = Math.sin(pc.angle);
        const fwdY = -Math.cos(pc.angle);
        const speedRatio = Math.min(1, Math.abs(pc.speed) / (pc.config?.maxSpeed || 280));
        const lookahead = 45 + speedRatio * 120;
        const targetX = pc.x + fwdX * lookahead;
        const targetY = pc.y + fwdY * lookahead;
        const followLerp = 0.065 + speedRatio * 0.06;
        camera.x += (targetX - camera.x) * followLerp;
        camera.y += (targetY - camera.y) * followLerp;
        const sr = Math.abs(pc.speed) / (pc.config?.maxSpeed || 280);
        camera.targetZoom = 1.14 - sr * 0.22;
        camera.zoom += ((camera.targetZoom || 1) - camera.zoom) * 0.04;
    }
    gs.camera = camera;

    width = canvas.width;
    height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    renderTerrain(ctx, camera, gs.trackName || 'Forest Trail');
    renderTrack(ctx, gs.trackCenter, gs.trackInner, gs.trackOuter, gs.trackName || 'Forest Trail');
    renderTireMarks(ctx, [pc, ...(gs.aiCars || []).map(a => a?.car).filter(Boolean)]);
    if (decorations.length > 0) {
        renderDecorations(ctx, decorations, gs.trackName || 'Forest Trail');
    }
    renderFinishLine(ctx, gs.trackCenter, gs.trackWidth || 140);

    (gs.aiCars || []).forEach(ai => {
        const car = ai?.car || ai;
        if (car) renderCar(ctx, car, 0.9);
    });
    if (pc) renderCar(ctx, pc, 1);

    // Draw labels after cars so text stays visible.
    if (pc) {
        const playerLabel = pc.displayName || 'You';
        renderCarLabel(ctx, pc, playerLabel, true);
    }

    renderProjectiles(ctx, window.projectiles || [], window.bullets || []);

    ctx.restore();
    requestAnimationFrame(render);
}

// ─── Public API ────────────────────────────────────────────────────────────
window.startEngine2D = function (trackName, trackCenter, trackInner, trackOuter, trackWidth) {
    window._engine2DRunning = true;
    if (trackCenter && trackInner && trackOuter) {
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
    render();
};

window.stopEngine2D = function () {
    window._engine2DRunning = false;
};

window.setEngine2DTrack = function (trackName, trackCenter, trackInner, trackOuter, trackWidth) {
    if (window.gameState) {
        window.gameState.trackCenter = trackCenter;
        window.gameState.trackInner = trackInner;
        window.gameState.trackOuter = trackOuter;
        window.gameState.trackWidth = trackWidth || 140;
        window.gameState.trackName = trackName || 'Forest Trail';
        decorations = generateDecorations(trackCenter, trackOuter, trackInner, trackName || 'Forest Trail');
    }
};
