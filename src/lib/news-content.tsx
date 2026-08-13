import type { ReactNode } from "react";
import Link from "next/link";

const LINK_PATTERN = /\[([^\]]+)\]\(([^\s)]+)\)/g;

function isSafeHref(href: string): boolean {
  return /^https?:\/\//.test(href) || href.startsWith("/");
}

/** お知らせ本文中の `[表示文言](URL)` 記法をリンクに変換する */
export function renderNewsContent(content: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  LINK_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = LINK_PATTERN.exec(content)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) {
      nodes.push(content.slice(lastIndex, match.index));
    }
    if (isSafeHref(href)) {
      nodes.push(
        href.startsWith("/") ? (
          <Link
            key={`news-link-${key++}`}
            href={href}
            className="text-gold underline underline-offset-2 hover:text-gold-muted"
          >
            {label}
          </Link>
        ) : (
          <a
            key={`news-link-${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold underline underline-offset-2 hover:text-gold-muted"
          >
            {label}
          </a>
        )
      );
    } else {
      nodes.push(full);
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < content.length) {
    nodes.push(content.slice(lastIndex));
  }
  return nodes;
}
