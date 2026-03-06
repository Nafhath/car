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

let carsToRender        = [];
let projectilesToRender = [];
let bulletsToRender     = [];

function setCarsToRender(cars)         { carsToRender       = cars; }
function setProjectilesToRender(projs) { projectilesToRender = projs; }
function setBulletsToRender(bulls)     { bulletsToRender    = bulls; }

// Stub — engine3d handles scene rendering now
function render3DScene() {}

window.render3DScene          = render3DScene;
window.setCarsToRender        = setCarsToRender;
window.setProjectilesToRender = setProjectilesToRender;
window.setBulletsToRender     = setBulletsToRender;
