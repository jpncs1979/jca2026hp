/**
 * Excel / CSV 取り込み用の日付セル解釈（文字列・シリアル・Date・8桁）
 */
export function parseImportDateCell(val: unknown): string | null {
  if (val == null || val === "") return null;
  if (val instanceof Date) {
    if (Number.isNaN(val.getTime())) return null;
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "number" && Number.isFinite(val)) {
    const n = val;
    if (Number.isInteger(n) && n >= 19000101 && n <= 21001231) {
      const digits = String(n);
      const y = digits.slice(0, 4);
      const m = digits.slice(4, 6);
      const day = digits.slice(6, 8);
      const d = new Date(`${y}-${m}-${day}T12:00:00`);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    // Excel 日付シリアル（年だけの数値 2020 などと区別するため下限を設ける）
    if (n >= 25000 && n < 1_000_000) {
      const base = Date.UTC(1899, 11, 30);
      const d = new Date(base + n * 86400000);
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return null;
  }
  const s = String(val).trim().replace(/\//g, "-");
  if (!s) return null;
  const digitsOnly = s.replace(/\D/g, "");
  if (digitsOnly.length === 8 && /^\d{8}$/.test(digitsOnly)) {
    const y = digitsOnly.slice(0, 4);
    const m = digitsOnly.slice(4, 6);
    const day = digitsOnly.slice(6, 8);
    const d = new Date(`${y}-${m}-${day}T12:00:00`);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const compactNum = s.replace(/,/g, "");
  if (/^\d+(\.\d+)?$/.test(compactNum)) {
    const n = Number(compactNum);
    if (Number.isFinite(n)) {
      const via = parseImportDateCell(Math.floor(n));
      if (via) return via;
    }
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/** Excel ヘッダから生年月日列を特定（表記揺れ） */
export function findBirthDateColumnIndex(header: string[]): number {
  const cells = header.map((h) => String(h ?? "").trim());
  const candidates = [
    "生年月日",
    "誕生日",
    "birth_date",
    "BirthDate",
    "生年月日（西暦）",
  ];
  for (const name of candidates) {
    const i = cells.findIndex((h) => h === name);
    if (i >= 0) return i;
  }
  return -1;
}
