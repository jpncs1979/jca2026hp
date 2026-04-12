import { NextResponse } from "next/server";

/**
 * 旧クライアント向け。現在は確認ページから `/api/events/young-2026/checkout` または
 * `/api/events/young-2026/bank-transfer/register` を利用してください。
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "この URL は廃止されました。申込ページで内容を入力し「確認する」のあと、クレジットカードまたは銀行振込をお選びください。",
    },
    { status: 410 }
  );
}
