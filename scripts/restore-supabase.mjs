/**
 * Supabase 復元スクリプト（バックアップの再投入）
 *
 * scripts/backup-supabase.mjs で作成した JSON を Supabase に書き戻します。
 * id をキーに upsert（あれば更新・なければ追加）します。既存行の削除はしません。
 *
 * 使い方（プロジェクト直下で・バックアップフォルダを指定）:
 *   node --env-file=.env.local scripts/restore-supabase.mjs backups/2026-06-07-08-28-57
 */
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("環境変数 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が必要です。");
  process.exit(1);
}

const dir = process.argv[2];
if (!dir) {
  console.error("復元元フォルダを指定してください。例: node --env-file=.env.local scripts/restore-supabase.mjs backups/2026-06-07-08-28-57");
  process.exit(1);
}

const sb = createClient(url, key);

// 親 → 子 の順（外部キーの都合）
const TABLES = ["profiles", "memberships", "payments"];
const CHUNK = 500;

async function loadJson(table) {
  try {
    const raw = await readFile(path.join(process.cwd(), dir, `${table}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

for (const table of TABLES) {
  const rows = await loadJson(table);
  if (!rows) {
    console.log(`- ${table}: バックアップファイルなし。スキップ`);
    continue;
  }
  if (rows.length === 0) {
    console.log(`- ${table}: 0 件。スキップ`);
    continue;
  }
  let ok = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await sb.from(table).upsert(chunk, { onConflict: "id" });
    if (error) {
      failed += chunk.length;
      console.error(`✗ ${table} [${i}-${i + chunk.length - 1}]: ${error.message}`);
    } else {
      ok += chunk.length;
    }
  }
  console.log(`✓ ${table}: ${ok} 件復元 / 失敗 ${failed} 件`);
}

console.log("\n復元完了。");
