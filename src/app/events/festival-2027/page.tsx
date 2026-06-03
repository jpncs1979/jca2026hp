import { permanentRedirect } from "next/navigation";
import { FESTIVAL_39_HIROSHIMA_OFFICIAL_URL } from "@/lib/festival-2027-hiroshima";

export const metadata = {
  title: "第３９回日本クラリネットフェスティバル in 広島 | 日本クラリネット協会",
  description:
    "2027年2月28日（日）、広島で開催予定の第39回日本クラリネットフェスティバル。公式案内サイトへ移動します。",
};

/** 協会サイト内の旧URLから公式案内サイトへ転送 */
export default function Festival2027Page() {
  permanentRedirect(FESTIVAL_39_HIROSHIMA_OFFICIAL_URL);
}
