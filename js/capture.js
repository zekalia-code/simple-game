function drawCover(ctx, source, sourceWidth, sourceHeight, width, height, mirror) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  if (mirror) {
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(source, -offsetX - drawWidth, offsetY, drawWidth, drawHeight);
    ctx.restore();
    return;
  }
  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
}

/** Composites the live background (camera or demo scene) under the AR layer. */
export function capturePhoto({ glCanvas, video, demoCanvas, mirrored = false }) {
  const width = glCanvas.width;
  const height = glCanvas.height;

  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');

  ctx.fillStyle = '#04070f';
  ctx.fillRect(0, 0, width, height);

  const videoReady = Boolean(video && video.srcObject && video.readyState >= 2 && video.videoWidth > 0);
  if (videoReady) {
    drawCover(ctx, video, video.videoWidth, video.videoHeight, width, height, mirrored);
  } else if (demoCanvas && demoCanvas.width > 1) {
    drawCover(ctx, demoCanvas, demoCanvas.width, demoCanvas.height, width, height, false);
  }

  ctx.drawImage(glCanvas, 0, 0, width, height);
  return out.toDataURL('image/png');
}
