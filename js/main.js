import { ARScene } from './scene.js';
import { CameraFeed } from './camera.js';
import { DemoBackground } from './demo.js';
import { LookControls } from './look.js';
import { capturePhoto } from './capture.js';

const $ = (id) => document.getElementById(id);

const els = {
  stage: $('stage'),
  camera: $('camera'),
  demo: $('demo-bg'),
  ar: $('ar-layer'),
  start: $('start'),
  startBtn: $('startBtn'),
  demoBtn: $('demoBtn'),
  modeChip: $('modeChip'),
  count: $('count'),
  hint: $('hint'),
  flip: $('flip'),
  shutter: $('shutter'),
  clear: $('clear'),
  photo: $('photo'),
  photoImg: $('photoImg'),
  save: $('save'),
  closePhoto: $('closePhoto'),
  toast: $('toast'),
};

const scene = new ARScene(els.ar);
const look = new LookControls(scene.camera);
const feed = new CameraFeed(els.camera);
const demo = new DemoBackground(els.demo);

let mode = 'idle';
let placed = 0;
let busy = false;
let toastTimer = 0;

function setMode(next, message) {
  mode = next;
  document.body.dataset.mode = next;
  els.modeChip.dataset.state = next;
  els.modeChip.textContent = next === 'live' ? 'LIVE' : next === 'demo' ? 'DEMO' : 'STANDBY';
  els.flip.disabled = next !== 'live';
  els.shutter.disabled = next === 'idle';
  els.clear.disabled = next === 'idle';
  if (message) showToast(message);
}

function showToast(message, duration = 5600) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), duration);
}

function cameraFailureMessage(error) {
  const name = error && error.name;
  const framed = window.self !== window.top;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return framed
      ? 'Camera is blocked inside this preview frame. Open the app in its own tab to use the real camera — showing the demo scene for now.'
      : 'Camera access is blocked. Allow it for this site and reload — showing the demo scene for now.';
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') {
    return 'No camera found on this device — showing the demo scene.';
  }
  if (error && error.code === 'unsupported') {
    return 'This browser exposes no camera API here — showing the demo scene.';
  }
  return 'Camera unavailable — showing the demo scene.';
}

function enterDemo(message) {
  demo.start();
  feed.stop();
  els.camera.classList.remove('mirrored');
  setMode('demo', message);
}

async function onStart() {
  if (busy) return;
  busy = true;
  els.startBtn.disabled = true;
  try {
    await look.requestPermission();
    demo.stop();
    await feed.start('environment');
    setMode('live');
  } catch (error) {
    enterDemo(cameraFailureMessage(error));
  } finally {
    busy = false;
    els.startBtn.disabled = false;
    els.start.classList.add('hidden');
    look.start();
  }
}

function onDemo() {
  els.start.classList.add('hidden');
  enterDemo('Demo scene — open the app in its own tab on a phone for the real camera.');
  look.start();
}

async function onFlip() {
  if (mode !== 'live' || busy) return;
  busy = true;
  try {
    await feed.flip();
    showToast(feed.mirrored ? 'Front camera' : 'Rear camera', 1800);
  } catch (error) {
    showToast('Could not switch camera.', 2400);
  } finally {
    busy = false;
  }
}

function onShoot() {
  if (mode === 'idle') return;
  scene.render();
  const url = capturePhoto({
    glCanvas: scene.canvas,
    video: els.camera,
    demoCanvas: els.demo,
    mirrored: mode === 'live' && feed.mirrored,
  });
  els.photoImg.src = url;
  els.save.href = url;
  els.save.download = `relic-ar-${Date.now()}.png`;
  els.photo.classList.remove('hidden');
}

function closePhoto() {
  els.photo.classList.add('hidden');
  els.photoImg.removeAttribute('src');
  els.save.removeAttribute('href');
}

function placeAt(clientX, clientY) {
  const rect = els.ar.getBoundingClientRect();
  const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
  scene.place(ndcX, ndcY);

  placed += 1;
  els.count.textContent = String(placed);
  if (placed === 1) els.hint.textContent = 'Relic placed · tap again for more · drag to look around';
}

function onClear() {
  scene.clearPlaced();
  placed = 0;
  els.count.textContent = '0';
  els.hint.textContent = 'Drag to look around · Tap to place a relic';
}

/* ---------- look / place gestures ---------- */
const INTERACTIVE = 'button, a, .start, .photo';
let pointerDown = false;
let pointerMoved = 0;
let pointerStartedAt = 0;
let lastX = 0;
let lastY = 0;

els.stage.addEventListener('pointerdown', (event) => {
  if (mode === 'idle' || event.target.closest(INTERACTIVE)) return;
  pointerDown = true;
  pointerMoved = 0;
  pointerStartedAt = performance.now();
  lastX = event.clientX;
  lastY = event.clientY;
});

els.stage.addEventListener('pointermove', (event) => {
  if (!pointerDown) return;
  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  lastX = event.clientX;
  lastY = event.clientY;
  pointerMoved += Math.hypot(dx, dy);
  if (pointerMoved > 6) look.drag(dx, dy);
});

els.stage.addEventListener('pointerup', (event) => {
  if (!pointerDown) return;
  pointerDown = false;
  if (event.target.closest(INTERACTIVE)) return;
  if (pointerMoved < 9 && performance.now() - pointerStartedAt < 600) {
    placeAt(event.clientX, event.clientY);
  }
});

els.stage.addEventListener('pointercancel', () => {
  pointerDown = false;
});

els.startBtn.addEventListener('click', onStart);
els.demoBtn.addEventListener('click', onDemo);
els.flip.addEventListener('click', onFlip);
els.shutter.addEventListener('click', onShoot);
els.clear.addEventListener('click', onClear);
els.closePhoto.addEventListener('click', closePhoto);
window.addEventListener('resize', () => scene.resize());
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closePhoto();
});

/* ---------- main render loop ---------- */
function frame() {
  requestAnimationFrame(frame);
  look.update();
  scene.render();
}

setMode('idle');
frame();
