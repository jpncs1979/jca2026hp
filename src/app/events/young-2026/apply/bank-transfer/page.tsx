import { redirect } from "next/navigation";

/** 銀行振込は廃止。申込ページへ誘導 */
export default function Young2026BankTransferPage() {
  redirect("/events/young-2026/apply");
}
