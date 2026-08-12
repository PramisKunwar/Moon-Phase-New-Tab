const MOON_IMG_SRC = "../icons/icon-512.png";

let moonImage = null;
let moonImagePromise = null;

function loadMoonImage() {
  if (moonImage) return Promise.resolve(moonImage);
  if (moonImagePromise) return moonImagePromise;
  moonImagePromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.src = "icons/icon-512.png";
    img.onload = () => {
      moonImage = img;
      resolve(img);
    };
    img.onerror = reject;
  });
  return moonImagePromise;
}

export async function renderMoon(canvas, phaseFraction, waxing) {
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.46;

  ctx.clearRect(0, 0, size, size);

  const img = await loadMoonImage();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.globalAlpha = 0.12;
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.restore();

  const illum = (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;
  const cosPhase = Math.cos(2 * Math.PI * phaseFraction);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.globalAlpha = 1;
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);

  ctx.globalCompositeOperation = "destination-out";
  drawShadow(ctx, cx, cy, r, cosPhase, waxing);
  ctx.globalCompositeOperation = "source-over";

  ctx.globalCompositeOperation = "destination-over";
  ctx.globalAlpha = 0.1;
  ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
  ctx.globalCompositeOperation = "source-over";
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = illum * 0.35;
  const grad = ctx.createRadialGradient(cx, cy, r * 0.98, cx, cy, r * 1.45);
  grad.addColorStop(0, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawShadow(ctx, cx, cy, r, cosPhase, waxing) {
  ctx.fillStyle = "#000";

  if (cosPhase > 0.999) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (cosPhase < -0.999) return;

  ctx.beginPath();
  if (waxing) {
    ctx.moveTo(cx, cy - r);
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, true);
  } else {
    ctx.moveTo(cx, cy - r);
    ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
  }
  ctx.closePath();
  ctx.fill();

  const ellipseW = Math.abs(cosPhase) * r;
  if (cosPhase > 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, ellipseW, r, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.ellipse(cx, cy, ellipseW, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
