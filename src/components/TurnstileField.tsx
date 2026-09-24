"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      appearance?: "always" | "execute" | "interaction-only";
      theme?: "light" | "dark" | "auto";
      language?: string;
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function turnstileSiteKey(): string {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
}

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const finish = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("turnstile missing"));
    };
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.turnstile) finish();
      else existing.addEventListener("load", finish, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(script);
  });
}

export function TurnstileField({
  onToken,
  language = "ja",
}: {
  onToken: (token: string) => void;
  language?: string;
}) {
  const siteKey = turnstileSiteKey();
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !containerRef.current) return;
        widgetId = api.render(containerRef.current, {
          sitekey: siteKey,
          appearance: "interaction-only",
          theme: "light",
          language,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch((e) => {
        console.error("[turnstile] load failed:", e);
        onTokenRef.current("");
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey, language]);

  if (!siteKey) return null;
  return <div ref={containerRef} />;
}
