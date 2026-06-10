import { NextResponse } from "next/server";
import {
  getCompetitionApplicationGate,
  parseCompetitionGateSlug,
} from "@/lib/competition-application-gate";

export async function GET(request: Request) {
  const slug = parseCompetitionGateSlug(
    new URL(request.url).searchParams.get("slug")
  );
  if (!slug) {
    return NextResponse.json({ error: "不正なコンクールです。" }, { status: 400 });
  }

  const gate = await getCompetitionApplicationGate(slug);
  return NextResponse.json(gate);
}
