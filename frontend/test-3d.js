/**
 * TEST-3D.JS - 3D Conversion Test Script
 * Tests all car models and 3D rendering functionality
 */

// Test function to verify 3D conversion
function test3DConversion() {
    console.log("🧪 Testing 3D Conversion...");
    
    // Test 1: Check if all car assets are loaded
    const carModels = window.carModels || {};
    const loadedCars = Object.keys(carModels).filter(key => {
        const car = carModels[key];
        return car && car.img && car.img.complete && car.img.naturalWidth > 0;
    });
    
    console.log(`✅ Loaded ${loadedCars.length}/18 car models:`, loadedCars);
    
    // Test 2: Check if 3D renderer is available
    const hasRenderer = typeof window.render3DScene === 'function' &&
                       typeof window.setCarsToRender === 'function';
    console.log(`✅ 3D Renderer available: ${hasRenderer}`);
    
    // Test 3: Check if projection math works
    const testPoint = { x: 100, y: 100, z: 1000 };
    const projected = window.project ? window.project(testPoint, 0, 1500, 0) : null;
    console.log(`✅ Projection test:`, projected);
    
    // Test 4: Create test cars for rendering
    if (hasRenderer && loadedCars.length > 0) {
        const testCars = [];
        for (let i = 0; i < 5; i++) {
            const carType = loadedCars[i % loadedCars.length];
            testCars.push({
                x: (i - 2) * 100,
                y: 0,
                z: 500 + i * 200,
                angle: i * 0.1,
                carType: carType,
                width: 24,
                height: 46,
                miniScale: 1,
                health: 100
            });
        }
        
        window.setCarsToRender(testCars);
        console.log(`✅ Created ${testCars.length} test cars for 3D rendering`);
        
        // Test rendering
        if (window.render3DScene) {
            try {
                window.render3DScene(testCars[0], 0, 1500, 0);
                console.log("✅ 3D rendering test successful");
            } catch (error) {
                console.error("❌ 3D rendering test failed:", error);
            }
        }
    }
    
    // Test 5: Check canvas context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    console.log(`✅ Canvas context available: ${!!ctx}`);
    
    console.log("🎉 3D Conversion Test Complete!");
    return {
        carsLoaded: loadedCars.length,
        rendererAvailable: hasRenderer,
        projectionWorking: !!projected,
        canvasWorking: !!ctx
    };
}

// Auto-run test when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', test3DConversion);
} else {
    test3DConversion();
}

// Expose test function globally
window.test3DConversion = test3DConversion;