import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { parseCsvRow, splitCsvLines } from "@/lib/csv-parse";
import { parseMemberNumberCell } from "@/lib/member-number";
import { parseFeePaymentLabel, type FeePaymentDb } from "@/lib/excel-fee-payment";
import { parseImportDateCell } from "@/lib/parse-import-date";

const MAX_ROWS = 2000;

function nonEmpty(v: string | undefined): v is string {
  return typeof v === "string" && v.trim() !== "";
}

function membershipTypeFromLabel(label: string): string | null {
  const t = label.trim();
  if (t.includes("学生会員") || t === "student") return "student";
  if (t.includes("賛助")) return "supporting";
  if (t.includes("会友")) return "friend";
  if (t.includes("正会員") || t === "regular") return "regular";
  return null;
}

function statusFromLabel(label: string): string | null {
  const t = label.trim();
  if (t === "有効" || t === "active") return "active";
  if (t === "期限切れ" || t === "expired") return "expired";
  // 旧「承認待ち」表記は運用上すべて有効会員として取り込む
  if (t === "承認待ち" || t === "pending") return "active";
  return null;
}

function paymentPatchFromLabel(label: string): FeePaymentDb | null {
  const t = label.trim();
  if (!t) return null;
  return parseFeePaymentLabel(t);
}

function icaFromCell(v: string): boolean | null {
  const t = v.trim();
  if (t === "○" || t === "〇" || t === "有" || t.toLowerCase() === "true") return true;
  if (t === "－" || t === "-" || t === "無" || t.toLowerCase() === "false") return false;
  return null;
}

/**
 * 管理画面「CSV出力」と同じ形式の CSV を再アップロード。
 * 空のセルはその列の DB 値を変更しない。会員ID 必須。
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !file.size) {
      return NextResponse.json({ error: "CSV ファイルを選択してください。" }, { status: 400 });
    }

    const text = await file.text();
    const lines = splitCsvLines(text);
    if (lines.length < 2) {
      return NextResponse.json({ error: "ヘッダーとデータ行が必要です。" }, { status: 400 });
    }

    const header = parseCsvRow(lines[0]).map((h) => h.trim());
    const idIdx = header.indexOf("会員ID");
    if (idIdx < 0) {
      return NextResponse.json(
        { error: "CSV に「会員ID」列がありません。管理画面の「CSV出力」で取得したファイルを使ってください。" },
        { status: 400 }
      );
    }

    const col = (name: string) => header.indexOf(name);

    let updated = 0;
    let skipped = 0;
    const messages: string[] = [];

    for (let li = 1; li < lines.length; li++) {
      if (li > MAX_ROWS) {
        messages.push(`処理は最大 ${MAX_ROWS} 行までです。以降は無視しました。`);
        break;
      }
      const cells = parseCsvRow(lines[li]);
      const profileId = (cells[idIdx] ?? "").trim();
      if (!profileId) {
        skipped++;
        continue;
      }

      const get = (name: string): string | undefined => {
        const i = col(name);
        if (i < 0) return undefined;
        return cells[i] ?? "";
      };

      const { data: existing, error: fetchErr } = await admin
        .from("profiles")
        .select(
          "id, email, name, name_kana, zip_code, address, phone, affiliation, membership_type, status, is_ica_member, officer_title, notes, gender, birth_date, is_css_user"
        )
        .eq("id", profileId)
        .maybeSingle();

      if (fetchErr || !existing) {
        skipped++;
        messages.push(`行${li + 1}: 会員ID ${profileId.slice(0, 8)}… が見つかりません`);
        continue;
      }

      const profilePatch: Record<string, unknown> = {};

      if (nonEmpty(get("氏名"))) profilePatch.name = get("氏名")!.trim();
      if (nonEmpty(get("ふりがな"))) profilePatch.name_kana = get("ふりがな")!.trim();

      if (nonEmpty(get("メール"))) {
        const newEmail = get("メール")!.trim();
        if (newEmail !== existing.email) {
          const { data: dup } = await admin
            .from("profiles")
            .select("id")
            .eq("email", newEmail)
            .neq("id", profileId)
            .maybeSingle();
          if (dup) {
            skipped++;
            messages.push(`行${li + 1}: メール ${newEmail} は他会員で使用中`);
            continue;
          }
          profilePatch.email = newEmail;
        }
      }

      if (nonEmpty(get("郵便番号"))) profilePatch.zip_code = get("郵便番号")!.trim();
      if (nonEmpty(get("住所"))) profilePatch.address = get("住所")!.trim();
      if (nonEmpty(get("電話番号"))) profilePatch.phone = get("電話番号")!.trim();
      if (nonEmpty(get("所属"))) profilePatch.affiliation = get("所属")!.trim();
      if (nonEmpty(get("備考"))) profilePatch.notes = get("備考")!.trim();
      if (nonEmpty(get("役員"))) profilePatch.officer_title = get("役員")!.trim() || null;
      if (nonEmpty(get("性別"))) profilePatch.gender = get("性別")!.trim();

      if (nonEmpty(get("生年月日"))) {
        const bd = parseImportDateCell(get("生年月日")!);
        if (bd) profilePatch.birth_date = bd;
      }

      if (nonEmpty(get("種別"))) {
        const mt = membershipTypeFromLabel(get("種別")!);
        if (mt) profilePatch.membership_type = mt;
      }

      if (nonEmpty(get("ステータス"))) {
        const st = statusFromLabel(get("ステータス")!);
        if (st) profilePatch.status = st;
      }

      if (nonEmpty(get("ICA会員"))) {
        const ica = icaFromCell(get("ICA会員")!);
        if (ica !== null) {
          profilePatch.is_ica_member = ica;
          profilePatch.ica_requested = ica;
        }
      }

      if (nonEmpty(get("会員番号"))) {
        const mn = parseMemberNumberCell(get("会員番号")!);
        if (mn !== null) profilePatch.member_number = mn;
      }

      const payFee = get("会費支払い方法");
      const payLegacy = get("支払い方法");
      const payCell = nonEmpty(payFee) ? payFee : nonEmpty(payLegacy) ? payLegacy : undefined;
      const payParsed = nonEmpty(payCell) ? paymentPatchFromLabel(payCell!) : null;
      if (payParsed) {
        profilePatch.is_css_user = payParsed.is_css_user;
        profilePatch.import_payment_kind = payParsed.import_payment_kind;
      }

      const expiryRaw = get("有効期限");
      const expiryStr = nonEmpty(expiryRaw) ? parseImportDateCell(expiryRaw!) : null;

      const profileKeys = Object.keys(profilePatch);
      const hasMembershipChange = Boolean(expiryStr || payParsed);

      if (profileKeys.length === 0 && !hasMembershipChange) {
        skipped++;
        continue;
      }

      if (profileKeys.length > 0) {
        profilePatch.updated_at = new Date().toISOString();
        const optionalKeys = [
          "is_ica_member",
          "ica_requested",
          "member_number",
          "officer_title",
          "notes",
          "gender",
          "birth_date",
          "is_css_user",
          "import_payment_kind",
        ];
        let err = (await admin.from("profiles").update(profilePatch).eq("id", profileId)).error;
        if (
          err?.message?.includes("column") ||
          err?.message?.includes("is_ica_member") ||
          err?.message?.includes("member_number")
        ) {
          const minimal = { ...profilePatch };
          for (const k of optionalKeys) delete minimal[k];
          err = (await admin.from("profiles").update(minimal).eq("id", profileId)).error;
        }
        if (err) {
          skipped++;
          messages.push(`行${li + 1}: ${err.message}`);
          continue;
        }
      }

      if (hasMembershipChange) {
        const { data: memList } = await admin
          .from("memberships")
          .select("id")
          .eq("profile_id", profileId)
          .order("expiry_date", { ascending: false })
          .limit(1);

        const memId = memList?.[0]?.id;
        const memUp: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (expiryStr) memUp.expiry_date = expiryStr;
        if (payParsed) memUp.payment_method = payParsed.payment_method;

        if (memId) {
          const { error: mErr } = await admin.from("memberships").update(memUp).eq("id", memId);
          if (mErr) {
            skipped++;
            messages.push(`行${li + 1} 会員資格: ${mErr.message}`);
            continue;
          }
        } else if (expiryStr) {
          const jd = new Date(expiryStr);
          jd.setFullYear(jd.getFullYear() - 1);
          const { error: insErr } = await admin.from("memberships").insert({
            profile_id: profileId,
            join_date: jd.toISOString().slice(0, 10),
            expiry_date: expiryStr,
            payment_method: payParsed?.payment_method ?? "transfer",
          });
          if (insErr) {
            skipped++;
            messages.push(`行${li + 1} 会員資格新規: ${insErr.message}`);
            continue;
          }
        } else if (payParsed && !memId) {
          skipped++;
          messages.push(
            `行${li + 1}: 会員資格レコードがないため「会費支払い方法」だけの更新はできません（有効期限を入れるか、先に会員資格を登録してください）`
          );
          continue;
        }
      }

      updated++;
    }

    return NextResponse.json({
      success: true,
      updated,
      skipped,
      messages: messages.slice(0, 50),
    });
  } catch (err) {
    console.error("csv-partial-import:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "取り込みに失敗しました。" },
      { status: 500 }
    );
  }
}
