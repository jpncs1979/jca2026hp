import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

const MEMBERSHIP_LABELS: Record<string, string> = {
  regular: "正会員",
  student: "学生会員",
  supporting: "賛助会員",
  friend: "会友",
};

function escapeCsv(val: unknown): string {
  const s = String(val ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: adminProfile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode"); // "new" | "re"
    const from = searchParams.get("from"); // YYYY-MM-DD
    const to = searchParams.get("to"); // YYYY-MM-DD

    if (mode === "new") {
      const { data: rows, error } = await admin
        .from("profiles")
        .select(`
          id, member_number, name, name_kana, email, zip_code, address, phone,
          affiliation, gender, birth_date, membership_type, ica_requested,
          memberships(join_date, expiry_date)
        `)
        .eq("ica_requested", true)
        .eq("ica_exported", false);

      if (error) {
        if (error.message?.includes("ica_requested") || error.message?.includes("ica_exported")) {
          return NextResponse.json(
            { error: "ica_requested / ica_exported カラムがありません。マイグレーション 008 を実行してください。" },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const list = (rows ?? []) as Array<{
        id: string;
        member_number: number | null;
        name: string;
        name_kana: string;
        email: string;
        zip_code?: string | null;
        address?: string | null;
        phone?: string | null;
        affiliation?: string | null;
        gender?: string | null;
        birth_date?: string | null;
        membership_type: string;
        ica_requested: boolean;
        memberships?: Array<{ join_date?: string; expiry_date?: string }> | null;
      }>;

      const idsToMark = list.map((r) => r.id);

      const headers = [
        "会員番号", "氏名", "ふりがな", "メール", "郵便番号", "住所", "電話", "所属", "性別", "生年月日",
        "会員種別", "ICA希望", "入会日", "有効期限",
      ];
      const csvRows = list.map((p) => {
        const mems = (p.memberships ?? []).sort(
          (a, b) => (a.join_date ?? "").localeCompare(b.join_date ?? "")
        );
        const firstJoin = mems[0]?.join_date ?? "";
        const latest = [...(p.memberships ?? [])].sort(
          (a, b) => (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
        )[0];
        return [
          p.member_number ?? "",
          p.name,
          p.name_kana ?? "",
          p.email ?? "",
          p.zip_code ?? "",
          p.address ?? "",
          p.phone ?? "",
          p.affiliation ?? "",
          p.gender ?? "",
          p.birth_date ?? "",
          MEMBERSHIP_LABELS[p.membership_type] ?? p.membership_type,
          p.ica_requested ? "希望" : "",
          firstJoin,
          latest?.expiry_date ?? "",
        ].map(escapeCsv);
      });

      const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });

      if (idsToMark.length > 0) {
        await admin
          .from("profiles")
          .update({
            ica_exported: true,
            ica_exported_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in("id", idsToMark);
      }

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ICA希望者_新規_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (mode === "re" && from && to) {
      const fromDate = from.slice(0, 10);
      const toDate = to.slice(0, 10);

      const { data: allProfiles, error: fetchError } = await admin
        .from("profiles")
        .select(`
          id, member_number, name, name_kana, email, zip_code, address, phone,
          affiliation, gender, birth_date, membership_type, ica_requested, ica_exported_at,
          memberships(join_date, expiry_date)
        `)
        .not("ica_requested", "eq", false);

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      const list = (allProfiles ?? []) as Array<{
        id: string;
        member_number: number | null;
        name: string;
        name_kana: string;
        email: string;
        zip_code?: string | null;
        address?: string | null;
        phone?: string | null;
        affiliation?: string | null;
        gender?: string | null;
        birth_date?: string | null;
        membership_type: string;
        ica_requested: boolean;
        ica_exported_at?: string | null;
        memberships?: Array<{ join_date?: string; expiry_date?: string }> | null;
      }>;

      const filtered = list.filter((p) => {
        const exportedAt = p.ica_exported_at ? p.ica_exported_at.slice(0, 10) : null;
        const mems = p.memberships ?? [];
        const firstJoin = mems.length
          ? mems.map((m) => m.join_date ?? "").sort()[0]
          : null;
        const inRangeByExport = exportedAt && exportedAt >= fromDate && exportedAt <= toDate;
        const inRangeByJoin = firstJoin && firstJoin >= fromDate && firstJoin <= toDate;
        return inRangeByExport || inRangeByJoin;
      });

      const headers = [
        "会員番号", "氏名", "ふりがな", "メール", "郵便番号", "住所", "電話", "所属", "性別", "生年月日",
        "会員種別", "ICA希望", "ICA出力日", "入会日", "有効期限",
      ];
      const csvRows = filtered.map((p) => {
        const mems = (p.memberships ?? []).sort(
          (a, b) => (a.join_date ?? "").localeCompare(b.join_date ?? "")
        );
        const firstJoin = mems[0]?.join_date ?? "";
        const latest = [...(p.memberships ?? [])].sort(
          (a, b) => (b.expiry_date ?? "").localeCompare(a.expiry_date ?? "")
        )[0];
        const exportedAt = p.ica_exported_at ? p.ica_exported_at.slice(0, 10) : "";
        return [
          p.member_number ?? "",
          p.name,
          p.name_kana ?? "",
          p.email ?? "",
          p.zip_code ?? "",
          p.address ?? "",
          p.phone ?? "",
          p.affiliation ?? "",
          p.gender ?? "",
          p.birth_date ?? "",
          MEMBERSHIP_LABELS[p.membership_type] ?? p.membership_type,
          p.ica_requested ? "希望" : "",
          exportedAt,
          firstJoin,
          latest?.expiry_date ?? "",
        ].map(escapeCsv);
      });

      const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });

      return new NextResponse(blob, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ICA再出力_${fromDate}_${toDate}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { error: "mode=new または mode=re&from=YYYY-MM-DD&to=YYYY-MM-DD を指定してください。" },
      { status: 400 }
    );
  } catch (err) {
    console.error("ICA export error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ICA出力に失敗しました。" },
      { status: 500 }
    );
  }
}
