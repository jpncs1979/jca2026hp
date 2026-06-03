import { permanentRedirect } from "next/navigation";

/** 相談室は公開終了。旧URLはトップへ */
export default function ConsultationPage() {
  permanentRedirect("/");
}
