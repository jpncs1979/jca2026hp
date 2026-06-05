import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";
import { read, utils } from "xlsx";
import { parseFeePaymentLabel } from "@/lib/excel-fee-payment";
import { profileChannelFromFeeImport } from "@/lib/payment-channel";
import { findBirthDateColumnIndex, parseImportDateCell } from "@/lib/parse-import-date";
import {
  clearAdminMemberNumbers,
  createImportMemberNumberCounters,
  nextMemberNumberForImport,
} from "@/lib/member-number-sequence";

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
  return parseImportDateCell(val);
}

/** 1行目ヘッダから「会費支払い方法」列（会費＋支払を含む別名も可）。誤って別の「支払い方法」だけの列は使わない */
function findFeePaymentColumnIndex(header: string[]): number {
  const cells = header.map((h) => String(h ?? "").trim());
  const exact = cells.findIndex((h) => h === "会費支払い方法");
  if (exact >= 0) return exact;
  return cells.findIndex((h) => /会費/.test(h) && /支払/.test(h));
}

/**
 * email に対応する Auth ユーザーを用意し、その UID を返す。
 * - 未登録なら email_confirm 済みで新規作成（ランダムな初期パスワード。本人が後でリセットして設定する）
 * - 既に Auth に登録済みなら recovery リンク生成で既存 UID を検出（メールは送らない）
 *
 * 注意: profiles は事前に upsert 済みのため、createUser の handle_new_user トリガーは
 * 既存メールをスキップする（022_handle_new_user_skip_existing_email）。よって二重 profiles は発生しない。
 */
async function ensureAuthUserId(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
  name: string
): Promise<{ userId: string | null; error: string | null }> {
  const tempPass = randomBytes(20).toString("base64url") + "Aa1!#x";
  const { data: created, error: ce } = await admin.auth.admin.createUser({
    email,
    password: tempPass,
    email_confirm: true,
    user_metadata: { full_name: name || undefined, name: name || undefined },
  });
  if (!ce && created.user?.id) {
    return { userId: created.user.id, error: null };
  }

  const msg = ce?.message ?? "";
  const maybeDup =
    msg.toLowerCase().includes("already") ||
    msg.toLowerCase().includes("registered") ||
    (ce as { status?: number })?.status === 422;

  if (maybeDup) {
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";
    const redirectTo = `${siteUrl}/auth/callback?next=/auth/set-password`;
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo, redirect_to: redirectTo },
    });
    if (!linkErr) {
      const uid = (linkData as { user?: { id?: string } })?.user?.id ?? null;
      if (uid) return { userId: uid, error: null };
    }
    return { userId: null, error: linkErr?.message ?? "既存アカウントの検出に失敗しました。" };
  }

  return { userId: null, error: msg || "ログイン用アカウントの作成に失敗しました。" };
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
    const wb = read(buf, { type: "array", cellDates: false });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = utils.sheet_to_json<string[]>(ws, { header: 1, defval: "" }) as string[][];

    const header = rows[0] ?? [];
    const nameIdx = header.findIndex((h) => h === "名前");
    const nameKanaIdx = header.findIndex((h) => h === "名前(カナ)");
    const emailIdx = header.findIndex((h) => h === "システム用メールアドレス");
    const memberTypeIdx = header.findIndex((h) => h === "会員種別");
    const expiryIdx = header.findIndex((h) => h === "会員有効終了日");
    const icaIdx = header.findIndex((h) => h === "ICA資格");
    const paymentIdx = findFeePaymentColumnIndex(header);
    const zipIdx = header.findIndex((h) => h === "住所_郵便番号");
    const prefIdx = header.findIndex((h) => h === "住所_都道府県");
    const cityIdx = header.findIndex((h) => h === "住所_市区町村");
    const addrIdx = header.findIndex((h) => h === "住所_番地");
    const buildingIdx = header.findIndex((h) => h === "住所_建物名");
    const phoneIdx = header.findIndex((h) => h === "電話番号");
    const notesIdx = header.findIndex((h) => h === "備考");
    const officerTitleIdx = header.findIndex((h) => h === "役員");
    const birthDateIdx = findBirthDateColumnIndex(header);

    if (nameIdx < 0 || emailIdx < 0) {
      return NextResponse.json({
        error: "Excel に「名前」「システム用メールアドレス」列が必要です。",
      }, { status: 400 });
    }
    if (birthDateIdx < 0) {
      return NextResponse.json({
        error:
          "Excel に生年月日列が必要です（列名の例:「生年月日」「誕生日」「birth_date」）。",
      }, { status: 400 });
    }

    const created: string[] = [];
    const updated: string[] = [];
    const skipped: string[] = [];
    const linked: string[] = [];
    const linkFailures: string[] = [];

    await clearAdminMemberNumbers(admin);

    const emailsInFile: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const email = String(row[emailIdx] ?? "").trim();
      if (email) emailsInFile.push(email);
    }
    if (emailsInFile.length > 0) {
      await admin.from("profiles").update({ member_number: null }).in("email", emailsInFile);
    }

    const memberNumberCounters = createImportMemberNumberCounters();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] ?? [];
      const email = String(row[emailIdx] ?? "").trim();
      const name = String(row[nameIdx] ?? "").trim();
      const nameKana = String(row[nameKanaIdx] ?? "").trim() || name;

      if (!email || !name) {
        skipped.push(`行${i + 1}: メール・名前が空`);
        continue;
      }

      const birthDateStr = parseImportDateCell(row[birthDateIdx]);
      if (!birthDateStr) {
        skipped.push(`行${i + 1}: 生年月日が空または不正`);
        continue;
      }

      const membershipType = mapMembershipType(row[memberTypeIdx] ?? "");
      const expiryStr = parseDate(row[expiryIdx]);
      // ICA資格列が「会員」なら ICA会員
      const isIca = String(row[icaIdx] ?? "").trim() === "会員";
      const officerTitle = officerTitleIdx >= 0 ? (String(row[officerTitleIdx] ?? "").trim() || null) : null;
      const feePayment =
        paymentIdx >= 0 ? parseFeePaymentLabel(row[paymentIdx]) : null;

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
        .select("id, member_number, user_id")
        .eq("email", email)
        .single();

      const status = expiryStr && new Date(expiryStr) >= new Date() ? "active" : "expired";
      let memberNumber: number;
      try {
        memberNumber = nextMemberNumberForImport(membershipType, memberNumberCounters);
      } catch (e) {
        skipped.push(`行${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      const profileBase = {
        name,
        name_kana: nameKana,
        email,
        birth_date: birthDateStr,
        zip_code: zipCode,
        address: address || null,
        address_prefecture: pref || null,
        address_city: city || null,
        address_street: addr || null,
        address_building: building || null,
        phone,
        membership_type: membershipType,
        status,
        updated_at: new Date().toISOString(),
      };

      let profileId: string;

      if (existing) {
        const updateData: Record<string, unknown> = {
          ...profileBase,
          member_number: memberNumber,
          birth_date: birthDateStr,
          is_ica_member: isIca,
          ica_requested: isIca,
          officer_title: officerTitle,
          notes,
          ...(feePayment != null
            ? {
                ...profileChannelFromFeeImport(feePayment),
                import_payment_kind: feePayment.import_payment_kind,
              }
            : {}),
        };
        try {
          const { error: upErr } = await admin.from("profiles").update(updateData).eq("id", existing.id);
          if (upErr) throw upErr;
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (
            msg.includes("is_ica_member") ||
            msg.includes("notes") ||
            msg.includes("source") ||
            msg.includes("officer_title") ||
            msg.includes("birth_date") ||
            msg.includes("import_payment_kind") ||
            msg.includes("column")
          ) {
            const fallbackUpdate = {
              name: profileBase.name,
              name_kana: profileBase.name_kana,
              email: profileBase.email,
              birth_date: birthDateStr,
              zip_code: profileBase.zip_code,
              address: profileBase.address,
              phone: profileBase.phone,
              membership_type: profileBase.membership_type,
              status: profileBase.status,
              updated_at: profileBase.updated_at,
            };
            const { error: upErr2 } = await admin.from("profiles").update(fallbackUpdate).eq("id", existing.id);
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
          birth_date: birthDateStr,
          zip_code: zipCode,
          address: address || null,
          address_prefecture: pref || null,
          address_city: city || null,
          address_street: addr || null,
          address_building: building || null,
          phone,
          membership_type: membershipType,
          category: membershipType === "student" ? "student" : "general",
          status,
        };
        const insertWithExtras = {
          ...insertBase,
          member_number: memberNumber,
          birth_date: birthDateStr,
          is_ica_member: isIca,
          ica_requested: isIca,
          officer_title: officerTitle,
          notes,
          source: "import" as const,
          ...(feePayment != null
            ? {
                ...profileChannelFromFeeImport(feePayment),
                import_payment_kind: feePayment.import_payment_kind,
              }
            : {}),
        };
        const { data: inserted, error } = await admin
          .from("profiles")
          .insert(insertWithExtras)
          .select("id")
          .single();

        if (error) {
          const msg = error.message ?? "";
          const isColumnError =
            msg.includes("is_ica_member") ||
            msg.includes("notes") ||
            msg.includes("source") ||
            msg.includes("officer_title") ||
            msg.includes("birth_date") ||
            msg.includes("import_payment_kind") ||
            msg.includes("column");
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

      // ログイン用 Auth アカウントを用意して user_id を紐付け（未紐付のときのみ）
      if (profileId && !existing?.user_id) {
        const { userId: authUserId, error: authErr } = await ensureAuthUserId(admin, email, name);
        if (authUserId) {
          const { error: linkErr } = await admin
            .from("profiles")
            .update({ user_id: authUserId, updated_at: new Date().toISOString() })
            .eq("id", profileId);
          if (linkErr) {
            linkFailures.push(`${email}: ${linkErr.message}`);
          } else {
            linked.push(email);
          }
        } else if (authErr) {
          linkFailures.push(`${email}: ${authErr}`);
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
          const memPatch: Record<string, unknown> = {
            expiry_date: expiryStr,
            updated_at: new Date().toISOString(),
          };
          if (feePayment != null) {
            memPatch.payment_method = feePayment.payment_method;
          }
          await admin.from("memberships").update(memPatch).eq("id", mem.id);
        } else {
          await admin.from("memberships").insert({
            profile_id: profileId,
            join_date: joinDate.toISOString().slice(0, 10),
            expiry_date: expiryStr,
            payment_method: feePayment?.payment_method ?? "transfer",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      created: created.length,
      updated: updated.length,
      skipped: skipped.length,
      linked: linked.length,
      linkFailed: linkFailures.length,
      createdList: created,
      updatedList: updated,
      skippedList: skipped,
      linkedList: linked,
      linkFailedList: linkFailures,
    });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "取り込みに失敗しました" },
      { status: 500 }
    );
  }
}
