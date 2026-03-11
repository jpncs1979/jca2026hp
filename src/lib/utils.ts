import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 0.0.0.0 を localhost に置き換えたベースURL（開発時のリダイレクト先のため） */
export function normalizeBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "0.0.0.0") {
      u.hostname = "localhost";
      return u.origin;
    }
    return u.origin;
  } catch {
    return url;
  }
}
