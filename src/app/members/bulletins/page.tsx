import { createAdminClient } from "@/lib/supabase/server";
import { requireValidMember } from "@/lib/member-access";
import { BookOpen, Download } from "lucide-react";

export const dynamic = "force-dynamic";

type BulletinRow = {
  id: string;
  title: string;
  description: string | null;
  issue_label: string | null;
  issue_date: string | null;
  file_path: string | null;
  external_url: string | null;
};

function fiscalYearLabel(issueDate: string | null): string {
  if (!issueDate) return "発行年月未設定";
  const y = new Date(issueDate).getFullYear();
  return Number.isFinite(y) ? `${y}年` : "発行年月未設定";
}

export default async function MemberBulletinsPage() {
  const auth = await requireValidMember();
  if (!auth.ok) return null; // レイアウトが会員資格の案内を表示する

  const admin = createAdminClient();
  const { data } = await admin
    .from("member_contents")
    .select("id, title, description, issue_label, issue_date, file_path, external_url")
    .eq("category", "bulletin")
    .eq("is_published", true)
    .order("issue_date", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const bulletins = (data ?? []) as BulletinRow[];

  const groups: { label: string; items: BulletinRow[] }[] = [];
  for (const b of bulletins) {
    const label = fiscalYearLabel(b.issue_date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(b);
    else groups.push({ label, items: [b] });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-navy">
          <BookOpen className="size-6 text-gold" />
          会報バックナンバー
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          会員の皆さまは、過去の会報 PDF をダウンロードいただけます。
        </p>
      </div>

      {bulletins.length === 0 ? (
        <p className="rounded-lg border border-border bg-white p-8 text-center text-muted-foreground">
          現在、公開されている会報はありません。準備が整いましたら掲載します。
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.label} className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">{group.label}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-white">
                {group.items.map((b) => (
                  <li key={b.id}>
                    <a
                      href={`/api/member-content/${b.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          {b.issue_label && (
                            <span className="font-medium text-navy">{b.issue_label}</span>
                          )}
                          <span className="truncate">{b.title}</span>
                        </span>
                        {(b.issue_date || b.description) && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {b.issue_date
                              ? new Date(b.issue_date).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "long",
                                })
                              : null}
                            {b.issue_date && b.description ? " ・ " : null}
                            {b.description}
                          </span>
                        )}
                      </span>
                      <Download className="size-4 shrink-0 text-gold" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
