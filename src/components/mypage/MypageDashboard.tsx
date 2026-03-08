import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  FileText,
  Video,
  ArrowRight,
  Edit,
  ExternalLink,
} from "lucide-react";
import { YOUNG_2026 } from "@/lib/young-2026";

interface MypageDashboardProps {
  userId: string;
}

export async function MypageDashboard({ userId }: MypageDashboardProps) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*")
    .eq("profile_id", profile?.id ?? "")
    .order("expiry_date", { ascending: false })
    .limit(1);

  const { data: applications } = profile
    ? await supabase
        .from("applications")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const { data: contents } = profile?.status === "active"
    ? await supabase
        .from("member_contents")
        .select("*")
        .order("published_at", { ascending: false })
    : { data: [] };

  const latestMembership = memberships?.[0];
  const expiryDate = latestMembership?.expiry_date
    ? new Date(latestMembership.expiry_date).toLocaleDateString("ja-JP")
    : "—";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* デジタル会員証 */}
      <Card className="overflow-hidden border-2 border-gold/30 bg-gradient-to-br from-navy to-navy/95 text-white">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gold">一般社団法人 日本クラリネット協会</span>
            <CreditCard className="size-8 text-gold/80" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div>
            <p className="text-xs text-white/70">会員番号</p>
            <p className="text-2xl font-bold tracking-wider">
              {profile?.member_number ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/70">氏名</p>
            <p className="text-xl font-medium">{profile?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-white/70">有効期限</p>
            <p className="text-lg font-medium">{expiryDate}</p>
          </div>
          {profile?.status === "pending" && (
            <p className="rounded bg-amber-500/20 px-3 py-1 text-sm text-amber-200">
              承認待ちです。事務局の承認後にご利用いただけます。
            </p>
          )}
        </CardContent>
      </Card>

      {/* プロフィール編集 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="size-5 text-gold" />
            プロフィール
          </CardTitle>
          <CardDescription>
            住所・連絡先・所属の変更申請
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            {profile?.address || profile?.phone
              ? `${profile.address ?? ""} ${profile.phone ?? ""}`.trim() || "未登録"
              : "未登録"}
          </p>
          <Link href="/mypage/profile">
            <Button variant="outline" size="sm">
              編集する
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 申込履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5 text-gold" />
            申込履歴
          </CardTitle>
          <CardDescription>
            {YOUNG_2026.name} の申込状況と決済状態
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications && applications.length > 0 ? (
            <ul className="space-y-3">
              {applications.map((app: { id: string; category: string; payment_status: string; created_at: string }) => (
                <li
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{app.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString("ja-JP")} 申込
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      app.payment_status === "paid"
                        ? "bg-green-500/20 text-green-700"
                        : "bg-amber-500/20 text-amber-700"
                    }`}
                  >
                    {app.payment_status === "paid" ? "入金済" : "未入金"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              申込履歴はありません。
            </p>
          )}
          <Link href="/events/young-2026/apply" className="mt-4 inline-block">
            <Button variant="ghost" size="sm">
              コンクール申込はこちら
              <ExternalLink className="ml-1 size-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* 会員限定コンテンツ */}
      {profile?.status === "active" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="size-5 text-gold" />
              会員限定コンテンツ
            </CardTitle>
            <CardDescription>
              会報PDF・限定動画へのリンク
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contents && contents.length > 0 ? (
              <ul className="space-y-2">
                {contents.map((c: { id: string; title: string; file_path: string }) => (
                  <li key={c.id}>
                    <a
                      href={c.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gold hover:underline"
                    >
                      {c.title}
                      <ExternalLink className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                現在、限定コンテンツはありません。
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
