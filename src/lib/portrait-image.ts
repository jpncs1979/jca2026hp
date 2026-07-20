/** 顔写真：JPEG/PNG をリサイズして JPEG data URL にする（sessionStorage 用） */

export const PORTRAIT_MAX_BYTES = 5 * 1024 * 1024;
export const PORTRAIT_ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.85;

export function isAllowedPortraitMime(mime: string): boolean {
  return mime === "image/jpeg" || mime === "image/png" || mime === "image/webp";
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("画像の読み込みに失敗しました。"));
    };
    img.src = url;
  });
}

/** ブラウザ上で顔写真を JPEG data URL に変換（長辺 MAX_EDGE 以下） */
export async function fileToPortraitDataUrl(file: File): Promise<string> {
  if (!isAllowedPortraitMime(file.type)) {
    throw new Error("顔写真は JPEG / PNG / WebP 形式でアップロードしてください。");
  }
  if (file.size > PORTRAIT_MAX_BYTES) {
    throw new Error("顔写真は 5MB 以下にしてください。");
  }

  const img = await loadImageFromFile(file);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) throw new Error("画像サイズを取得できませんでした。");

  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像の処理に失敗しました。");
  ctx.drawImage(img, 0, 0, cw, ch);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  if (!dataUrl.startsWith("data:image/jpeg")) {
    throw new Error("顔写真の変換に失敗しました。");
  }
  // sessionStorage 余裕のためおおよそ 3.5MB 上限
  if (dataUrl.length > 3.5 * 1024 * 1024) {
    throw new Error("顔写真のデータが大きすぎます。別の写真をお試しください。");
  }
  return dataUrl;
}

/** data URL → Buffer（サーバー側アップロード用） */
export function portraitDataUrlToBuffer(dataUrl: string): {
  buffer: Buffer;
  contentType: "image/jpeg";
  ext: "jpg";
} | null {
  const trimmed = dataUrl.trim();
  const prefix = "data:image/jpeg;base64,";
  if (!trimmed.startsWith(prefix)) return null;
  const b64 = trimmed.slice(prefix.length);
  if (!b64) return null;
  try {
    const buffer = Buffer.from(b64, "base64");
    if (buffer.length < 100 || buffer.length > PORTRAIT_MAX_BYTES) return null;
    return { buffer, contentType: "image/jpeg", ext: "jpg" };
  } catch {
    return null;
  }
}
