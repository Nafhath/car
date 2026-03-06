/**
 * TEST-3D.JS - 3D Conversion Test Script
 */
function test3DConversion() {
    console.log('🧪 Testing 3D Conversion...');
    const carModels = window.carModels || {};
    const loadedCars = Object.keys(carModels).filter(key => {
        const car = carModels[key];
        return car && car.img && car.img.complete && car.img.naturalWidth > 0;
    });
    console.log(`✅ Loaded ${loadedCars.length}/18 car models:`, loadedCars);
    const hasRenderer = typeof window.render3DScene === 'function' && typeof window.setCarsToRender === 'function';
    console.log(`✅ 3D Renderer available: ${hasRenderer}`);
    const testPoint = { x: 100, y: 100, z: 1000 };
    const projected = window.project ? window.project(testPoint, 0, 1500, 0) : null;
    console.log(`✅ Projection test:`, projected);
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    console.log(`✅ Canvas context available: ${!!ctx}`);
    console.log('🎉 3D Conversion Test Complete!');
    return { carsLoaded: loadedCars.length, rendererAvailable: hasRenderer, projectionWorking: !!projected, canvasWorking: !!ctx };
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', test3DConversion);
} else {
    test3DConversion();
}
window.test3DConversion = test3DConversion;
