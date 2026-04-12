import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, ArrowRight } from "lucide-react";

export default async function AdminDashboardPage() {
  let totalMembers = 0;
  let young2026Count = 0;

  try {
    const admin = createAdminClient();
    const membersRes = await admin.from("profiles").select("id", { count: "exact", head: true });
    totalMembers = membersRes.count ?? 0;
    const compId = (await admin.from("competitions").select("id").eq("slug", "young-2026").single()).data?.id;
    if (compId) {
      const { count } = await admin.from("applications").select("id", { count: "exact", head: true }).eq("competition_id", compId);
      young2026Count = count ?? 0;
    }
  } catch {
    // テーブル未作成時
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-navy">事務局ダッシュボード</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/members">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                全会員数
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-navy">{totalMembers}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/competitions">
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ヤング2026 申込者
              </CardTitle>
              <Trophy className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-navy">{young2026Count}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/admin/members">
          <Button className="bg-gold text-gold-foreground hover:bg-gold-muted">
            会員管理へ
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
        <Link href="/admin/competitions">
          <Button variant="outline">
            コンクール申込一覧へ
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
