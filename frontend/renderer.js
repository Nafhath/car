/**
 * RENDERER.JS - 3D Car Rendering System
 * Integrates 3D projection with car physics for proper 3D rendering
 *
 * NOTE: width, height, roadWidth, cameraDepth and project() are defined
 * in engine3d.js which loads after this file. They are shared globals.
 * Do NOT redeclare them here — that causes a SyntaxError in the browser.
 */

// Global variables for 3D rendering
let carsToRender = [];
let projectilesToRender = [];
let bulletsToRender = [];

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
        if (!carImg.complete || carImg.naturalWidth === 0) return;

        // Calculate car position in 3D space
        const carPos = { x: car.x, y: car.y, z: car.z || 0 };
        const projected = project(carPos, cameraX, cameraY, cameraZ);
        
        // Calculate car size based on distance (scale factor)
        const distance = Math.abs(carPos.z - cameraZ);
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
        
        const distance = Math.abs(projPos.z - cameraZ);
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
        
        const distance = Math.abs(bulletPos.z - cameraZ);
        const scale = cameraDepth / distance;
        const size = 3 * scale;
        
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Render tire marks
function renderTireMarks(car, cameraX, cameraY, cameraZ) {
    if (!car.tireMarks || car.tireMarks.length === 0) return;
    
    car.tireMarks.forEach(mark => {
        const markPos = { x: mark.x, y: mark.y, z: 0 };
        const projected = project(markPos, cameraX, cameraY, cameraZ);
        
        ctx.fillStyle = `rgba(0, 0, 0, ${mark.alpha || 0.5})`;
        ctx.fillRect(projected.x - 2, projected.y - 2, 4, 4);
    });
}

// Render particles
function renderParticles(car, cameraX, cameraY, cameraZ) {
    if (!car.particles || car.particles.length === 0) return;
    
    car.particles.forEach(particle => {
        const particlePos = { x: particle.x, y: particle.y, z: 0 };
        const projected = project(particlePos, cameraX, cameraY, cameraZ);
        
        const alpha = Math.max(0, particle.life);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Render sparks
function renderSparks(car, cameraX, cameraY, cameraZ) {
    if (!car.sparks || car.sparks.length === 0) return;
    
    car.sparks.forEach(spark => {
        const sparkPos = { x: spark.x, y: spark.y, z: 0 };
        const projected = project(sparkPos, cameraX, cameraY, cameraZ);
        
        const alpha = Math.max(0, spark.life);
        ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.fillRect(projected.x, projected.y, 2, 2);
    });
}

// Main render function that integrates with the existing engine
function render3DScene(playerCar, cameraX, cameraY, cameraZ) {
    // Render cars
    renderCars(playerCar, cameraX, cameraY, cameraZ);
    
    // Render projectiles
    renderProjectiles(cameraX, cameraY, cameraZ);
    
    // Render bullets
    renderBullets(cameraX, cameraY, cameraZ);
    
    // Render effects for player car
    if (playerCar) {
        renderTireMarks(playerCar, cameraX, cameraY, cameraZ);
        renderParticles(playerCar, cameraX, cameraY, cameraZ);
        renderSparks(playerCar, cameraX, cameraY, cameraZ);
    }
}

// Export functions for use in other files
window.render3DScene = render3DScene;
window.setCarsToRender = setCarsToRender;
window.setProjectilesToRender = setProjectilesToRender;
window.setBulletsToRender = setBulletsToRender;