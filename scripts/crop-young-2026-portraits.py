"""
ヤング2026 入賞者写真を顔まわりにトリミングする。
番号札（左下）は顔クロップで自然に外れる。
出力: public/images/young-2026/results/portraits/{id}.jpg
"""
from __future__ import annotations

import re
import sys
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "public" / "images" / "young-2026" / "results"
OUT_DIR = SRC_DIR / "portraits"
MODEL_PATH = ROOT / "scripts" / "face_detection_yunet_2023mar.onnx"
YUNET_URL = (
    "https://github.com/opencv/opencv_zoo/raw/main/models/"
    "face_detection_yunet/face_detection_yunet_2023mar.onnx"
)
OUT_W, OUT_H = 720, 960  # 3:4
JPEG_QUALITY = 88


def ensure_yunet_model() -> Path:
    if not (MODEL_PATH.exists() and MODEL_PATH.stat().st_size > 100_000):
        print("顔検出モデルをダウンロードしています…")
        urllib.request.urlretrieve(YUNET_URL, MODEL_PATH)
    # OpenCV は日本語パスの ONNX を読めないことがあるため ASCII パスへ複製
    ascii_path = Path.home() / "AppData" / "Local" / "Temp" / "face_detection_yunet_2023mar.onnx"
    ascii_path.write_bytes(MODEL_PATH.read_bytes())
    return ascii_path


def detect_face(bgr: np.ndarray, detector) -> tuple[int, int, int, int] | None:
    h, w = bgr.shape[:2]
    detector.setInputSize((w, h))
    _retval, faces = detector.detect(bgr)
    if faces is None or len(faces) == 0:
        detector.setScoreThreshold(0.45)
        detector.setInputSize((w, h))
        _retval, faces = detector.detect(bgr)
        detector.setScoreThreshold(0.7)
    if faces is None or len(faces) == 0:
        return None

    best = None
    best_area = 0
    for row in faces:
        x, y, fw, fh = [float(v) for v in row[:4]]
        if y + fh * 0.5 > h * 0.78:
            continue
        area = fw * fh
        if area > best_area:
            best_area = area
            best = (int(x), int(y), int(fw), int(fh))
    return best


def pil_to_bgr(img: Image.Image) -> np.ndarray:
    rgb = np.array(img.convert("RGB"))
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def crop_around_face(w: int, h: int, face: tuple[int, int, int, int] | None) -> tuple[int, int, int, int]:
    target_ratio = OUT_W / OUT_H  # 0.75
    if face:
        x, y, fw, fh = face
        cx = x + fw / 2
        cy = y + fh * 0.38
        crop_h = fh * 2.55
        crop_w = crop_h * target_ratio
        crop_w = max(crop_w, fw * 2.15)
        crop_h = crop_w / target_ratio
    else:
        # フォールバック: 上寄りの 3:4（番号札は下にある）
        crop_h = h * 0.48
        crop_w = crop_h * target_ratio
        cx = w / 2
        cy = h * 0.28

    if crop_h > h:
        crop_h = h
        crop_w = crop_h * target_ratio
    if crop_w > w:
        crop_w = w
        crop_h = crop_w / target_ratio

    left = int(round(cx - crop_w / 2))
    top = int(round(cy - crop_h / 2))
    left = max(0, min(left, w - int(crop_w)))
    top = max(0, min(top, h - int(crop_h)))
    cw = min(int(round(crop_w)), w - left)
    ch = min(int(round(crop_h)), h - top)
    return left, top, cw, ch


def file_id(path: Path) -> str:
    m = re.match(r"^([aby]\d+)", path.stem, re.I)
    return m.group(1).lower() if m else path.stem


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    model_path = ensure_yunet_model()
    detector = cv2.FaceDetectorYN.create(str(model_path), "", (320, 320), 0.7, 0.3, 5000)
    files = sorted(
        [p for p in SRC_DIR.iterdir() if p.suffix.lower() in {".jpg", ".jpeg"} and p.is_file()]
    )
    if not files:
        print("写真が見つかりません", file=sys.stderr)
        return 1

    missed: list[str] = []
    for src in files:
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            w, h = im.size
            bgr = pil_to_bgr(im)
            face = detect_face(bgr, detector)
            left, top, cw, ch = crop_around_face(w, h, face)
            cropped = im.crop((left, top, left + cw, top + ch))
            cropped = cropped.convert("RGB")
            cropped = cropped.resize((OUT_W, OUT_H), Image.Resampling.LANCZOS)
            dest = OUT_DIR / f"{file_id(src)}.jpg"
            cropped.save(dest, "JPEG", quality=JPEG_QUALITY, optimize=True)
            status = "face" if face else "fallback"
            if not face:
                missed.append(file_id(src))
            line = f"{file_id(src)} [{status}] {w}x{h} -> crop {cw}x{ch}"
            print(line)

    print(f"\n完了: {len(files)} 枚 -> {OUT_DIR}")
    if missed:
        print("顔検出フォールバック:", ", ".join(missed))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
