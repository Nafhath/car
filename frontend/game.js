/* ========================================
   NEON DRIFT — Game Engine v2
   Car Racing with Realistic Physics,
   Power-Ups, 6 Car Types, Color Picker
   ======================================== */

// ============= CONFIGURATION =============
const CONFIG = {
    TOTAL_LAPS: 3,
    POWERUP_COUNT: 8,
    POWERUP_RESPAWN: 12,
    cars: {
        sport: {
            maxSpeed: 280, acceleration: 3200, braking: 4500, turnSpeed: 2.8,
            grip: 0.92, driftGrip: 0.7, mass: 1200, dragCoeff: 0.4,
            defaultColor1: '#ff2d95', defaultColor2: '#ff6a00',
            bodyStyle: 'sport', width: 24, height: 46
        },
        muscle: {
            maxSpeed: 320, acceleration: 3800, braking: 3800, turnSpeed: 2.3,
            grip: 0.88, driftGrip: 0.6, mass: 1500, dragCoeff: 0.5,
            defaultColor1: '#00f0ff', defaultColor2: '#0066ff',
            bodyStyle: 'muscle', width: 26, height: 50
        },
        drift: {
            maxSpeed: 260, acceleration: 3000, braking: 4200, turnSpeed: 3.4,
            grip: 0.82, driftGrip: 0.55, mass: 1000, dragCoeff: 0.35,
            defaultColor1: '#39ff14', defaultColor2: '#00cc44',
            bodyStyle: 'drift', width: 22, height: 44
        },
        supercar: {
            maxSpeed: 360, acceleration: 4200, braking: 5000, turnSpeed: 2.5,
            grip: 0.94, driftGrip: 0.72, mass: 1100, dragCoeff: 0.32,
            defaultColor1: '#ffd700', defaultColor2: '#ff8c00',
            bodyStyle: 'supercar', width: 22, height: 48
        },
        truck: {
            maxSpeed: 220, acceleration: 2600, braking: 3000, turnSpeed: 1.8,
            grip: 0.95, driftGrip: 0.8, mass: 2200, dragCoeff: 0.7,
            defaultColor1: '#ff4444', defaultColor2: '#990000',
            bodyStyle: 'truck', width: 30, height: 54
        },
        rally: {
            maxSpeed: 270, acceleration: 3400, braking: 4000, turnSpeed: 3.6,
            grip: 0.85, driftGrip: 0.58, mass: 1050, dragCoeff: 0.38,
            defaultColor1: '#b829ff', defaultColor2: '#6600cc',
            bodyStyle: 'rally', width: 23, height: 44
        }
    }
};

// ============= POWER-UP TYPES =============
const POWERUP_TYPES = [
    { id: 'speed', name: 'SPEED BOOST!', icon: '⚡', duration: 4, color: '#ffd700' },
    { id: 'shield', name: 'SHIELD!', icon: '🛡️', duration: 5, color: '#00f0ff' },
    { id: 'nitro', name: 'NITRO!', icon: '🔥', duration: 3, color: '#ff4444' },
    { id: 'grip', name: 'MEGA GRIP!', icon: '🏁', duration: 4, color: '#39ff14' },
    { id: 'slow', name: 'OPPONENTS SLOWED!', icon: '❄️', duration: 4, color: '#66ccff' },
    { id: 'mini', name: 'MINI SIZE!', icon: '🔮', duration: 5, color: '#b829ff' },
];

// ============= TRACK GENERATION =============
function generateTrack() {
    const segments = [
        { x: -600, y: 400 }, { x: -400, y: 420 }, { x: -200, y: 400 },
        { x: 0, y: 380 }, { x: 200, y: 400 }, { x: 400, y: 420 }, { x: 600, y: 400 },
        { x: 720, y: 350 }, { x: 800, y: 280 }, { x: 830, y: 180 }, { x: 810, y: 80 },
        { x: 750, y: 0 }, { x: 700, y: -60 }, { x: 620, y: -80 },
        { x: 500, y: -100 }, { x: 380, y: -140 }, { x: 280, y: -200 },
        { x: 200, y: -280 }, { x: 120, y: -320 }, { x: 0, y: -340 },
        { x: -120, y: -320 }, { x: -200, y: -260 }, { x: -300, y: -220 },
        { x: -420, y: -200 }, { x: -520, y: -160 },
        { x: -620, y: -80 }, { x: -700, y: 20 }, { x: -740, y: 120 },
        { x: -730, y: 220 }, { x: -680, y: 320 },
    ];
    return segments.map(p => ({ x: p.x * 1.4, y: p.y * 1.4 }));
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

// ============= GAME STATE =============
let gameState = {
    screen: 'start', selectedCar: 'sport', selectedColor: '#ff2d95',
    paused: false, countdown: 0, raceStarted: false, raceFinished: false,
    totalTime: 0, lapTimes: [], bestLap: Infinity, currentLap: 1,
    maxSpeed: 0, driftScore: 0, currentDriftScore: 0, isDrifting: false,
    powerupsUsed: 0,
};

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
        // Power-up state
        this.activePowerup = null; this.powerupTimer = 0; this.powerupDuration = 0;
        this.shielded = false; this.miniScale = 1;
        this.speedMultiplier = 1; this.gripMultiplier = 1;
        // Wheel angle for visual
        this.visualWheelAngle = 0;
    }

    update(dt, keys) {
        const cfg = this.config;
        this.throttle = keys.up ? 1 : 0;
        this.brake = keys.down ? 1 : 0;
        this.handbrake = keys.space;

        let steerInput = 0;
        if (keys.left) steerInput = -1;
        if (keys.right) steerInput = 1;

        const speedFactor = 1 - (Math.abs(this.speed) / (cfg.maxSpeed * this.speedMultiplier)) * 0.6;
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

        if (Math.abs(this.speed) > 5) {
            this.angle += this.steerAngle * (this.speed / 200) * dt;
        }

        let accelForward = engineForce;
        if (this.brake > 0 && forwardSpeed > 10) accelForward -= brakeForce;
        else if (this.brake > 0 && forwardSpeed <= 10) accelForward = -cfg.acceleration * 0.4 * this.brake;

        accelForward -= cfg.dragCoeff * forwardSpeed * Math.abs(forwardSpeed) * 0.005;
        accelForward -= forwardSpeed * 30 * cfg.dragCoeff * dt;

        const effectiveMax = cfg.maxSpeed * this.speedMultiplier;
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

        if (this.drifting && Math.abs(this.speed) > 40) {
            const sa = Math.min(this.slipAngle * 2, 1);
            this.tireMarks.push(
                { x: this.x - forwardX * this.height * 0.35 + rightX * this.width * 0.35, y: this.y - forwardY * this.height * 0.35 + rightY * this.width * 0.35, alpha: sa },
                { x: this.x - forwardX * this.height * 0.35 - rightX * this.width * 0.35, y: this.y - forwardY * this.height * 0.35 - rightY * this.width * 0.35, alpha: sa }
            );
        }
        if (this.tireMarks.length > 2000) this.tireMarks = this.tireMarks.slice(-1500);

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

        this.headlightFlicker = 0.95 + Math.random() * 0.05;

        // Power-up timer
        if (this.activePowerup) {
            this.powerupTimer -= dt;
            if (this.powerupTimer <= 0) this.clearPowerup();
        }
    }

    applyPowerup(type) {
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
        this.speedVariation = 0.65 + Math.random() * 0.3;
        this.lineOffset = (Math.random() - 0.5) * 40;
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

        const keys = { up: true, down: false, left: angleDiff < -0.05, right: angleDiff > 0.05, space: false };

        const la = 15;
        const ft = this.trackPoints[(this.currentTarget + la) % this.trackPoints.length];
        let fa = Math.atan2(ft.x - this.car.x, -(ft.y - this.car.y)) - this.car.angle;
        while (fa > Math.PI) fa -= Math.PI * 2;
        while (fa < -Math.PI) fa += Math.PI * 2;
        if (Math.abs(fa) > 0.5 && Math.abs(this.car.speed) > 120) { keys.up = false; keys.down = true; }
        if (Math.abs(this.car.speed) > this.car.config.maxSpeed * this.speedVariation) keys.up = false;

        this.car.update(dt, keys);
        if (dist < 80) this.currentTarget = (this.currentTarget + 1) % this.trackPoints.length;
    }
}
