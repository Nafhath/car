/**
 * ENGINE3D.JS - Realistic Pseudo-3D Racing Engine
 * Replaces old 2D movement with depth projection.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Game Settings ---
const width = 800;
const height = 600;
const roadWidth = 2000;
const segmentLength = 200; 
const cameraDepth = 0.8; 
const drawDistance = 300; 

let playerZ = 0;   // Forward distance
let playerX = 0;   // Left/Right (-1 to 1)
let speed = 0;

// --- Load Realistic Car Assets ---
const carModels = {
    "bmw_m4": { img: new Image(), src: 'assets/bmw_m4.png' },
    "mercedes_amg": { img: new Image(), src: 'assets/mercedes_amg.png' },
    "toyota_supra": { img: new Image(), src: 'assets/toyota_supra.png' },
    "bugatti_chiron": { img: new Image(), src: 'assets/bugatti_chiron.png' },
    "lamborghini": { img: new Image(), src: 'assets/lamborghini.png' },
    "ferrari_f40": { img: new Image(), src: 'assets/ferrari_f40.png' },
    "porsche_911": { img: new Image(), src: 'assets/porsche_911.png' },
    "mclaren_p1": { img: new Image(), src: 'assets/mclaren_p1.png' },
    "ford_mustang": { img: new Image(), src: 'assets/ford_mustang.png' },
    "nissan_gtr": { img: new Image(), src: 'assets/nissan_gtr.png' },
    "subaru_wrx": { img: new Image(), src: 'assets/subaru_wrx.png' },
    "f1_racer": { img: new Image(), src: 'assets/f1_racer.png' },
    "monster_truck": { img: new Image(), src: 'assets/monster_truck.png' },
    "kawasaki_ninja": { img: new Image(), src: 'assets/kawasaki_ninja.png' },
    "ducati_v4": { img: new Image(), src: 'assets/ducati_v4.png' },
    "heavy_duty": { img: new Image(), src: 'assets/heavy_duty.png' },
    "formula_one": { img: new Image(), src: 'assets/formula_one.png' },
    "offroad_legend": { img: new Image(), src: 'assets/offroad_legend.png' }
};
Object.keys(carModels).forEach(key => carModels[key].img.src = carModels[key].src);

// --- 3D Projection Math ---
function project(p, cameraX, cameraY, cameraZ) {
    const scale = cameraDepth / (p.z - cameraZ);
    return {
        x: Math.round((width / 2) + (scale * (p.x - cameraX) * width / 2)),
        y: Math.round((height / 2) - (scale * (p.y - cameraY) * height / 2)),
        w: Math.round(scale * roadWidth * width / 2)
    };
}

// --- Draw Environment & Road ---
function render() {
    ctx.clearRect(0, 0, width, height);

    // 1. Sky/Horizon (Realistic Gradient)
    let grad = ctx.createLinearGradient(0, 0, 0, height/2);
    grad.addColorStop(0, "#0077be");
    grad.addColorStop(1, "#72D1FF");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height / 2);

    // 2. Road Segments
    let baseSegment = Math.floor(playerZ / segmentLength);
    for (let n = 0; n < drawDistance; n++) {
        let z1 = (baseSegment + n) * segmentLength;
        let z2 = (baseSegment + n + 1) * segmentLength;
        
        let p1 = project({x: 0, y: 0, z: z1}, playerX * roadWidth, 1500, playerZ);
        let p2 = project({x: 0, y: 0, z: z2}, playerX * roadWidth, 1500, playerZ);

        if (p1.y <= p2.y) continue; 

        // Track Colors (Rumble strips + Grass)
        let color = (Math.floor((baseSegment + n) / 3) % 2) ? "#666" : "#777";
        let rumble = (Math.floor((baseSegment + n) / 3) % 2) ? "#f00" : "#fff";

        // Grass
        ctx.fillStyle = (Math.floor((baseSegment + n) / 3) % 2) ? "#10AA10" : "#109910";
        ctx.fillRect(0, p2.y, width, p1.y - p2.y);

        // Render Road Polygons
        drawPolygon(ctx, p1.x, p1.y, p1.w * 1.1, p2.x, p2.y, p2.w * 1.1, rumble); // Rumble
        drawPolygon(ctx, p1.x, p1.y, p1.w, p2.x, p2.y, p2.w, color); // Road
    }

    // 3. Render 3D Cars (if renderer is available)
    if (window.render3DScene && window.gameState && window.gameState.playerCar) {
        const playerCar = window.gameState.playerCar;
        // Update camera position based on player car
        playerX = playerCar.x / roadWidth;
        playerZ = playerCar.z || 0;
        
        // Get all cars to render (player + AI)
        const allCars = [playerCar];
        if (window.gameState.aiCars) {
            window.gameState.aiCars.forEach(ai => allCars.push(ai.car));
        }
        
        // Set cars for rendering
        window.setCarsToRender(allCars);
        window.setProjectilesToRender(window.projectiles || []);
        window.setBulletsToRender(window.bullets || []);
        
        // Render 3D scene
        render3DScene(playerCar, playerX * roadWidth, 1500, playerZ);
    } else {
        // Fallback: Render player car as before
        const activeCar = carModels["bmw_m4"].img; // Default to BMW M4
        const carSize = 250;
        ctx.drawImage(activeCar, (width/2) - carSize/2, height - carSize - 10, carSize, carSize);
    }

    requestAnimationFrame(render);
}

function drawPolygon(ctx, x1, y1, w1, x2, y2, w2, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1 - w1, y1); ctx.lineTo(x2 - w2, y2);
    ctx.lineTo(x2 + w2, y2); ctx.lineTo(x1 + w1, y1);
    ctx.closePath(); ctx.fill();
}

render();