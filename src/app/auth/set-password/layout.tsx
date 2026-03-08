import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "パスワードを再設定 | 日本クラリネット協会",
};

export default function SetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
