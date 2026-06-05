import { NextResponse } from "next/server";

/** 承認フローは廃止。新規会員は active で登録されます。 */
export async function POST() {
  return NextResponse.json(
    { error: "会員承認機能は廃止しました。会員は入会時に有効化されます。" },
    { status: 410 }
  );
}
