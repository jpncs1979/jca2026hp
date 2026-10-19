import { Card, CardContent, CardHeader } from "@/components/ui/card";

export type PublicQAItem = {
  id: string;
  category: string;
  public_name: string | null;
  age: string | null;
  public_question: string | null;
  answer: string | null;
  published_at: string | null;
};

function formatPublishedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function PublicQACard({ item }: { item: PublicQAItem }) {
  const meta = [
    item.published_at ? formatPublishedDate(item.published_at) : null,
    item.age,
    item.public_name ? `${item.public_name}さん` : null,
  ]
    .filter(Boolean)
    .join(" ・ ");

  return (
    <Card>
      <CardHeader className="pb-2">
        {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
        <p className="font-medium text-navy">{item.category}</p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {item.public_question ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">質問</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{item.public_question}</p>
          </div>
        ) : null}
        {item.answer ? (
          <div className="rounded-lg bg-gold/10 p-4">
            <p className="text-xs font-medium text-gold">回答</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{item.answer}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PublishedQAList({ items }: { items: PublicQAItem[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          まだ公開されているQ&Aはありません。
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <PublicQACard key={item.id} item={item} />
      ))}
    </div>
  );
}
