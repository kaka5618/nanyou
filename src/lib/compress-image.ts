const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.8;

/** Client-side resize + JPEG compress. Returns a new File (JPEG) when possible. */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  let w = width;
  let h = height;
  const longest = Math.max(w, h);
  if (longest > MAX_EDGE) {
    const scale = MAX_EDGE / longest;
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });

  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}
