/* ========================================
   NEON DRIFT v3 — Game Engine
   15 Real-World Cars, Motorbikes, Weapons,
   Health, Pit Stops, Difficulty, Procedural Tracks
   ======================================== */

// ============= CONFIGURATION =============
const CONFIG = {
    TOTAL_LAPS: 3,
    POWERUP_COUNT: 10,
    POWERUP_RESPAWN: 10,
    MAX_HEALTH: 100,
    MAX_LIVES: 3,
    WEAPON_COOLDOWN: 3,
    BULLET_COOLDOWN: 0.2,      // machine gun speed
    difficulty: 'medium',      // easy, medium, hard
    cars: {
        bmw_m4: {
            name: 'BMW M4', type: 'car', category: 'Sport',
            maxSpeed: 280, acceleration: 3200, braking: 4500, turnSpeed: 2.8,
            grip: 0.92, driftGrip: 0.7, mass: 1200, dragCoeff: 0.4,
            defaultColor1: '#0066ff', defaultColor2: '#003399',
            bodyStyle: 'sport', width: 24, height: 46
        },
        mercedes_amg: {
            name: 'Mercedes AMG', type: 'car', category: 'Luxury',
            maxSpeed: 290, acceleration: 3500, braking: 4800, turnSpeed: 2.6,
            grip: 0.93, driftGrip: 0.68, mass: 1350, dragCoeff: 0.42,
            defaultColor1: '#c0c0c0', defaultColor2: '#666666',
            bodyStyle: 'sport', width: 25, height: 48
        },
        toyota_supra: {
            name: 'Toyota Supra', type: 'car', category: 'Drift',
            maxSpeed: 270, acceleration: 3100, braking: 4200, turnSpeed: 3.4,
            grip: 0.82, driftGrip: 0.55, mass: 1050, dragCoeff: 0.36,
            defaultColor1: '#ff6a00', defaultColor2: '#cc4400',
            bodyStyle: 'drift', width: 23, height: 45
        },
        bugatti_chiron: {
            name: 'Bugatti Chiron', type: 'car', category: 'Hyper',
            maxSpeed: 400, acceleration: 4800, braking: 5500, turnSpeed: 2.2,
            grip: 0.94, driftGrip: 0.72, mass: 1400, dragCoeff: 0.3,
            defaultColor1: '#1a1a2e', defaultColor2: '#0066cc',
            bodyStyle: 'supercar', width: 24, height: 50
        },
        lamborghini: {
            name: 'Lamborghini', type: 'car', category: 'Super',
            maxSpeed: 360, acceleration: 4400, braking: 5200, turnSpeed: 2.5,
            grip: 0.93, driftGrip: 0.7, mass: 1250, dragCoeff: 0.32,
            defaultColor1: '#39ff14', defaultColor2: '#00aa00',
            bodyStyle: 'supercar', width: 23, height: 48
        },
        ferrari_f40: {
            name: 'Ferrari F40', type: 'car', category: 'Classic',
            maxSpeed: 340, acceleration: 4000, braking: 4800, turnSpeed: 2.7,
            grip: 0.91, driftGrip: 0.66, mass: 1100, dragCoeff: 0.34,
            defaultColor1: '#ff2d2d', defaultColor2: '#aa0000',
            bodyStyle: 'supercar', width: 23, height: 47
        },
        porsche_911: {
            name: 'Porsche 911', type: 'car', category: 'Sport',
            maxSpeed: 300, acceleration: 3600, braking: 4600, turnSpeed: 3.0,
            grip: 0.95, driftGrip: 0.74, mass: 1200, dragCoeff: 0.36,
            defaultColor1: '#ffd700', defaultColor2: '#cc9900',
            bodyStyle: 'sport', width: 23, height: 44
        },
        mclaren_p1: {
            name: 'McLaren P1', type: 'car', category: 'Hyper',
            maxSpeed: 380, acceleration: 4600, braking: 5400, turnSpeed: 2.4,
            grip: 0.95, driftGrip: 0.73, mass: 1150, dragCoeff: 0.28,
            defaultColor1: '#ff8c00', defaultColor2: '#994400',
            bodyStyle: 'supercar', width: 23, height: 48
        },
        ford_mustang: {
            name: 'Ford Mustang', type: 'car', category: 'Muscle',
            maxSpeed: 310, acceleration: 3800, braking: 3800, turnSpeed: 2.3,
            grip: 0.88, driftGrip: 0.6, mass: 1500, dragCoeff: 0.5,
            defaultColor1: '#2d2dff', defaultColor2: '#0000aa',
            bodyStyle: 'muscle', width: 26, height: 50
        },
        nissan_gtr: {
            name: 'Nissan GT-R', type: 'car', category: 'Tuner',
            maxSpeed: 320, acceleration: 3700, braking: 4400, turnSpeed: 2.9,
            grip: 0.94, driftGrip: 0.72, mass: 1300, dragCoeff: 0.38,
            defaultColor1: '#c0c0c0', defaultColor2: '#888888',
            bodyStyle: 'sport', width: 24, height: 46
        },
        subaru_wrx: {
            name: 'Subaru WRX', type: 'car', category: 'Rally',
            maxSpeed: 260, acceleration: 3400, braking: 4000, turnSpeed: 3.6,
            grip: 0.85, driftGrip: 0.58, mass: 1050, dragCoeff: 0.38,
            defaultColor1: '#0055ff', defaultColor2: '#ffd700',
            bodyStyle: 'rally', width: 23, height: 44
        },
        f1_racer: {
            name: 'F1 Racer', type: 'car', category: 'F1',
            maxSpeed: 370, acceleration: 5000, braking: 6000, turnSpeed: 3.2,
            grip: 0.98, driftGrip: 0.85, mass: 750, dragCoeff: 0.25,
            defaultColor1: '#ff2d95', defaultColor2: '#990055',
            bodyStyle: 'f1', width: 22, height: 50
        },
        monster_truck: {
            name: 'Monster Truck', type: 'car', category: 'Truck',
            maxSpeed: 200, acceleration: 2600, braking: 3000, turnSpeed: 1.8,
            grip: 0.95, driftGrip: 0.8, mass: 2400, dragCoeff: 0.7,
            defaultColor1: '#ff4444', defaultColor2: '#880000',
            bodyStyle: 'truck', width: 32, height: 56
        },
        kawasaki_ninja: {
            name: 'Kawasaki Ninja', type: 'bike', category: 'Bike',
            maxSpeed: 300, acceleration: 4000, braking: 3500, turnSpeed: 3.8,
            grip: 0.78, driftGrip: 0.5, mass: 450, dragCoeff: 0.2,
            defaultColor1: '#39ff14', defaultColor2: '#00cc00',
            bodyStyle: 'bike', width: 14, height: 38
        },
        ducati_v4: {
            name: 'Ducati V4', type: 'bike', category: 'Bike',
            maxSpeed: 320, acceleration: 4200, braking: 3700, turnSpeed: 3.6,
            grip: 0.8, driftGrip: 0.52, mass: 480, dragCoeff: 0.22,
            defaultColor1: '#ff2d2d', defaultColor2: '#cc0000',
            bodyStyle: 'bike', width: 14, height: 40
        },
        heavy_duty: {
            name: 'Heavy Duty', type: 'car', category: 'Tank',
            maxSpeed: 180, acceleration: 2800, braking: 2500, turnSpeed: 1.5,
            grip: 0.96, driftGrip: 0.85, mass: 3000, dragCoeff: 0.8,
            defaultColor1: '#4b5320', defaultColor2: '#2b2f12',
            bodyStyle: 'truck', width: 34, height: 58
        },
        formula_one: {
            name: 'Formula One', type: 'car', category: 'F1',
            maxSpeed: 380, acceleration: 5200, braking: 6500, turnSpeed: 3.5,
            grip: 0.99, driftGrip: 0.9, mass: 700, dragCoeff: 0.2,
            defaultColor1: '#ff0000', defaultColor2: '#ffffff',
            bodyStyle: 'f1', width: 22, height: 52
        },
        offroad_legend: {
            name: 'Offroad Legend', type: 'car', category: 'Rally',
            maxSpeed: 240, acceleration: 3500, braking: 3200, turnSpeed: 3.2,
            grip: 0.92, driftGrip: 0.75, mass: 1400, dragCoeff: 0.45,
            defaultColor1: '#8b4513', defaultColor2: '#5c2e0a',
            bodyStyle: 'rally', width: 26, height: 48
        }
    }
};

// Difficulty presets
const DIFFICULTY = {
    easy: { aiSpeed: 0.55, aiLookahead: 12, aiReaction: 0.12, label: 'EASY' },
    medium: { aiSpeed: 0.75, aiLookahead: 18, aiReaction: 0.06, label: 'MEDIUM' },
    hard: { aiSpeed: 0.95, aiLookahead: 25, aiReaction: 0.03, label: 'HARD' }
};

// ============= POWER-UP & WEAPON TYPES =============
const POWERUP_TYPES = [
    { id: 'speed', name: 'SPEED BOOST!', icon: '⚡', duration: 4, color: '#ffd700', isWeapon: false },
    { id: 'shield', name: 'SHIELD!', icon: '🛡️', duration: 5, color: '#00f0ff', isWeapon: false },
    { id: 'nitro', name: 'NITRO!', icon: '🔥', duration: 3, color: '#ff4444', isWeapon: false },
    { id: 'grip', name: 'MEGA GRIP!', icon: '🏁', duration: 4, color: '#39ff14', isWeapon: false },
    { id: 'mini', name: 'MINI SIZE!', icon: '🔮', duration: 5, color: '#b829ff', isWeapon: false },
    { id: 'missile', name: 'MISSILE!', icon: '🚀', duration: 0, color: '#ff4444', isWeapon: true },
    { id: 'oil', name: 'OIL SLICK!', icon: '🛢️', duration: 0, color: '#333333', isWeapon: true },
    { id: 'emp', name: 'EMP BLAST!', icon: '💥', duration: 0, color: '#00f0ff', isWeapon: true },
];

// ============= TRACK TEMPLATES =============
const TRACK_TEMPLATES = [
    {
        name: 'City Circuit', scale: 1.4, points: [
            { x: -600, y: 400 }, { x: -400, y: 420 }, { x: -200, y: 400 }, { x: 0, y: 380 }, { x: 200, y: 400 }, { x: 400, y: 420 }, { x: 600, y: 400 },
            { x: 720, y: 350 }, { x: 800, y: 280 }, { x: 830, y: 180 }, { x: 810, y: 80 }, { x: 750, y: 0 }, { x: 700, y: -60 }, { x: 620, y: -80 },
            { x: 500, y: -100 }, { x: 380, y: -140 }, { x: 280, y: -200 }, { x: 200, y: -280 }, { x: 120, y: -320 }, { x: 0, y: -340 },
            { x: -120, y: -320 }, { x: -200, y: -260 }, { x: -300, y: -220 }, { x: -420, y: -200 }, { x: -520, y: -160 },
            { x: -620, y: -80 }, { x: -700, y: 20 }, { x: -740, y: 120 }, { x: -730, y: 220 }, { x: -680, y: 320 }
        ]
    },
    {
        name: 'Mountain Pass', scale: 1.5, points: [
            { x: -500, y: 500 }, { x: -300, y: 480 }, { x: -100, y: 420 }, { x: 100, y: 340 }, { x: 250, y: 240 }, { x: 350, y: 120 },
            { x: 500, y: 60 }, { x: 650, y: 100 }, { x: 750, y: 200 }, { x: 800, y: 340 }, { x: 780, y: 460 }, { x: 700, y: 520 },
            { x: 550, y: 500 }, { x: 400, y: 440 }, { x: 300, y: 340 }, { x: 250, y: 200 }, { x: 200, y: 80 }, { x: 100, y: -20 },
            { x: -50, y: -80 }, { x: -200, y: -120 }, { x: -350, y: -160 }, { x: -500, y: -200 }, { x: -620, y: -160 },
            { x: -700, y: -60 }, { x: -720, y: 80 }, { x: -700, y: 200 }, { x: -650, y: 340 }, { x: -580, y: 440 }
        ]
    },
    {
        name: 'Coastal Road', scale: 1.6, points: [
            { x: -700, y: 200 }, { x: -550, y: 280 }, { x: -380, y: 340 }, { x: -200, y: 360 }, { x: 0, y: 340 }, { x: 180, y: 280 },
            { x: 340, y: 200 }, { x: 480, y: 100 }, { x: 580, y: -20 }, { x: 640, y: -160 }, { x: 660, y: -300 }, { x: 620, y: -420 },
            { x: 520, y: -500 }, { x: 380, y: -520 }, { x: 220, y: -480 }, { x: 80, y: -400 }, { x: -40, y: -300 }, { x: -120, y: -180 },
            { x: -220, y: -100 }, { x: -350, y: -60 }, { x: -480, y: -80 }, { x: -600, y: -140 }, { x: -700, y: -60 }, { x: -740, y: 60 }
        ]
    },
    {
        name: 'Desert Loop', scale: 1.3, points: [
            { x: -400, y: 350 }, { x: -200, y: 400 }, { x: 50, y: 420 }, { x: 300, y: 380 }, { x: 500, y: 300 }, { x: 650, y: 180 },
            { x: 700, y: 20 }, { x: 680, y: -140 }, { x: 580, y: -260 }, { x: 420, y: -340 }, { x: 250, y: -360 }, { x: 80, y: -320 },
            { x: -60, y: -240 }, { x: -150, y: -120 }, { x: -200, y: 0 }, { x: -280, y: 80 }, { x: -400, y: 100 }, { x: -520, y: 60 },
            { x: -600, y: -40 }, { x: -640, y: -160 }, { x: -600, y: -280 }, { x: -500, y: -340 }, { x: -380, y: -320 }, { x: -300, y: -240 },
            { x: -340, y: -120 }, { x: -420, y: 0 }, { x: -500, y: 120 }, { x: -520, y: 240 }
        ]
    },
    {
        name: 'Forest Trail', scale: 1.5, points: [
            { x: -500, y: 300 }, { x: -350, y: 350 }, { x: -180, y: 360 }, { x: 0, y: 320 }, { x: 140, y: 240 }, { x: 220, y: 120 },
            { x: 340, y: 40 }, { x: 480, y: 0 }, { x: 600, y: 60 }, { x: 680, y: 160 }, { x: 700, y: 300 }, { x: 640, y: 420 },
            { x: 500, y: 480 }, { x: 340, y: 460 }, { x: 200, y: 380 }, { x: 100, y: 260 }, { x: 50, y: 120 }, { x: 0, y: -20 },
            { x: -80, y: -140 }, { x: -200, y: -220 }, { x: -360, y: -260 }, { x: -500, y: -240 }, { x: -600, y: -160 },
            { x: -650, y: -40 }, { x: -640, y: 100 }, { x: -580, y: 220 }
        ]
    },
    {
        name: 'Stadium Oval', scale: 1.2, points: [
            { x: -500, y: 200 }, { x: -400, y: 300 }, { x: -250, y: 380 }, { x: -50, y: 420 }, { x: 150, y: 400 }, { x: 320, y: 340 },
            { x: 460, y: 240 }, { x: 540, y: 120 }, { x: 560, y: -20 }, { x: 520, y: -160 }, { x: 420, y: -280 }, { x: 280, y: -360 },
            { x: 100, y: -400 }, { x: -80, y: -380 }, { x: -250, y: -320 }, { x: -400, y: -220 }, { x: -500, y: -100 }, { x: -540, y: 40 }
        ]
    }
];

// ============= TRACK GENERATION =============
function generateTrack(templateIndex) {
    const idx = templateIndex !== undefined ? templateIndex : Math.floor(Math.random() * TRACK_TEMPLATES.length);
    const tmpl = TRACK_TEMPLATES[idx];
    return { points: tmpl.points.map(p => ({ x: p.x * tmpl.scale, y: p.y * tmpl.scale })), name: tmpl.name, index: idx };
}

function catmullRomSpline(points, numPerSeg = 25) {
    const result = [], n = points.length;
    for (let i = 0; i < n; i++) {
        const p0 = points[(i - 1 + n) % n], p1 = points[i];
        const p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
        for (let t = 0; t < numPerSeg; t++) {
            const s = t / numPerSeg, s2 = s * s, s3 = s2 * s;
            result.push({
                x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * s + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s3),
                y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * s + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s3)
            });
        }
    }
    return result;
}

function buildTrackEdges(centerLine, halfWidth) {
    const inner = [], outer = [], n = centerLine.length;
    for (let i = 0; i < n; i++) {
        const prev = centerLine[(i - 1 + n) % n], curr = centerLine[i], next = centerLine[(i + 1) % n];
        const dx = next.x - prev.x, dy = next.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        inner.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
        outer.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
    }
    return { inner, outer };
}

// Build shortcut path (a narrow cut across a curve)
function generateShortcuts(trackCenter, n) {
    const shortcuts = [];
    const segLen = Math.floor(n / 4);
    for (let s = 0; s < 2; s++) {
        const startIdx = Math.floor(segLen * (s + 1) + Math.random() * segLen * 0.3);
        const endIdx = (startIdx + Math.floor(segLen * 0.5)) % n;
        const sp = trackCenter[startIdx % n], ep = trackCenter[endIdx];
        // Midpoint slightly offset
        const mx = (sp.x + ep.x) / 2 + (Math.random() - 0.5) * 60;
        const my = (sp.y + ep.y) / 2 + (Math.random() - 0.5) * 60;
        shortcuts.push({ entry: sp, mid: { x: mx, y: my }, exit: ep, startIdx: startIdx % n, endIdx, width: 30 });
    }
    return shortcuts;
}

// Build pit lane alongside start area
function generatePitLane(trackCenter, trackWidth) {
    const n = trackCenter.length;
    const pitStart = Math.floor(n * 0.95);
    const pitEnd = Math.floor(n * 0.08);
    const pitPoints = [];
    for (let i = pitStart; i < n; i++) {
        const p = trackCenter[i], prev = trackCenter[(i - 1 + n) % n], next = trackCenter[(i + 1) % n];
        const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        pitPoints.push({ x: p.x + nx * (trackWidth + 30), y: p.y + ny * (trackWidth + 30) });
    }
    for (let i = 0; i <= pitEnd; i++) {
        const p = trackCenter[i], prev = trackCenter[(i - 1 + n) % n], next = trackCenter[(i + 1) % n];
        const dx = next.x - prev.x, dy = next.y - prev.y, len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        pitPoints.push({ x: p.x + nx * (trackWidth + 30), y: p.y + ny * (trackWidth + 30) });
    }
    const center = { x: 0, y: 0 };
    pitPoints.forEach(p => { center.x += p.x; center.y += p.y; });
    center.x /= pitPoints.length; center.y /= pitPoints.length;
    return { points: pitPoints, center, width: 25 };
}

// ============= GAME STATE =============
let gameState = {
    screen: 'start', selectedCar: 'bmw_m4', selectedColor: '#0066ff',
    paused: false, countdown: 0, raceStarted: false, raceFinished: false,
    totalTime: 0, lapTimes: [], bestLap: Infinity, currentLap: 1,
    maxSpeed: 0, driftScore: 0, currentDriftScore: 0, isDrifting: false,
    powerupsUsed: 0, trackName: '', difficulty: 'medium',
};

// ============= PROJECTILES =============
const projectiles = [];
const bullets = [];

class Bullet {
    constructor(x, y, angle, ownerId) {
        this.x = x; this.y = y; this.angle = angle;
        this.speed = 1200; this.life = 0.8; this.ownerId = ownerId;
        this.active = true;
    }
    update(dt) {
        this.x += Math.sin(this.angle) * this.speed * dt;
        this.y -= Math.cos(this.angle) * this.speed * dt;
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }
}

class Projectile {
    constructor(x, y, angle, type, ownerId) {
        this.x = x; this.y = y; this.angle = angle;
        this.type = type; this.ownerId = ownerId;
        this.speed = type === 'missile' ? 600 : 0;
        this.life = type === 'missile' ? 3 : (type === 'oil' ? 12 : 0);
        this.radius = type === 'missile' ? 8 : (type === 'oil' ? 20 : 60);
        this.active = true;
        if (type === 'emp') { this.life = 0.5; this.radius = 120; }
    }
    update(dt) {
        if (this.type === 'missile') {
            this.x += Math.sin(this.angle) * this.speed * dt;
            this.y -= Math.cos(this.angle) * this.speed * dt;
        }
        this.life -= dt;
        if (this.life <= 0) this.active = false;
    }
}

// ============= CAR PHYSICS =============
class Car {
    constructor(x, y, angle, carType, color1, color2) {
        this.x = x; this.y = y; this.angle = angle;
        this.speed = 0; this.velocity = { x: 0, y: 0 };
        this.steerAngle = 0; this.throttle = 0; this.brake = 0; this.handbrake = false;
        this.carType = carType;
        this.config = CONFIG.cars[carType];
        this.color1 = color1 || this.config.defaultColor1;
        this.color2 = color2 || this.config.defaultColor2;
        this.tireMarks = []; this.particles = [];
        this.headlightFlicker = 1; this.engineRPM = 800; this.gear = 1;
        this.slipAngle = 0; this.drifting = false;
        this.width = this.config.width; this.height = this.config.height;
        // Power-up / weapon state
        this.activePowerup = null; this.powerupTimer = 0; this.powerupDuration = 0;
        this.heldWeapon = null; this.weaponCooldown = 0;
        this.shielded = false; this.miniScale = 1;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        this.visualWheelAngle = 0;
        // Health & pit
        this.health = CONFIG.MAX_HEALTH;
        this.lives = CONFIG.MAX_LIVES;
        this.inPit = false; this.pitTimer = 0;
        this.stunned = false; this.stunTimer = 0;
        this.oilSlow = false; this.oilTimer = 0;
        // Machine gun
        this.bulletCooldown = 0;
        // Damage visual
        this.damageFlash = 0;
        this.sparks = [];
    }

    update(dt, keys) {
        // Stun check
        if (this.stunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) this.stunned = false;
            this.velocity.x *= 0.95; this.velocity.y *= 0.95;
            this.speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2) * 0.5;
            this.updateParticles(dt);
            return;
        }

        const cfg = this.config;
        this.throttle = keys.up ? 1 : 0;
        this.brake = keys.down ? 1 : 0;
        this.handbrake = keys.space;

        let steerInput = 0;
        if (keys.left) steerInput = -1;
        if (keys.right) steerInput = 1;

        let spdMul = this.speedMultiplier;
        if (this.oilSlow) { spdMul *= 0.5; this.oilTimer -= dt; if (this.oilTimer <= 0) this.oilSlow = false; }

        const speedFactor = 1 - (Math.abs(this.speed) / (cfg.maxSpeed * spdMul)) * 0.6;
        const targetSteer = steerInput * cfg.turnSpeed * speedFactor;
        this.steerAngle += (targetSteer - this.steerAngle) * 8 * dt;
        this.visualWheelAngle += (steerInput * 0.5 - this.visualWheelAngle) * 10 * dt;

        let engineForce = this.throttle > 0 ? cfg.acceleration * this.throttle : 0;
        let brakeForce = this.brake > 0 ? cfg.braking * this.brake : 0;

        const forwardX = Math.sin(this.angle), forwardY = -Math.cos(this.angle);
        const forwardSpeed = this.velocity.x * forwardX + this.velocity.y * forwardY;
        this.speed = forwardSpeed;

        const rightX = Math.cos(this.angle), rightY = Math.sin(this.angle);
        const lateralSpeed = this.velocity.x * rightX + this.velocity.y * rightY;

        this.slipAngle = Math.abs(lateralSpeed) > 0.5 ? Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed)) : 0;
        this.drifting = this.slipAngle > 0.2 && Math.abs(this.speed) > 50;

        let grip = cfg.grip * this.gripMultiplier;
        if (this.handbrake) grip = cfg.driftGrip * 0.6;
        else if (this.drifting) grip = cfg.driftGrip;

        if (Math.abs(this.speed) > 5) { this.angle += this.steerAngle * (this.speed / 200) * dt; }

        let accelForward = engineForce;
        if (this.brake > 0 && forwardSpeed > 10) accelForward -= brakeForce;
        else if (this.brake > 0 && forwardSpeed <= 10) accelForward = -cfg.acceleration * 0.4 * this.brake;

        accelForward -= cfg.dragCoeff * forwardSpeed * Math.abs(forwardSpeed) * 0.005;
        accelForward -= forwardSpeed * 30 * cfg.dragCoeff * dt;

        const effectiveMax = cfg.maxSpeed * spdMul;
        if (Math.abs(forwardSpeed) > effectiveMax && accelForward * forwardSpeed > 0) accelForward = 0;

        this.velocity.x += forwardX * accelForward * dt;
        this.velocity.y += forwardY * accelForward * dt;

        const lateralFriction = lateralSpeed * grip * 8;
        this.velocity.x -= rightX * lateralFriction * dt;
        this.velocity.y -= rightY * lateralFriction * dt;

        if (this.handbrake && Math.abs(forwardSpeed) > 30) {
            this.velocity.x += rightX * lateralSpeed * 0.3 * dt;
            this.velocity.y += rightY * lateralSpeed * 0.3 * dt;
        }

        this.x += this.velocity.x * dt;
        this.y += this.velocity.y * dt;

        const decay = Math.pow(0.998, dt * 60);
        this.velocity.x *= decay; this.velocity.y *= decay;

        const speedRatio = Math.abs(this.speed) / cfg.maxSpeed;
        this.engineRPM = 800 + speedRatio * 7200;
        if (speedRatio < 0.15) this.gear = 1;
        else if (speedRatio < 0.3) this.gear = 2;
        else if (speedRatio < 0.5) this.gear = 3;
        else if (speedRatio < 0.7) this.gear = 4;
        else if (speedRatio < 0.85) this.gear = 5;
        else this.gear = 6;

        // Tire marks
        if (this.drifting && Math.abs(this.speed) > 40) {
            const sa = Math.min(this.slipAngle * 2, 1);
            this.tireMarks.push(
                { x: this.x - forwardX * this.height * 0.35 + rightX * this.width * 0.35, y: this.y - forwardY * this.height * 0.35 + rightY * this.width * 0.35, alpha: sa },
                { x: this.x - forwardX * this.height * 0.35 - rightX * this.width * 0.35, y: this.y - forwardY * this.height * 0.35 - rightY * this.width * 0.35, alpha: sa }
            );
        }
        if (this.tireMarks.length > 2000) this.tireMarks = this.tireMarks.slice(-1500);

        this.updateParticles(dt);
        this.headlightFlicker = 0.95 + Math.random() * 0.05;

        // Power-up timer
        if (this.activePowerup) {
            this.powerupTimer -= dt;
            if (this.powerupTimer <= 0) this.clearPowerup();
        }
        // Weapon cooldown
        if (this.weaponCooldown > 0) this.weaponCooldown -= dt;
        // Machine gun cooldown
        if (this.bulletCooldown > 0) this.bulletCooldown -= dt;
        // Damage flash
        if (this.damageFlash > 0) this.damageFlash -= dt;
        // Sparks
        this.sparks = this.sparks.filter(s => { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; return s.life > 0; });

        // Auto-shoot if key is held
        if (keys.shoot && this.bulletCooldown <= 0) {
            this.shootBullet();
        }
    }

    shootBullet() {
        this.bulletCooldown = CONFIG.BULLET_COOLDOWN;
        const fwd = { x: Math.sin(this.angle), y: -Math.cos(this.angle) };
        bullets.push(new Bullet(this.x + fwd.x * this.height * 0.6, this.y + fwd.y * this.height * 0.6, this.angle, this));
    }

    updateParticles(dt) {
        const forwardX = Math.sin(this.angle), forwardY = -Math.cos(this.angle);
        if (this.throttle > 0 || this.drifting) {
            for (let i = 0; i < 2; i++) {
                this.particles.push({
                    x: this.x - forwardX * this.height * 0.5 + (Math.random() - 0.5) * 6,
                    y: this.y - forwardY * this.height * 0.5 + (Math.random() - 0.5) * 6,
                    vx: -forwardX * (20 + Math.random() * 30) + (Math.random() - 0.5) * 15,
                    vy: -forwardY * (20 + Math.random() * 30) + (Math.random() - 0.5) * 15,
                    life: 1, maxLife: 0.5 + Math.random() * 0.5, size: 2 + Math.random() * 3
                });
            }
        }
        this.particles = this.particles.filter(p => {
            p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt / p.maxLife; p.size *= 0.99;
            return p.life > 0;
        });
    }

    takeDamage(amount = 10) {
        if (this.shielded) return;
        this.health = Math.max(0, this.health - amount);
        this.damageFlash = 0.5;
        // Generate sparks
        for (let i = 0; i < 10; i++) {
            this.sparks.push({
                x: this.x, y: this.y,
                vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
                life: 0.3 + Math.random() * 0.3
            });
        }
        if (this.health <= 0 && this.lives > 0) {
            this.respawn();
        }
    }

    respawn() {
        this.lives--;
        if (this.lives > 0) {
            this.health = CONFIG.MAX_HEALTH;
            this.speed = 0;
            this.velocity = { x: 0, y: 0 };
            // Simple respawn: stay in place but invulnerable briefly
            this.shielded = true;
            this.powerupTimer = 2;
            this.powerupDuration = 2;
        }
    }

    applyPowerup(type) {
        if (type.isWeapon) {
            this.heldWeapon = type;
            return;
        }
        this.activePowerup = type;
        this.powerupTimer = type.duration;
        this.powerupDuration = type.duration;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        this.shielded = false; this.miniScale = 1;

        switch (type.id) {
            case 'speed': this.speedMultiplier = 1.35; break;
            case 'nitro': this.speedMultiplier = 1.5; break;
            case 'shield': this.shielded = true; break;
            case 'grip': this.gripMultiplier = 1.6; break;
            case 'mini': this.miniScale = 0.7; break;
        }
    }

    fireWeapon() {
        if (!this.heldWeapon || this.weaponCooldown > 0) return null;
        const w = this.heldWeapon;
        this.heldWeapon = null;
        this.weaponCooldown = CONFIG.WEAPON_COOLDOWN;
        const fwd = { x: Math.sin(this.angle), y: -Math.cos(this.angle) };
        if (w.id === 'missile') {
            return new Projectile(this.x + fwd.x * this.height * 0.6, this.y + fwd.y * this.height * 0.6, this.angle, 'missile', this);
        } else if (w.id === 'oil') {
            return new Projectile(this.x - fwd.x * this.height * 0.6, this.y - fwd.y * this.height * 0.6, this.angle, 'oil', this);
        } else if (w.id === 'emp') {
            return new Projectile(this.x, this.y, this.angle, 'emp', this);
        }
        return null;
    }

    clearPowerup() {
        this.activePowerup = null; this.powerupTimer = 0;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        this.shielded = false; this.miniScale = 1;
    }
}

// ============= AI CAR =============
class AICar {
    constructor(x, y, angle, carType, trackPoints, offset, color1, color2) {
        this.car = new Car(x, y, angle, carType, color1, color2);
        this.trackPoints = trackPoints;
        this.currentTarget = offset || 0;
        const diff = DIFFICULTY[CONFIG.difficulty] || DIFFICULTY.medium;
        this.speedVariation = diff.aiSpeed + (Math.random() - 0.5) * 0.1;
        this.lineOffset = (Math.random() - 0.5) * 40;
        this.lookahead = diff.aiLookahead + Math.floor(Math.random() * 6);
        this.reactionDelay = diff.aiReaction;
        this.overtakeTimer = 0;
    }
    update(dt) {
        const target = this.trackPoints[this.currentTarget];
        const dx = target.x + this.lineOffset - this.car.x;
        const dy = target.y + this.lineOffset - this.car.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const targetAngle = Math.atan2(dx, -dy);
        let angleDiff = targetAngle - this.car.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        const keys = { up: true, down: false, left: angleDiff < -this.reactionDelay, right: angleDiff > this.reactionDelay, space: false };

        const ft = this.trackPoints[(this.currentTarget + this.lookahead) % this.trackPoints.length];
        let fa = Math.atan2(ft.x - this.car.x, -(ft.y - this.car.y)) - this.car.angle;
        while (fa > Math.PI) fa -= Math.PI * 2;
        while (fa < -Math.PI) fa += Math.PI * 2;
        if (Math.abs(fa) > 0.5 && Math.abs(this.car.speed) > 120) { keys.up = false; keys.down = true; }
        if (Math.abs(this.car.speed) > this.car.config.maxSpeed * this.speedVariation) keys.up = false;

        // Hard mode: drift through tight corners
        if (CONFIG.difficulty === 'hard' && Math.abs(fa) > 0.8 && Math.abs(this.car.speed) > 100) {
            keys.space = true;
        }

        this.car.update(dt, keys);
        if (dist < 80) this.currentTarget = (this.currentTarget + 1) % this.trackPoints.length;
    }
}
