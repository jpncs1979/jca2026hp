/**
 * PDF のチラシを案内ページで画像として見せるための処理（サーバー専用）。
 * 1ページ目を JPEG にして、元の PDF の隣（<元のパス>.preview.jpg）に保存して使い回す。
 * チラシを差し替えると元のパスが変わるので、画像も自動で作り直される。
 */

const PREVIEW_WIDTH = 900;
const PREVIEW_QUALITY = 82;

export function flyerPreviewPath(flyerPath: string): string {
  return `${flyerPath}.preview.jpg`;
}

/** 元のチラシと、その変換済み画像（PDF のときだけ存在）のパス */
export function flyerStoragePaths(flyerPath: string | null | undefined): string[] {
  if (!flyerPath) return [];
  return flyerPath.toLowerCase().endsWith(".pdf")
    ? [flyerPath, flyerPreviewPath(flyerPath)]
    : [flyerPath];
}

/** PDF の1ページ目を白背景の JPEG にする */
export async function renderPdfFirstPageAsJpeg(pdf: Uint8Array): Promise<Buffer> {
  const [{ renderPageAsImage }, canvas] = await Promise.all([
    import("unpdf"),
    import("@napi-rs/canvas"),
  ]);
  const png = await renderPageAsImage(pdf, 1, {
    canvasImport: async () => canvas,
    width: PREVIEW_WIDTH,
  });
  // PDF の透明部分が JPEG で黒くならないよう、白を敷いてから描く
  const image = await canvas.loadImage(Buffer.from(png));
  const out = canvas.createCanvas(image.width, image.height);
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, image.width, image.height);
  ctx.drawImage(image, 0, 0);
  return out.encode("jpeg", PREVIEW_QUALITY);
}
