import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, { path: "/", ...options });
            } catch {
              // ignore
            }
          });
        },
      },
    }
  );

  await supabase.auth.signOut();
  const origin = request.headers.get("origin") ?? request.nextUrl.origin ?? "http://localhost:3000";
  return NextResponse.redirect(new URL("/mypage", origin));
}
