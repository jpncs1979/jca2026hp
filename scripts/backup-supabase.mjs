/**
 * Supabase バックアップスクリプト
 *
 * profiles（会員情報）と関連テーブル（memberships / payments）を
 * JSON で backups/ フォルダに丸ごと書き出します。
 *
 * 使い方（プロジェクト直下で）:
 *   node --env-file=.env.local scripts/backup-supabase.mjs
 *
 * 出力例: backups/2026-06-07T17-30-00/profiles.json など
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("環境変数 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要です。");
  process.exit(1);
}
const sb = createClient(url, key);

// バックアップ対象テーブル
const TABLES = ["profiles", "memberships", "payments"];
const PAGE = 1000;

/** テーブルを全件取得（1000件ずつページング） */
async function fetchAll(table) {
  const all = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    all.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return all;
}

/** 配列を CSV 文字列に（profiles の人が見やすい用） */
function toCsv(rows) {
  if (rows.length === 0) return "";
  const headers = Array.from(
    rows.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );
  const esc = (v) => {
    if (v == null) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ].join("\n");
}

const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
const outDir = path.join(process.cwd(), "backups", stamp);
await mkdir(outDir, { recursive: true });

for (const table of TABLES) {
  try {
    const rows = await fetchAll(table);
    await writeFile(
      path.join(outDir, `${table}.json`),
      JSON.stringify(rows, null, 2),
      "utf8"
    );
    if (table === "profiles") {
      await writeFile(path.join(outDir, "profiles.csv"), "\uFEFF" + toCsv(rows), "utf8");
    }
    console.log(`✓ ${table}: ${rows.length} 件`);
  } catch (e) {
    console.error(`✗ ${table}: ${e.message}`);
  }
}

console.log(`\nバックアップ完了: ${outDir}`);
