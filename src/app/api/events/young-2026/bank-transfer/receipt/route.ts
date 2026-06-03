import { NextResponse } from "next/server";

/** 銀行振込・郵便振替は廃止。クレジットカードのみ */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "銀行振込・郵便振替でのお申し込みは受け付けておりません。申込確認画面からクレジットカードでお支払いください。",
    },
    { status: 410 }
  );
}
