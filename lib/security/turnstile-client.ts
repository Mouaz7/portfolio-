"use client";

type TurnstileApi = {
  execute: (widgetId: string) => void;
  remove: (widgetId: string) => void;
  render: (
    container: HTMLElement,
    options: {
      action: string;
      callback: (token: string) => void;
      "error-callback": () => void;
      execution: "execute";
      sitekey: string;
      size: "invisible";
      theme: "auto";
    },
  ) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-portfolio-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.portfolioTurnstile = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")), { once: true });
    document.head.appendChild(script);
  });
  return scriptPromise;
}

async function executeTurnstile(action: string): Promise<string> {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!sitekey) throw new Error("Turnstile is not configured");
  await loadTurnstile();
  if (!window.turnstile) throw new Error("Turnstile is unavailable");

  const container = document.createElement("div");
  container.setAttribute("aria-hidden", "true");
  Object.assign(container.style, {
    height: "1px",
    left: "-9999px",
    opacity: "0",
    overflow: "hidden",
    pointerEvents: "none",
    position: "fixed",
    top: "0",
    width: "1px",
  });
  document.body.appendChild(container);

  return new Promise((resolve, reject) => {
    let widgetId = "";
    const cleanup = () => {
      if (widgetId) window.turnstile?.remove(widgetId);
      container.remove();
    };
    widgetId = window.turnstile!.render(container, {
      action,
      callback: (token) => {
        cleanup();
        resolve(token);
      },
      "error-callback": () => {
        cleanup();
        reject(new Error("Turnstile verification failed"));
      },
      execution: "execute",
      sitekey,
      size: "invisible",
      theme: "auto",
    });
    window.turnstile!.execute(widgetId);
  });
}

export async function fetchWithTurnstile(
  input: RequestInfo | URL,
  init: RequestInit,
  action: "cv_chat" | "code_review" | "code_review_chat" | "contact",
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 428) return response;

  const body = await response.clone().json().catch(() => null) as { code?: string } | null;
  if (body?.code !== "captcha_required") return response;

  const token = await executeTurnstile(action);
  const headers = new Headers(init.headers);
  headers.set("X-Turnstile-Token", token);
  return fetch(input, { ...init, headers });
}
