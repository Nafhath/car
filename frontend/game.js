/* ========================================
   NEON DRIFT v3 — Game Engine
   18 Real-World Cars, Motorbikes, Weapons,
   Health, Pit Stops, Difficulty, Procedural Tracks
   OutRun-style pseudo-3D renderer (engine3d.js)
   ======================================== */

// ============= CONFIGURATION =============
const CONFIG = {
    TOTAL_LAPS: 3,
    POWERUP_COUNT: 10,
    POWERUP_RESPAWN: 10,
    MAX_HEALTH: 100,
    MAX_LIVES: 3,
    WEAPON_COOLDOWN: 3,
    BULLET_COOLDOWN: 0.2,
    difficulty: 'medium',
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

const DIFFICULTY = {
    easy:   { aiSpeed: 0.55, aiLookahead: 12, aiReaction: 0.12, label: 'EASY' },
    medium: { aiSpeed: 0.75, aiLookahead: 18, aiReaction: 0.06, label: 'MEDIUM' },
    hard:   { aiSpeed: 0.95, aiLookahead: 25, aiReaction: 0.03, label: 'HARD' }
};

// ============= POWER-UP & WEAPON TYPES =============
const POWERUP_TYPES = [
    { id: 'speed',   name: 'SPEED BOOST!', icon: '⚡',  duration: 4, color: '#ffd700', isWeapon: false },
    { id: 'shield',  name: 'SHIELD!',      icon: '🛡️', duration: 5, color: '#00f0ff', isWeapon: false },
    { id: 'nitro',   name: 'NITRO!',       icon: '🔥',  duration: 3, color: '#ff4444', isWeapon: false },
    { id: 'grip',    name: 'MEGA GRIP!',   icon: '🏁',  duration: 4, color: '#39ff14', isWeapon: false },
    { id: 'mini',    name: 'MINI SIZE!',   icon: '🔮',  duration: 5, color: '#b829ff', isWeapon: false },
    { id: 'missile', name: 'MISSILE!',     icon: '🚀',  duration: 0, color: '#ff4444', isWeapon: true  },
    { id: 'oil',     name: 'OIL SLICK!',   icon: '🛢️', duration: 0, color: '#333333', isWeapon: true  },
    { id: 'emp',     name: 'EMP BLAST!',   icon: '💥',  duration: 0, color: '#00f0ff', isWeapon: true  },
];

// ============= TRACK TEMPLATES =============
const TRACK_TEMPLATES = [
    {
        name: 'City Circuit', scale: 1.4, points: [
            {x:-600,y:400},{x:-400,y:420},{x:-200,y:400},{x:0,y:380},{x:200,y:400},{x:400,y:420},{x:600,y:400},
            {x:720,y:350},{x:800,y:280},{x:830,y:180},{x:810,y:80},{x:750,y:0},{x:700,y:-60},{x:620,y:-80},
            {x:500,y:-100},{x:380,y:-140},{x:280,y:-200},{x:200,y:-280},{x:120,y:-320},{x:0,y:-340},
            {x:-120,y:-320},{x:-200,y:-260},{x:-300,y:-220},{x:-420,y:-200},{x:-520,y:-160},
            {x:-620,y:-80},{x:-700,y:20},{x:-740,y:120},{x:-730,y:220},{x:-680,y:320}
        ]
    },
    {
        name: 'Mountain Pass', scale: 1.5, points: [
            {x:-500,y:500},{x:-300,y:480},{x:-100,y:420},{x:100,y:340},{x:250,y:240},{x:350,y:120},
            {x:500,y:60},{x:650,y:100},{x:750,y:200},{x:800,y:340},{x:780,y:460},{x:700,y:520},
            {x:550,y:500},{x:400,y:440},{x:300,y:340},{x:250,y:200},{x:200,y:80},{x:100,y:-20},
            {x:-50,y:-80},{x:-200,y:-120},{x:-350,y:-160},{x:-500,y:-200},{x:-620,y:-160},
            {x:-700,y:-60},{x:-720,y:80},{x:-700,y:200},{x:-650,y:340},{x:-580,y:440}
        ]
    },
    {
        name: 'Coastal Road', scale: 1.6, points: [
            {x:-700,y:200},{x:-550,y:280},{x:-380,y:340},{x:-200,y:360},{x:0,y:340},{x:180,y:280},
            {x:340,y:200},{x:480,y:100},{x:580,y:-20},{x:640,y:-160},{x:660,y:-300},{x:620,y:-420},
            {x:520,y:-500},{x:380,y:-520},{x:220,y:-480},{x:80,y:-400},{x:-40,y:-300},{x:-120,y:-180},
            {x:-220,y:-100},{x:-350,y:-60},{x:-480,y:-80},{x:-600,y:-140},{x:-700,y:-60},{x:-740,y:60}
        ]
    },
    {
        name: 'Desert Loop', scale: 1.3, points: [
            {x:-400,y:350},{x:-200,y:400},{x:50,y:420},{x:300,y:380},{x:500,y:300},{x:650,y:180},
            {x:700,y:20},{x:680,y:-140},{x:580,y:-260},{x:420,y:-340},{x:250,y:-360},{x:80,y:-320},
            {x:-60,y:-240},{x:-150,y:-120},{x:-200,y:0},{x:-280,y:80},{x:-400,y:100},{x:-520,y:60},
            {x:-600,y:-40},{x:-640,y:-160},{x:-600,y:-280},{x:-500,y:-340},{x:-380,y:-320},{x:-300,y:-240},
            {x:-340,y:-120},{x:-420,y:0},{x:-500,y:120},{x:-520,y:240}
        ]
    },
    {
        name: 'Forest Trail', scale: 1.5, points: [
            {x:-500,y:300},{x:-350,y:350},{x:-180,y:360},{x:0,y:320},{x:140,y:240},{x:220,y:120},
            {x:340,y:40},{x:480,y:0},{x:600,y:60},{x:680,y:160},{x:700,y:300},{x:640,y:420},
            {x:500,y:480},{x:340,y:460},{x:200,y:380},{x:100,y:260},{x:50,y:120},{x:0,y:-20},
            {x:-80,y:-140},{x:-200,y:-220},{x:-360,y:-260},{x:-500,y:-240},{x:-600,y:-160},
            {x:-650,y:-40},{x:-640,y:100},{x:-580,y:220}
        ]
    },
    {
        name: 'Stadium Oval', scale: 1.2, points: [
            {x:-500,y:200},{x:-400,y:300},{x:-250,y:380},{x:-50,y:420},{x:150,y:400},{x:320,y:340},
            {x:460,y:240},{x:540,y:120},{x:560,y:-20},{x:520,y:-160},{x:420,y:-280},{x:280,y:-360},
            {x:100,y:-400},{x:-80,y:-380},{x:-250,y:-320},{x:-400,y:-220},{x:-500,y:-100},{x:-540,y:40}
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
                x: 0.5 * ((2*p1.x) + (-p0.x+p2.x)*s + (2*p0.x-5*p1.x+4*p2.x-p3.x)*s2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*s3),
                y: 0.5 * ((2*p1.y) + (-p0.y+p2.y)*s + (2*p0.y-5*p1.y+4*p2.y-p3.y)*s2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*s3)
            });
        }
    }
    return result;
}

function enforceTrackBounds(car, trackCenter, trackWidth, dt = 0.016) {
    if (!car) return;
    let minDist = Infinity, closestIdx = 0;
    const sr = 60, n = trackCenter.length;
    let ss = (car._lastTrackIdx ?? 0) - sr;
    let se = (car._lastTrackIdx ?? 0) + sr;
    if (car._lastTrackIdx == null) { ss = 0; se = n; }
    for (let i = ss; i < se; i++) {
        const idx = ((i % n) + n) % n;
        const p = trackCenter[idx];
        const dx = car.x - p.x, dy = car.y - p.y;
        const d = dx * dx + dy * dy;
        if (d < minDist) { minDist = d; closestIdx = idx; }
    }
    car._lastTrackIdx = closestIdx;
    const dist = Math.sqrt(minDist);
    const maxDist = trackWidth / 2 - (car.width || 24) / 2;
    if (dist > maxDist) {
        car._offTrackTimer = (car._offTrackTimer || 0) + dt;
        const cp = trackCenter[closestIdx];
        const dx = car.x - cp.x, dy = car.y - cp.y;
        const len = dist || 1, nx = dx / len, ny = dy / len;
        
        // Push back smoothly
        car.x = cp.x + nx * maxDist;
        car.y = cp.y + ny * maxDist;
        
        // Reflect velocity with less bounce
        const dot = car.velocity.x * nx + car.velocity.y * ny;
        if (dot > 0) {
            car.velocity.x -= nx * dot * 1.2;
            car.velocity.y -= ny * dot * 1.2;
            car.speed *= 0.8;
        }
    } else {
        car._offTrackTimer = 0;
    }
}

function respawnCarToTrack(car, trackCenter) {
    if (!car) return;
    const idx = ((car._lastTrackIdx ?? 0) + 20) % trackCenter.length;
    const p    = trackCenter[idx];
    const next = trackCenter[(idx + 1) % trackCenter.length];
    car.x = p.x;
    car.y = p.y;
    car.angle = Math.atan2(next.x - p.x, -(next.y - p.y));
    car.velocity = { x: 0, y: 0, z: 0 };
    car.speed = 0;
    car._offTrackTimer = 0;
    car._stuckTimer = 0;
    car._lastStuckX = undefined;
    car._lastStuckY = undefined;
    car.respawnShieldTimer = 2;
    car.shielded = true;
}

function checkStuckAndRespawn(car, trackCenter, trackWidth, dt) {
    if (!car) return;
    
    // Check if car has moved significantly (more than 5 pixels in last update)
    const moved = Math.sqrt(
        (car.x - (car._lastStuckX ?? car.x)) ** 2 +
        (car.y - (car._lastStuckY ?? car.y)) ** 2
    );
    
    // If speed is very low and hasn't moved much, increment stuck timer
    if (Math.abs(car.speed) < 20 && moved < 2) {
        car._stuckTimer = (car._stuckTimer || 0) + dt;
    } else {
        car._stuckTimer = 0;
    }
    
    car._lastStuckX = car.x;
    car._lastStuckY = car.y;
    
    // Respawn only if stuck for 5 seconds
    if (car._stuckTimer >= 5) {
        respawnCarToTrack(car, trackCenter);
    }
}

function checkCarCollisions(allCars) {
    for (let i = 0; i < allCars.length; i++) {
        for (let j = i + 1; j < allCars.length; j++) {
            const a = allCars[i], b = allCars[j];
            if (!a || !b) continue;
            const dx = b.x - a.x, dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy), md = 45;
            if (dist < md && dist > 0) {
                const nx = dx / dist, ny = dy / dist;
                const ol = md - dist;
                if (!a.shielded) { a.x -= nx * ol * 0.5; a.y -= ny * ol * 0.5; }
                if (!b.shielded) { b.x += nx * ol * 0.5; b.y += ny * ol * 0.5; }
                const rvx = a.velocity.x - b.velocity.x, rvy = a.velocity.y - b.velocity.y;
                const rd = rvx * nx + rvy * ny;
                if (rd > 0) {
                    const mA = a.config?.mass || 1200, mB = b.config?.mass || 1200;
                    const tm = mA + mB;
                    if (!a.shielded) { a.velocity.x -= (2*mB/tm)*rd*nx*0.6; a.velocity.y -= (2*mB/tm)*rd*ny*0.6; }
                    if (!b.shielded) { b.velocity.x += (2*mA/tm)*rd*nx*0.6; b.velocity.y += (2*mA/tm)*rd*ny*0.6; }
                }
            }
        }
    }
}

function buildTrackEdges(centerLine, halfWidth) {
    const inner = [], outer = [], n = centerLine.length;
    for (let i = 0; i < n; i++) {
        const prev = centerLine[(i - 1 + n) % n];
        const curr = centerLine[i];
        const next = centerLine[(i + 1) % n];
        const dx = next.x - prev.x, dy = next.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        inner.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
        outer.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
    }
    return { inner, outer };
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
        this.life  = type === 'missile' ? 3 : (type === 'oil' ? 12 : 0);
        this.radius= type === 'missile' ? 8 : (type === 'oil' ? 20 : 60);
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
        this.x = x; this.y = y; this.z = 0; this.angle = angle;
        this.speed = 0; this.velocity = { x: 0, y: 0, z: 0 };
        this.steerAngle = 0; this.throttle = 0; this.brake = 0; this.handbrake = false;
        this.carType = carType;
        this.config = CONFIG.cars[carType];
        this.color1 = color1 || this.config.defaultColor1;
        this.color2 = color2 || this.config.defaultColor2;
        this.tireMarks = []; this.particles = [];
        this.headlightFlicker = 1; this.engineRPM = 800; this.gear = 1;
        this.slipAngle = 0; this.drifting = false;
        this.width = this.config.width; this.height = this.config.height;
        this.activePowerup = null; this.powerupTimer = 0; this.powerupDuration = 0;
        this.heldWeapon = null; this.weaponCooldown = 0;
        this.shielded = false; this.miniScale = 1;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        this.visualWheelAngle = 0;
        this.health = CONFIG.MAX_HEALTH;
        this.lives  = CONFIG.MAX_LIVES;
        this.inPit = false; this.pitTimer = 0;
        this.stunned = false; this.stunTimer = 0;
        this.oilSlow = false; this.oilTimer = 0;
        this.bulletCooldown = 0;
        this.damageFlash = 0;
        this.sparks = [];
        this.respawnShieldTimer = 0;
        // OutRun track position (used by engine3d.js to place sprite on road)
        this._trackPos = 0;
    }

    update(dt, keys) {
        if (this.stunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) this.stunned = false;
            this.velocity.x *= 0.95; this.velocity.y *= 0.95;
            this.speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2) * 0.5;
            this.updateParticles(dt);
            return;
        }

        const cfg = this.config;
        this.throttle  = keys.up    ? 1 : 0;
        this.brake     = keys.down  ? 1 : 0;
        this.handbrake = keys.space;

        let steerInput = 0;
        if (keys.left)  steerInput = -1;
        if (keys.right) steerInput =  1;

        let spdMul = this.speedMultiplier;
        if (this.oilSlow) { spdMul *= 0.5; this.oilTimer -= dt; if (this.oilTimer <= 0) this.oilSlow = false; }

        const speedFactor  = 1 - (Math.abs(this.speed) / (cfg.maxSpeed * spdMul)) * 0.6;
        const targetSteer  = steerInput * cfg.turnSpeed * speedFactor;
        this.steerAngle   += (targetSteer - this.steerAngle) * 8 * dt;
        this.visualWheelAngle += (steerInput * 0.5 - this.visualWheelAngle) * 10 * dt;

        let engineForce = this.throttle > 0 ? cfg.acceleration * this.throttle : 0;
        let brakeForce  = this.brake    > 0 ? cfg.braking      * this.brake    : 0;

        const forwardX     = Math.sin(this.angle), forwardY = -Math.cos(this.angle);
        const forwardSpeed = this.velocity.x * forwardX + this.velocity.y * forwardY;
        this.speed = forwardSpeed;

        const rightX       = Math.cos(this.angle),  rightY  =  Math.sin(this.angle);
        const lateralSpeed = this.velocity.x * rightX + this.velocity.y * rightY;

        this.slipAngle = Math.abs(lateralSpeed) > 0.5 ? Math.atan2(Math.abs(lateralSpeed), Math.abs(forwardSpeed)) : 0;
        this.drifting  = this.slipAngle > 0.2 && Math.abs(this.speed) > 50;

        let grip = cfg.grip * this.gripMultiplier;
        if (this.handbrake)    grip = cfg.driftGrip * 0.6;
        else if (this.drifting) grip = cfg.driftGrip;

        if (Math.abs(this.speed) > 5) this.angle += this.steerAngle * (this.speed / 200) * dt;

        let accelForward = engineForce;
        if (this.brake > 0 && forwardSpeed > 10)  accelForward -= brakeForce;
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
        if      (speedRatio < 0.15) this.gear = 1;
        else if (speedRatio < 0.3)  this.gear = 2;
        else if (speedRatio < 0.5)  this.gear = 3;
        else if (speedRatio < 0.7)  this.gear = 4;
        else if (speedRatio < 0.85) this.gear = 5;
        else                         this.gear = 6;

        if (this.drifting && Math.abs(this.speed) > 40) {
            const sa = Math.min(this.slipAngle * 2, 1);
            this.tireMarks.push(
                { x: this.x - forwardX*this.height*0.35 + rightX*this.width*0.35, y: this.y - forwardY*this.height*0.35 + rightY*this.width*0.35, alpha: sa },
                { x: this.x - forwardX*this.height*0.35 - rightX*this.width*0.35, y: this.y - forwardY*this.height*0.35 - rightY*this.width*0.35, alpha: sa }
            );
        }
        if (this.tireMarks.length > 600) this.tireMarks = this.tireMarks.slice(-400);

        this.updateParticles(dt);
        this.headlightFlicker = 0.95 + Math.random() * 0.05;

        if (this.activePowerup) {
            this.powerupTimer -= dt;
            if (this.powerupTimer <= 0) this.clearPowerup();
        }
        if (this.respawnShieldTimer > 0) {
            this.respawnShieldTimer -= dt;
            this.shielded = true;
            if (this.respawnShieldTimer <= 0) {
                this.respawnShieldTimer = 0;
                if (!this.activePowerup || this.activePowerup.id !== 'shield') this.shielded = false;
            }
        }
        if (this.weaponCooldown  > 0) this.weaponCooldown  -= dt;
        if (this.bulletCooldown  > 0) this.bulletCooldown  -= dt;
        if (this.damageFlash     > 0) this.damageFlash     -= dt;
        this.sparks = this.sparks.filter(s => { s.x += s.vx*dt; s.y += s.vy*dt; s.life -= dt; return s.life > 0; });

        if (keys.shoot && this.bulletCooldown <= 0) this.shootBullet();
    }

    shootBullet() {
        this.bulletCooldown = CONFIG.BULLET_COOLDOWN;
        const fwd = { x: Math.sin(this.angle), y: -Math.cos(this.angle) };
        bullets.push(new Bullet(this.x + fwd.x*this.height*0.6, this.y + fwd.y*this.height*0.6, this.angle, this));
    }

    updateParticles(dt) {
        const fx = Math.sin(this.angle), fy = -Math.cos(this.angle);
        if (this.throttle > 0 || this.drifting) {
            for (let i = 0; i < 2; i++) {
                this.particles.push({
                    x: this.x - fx*this.height*0.5 + (Math.random()-0.5)*6,
                    y: this.y - fy*this.height*0.5 + (Math.random()-0.5)*6,
                    vx: -fx*(20+Math.random()*30)+(Math.random()-0.5)*15,
                    vy: -fy*(20+Math.random()*30)+(Math.random()-0.5)*15,
                    life: 1, maxLife: 0.5+Math.random()*0.5, size: 2+Math.random()*3
                });
            }
        }
        this.particles = this.particles.filter(p => {
            p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt/p.maxLife; p.size *= 0.99;
            return p.life > 0;
        });
    }

    takeDamage(amount = 10) {
        if (this.shielded) return;
        this.health = Math.max(0, this.health - amount);
        this.damageFlash = 0.5;
        for (let i = 0; i < 10; i++) {
            this.sparks.push({ x: this.x, y: this.y,
                vx: (Math.random()-0.5)*200, vy: (Math.random()-0.5)*200,
                life: 0.3+Math.random()*0.3 });
        }
        if (this.health <= 0 && this.lives > 0) this.respawn();
    }

    respawn() {
        this.lives--;
        if (this.lives > 0) {
            this.health = CONFIG.MAX_HEALTH;
            this.speed  = 0;
            this.velocity = { x: 0, y: 0, z: 0 };
            this.respawnShieldTimer = 2;
        }
    }

    applyPowerup(type) {
        if (type.isWeapon) { this.heldWeapon = type; return; }
        this.activePowerup   = type;
        this.powerupTimer    = type.duration;
        this.powerupDuration = type.duration;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        if (this.respawnShieldTimer <= 0) this.shielded = false;
        this.miniScale = 1;
        switch (type.id) {
            case 'speed':  this.speedMultiplier = 1.35; break;
            case 'nitro':  this.speedMultiplier = 1.5;  break;
            case 'shield': this.shielded = true;        break;
            case 'grip':   this.gripMultiplier = 1.6;   break;
            case 'mini':   this.miniScale = 0.7;        break;
        }
    }

    fireWeapon() {
        if (!this.heldWeapon || this.weaponCooldown > 0) return null;
        const w = this.heldWeapon;
        this.heldWeapon = null;
        this.weaponCooldown = CONFIG.WEAPON_COOLDOWN;
        const fwd = { x: Math.sin(this.angle), y: -Math.cos(this.angle) };
        if (w.id === 'missile') return new Projectile(this.x+fwd.x*this.height*0.6, this.y+fwd.y*this.height*0.6, this.angle, 'missile', this);
        if (w.id === 'oil')     return new Projectile(this.x-fwd.x*this.height*0.6, this.y-fwd.y*this.height*0.6, this.angle, 'oil',     this);
        if (w.id === 'emp')     return new Projectile(this.x, this.y, this.angle, 'emp', this);
        return null;
    }

    clearPowerup() {
        this.activePowerup = null; this.powerupTimer = 0;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        if (this.respawnShieldTimer <= 0) this.shielded = false;
        this.miniScale = 1;
    }
}

// ============= AI CAR =============
class AICar {
    constructor(x, y, angle, carType, trackPoints, offset, color1, color2) {
        this.car = new Car(x, y, angle, carType, color1, color2);
        this.trackPoints    = trackPoints;
        this.currentTarget  = offset || 0;
        const diff = DIFFICULTY[CONFIG.difficulty] || DIFFICULTY.medium;
        this.speedVariation = Math.max(0.1, diff.aiSpeed + (Math.random()-0.5)*0.1);
        this.lineOffset     = (Math.random()-0.5) * 40;
        this.lookahead      = diff.aiLookahead + Math.floor(Math.random()*6);
        this.reactionDelay  = diff.aiReaction;
        this.overtakeTimer  = 0;
    }
    update(dt) {
        // 1. Get current track target with offset
        const target = this.trackPoints[this.currentTarget];
        
        // 2. Smoothly steer towards the target
        const dx = target.x - this.car.x;
        const dy = target.y - this.car.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Target angle calculation
        const targetAngle = Math.atan2(dx, -dy);
        let angleDiff = targetAngle - this.car.angle;
        while (angleDiff >  Math.PI) angleDiff -= Math.PI*2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI*2;

        const keys = { 
            up: true, 
            down: false, 
            left: angleDiff < -0.05, 
            right: angleDiff > 0.05, 
            space: false, 
            shoot: false 
        };

        // 3. Look ahead for corners and adjust speed
        const lookAheadIndex = (this.currentTarget + this.lookahead) % this.trackPoints.length;
        const ft = this.trackPoints[lookAheadIndex];
        let fa = Math.atan2(ft.x - this.car.x, -(ft.y - this.car.y)) - this.car.angle;
        while (fa >  Math.PI) fa -= Math.PI*2;
        while (fa < -Math.PI) fa += Math.PI*2;

        // Slow down if there's a sharp turn ahead
        if (Math.abs(fa) > 0.4) {
            keys.up = false;
            if (Math.abs(this.car.speed) > 100) keys.down = true;
        }

        // Apply speed variation and max speed limit
        const maxAllowedSpeed = this.car.config.maxSpeed * this.speedVariation;
        if (Math.abs(this.car.speed) > maxAllowedSpeed) {
            keys.up = false;
        }

        // Small chance to use weapon if player is nearby
        if (Math.random() < 0.01 && !this.car.heldWeapon && !this.car.weaponCooldown) {
            // AI firing logic could be added here
        }

        this.car.update(dt, keys);

        // Move to next target point when close enough
        if (dist < 100) {
            this.currentTarget = (this.currentTarget + 1) % this.trackPoints.length;
        }
    }
}

// ============= IMAGE LOADER =============
const IMAGE_CACHE = {};
let imagesLoaded = 0;
const totalImages = Object.keys(CONFIG.cars).length;

function preloadAssets(callback) {
    console.log('Starting asset preload...');
    Object.keys(CONFIG.cars).forEach(key => {
        const img = new Image();
        img.src = `assets/${key}.png`;
        img.onload = () => {
            imagesLoaded++;
            IMAGE_CACHE[key] = img;
            if (imagesLoaded === totalImages) { console.log('All assets loaded.'); callback(); }
        };
        img.onerror = () => {
            console.error(`Failed to load asset: assets/${key}.png`);
            IMAGE_CACHE[key] = null;
            imagesLoaded++;
            if (imagesLoaded === totalImages) callback();
        };
    });
}

// ============= GAME INITIALIZATION =============
preloadAssets(() => {
    console.log('Neon Drift v3 Engine Initialized.');

    const keys = { up: false, down: false, left: false, right: false, space: false, shoot: false, _shootHeld: false };

    const KEY_MAP = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        Space: 'space', KeyF: 'shoot', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right'
    };
    document.addEventListener('keydown', e => { if (KEY_MAP[e.code]) { keys[KEY_MAP[e.code]] = true; e.preventDefault(); } });
    document.addEventListener('keyup',   e => { if (KEY_MAP[e.code]) keys[KEY_MAP[e.code]] = false; });

    const touchMap = {
        'touch-gas': 'up', 'touch-brake': 'down', 'touch-left': 'left',
        'touch-right': 'right', 'touch-handbrake': 'space', 'touch-fire': 'shoot'
    };
    Object.entries(touchMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('touchstart', e => { keys[key] = true; e.preventDefault(); }, { passive: false });
        el.addEventListener('touchend',   () => { keys[key] = false; });
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            CONFIG.difficulty = btn.dataset.diff;
            gameState.difficulty = btn.dataset.diff;
        });
    });

    document.querySelectorAll('.car-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.car-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.selectedCar = btn.dataset.car;
        });
    });

    document.querySelectorAll('.color-swatch').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            gameState.selectedColor = btn.dataset.color;
        });
    });
    const customColorInput = document.getElementById('custom-color');
    if (customColorInput) customColorInput.addEventListener('input', e => { gameState.selectedColor = e.target.value; });

    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const el = document.getElementById(id);
        if (el) el.classList.add('active');
    }

    let engineStarted = false;

    // Pause / resume / quit
    document.addEventListener('keydown', e => {
        if (e.code === 'Escape' && gameState.screen === 'game') {
            gameState.paused = !gameState.paused;
            document.getElementById('pause-overlay')?.classList.toggle('hidden', !gameState.paused);
        }
    });
    document.getElementById('resume-btn')?.addEventListener('click', () => {
        gameState.paused = false;
        document.getElementById('pause-overlay')?.classList.add('hidden');
    });
    document.getElementById('quit-btn')?.addEventListener('click', () => {
        gameState.screen = 'start';
        gameState.paused = false;
        if (window.stopEngine2D) window.stopEngine2D();
        engineStarted = false;
        showScreen('start-screen');
    });
    document.getElementById('restart-btn')?.addEventListener('click', () => startSinglePlayer());
    document.getElementById('menu-btn')?.addEventListener('click', () => {
        if (window.stopEngine2D) window.stopEngine2D();
        engineStarted = false;
        showScreen('start-screen');
    });

    document.getElementById('singleplayer-btn')?.addEventListener('click', () => startSinglePlayer());

    function startSinglePlayer() {
        projectiles.length = 0;
        bullets.length     = 0;

        const carType = gameState.selectedCar;
        const color1  = gameState.selectedColor;
        const cfg     = CONFIG.cars[carType];
        const color2  = cfg ? cfg.defaultColor2 : '#000000';

        const trackData    = generateTrack();
        const trackCenter  = catmullRomSpline(trackData.points);
        const halfWidth    = 70;
        const trackEdges   = buildTrackEdges(trackCenter, halfWidth);
        const trackInnerEdge = trackEdges.inner;
        const trackOuterEdge = trackEdges.outer;
        gameState.trackName = trackData.name;

        const startPt    = trackCenter[0];
        const startAngle = Math.atan2(trackCenter[1].x - trackCenter[0].x, -(trackCenter[1].y - trackCenter[0].y));

        const playerCar  = new Car(startPt.x, startPt.y, startAngle, carType, color1, color2);

        const aiCarTypes = Object.keys(CONFIG.cars).filter(k => k !== carType);
        const aiCars = [];
        for (let i = 0; i < 4; i++) {
            const offset = Math.floor((trackCenter.length / 5) * (i + 1));
            const aiType = aiCarTypes[i % aiCarTypes.length];
            const aiCfg  = CONFIG.cars[aiType];
            aiCars.push(new AICar(
                trackCenter[offset].x, trackCenter[offset].y, startAngle,
                aiType, trackCenter, offset,
                aiCfg.defaultColor1, aiCfg.defaultColor2
            ));
        }

        // Expose to engine2d.js
        window.gameState             = window.gameState || {};
        window.gameState.playerCar   = playerCar;
        window.gameState.aiCars      = aiCars;
        window.gameState.trackName   = trackData.name;
        window.projectiles = projectiles;
        window.bullets     = bullets;

        gameState.screen       = 'game';
        gameState.raceStarted  = true;
        gameState.raceFinished = false;
        gameState.currentLap   = 1;
        gameState.totalTime    = 0;
        gameState.lapTimes     = [];
        gameState.bestLap      = Infinity;
        gameState.maxSpeed     = 0;
        gameState.driftScore   = 0;
        gameState.paused       = false;

        showScreen('game-screen');
        const trackNameEl = document.getElementById('track-name');
        if (trackNameEl) trackNameEl.textContent = trackData.name;

        // Start / restart the top-down engine with full track geometry
        if (!engineStarted) {
            engineStarted = true;
            if (window.startEngine2D) window.startEngine2D(
                trackData.name, trackCenter, trackInnerEdge, trackOuterEdge, halfWidth);
        } else {
            if (window.setEngine2DTrack) window.setEngine2DTrack(
                trackData.name, trackCenter, trackInnerEdge, trackOuterEdge, halfWidth);
        }

        // Lap detection (simple: proximity to start/finish line)
        let lastTime          = null;
        let lapStartTime      = performance.now();
        let nearFinish        = false;
        // Simple checkpoint ring (every 1/8 of track)
        const checkpoints     = [];
        const cpInterval      = Math.floor(trackCenter.length / 8);
        for (let i = 0; i < 8; i++) checkpoints.push(i * cpInterval);
        let checkpointsHit    = new Set();

        // AI track position accumulator (separate per AI, advances with their speed)
        const aiTrackPosBase = 600; // spacing between AI start positions on road

        function gameLoop(ts) {
            if (gameState.screen !== 'game') return;
            requestAnimationFrame(gameLoop);
            if (!lastTime) { lastTime = ts; return; }
            const dt = Math.min((ts - lastTime) / 1000, 0.05);
            lastTime = ts;

            if (gameState.paused) return;

            // Player physics
            playerCar.update(dt, keys);

            // Weapon fire (once per press)
            if (keys.shoot && !keys._shootHeld) {
                const proj = playerCar.fireWeapon();
                if (proj) projectiles.push(proj);
            }
            keys._shootHeld = keys.shoot;

            // AI physics + advance their _trackPos so engine3d can place sprites
            aiCars.forEach((ai, idx) => {
                ai.update(dt);
                // Advance _trackPos proportional to the AI car's speed
                const spd = Math.max(0, ai.car.speed || 0);
                ai.car._trackPos = ((ai.car._trackPos || aiTrackPosBase * (idx + 1)) + spd * dt * 3) % (200 * 500);
            });

            // Track bounds enforcement
            enforceTrackBounds(playerCar, trackCenter, halfWidth * 2, dt);
            aiCars.forEach(ai => enforceTrackBounds(ai.car, trackCenter, halfWidth * 2, dt));

            // Car collisions
            checkCarCollisions([playerCar, ...aiCars.map(a => a.car)]);

            // Stuck / off-track respawn
            checkStuckAndRespawn(playerCar, trackCenter, halfWidth * 2, dt);
            aiCars.forEach(ai => checkStuckAndRespawn(ai.car, trackCenter, halfWidth * 2, dt));

            // Projectile / bullet update & cleanup
            for (let i = projectiles.length - 1; i >= 0; i--) {
                projectiles[i].update(dt);
                if (!projectiles[i].active) projectiles.splice(i, 1);
            }
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].update(dt);
                if (!bullets[i].active) bullets.splice(i, 1);
            }

            // Lap logic (proximity-based against 2D catmull-rom track)
            if (!gameState.raceFinished) {
                for (let i = 0; i < checkpoints.length; i++) {
                    const cp = trackCenter[checkpoints[i]];
                    const dx = playerCar.x - cp.x, dy = playerCar.y - cp.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 120) checkpointsHit.add(i);
                }
                const fp = trackCenter[0];
                const fd = Math.sqrt((playerCar.x - fp.x)**2 + (playerCar.y - fp.y)**2);
                if (fd < 100 && checkpointsHit.size >= checkpoints.length - 1 && gameState.totalTime > 3) {
                    if (!nearFinish) {
                        nearFinish = true;
                        const lt = (performance.now() - lapStartTime) / 1000;
                        gameState.lapTimes.push(lt);
                        if (lt < gameState.bestLap) gameState.bestLap = lt;
                        if (gameState.currentLap >= CONFIG.TOTAL_LAPS) {
                            gameState.raceFinished = true;
                            setTimeout(() => {
                                document.getElementById('final-time')?.setAttribute('textContent', formatTime(gameState.totalTime));
                                document.getElementById('final-time') && (document.getElementById('final-time').textContent = formatTime(gameState.totalTime));
                                document.getElementById('final-best-lap') && (document.getElementById('final-best-lap').textContent = formatTime(gameState.bestLap));
                                document.getElementById('final-max-speed') && (document.getElementById('final-max-speed').textContent = Math.round(gameState.maxSpeed) + ' km/h');
                                document.getElementById('final-drift-score') && (document.getElementById('final-drift-score').textContent = Math.floor(gameState.driftScore));
                                document.getElementById('final-powerups') && (document.getElementById('final-powerups').textContent = gameState.powerupsUsed);
                                showScreen('finish-screen');
                            }, 1500);
                        } else {
                            gameState.currentLap++;
                            checkpointsHit = new Set();
                            lapStartTime   = performance.now();
                        }
                    }
                } else {
                    nearFinish = false;
                }
            }

            // Race timer
            if (!gameState.raceFinished) gameState.totalTime += dt;

            // HUD
            const spd = Math.abs(playerCar.speed);
            if (spd > gameState.maxSpeed) gameState.maxSpeed = spd;
            const speedEl = document.getElementById('speed-number');
            const gearEl  = document.getElementById('gear-indicator');
            const timeEl  = document.getElementById('race-time');
            const lapEl   = document.getElementById('lap-counter');
            if (speedEl) speedEl.textContent = Math.round(spd);
            if (gearEl)  gearEl.textContent  = playerCar.gear;
            if (timeEl)  timeEl.textContent   = formatTime(gameState.totalTime);
            if (lapEl)   lapEl.textContent    = gameState.currentLap + ' / ' + CONFIG.TOTAL_LAPS;

            // Sync state for engine
            window.gameState.playerCar = playerCar;
            window.gameState.aiCars    = aiCars;

            // Trigger Render
            if (window.render2DScene) window.render2DScene();
        }
        requestAnimationFrame(gameLoop);
    }

    // Multiplayer
    document.getElementById('multiplayer-btn')?.addEventListener('click', () => {
        network.connect();
        showScreen('lobby-screen');
        const name = document.getElementById('player-name')?.value || 'Racer';
        network.on('connected', () => {
            network.joinRoom(name, gameState.selectedCar, gameState.selectedColor,
                CONFIG.cars[gameState.selectedCar]?.defaultColor2 || '#000000');
            const statusEl = document.getElementById('connection-status');
            if (statusEl) statusEl.textContent = '✅ Connected';
        });
        network.on('disconnected', () => {
            const statusEl = document.getElementById('connection-status');
            if (statusEl) statusEl.textContent = '❌ Disconnected';
        });
    });
    document.getElementById('lobby-back-btn')?.addEventListener('click', () => showScreen('start-screen'));
    document.getElementById('ready-btn')?.addEventListener('click', () => network.toggleReady());
    document.getElementById('start-race-btn')?.addEventListener('click', () => network.startRace());
});

function formatTime(seconds) {
    const m  = Math.floor(seconds / 60);
    const s  = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + ms;
}
