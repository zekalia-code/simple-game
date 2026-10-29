/**
 * Synthetic scene drawn when no camera is available, so the AR layer still has
 * something to sit on (and to photograph).
 */
export class DemoBackground {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.running = false;
    this.frameId = 0;
    this.startedAt = 0;
    this.width = 0;
    this.height = 0;
    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
  }

  resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = this.canvas.width = Math.max(1, Math.round(window.innerWidth * pixelRatio));
    this.height = this.canvas.height = Math.max(1, Math.round(window.innerHeight * pixelRatio));
    if (!this.running && this.height) this.draw(0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.resize();
    this.startedAt = performance.now();
    const tick = () => {
      if (!this.running) return;
      this.draw((performance.now() - this.startedAt) / 1000);
      this.frameId = requestAnimationFrame(tick);
    };
    tick();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameId);
  }

  draw(time = 0) {
    const { ctx, width: w, height: h } = this;
    if (!ctx || !w || !h) return;

    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#050b16');
    sky.addColorStop(0.45, '#0a1c31');
    sky.addColorStop(1, '#02060d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const blobs = [
      { x: 0.28 + Math.sin(time * 0.13) * 0.05, y: 0.42 + Math.cos(time * 0.17) * 0.04, r: 0.55, color: 'rgba(87,245,255,0.30)' },
      { x: 0.78 + Math.cos(time * 0.11) * 0.04, y: 0.33 + Math.sin(time * 0.15) * 0.05, r: 0.5, color: 'rgba(255,79,216,0.24)' },
      { x: 0.5, y: 0.72, r: 0.6, color: 'rgba(157,123,255,0.18)' },
    ];
    blobs.forEach((blob) => {
      const radius = blob.r * Math.max(w, h);
      const glow = ctx.createRadialGradient(blob.x * w, blob.y * h, 0, blob.x * w, blob.y * h, radius);
      glow.addColorStop(0, blob.color);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    });

    // Perspective grid standing in for a floor plane.
    const horizon = h * 0.62;
    const vanishX = w * 0.5;
    ctx.lineWidth = Math.max(1, w / 1400);
    ctx.strokeStyle = 'rgba(87,245,255,0.16)';
    for (let i = -14; i <= 14; i += 1) {
      ctx.beginPath();
      ctx.moveTo(vanishX, horizon);
      ctx.lineTo(vanishX + i * (w / 11), h);
      ctx.stroke();
    }

    const scroll = (time * 0.1) % 1;
    for (let i = 0; i < 12; i += 1) {
      const depth = (i + scroll) / 12;
      const y = horizon + (h - horizon) * depth * depth;
      ctx.globalAlpha = 0.08 + depth * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const vignette = ctx.createRadialGradient(w / 2, h * 0.48, Math.min(w, h) * 0.22, w / 2, h * 0.5, Math.max(w, h) * 0.78);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(1,4,10,0.92)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }
}
