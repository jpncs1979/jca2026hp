import { Young2026ResultsContent } from "@/components/events/Young2026ResultsContent";
import { YOUNG_2026 } from "@/lib/young-2026";

export const metadata = {
  title: `本選結果発表 | ${YOUNG_2026.name} | 日本クラリネット協会`,
  description: `${YOUNG_2026.name}の本選結果を掲載しています。`,
};

export default function Young2026ResultsPage() {
  return <Young2026ResultsContent />;
}
