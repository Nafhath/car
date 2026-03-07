/**
 * RENDERER.JS
 *
 * The OutRun-style engine3d.js handles all road/car rendering.
 * This file only exposes the window hooks game.js may call — no drawing here.
 *
 * IMPORTANT: canvas, ctx, width, height, roadWidth, cameraDepth, carModels and
 * project() are all declared in engine3d.js (loaded AFTER this file).
 * Do NOT redeclare them here — duplicate `const` declarations crash the page.
 */

let carsToRender        = [];
let projectilesToRender = [];
let bulletsToRender     = [];

function setCarsToRender(cars)         { carsToRender        = cars; }
function setProjectilesToRender(projs) { projectilesToRender = projs; }
function setBulletsToRender(bulls)     { bulletsToRender     = bulls; }

// Stub — engine3d.js handles all scene rendering
function render3DScene() {}

window.render3DScene          = render3DScene;
window.setCarsToRender        = setCarsToRender;
window.setProjectilesToRender = setProjectilesToRender;
window.setBulletsToRender     = setBulletsToRender;
