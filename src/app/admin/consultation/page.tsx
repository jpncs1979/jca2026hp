import { Suspense } from "react";
import { AdminConsultationClient } from "./AdminConsultationClient";

export default function AdminConsultationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">読み込み中…</p>
        </div>
      }
    >
      <AdminConsultationClient />
    </Suspense>
  );
}
