import { NextResponse } from "next/server";

/**
 * 3年未納の自動強制退会は廃止（手動運用）。
 * 設計: docs/会員データ簡素化_設計書.md
 */
export async function GET() {
  return NextResponse.json(
    {
      disabled: true,
      message:
        "自動退会 Cron は廃止しました。会費状況CSVで3年連続未納を確認し、会員詳細から手動退会してください。",
    },
    { status: 410 }
  );
}
