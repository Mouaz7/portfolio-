import { expect, test } from "@playwright/test";

for (const failure of ["error", "transfer", "context"] as const) {
  test(`worker ${failure} failure is bounded and cleans up`, async ({ page }) => {
    await page.addInitScript((mode) => {
      const state = { created: 0, terminated: 0, posts: 0, emit: (_type: string) => {} };
      (window as unknown as { workerProbe: typeof state }).workerProbe = state;
      class TestWorker {
        onmessage: ((event: unknown) => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() { state.created += 1; }
        postMessage(message: { type: string; generation: number }) {
          state.posts += 1;
          if (message.type !== "init") return;
          if (mode === "transfer") throw new Error("simulated transfer failure");
          state.emit = (type) => {
            if (type === "error") this.onerror?.();
            else this.onmessage?.({ data: { type, generation: message.generation } });
          };
          setTimeout(() => state.emit("ready"), 0);
        }
        terminate() { state.terminated += 1; }
      }
      window.Worker = TestWorker as unknown as typeof Worker;
    }, failure);
    await page.goto("/");
    const canvas = page.locator("canvas[data-background-fps]");
    const emit = (type: string) => page.evaluate((type) => {
      (window as unknown as { workerProbe: { emit: (type: string) => void } }).workerProbe.emit(type);
    }, type);
    if (failure !== "transfer") {
      await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
      await emit(failure === "error" ? "error" : "lost");
    }
    await expect(canvas).toHaveAttribute("data-background-renderer", "css");
    await expect(canvas).toHaveAttribute("data-background-profile", "css-soft");
    await expect(canvas).toHaveAttribute("data-background-device-tier", /desktop/);
    if (failure === "context") {
      await emit("restored");
      await expect(canvas).toHaveAttribute("data-background-generation", "1");
      await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
      await emit("lost");
      await expect(canvas).toHaveAttribute("data-background-renderer", "css");
      await emit("restored");
      await expect(canvas).toHaveAttribute("data-background-generation", "2");
      await expect(canvas).toHaveAttribute("data-background-renderer", "css");
    }
    const probe = () => page.evaluate(() => {
      const { created, terminated, posts } = (window as unknown as {
        workerProbe: { created: number; terminated: number; posts: number };
      }).workerProbe;
      return { created, terminated, posts };
    });
    const before = await probe();
    expect(before.terminated).toBe(before.created);
    await page.setViewportSize({ width: 1200, height: 700 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toHaveAttribute("data-background-mode", "static");
    expect(await probe()).toEqual(before);
    await expect(canvas).toHaveCount(1);
  });
}

test("live motion preferences pause and resume the background", async ({ page }) => {
  await page.goto("/");
  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-mode", "animated");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-background-mode", "static");
  await expect(canvas).toHaveAttribute("data-background-fps", "0");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(canvas).toHaveAttribute("data-background-mode", "animated");
  await expect(canvas).toHaveCount(1);
});

test("profile changes replace a transferred canvas in both directions", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-device-tier", /desktop/);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveAttribute("data-background-device-tier", "mobile");
  await expect(canvas).toHaveAttribute("data-background-generation", "1");
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect(canvas).toHaveAttribute("data-background-device-tier", /desktop/);
  await expect(canvas).toHaveAttribute("data-background-generation", "2");
  await expect(canvas).toHaveCount(1);
});

test("main-thread WebGL context loss falls back and restoration recreates resources", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", { value: undefined });
  });
  await page.goto("/");
  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
  const supported = await canvas.evaluate((element: HTMLCanvasElement) => {
    const extension = element.getContext("webgl")?.getExtension("WEBGL_lose_context");
    if (!extension) return false;
    (window as unknown as { restoreBackground: () => void }).restoreBackground = () => extension.restoreContext();
    extension.loseContext();
    return true;
  });
  test.skip(!supported, "Browser does not expose the context-loss test extension");
  await expect(canvas).toHaveAttribute("data-background-renderer", "css");
  await page.evaluate(() => (window as unknown as { restoreBackground: () => void }).restoreBackground());
  await expect(canvas).toHaveAttribute("data-background-generation", "1");
  await expect(canvas).toHaveAttribute("data-background-renderer", "webgl");
  // A second loss/restoration must stop retrying rather than loop forever.
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const extension = element.getContext("webgl")!.getExtension("WEBGL_lose_context")!;
    (window as unknown as { restoreBackground: () => void }).restoreBackground = () => extension.restoreContext();
    extension.loseContext();
  });
  await expect(canvas).toHaveAttribute("data-background-renderer", "css");
  await page.evaluate(() => (window as unknown as { restoreBackground: () => void }).restoreBackground());
  await expect(canvas).toHaveAttribute("data-background-generation", "2");
  await expect(canvas).toHaveAttribute("data-background-renderer", "css");
});

test("CSS fallback pauses while hidden and follows live motion settings", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "transferControlToOffscreen", { value: undefined });
    HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-mode", "animated");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(canvas).toHaveCSS("animation-play-state", "paused");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(canvas).toHaveCSS("animation-play-state", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveCSS("animation-name", "none");
});

test("worker startup timeout cleans up and ignores late ready messages", async ({ page }) => {
  await page.addInitScript(() => {
    const state = { terminated: 0, posts: 0, lateReady: null as null | (() => void) };
    (window as unknown as { workerProbe: typeof state }).workerProbe = state;
    class SilentWorker {
      onmessage: ((event: unknown) => void) | null = null;
      onerror = null;
      postMessage(message: { type: string; generation: number }) {
        state.posts += 1;
        if (message.type === "init") setTimeout(() => {
          const listener = this.onmessage;
          state.lateReady = () => listener?.({ data: { type: "ready", generation: message.generation } });
        }, 0);
      }
      terminate() { state.terminated += 1; }
    }
    window.Worker = SilentWorker as unknown as typeof Worker;
  });
  await page.goto("/");
  const canvas = page.locator("canvas[data-background-fps]");
  await expect(canvas).toHaveAttribute("data-background-thread", "worker");
  await expect(canvas).toHaveAttribute("data-background-profile", "css-soft", { timeout: 7000 });
  const before = await page.evaluate(() => {
    const state = (window as unknown as { workerProbe: { posts: number; terminated: number; lateReady: () => void } }).workerProbe;
    state.lateReady();
    return { posts: state.posts, terminated: state.terminated };
  });
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveAttribute("data-background-mode", "static");
  await expect(canvas).toHaveAttribute("data-background-renderer", "css");
  expect(await page.evaluate(() => {
    const state = (window as unknown as { workerProbe: { posts: number; terminated: number } }).workerProbe;
    return { posts: state.posts, terminated: state.terminated };
  })).toEqual(before);
  expect(before.terminated).toBe(1);
});
