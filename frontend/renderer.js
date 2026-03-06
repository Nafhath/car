/**
 * RENDERER.JS
 *
 * The OutRun-style engine3d.js now renders the road, player car, and AI cars
 * directly. This file just exposes the window hooks that game.js calls so
 * nothing breaks — the actual drawing is done inside engine3d.js.
 *
 * NOTE: canvas, ctx, width, height, roadWidth, cameraDepth and project() are
 * all declared in engine3d.js (loaded after this file). Do NOT redeclare them.
 */

// Global variables for 3D rendering
let carsToRender = [];
let projectilesToRender = [];
let bulletsToRender = [];

// NOTE: canvas, ctx, and carModels are all declared in engine3d.js.
// Do NOT redeclare them here — duplicate const declarations crash the page.
// renderer.js loads before engine3d.js (see index.html script order),
// so these globals are available by the time any render function is called.

// Set cars to render (called from game.js)
function setCarsToRender(cars) {
    carsToRender = cars;
}

// Set projectiles to render (called from game.js)
function setProjectilesToRender(projectiles) {
    projectilesToRender = projectiles;
}

// Set bullets to render (called from game.js)
function setBulletsToRender(bullets) {
    bulletsToRender = bullets;
}

// Render all cars in 3D space
function renderCars(playerCar, cameraX, cameraY, cameraZ) {
    try {
        // Sort cars by distance (furthest first) for proper overlap
        const sortedCars = [...carsToRender].sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.x - cameraX, 2) + Math.pow(a.y - cameraY, 2) + Math.pow(a.z - cameraZ, 2));
            const distB = Math.sqrt(Math.pow(b.x - cameraX, 2) + Math.pow(b.y - cameraY, 2) + Math.pow(b.z - cameraZ, 2));
            return distB - distA;
        });

        // Render each car
        sortedCars.forEach(car => {
            if (!car || !car.carType || !carModels[car.carType]) return;
            
            const carImg = carModels[car.carType].img;
            if (!carImg || !carImg.complete || carImg.naturalWidth === 0) return;

            // Calculate car position in 3D space
            const carPos = { x: car.x, y: car.y, z: car.z || 0 };
            const projected = project(carPos, cameraX, cameraY, cameraZ);
            
            // Calculate car size based on distance (scale factor)
            const distance = Math.max(1, Math.abs(carPos.z - cameraZ)); // clamp to avoid div/0
            const baseSize = 40; // Base car size at distance 1
            const scale = cameraDepth / distance;
            const carWidth = baseSize * scale * car.miniScale;
            const carHeight = (car.width || 46) * scale * car.miniScale;

            // Calculate car rotation
            const carAngle = car.angle || 0;
            
            // Save canvas state for rotation
            ctx.save();
            
            // Move to projected position (center of car)
            ctx.translate(projected.x, projected.y);
            
            // Rotate canvas by car angle
            ctx.rotate(carAngle);
            
            // Draw car (flipped for correct orientation)
            ctx.scale(1, -1); // Flip vertically for correct orientation
            
            // Draw the car image
            if (carImg && carImg.complete && carImg.naturalWidth > 0) {
                ctx.drawImage(carImg, -carWidth/2, -carHeight/2, carWidth, carHeight);
            }
            
            // Restore canvas state
            ctx.restore();

            // Draw health bar for AI cars (if close enough)
            if (car !== playerCar && distance < 500) {
                drawHealthBar(car, projected, scale);
            }
        });
    } catch (error) {
        console.error('Error rendering cars:', error);
    }
}

// Draw health bar for cars
function drawHealthBar(car, projected, scale) {
    const barWidth = 30 * scale;
    const barHeight = 4 * scale;
    const barX = projected.x - barWidth / 2;
    const barY = projected.y - 40 * scale;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthPercent = car.health / 100;
    ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : (healthPercent > 0.25 ? '#ffff00' : '#ff0000');
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
}

// Render projectiles in 3D space
function renderProjectiles(cameraX, cameraY, cameraZ) {
    projectilesToRender.forEach(proj => {
        if (!proj.active) return;
        
        const projPos = { x: proj.x, y: proj.y, z: 0 };
        const projected = project(projPos, cameraX, cameraY, cameraZ);
        
        const distance = Math.max(1, Math.abs(projPos.z - cameraZ));
        const scale = cameraDepth / distance;
        const size = proj.radius * scale;
        
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        
        if (proj.type === 'missile') {
            ctx.fillStyle = '#ff4444';
        } else if (proj.type === 'oil') {
            ctx.fillStyle = '#333333';
        } else if (proj.type === 'emp') {
            ctx.fillStyle = '#00f0ff';
        }
        
        ctx.fill();
    });
}

// Render bullets in 3D space
function renderBullets(cameraX, cameraY, cameraZ) {
    bulletsToRender.forEach(bullet => {
        if (!bullet.active) return;
        
        const bulletPos = { x: bullet.x, y: bullet.y, z: 0 };
        const projected = project(bulletPos, cameraX, cameraY, cameraZ);
        
        const distance = Math.max(1, Math.abs(bulletPos.z - cameraZ));
        const scale = cameraDepth / distance;
        const size = 3 * scale;
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Stub — engine3d handles scene rendering now
function render3DScene() {}

window.render3DScene          = render3DScene;
window.setCarsToRender        = setCarsToRender;
window.setProjectilesToRender = setProjectilesToRender;
window.setBulletsToRender     = setBulletsToRender;
