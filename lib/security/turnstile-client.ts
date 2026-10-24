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
const TURNSTILE_LOAD_TIMEOUT_MS = 8000;
const TURNSTILE_CHALLENGE_TIMEOUT_MS = 10000;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  const loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-portfolio-turnstile]");
    let createdScript: HTMLScriptElement | null = null;
    let settled = false;
    let timeout = 0;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      const script = existing ?? createdScript;
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
      if (error) {
        createdScript?.remove();
        reject(error);
      } else {
        resolve();
      }
    };
    const onLoad = () => finish();
    const onError = () => finish(new Error("Turnstile failed to load"));
    timeout = window.setTimeout(
      () => finish(new Error("Turnstile loading timed out")),
      TURNSTILE_LOAD_TIMEOUT_MS,
    );

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    createdScript = script;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.portfolioTurnstile = "true";
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });
  const retryablePromise = loadingPromise.catch((error) => {
    // Allow a later click to retry after a transient extension/network error.
    scriptPromise = null;
    throw error;
  });
  scriptPromise = retryablePromise;
  return retryablePromise;
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
    let settled = false;
    let timeout = 0;
    const cleanup = () => {
      window.clearTimeout(timeout);
      if (widgetId) window.turnstile?.remove(widgetId);
      container.remove();
    };
    const finish = (token?: string, error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error);
      else resolve(token ?? "");
    };
    timeout = window.setTimeout(
      () => finish(undefined, new Error("Turnstile verification timed out")),
      TURNSTILE_CHALLENGE_TIMEOUT_MS,
    );
    widgetId = window.turnstile!.render(container, {
      action,
      callback: (token) => finish(token),
      "error-callback": () => finish(undefined, new Error("Turnstile verification failed")),
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
  action: "contact",
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
