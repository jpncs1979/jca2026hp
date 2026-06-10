import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/is-current-user-admin";

export async function GET() {
  const isAdmin = await isCurrentUserAdmin();
  return NextResponse.json({ isAdmin });
}
