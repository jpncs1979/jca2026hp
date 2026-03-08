import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { read, utils } from "xlsx";

/**
 * Excel 会員データの列マッピング
 * 名前, 名前(カナ), 会員種別, 会員有効終了日, ICA資格, 会費支払い方法, システム用メールアドレス, 電話番号, 住所...
 */
function mapMembershipType(excelType: string): "regular" | "student" | "supporting" | "friend" {
  const t = String(excelType ?? "").trim();
  if (t.includes("学生会員") || t.includes("学生")) return "student";
  if (t.includes("賛助")) return "supporting";
  if (t.includes("会友")) return "friend";
  return "regular";
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  const d = new Date(s.replace(/\//g, "-"));
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "未認証" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "ファイルを選択してください" }, { status: 400 });
    }

    const buf = await file.arrayBuffer();
    const wb = read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }) as string[][];

    const header = rows[0] ?? [];
    const nameIdx = header.findIndex((h) => h === "名前");
    const nameKanaIdx = header.findIndex((h) => h === "名前(カナ)");
    const emailIdx = header.findIndex((h) => h === "システム用メールアドレス");
    const memberTypeIdx = header.findIndex((h) => h === "会員種別");
    const expiryIdx = header.findIndex((h) => h === "会員有効終了日");
    const icaIdx = header.findIndex((h) => h === "ICA資格");
    const paymentIdx = header.findIndex((h) => h === "会費支払い方法");
    const zipIdx = header.findIndex((h) => h === "住所_郵便番号");
    const prefIdx = header.findIndex((h) => h === "住所_都道府県");
    const cityIdx = header.findIndex((h) => h === "住所_市区町村");
    const addrIdx = header.findIndex((h) => h === "住所_番地");
    const buildingIdx = header.findIndex((h) => h === "住所_建物名");
    const phoneIdx = header.findIndex((h) => h === "電話番号");
    const notesIdx = header.findIndex((h) => h === "備考");

    if (nameIdx < 0 || emailIdx < 0) {
      return NextResponse.json({
        error: "Excel に「名前」「システム用メールアドレス」列が必要です。",
      }, { status: 400 });
    }

    const created: string[] = [];
    const updated: string[] = [];
    const skipped: string[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const email = String(row[emailIdx] ?? "").trim();
      const name = String(row[nameIdx] ?? "").trim();
      const nameKana = String(row[nameKanaIdx] ?? "").trim() || name;

      if (!email || !name) {
        skipped.push(`行${i + 1}: メール・名前が空`);
        continue;
      }

      const membershipType = mapMembershipType(row[memberTypeIdx] ?? "");
      const expiryStr = parseDate(row[expiryIdx]);
      const isIca = String(row[icaIdx] ?? "").trim() === "会員";
      const paymentRaw = String(row[paymentIdx] ?? "").trim().toUpperCase();
      const paymentMethod =
        paymentRaw.includes("CSS") ? "css" : paymentRaw.includes("振") ? "transfer" : "transfer";

      const zipRaw = String(row[zipIdx] ?? "").replace(/[〒\s]/g, "").trim();
      const pref = String(row[prefIdx] ?? "").trim();
      const city = String(row[cityIdx] ?? "").trim();
      const addr = String(row[addrIdx] ?? "").trim();
      const building = String(row[buildingIdx] ?? "").trim();
      const address = [pref, city, addr, building].filter(Boolean).join(" ");
      const zipCode = zipRaw || null;
      const phone = String(row[phoneIdx] ?? "").trim() || null;
      const notes = notesIdx >= 0 ? String(row[notesIdx] ?? "").trim() || null : null;

      const { data: existing } = await admin
        .from("profiles")
        .select("id, member_number")
        .eq("email", email)
        .single();

      const status = expiryStr && new Date(expiryStr) >= new Date() ? "active" : "expired";
      const profileBase = {
        name,
        name_kana: nameKana,
        email,
        zip_code: zipCode,
        address: address || null,
        phone,
        membership_type: membershipType,
        status,
        updated_at: new Date().toISOString(),
      };

      let profileId: string;

      if (existing) {
        const updateData: Record<string, unknown> = { ...profileBase };
        try {
          const { error: upErr } = await admin.from("profiles").update(updateData).eq("id", existing.id);
          if (upErr) throw upErr;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes("is_ica_member") || msg.includes("notes") || msg.includes("source")) {
            const { error: upErr2 } = await admin.from("profiles").update(profileBase).eq("id", existing.id);
            if (upErr2) {
              skipped.push(`行${i + 1}: ${upErr2.message}`);
              continue;
            }
          } else {
            skipped.push(`行${i + 1}: ${msg}`);
            continue;
          }
        }
        profileId = existing.id;
        updated.push(email);
      } else {
        const insertBase = {
          user_id: null,
          name,
          name_kana: nameKana,
          email,
          zip_code: zipCode,
          address: address || null,
          phone,
          membership_type: membershipType,
          category: membershipType === "student" ? "student" : "general",
          status,
        };
        const insertWithExtras = { ...insertBase, is_ica_member: isIca, notes, source: "import" as const };
        const { data: inserted, error } = await admin
          .from("profiles")
          .insert(insertWithExtras)
          .select("id")
          .single();

        if (error) {
          const msg = error.message ?? "";
          const isColumnError = msg.includes("is_ica_member") || msg.includes("notes") || msg.includes("source") || msg.includes("column");
          const isConstraintError = msg.includes("check") || msg.includes("membership_type") || msg.includes("friend");
          if (isColumnError || isConstraintError) {
            const fallbackInsert = membershipType === "friend"
              ? { ...insertBase, membership_type: "regular" as const }
              : insertBase;
            const retry = await admin.from("profiles").insert(fallbackInsert).select("id").single();
            if (retry.error) {
              skipped.push(`行${i + 1}: ${retry.error.message}`);
              continue;
            }
            profileId = retry.data?.id ?? "";
            created.push(email);
          } else {
            skipped.push(`行${i + 1}: ${msg}`);
            continue;
          }
        } else {
          profileId = inserted?.id ?? "";
          created.push(email);
        }
      }

      if (profileId && expiryStr) {
        const { data: mem } = await admin
          .from("memberships")
          .select("id, expiry_date")
          .eq("profile_id", profileId)
          .order("expiry_date", { ascending: false })
          .limit(1)
          .single();

        const joinDate = new Date(expiryStr);
        joinDate.setFullYear(joinDate.getFullYear() - 1);

        if (mem?.id) {
          await admin
            .from("memberships")
            .update({
              expiry_date: expiryStr,
              payment_method: paymentMethod,
              updated_at: new Date().toISOString(),
            })
            .eq("id", mem.id);
        } else {
          await admin.from("memberships").insert({
            profile_id: profileId,
            join_date: joinDate.toISOString().slice(0, 10),
            expiry_date: expiryStr,
            payment_method: paymentMethod,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      updated: updated.length,
      skipped: skipped.length,
      createdList: created,
      updatedList: updated,
      skippedList: skipped,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "取り込みに失敗しました" },
      { status: 500 }
    );
  }
}
