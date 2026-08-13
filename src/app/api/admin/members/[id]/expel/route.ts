import { NextResponse } from "next/server";

/** 強制退会は廃止。3年滞納は会費状況CSVで確認し、手動退会（DELETE）を利用してください。 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "強制退会機能は廃止しました。会費状況CSVで確認のうえ、会員詳細の「退会（資格喪失）」をご利用ください。",
    },
    { status: 410 }
  );
}
