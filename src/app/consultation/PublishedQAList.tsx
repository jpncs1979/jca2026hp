import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Item = {
  id: string;
  category: string;
  body: string | null;
  answer: string | null;
  published_at: string;
  nickname: string | null;
  age: string | null;
};

export function PublishedQAList({ items }: { items: Item[] }) {
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
        <Card key={item.id}>
          <CardHeader className="pb-2">
            <p className="text-sm text-muted-foreground">
              {new Date(item.published_at).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {item.age && ` ・ ${item.age}`}
              {item.nickname && ` ・ ${item.nickname}さん`}
            </p>
            <p className="font-medium text-navy">{item.category}</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {item.body && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">質問</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p>
              </div>
            )}
            {item.answer && (
              <div className="rounded-lg bg-gold/10 p-4">
                <p className="text-xs font-medium text-gold">回答</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{item.answer}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
