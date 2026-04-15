/**
 * Draws a bottom-right watermark on a data URL image. Returns a new PNG data URL.
 */
export async function applyWatermark(
  imageDataUrl: string,
  lines: [string, string],
): Promise<string> {
  const img = await loadImage(imageDataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return imageDataUrl;
  }

  ctx.drawImage(img, 0, 0);

  const pad = Math.max(12, Math.round(canvas.width * 0.02));
  const fontSize = Math.max(12, Math.round(canvas.width * 0.028));
  ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  const line1 = lines[0];
  const line2 = lines[1];
  const w1 = ctx.measureText(line1).width;
  const w2 = ctx.measureText(line2).width;
  const textW = Math.max(w1, w2);
  const lineGap = Math.round(fontSize * 0.35);
  const boxH = fontSize * 2 + lineGap + pad * 1.5;
  const boxW = textW + pad * 2;
  const x0 = canvas.width - pad - boxW;
  const y0 = canvas.height - pad - boxH;

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(x0, y0, boxW, boxH);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const tx = canvas.width - pad;
  const ty = canvas.height - pad - pad;
  ctx.fillText(line1, tx, ty - fontSize - lineGap);
  ctx.fillText(line2, tx, ty);

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (!src.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image load failed"));
    image.src = src;
  });
}
