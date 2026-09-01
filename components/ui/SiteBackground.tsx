"use client";

import { useEffect, useRef } from "react";

/**
 * Single shared GPU backdrop for every page. A hand-written GLSL fragment
 * shader draws many slow, soft ocean-wave ribbons through the theme colors.
 * Colors are read live from CSS variables, so it adapts automatically to BOTH
 * dark and light mode. Reduced motion renders one still frame.
 */
const DESKTOP_FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_mouseAmt;
uniform vec3  u_bg;
uniform vec3  u_accent;
uniform vec3  u_accent2;
uniform vec3  u_cyan;
uniform vec3  u_teal;
uniform vec3  u_mint;
uniform vec3  u_foam;
uniform float u_light;     // 1.0 in light mode, 0.0 in dark

float hash(vec2 p){
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i + vec2(0.0, 0.0));
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++){
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}
mat2 rot(float a){
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// Polynomial smooth maximum. A regular max() leaves a visible derivative
// seam where two translucent wave fields cross, which some mobile GPUs make
// especially obvious. This keeps the union continuous through the overlap.
float softUnion(float a, float b){
  const float softness = 0.16;
  float h = clamp(0.5 + 0.5 * (a - b) / softness, 0.0, 1.0);
  return mix(b, a, h) + softness * h * (1.0 - h);
}

float waveBand(vec2 p, float angle, float offset, float width, float blur, float phase, float amp, float freq){
  vec2 q = rot(angle) * p;
  q.x += 0.085 * sin(q.y * 2.25 + phase * 0.42);
  q.y += 0.045 * sin(q.x * 1.15 - phase * 0.30);
  float y = offset
    + amp * sin(q.x * freq + phase)
    + amp * 0.52 * sin(q.x * (freq * 1.72) - phase * 0.76)
    + amp * 0.24 * sin(q.x * (freq * 2.55) + phase * 1.18);
  return 1.0 - smoothstep(width, width + blur, abs(q.y - y));
}

float silkWaves(vec2 p, float angle, float density, float phase, float bend, float threshold){
  vec2 q = rot(angle) * p;
  q.x += 0.07 * sin(q.y * 2.4 - phase * 0.26);
  float stream = q.y
    + bend * sin(q.x * 1.22 + phase)
    + bend * 0.58 * sin(q.x * 2.10 - phase * 0.64)
    + bend * 0.22 * sin(q.x * 3.55 + phase * 1.2);
  float v = 0.5 + 0.5 * cos(stream * density + phase * 0.42);
  return smoothstep(threshold, 1.0, v);
}

float pocket(vec2 p, vec2 center, vec2 scale, float angle, float edge){
  vec2 d = rot(angle) * (p - center);
  d /= scale;
  return 1.0 - smoothstep(1.0, 1.0 + edge, length(d));
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv - 0.5;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.095;
  vec2 flow = p + vec2(
    0.050 * sin(p.y * 4.2 + p.x * 1.4 + t * 1.7),
    0.046 * cos(p.x * 3.6 - p.y * 1.8 - t * 1.35)
  );
  flow += (fbm(p * 2.2 + vec2(t * 0.32, -t * 0.24)) - 0.5) * 0.105;

  float c1 = waveBand(flow, -0.72, -0.58, 0.105, 0.245, t * 1.05 + 0.2, 0.145, 1.10);
  float c2 = waveBand(flow, -0.82, -0.34, 0.095, 0.230, t * 0.86 + 2.1, 0.130, 1.34);
  float c3 = waveBand(flow, -0.68, -0.08, 0.105, 0.260, t * 1.18 + 4.0, 0.155, 1.02);
  float c4 = waveBand(flow, -0.88,  0.20, 0.090, 0.220, t * 0.78 + 1.3, 0.122, 1.48);
  float c5 = waveBand(flow, -0.76,  0.46, 0.110, 0.250, t * 0.92 + 3.3, 0.138, 1.18);

  float t1 = waveBand(flow, -0.58, -0.50, 0.100, 0.235, t * 0.82 + 5.4, 0.112, 1.42);
  float t2 = waveBand(flow, -0.66, -0.22, 0.095, 0.225, t * 1.10 + 0.7, 0.128, 1.22);
  float t3 = waveBand(flow, -0.54,  0.06, 0.090, 0.220, t * 0.95 + 2.8, 0.118, 1.58);
  float t4 = waveBand(flow, -0.62,  0.33, 0.100, 0.235, t * 0.74 + 4.6, 0.136, 1.26);

  float m1 = waveBand(flow, -1.02, -0.43, 0.075, 0.205, t * 0.90 + 1.7, 0.105, 1.68);
  float m2 = waveBand(flow, -0.98, -0.12, 0.080, 0.215, t * 1.16 + 3.9, 0.120, 1.36);
  float m3 = waveBand(flow, -1.08,  0.22, 0.078, 0.210, t * 0.84 + 0.4, 0.110, 1.54);
  float m4 = waveBand(flow, -0.94,  0.52, 0.080, 0.220, t * 1.02 + 2.5, 0.116, 1.30);

  float f1 = waveBand(flow, -0.79, -0.47, 0.052, 0.185, t * 1.25 + 0.9, 0.130, 1.24);
  float f2 = waveBand(flow, -0.86, -0.24, 0.050, 0.175, t * 1.04 + 2.7, 0.118, 1.44);
  float f3 = waveBand(flow, -0.76,  0.00, 0.056, 0.190, t * 1.18 + 4.4, 0.142, 1.16);
  float f4 = waveBand(flow, -0.92,  0.25, 0.052, 0.180, t * 0.92 + 1.6, 0.120, 1.52);
  float f5 = waveBand(flow, -0.70,  0.50, 0.055, 0.185, t * 1.10 + 3.6, 0.134, 1.20);
  float f6 = waveBand(flow, -1.14, -0.02, 0.046, 0.170, t * 0.88 + 5.2, 0.106, 1.64);

  float cyanField = clamp(softUnion(softUnion(softUnion(c1, c2), softUnion(c3, c4)), c5) * 0.56, 0.0, 1.0);
  float tealField = clamp(softUnion(softUnion(t1, t2), softUnion(t3, t4)) * 0.56, 0.0, 1.0);
  float mintField = clamp(softUnion(softUnion(m1, m2), softUnion(m3, m4)) * 0.52, 0.0, 1.0);
  float foamField = clamp(softUnion(softUnion(softUnion(f1, f2), softUnion(f3, f4)), softUnion(f5, f6)) * 0.46, 0.0, 1.0);

  float silkFoam = softUnion(
    silkWaves(flow + vec2(-0.03, 0.02), -0.80, 9.6, t * 1.12 + 0.8, 0.165, 0.68),
    silkWaves(flow + vec2(0.22, -0.04), -1.04, 8.2, t * 0.92 + 3.1, 0.135, 0.70)
  );
  float silkCyan = softUnion(
    silkWaves(flow + vec2(0.02, 0.00), -0.66, 7.8, t * 0.84 + 2.0, 0.185, 0.66),
    silkWaves(flow + vec2(-0.24, 0.06), -0.92, 6.7, t * 1.02 + 4.8, 0.150, 0.68)
  );
  float silkTeal = softUnion(
    silkWaves(flow + vec2(-0.18, -0.03), -0.52, 7.1, t * 0.76 + 1.4, 0.145, 0.68),
    silkWaves(flow + vec2(0.18, 0.05), -0.74, 8.8, t * 0.88 + 5.5, 0.155, 0.70)
  );
  float silkMint = silkWaves(flow + vec2(0.06, -0.10), -1.16, 7.4, t * 1.06 + 2.6, 0.125, 0.70);

  cyanField = clamp(softUnion(cyanField, silkCyan * 0.98), 0.0, 1.0);
  tealField = clamp(softUnion(tealField, silkTeal * 0.90), 0.0, 1.0);
  mintField = clamp(softUnion(mintField, silkMint * 0.88), 0.0, 1.0);
  foamField = clamp(softUnion(foamField, silkFoam), 0.0, 1.0);

  float haze = softUnion(
    pocket(flow, vec2(-0.52, -0.06), vec2(0.55, 0.95), -0.68, 0.95),
    pocket(flow, vec2(0.52, 0.10), vec2(0.48, 0.90), -0.70, 0.95)
  );
  float foamHaze = softUnion(
    pocket(flow, vec2(0.18, 0.42), vec2(0.36, 0.92), -0.78, 0.82),
    pocket(flow, vec2(-0.12, -0.46), vec2(0.30, 0.86), -0.92, 0.82)
  );

  // Pointer glow — gentle, softer in light mode so it never darkens.
  float md = distance(uv, u_mouse);
  float glow = u_mouseAmt * smoothstep(0.46, 0.0, md) * mix(0.10, 0.16, u_light);
  float grain = (fbm(p * 4.2 + vec2(t * 1.6, -t * 1.1)) - 0.5) * mix(0.022, 0.034, u_light);

  vec3 col = u_bg;
  col = mix(col, u_cyan, haze * mix(0.06, 0.32, u_light));
  col = mix(col, u_teal, tealField * mix(0.12, 0.72, u_light));
  col = mix(col, u_cyan, cyanField * mix(0.18, 0.82, u_light));
  col = mix(col, u_mint, mintField * mix(0.14, 0.62, u_light));
  col = mix(col, u_foam, foamHaze * mix(0.10, 0.30, u_light));
  col = mix(col, u_foam, foamField * mix(0.30, 0.86, u_light));
  col += (u_cyan * cyanField + u_mint * mintField + u_foam * foamField) * mix(0.075, 0.015, u_light);
  col += (u_accent + u_accent2) * glow * 0.08;
  col += grain;

  float night = 1.0 - u_light;
  float edgeDepth = smoothstep(0.12, 0.98, distance(uv, vec2(0.54, 0.48)));
  col = mix(col, u_bg * 0.62, edgeDepth * night * 0.48);
  col += (u_cyan + u_mint) * foamField * night * 0.035;

  // Sub-pixel, frame-stable dithering prevents 8-bit mobile framebuffers and
  // screenshot/video compression from turning smooth gradients into bands.
  float dither = (hash(gl_FragCoord.xy + vec2(19.19, 73.73)) - 0.5) * (0.75 / 255.0);
  col += dither;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Mobile GPUs get a deliberately simpler shader. It contains no thresholded
 * bands, pockets, field unions, or cellular noise: every visible color field
 * is an analytic sine/cosine gradient over the whole viewport. This prevents
 * the large, moving polygon/rectangle facets seen in Samsung Internet while
 * preserving the same slow ocean motion and theme palette.
 */
const MOBILE_FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec3  u_bg;
uniform vec3  u_accent2;
uniform vec3  u_cyan;
uniform vec3  u_teal;
uniform vec3  u_mint;
uniform vec3  u_foam;
uniform float u_light;

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv - 0.5;

  // Keep the field stable between narrow portrait and wide landscape phones.
  // Only coordinate scaling uses min/mix; visible fields remain threshold-free.
  float shortAspect = min(u_res.x / u_res.y, 1.0);
  p.x *= mix(0.82, 1.0, shortAspect);

  float t = u_time * 0.22;
  float bendX = sin(p.y * 2.40 + t * 0.55)
    + 0.38 * sin(p.y * 4.70 - t * 0.33 + 1.20);
  float bendY = cos(p.x * 2.60 - t * 0.43)
    + 0.34 * cos(p.x * 5.10 + t * 0.27 + 2.10);
  vec2 q = p + vec2(bendX, bendY) * 0.080;

  float waveA = 0.5 + 0.5 * sin(q.x * 5.10 + q.y * 3.80 + t * 0.52 + 0.30);
  float waveB = 0.5 + 0.5 * cos(q.x * 3.40 - q.y * 6.00 - t * 0.41 + 1.70);
  float waveC = 0.5 + 0.5 * sin((q.x + q.y) * 7.00 + t * 0.52 + 3.40);
  float waveD = 0.5 + 0.5 * cos(q.y * 5.50 - q.x * 4.30 - t * 0.36 + 5.10);

  // Squaring a sine field concentrates its highlight into a soft ribbon while
  // keeping the value and derivative continuous everywhere.
  float ribbonA = waveA * waveA * waveA;
  float ribbonB = waveB * waveB * waveB;
  float ribbonC = waveC * waveC;
  ribbonC *= ribbonC;
  float ribbonD = waveD * waveD * waveD;

  vec3 col = mix(u_bg, u_teal, mix(0.38, 0.10, u_light));
  col = mix(col, u_cyan, 0.08 + mix(0.26, 0.24, u_light) * ribbonA);
  col = mix(col, u_mint, 0.02 + mix(0.14, 0.16, u_light) * ribbonB);
  col = mix(col, u_accent2, 0.02 + mix(0.10, 0.12, u_light) * ribbonD);
  col = mix(col, u_foam, 0.035 + mix(0.42, 0.52, u_light) * ribbonC);

  // A continuous edge-depth curve retains dark-mode depth without contours.
  float radial = dot(p, p);
  col *= 1.0 - (1.0 - u_light) * radial * 0.12;

  // Match the desktop shader's measured color balance without borrowing its
  // thresholded geometry. The mobile field supplies only continuous luminance;
  // these two linear color curves reproduce desktop dark/light mean color and
  // contrast while keeping every mobile wave edge smooth.
  float sourceLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));

  float desktopDarkLuma = 0.46599516
    + (sourceLuma - 0.44953252) * 1.41685879;
  vec3 desktopDark = vec3(0.32208068, 0.50194421, 0.53366089)
    + vec3(0.88289137, 1.02491190, 1.09806512)
      * (desktopDarkLuma - 0.46599516);

  float desktopLightLuma = 0.91273683
    + (sourceLuma - 0.89104284) * 1.75637562;
  vec3 desktopLight = vec3(0.73512117, 0.96223999, 0.94537426)
    + vec3(2.51916747, 0.58039367, 0.68320557)
      * (desktopLightLuma - 0.91273683);

  col = mix(desktopDark, desktopLight, u_light);

  // Tiny frame-stable dithering prevents 8-bit gradient banding. Its amplitude
  // is below one color step, so it cannot create visible shapes of its own.
  float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (dither - 0.5) * (0.65 / 255.0);

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const MOBILE_RENDER_SCALE = 0.82;
const LOW_POWER_DESKTOP_RENDER_SCALE = 0.62;
const DESKTOP_RENDER_SCALE = 0.52;

const CSS_FALLBACK =
  "radial-gradient(ellipse at 14% 18%, rgba(var(--wave-foam-rgb),0.66) 0%, transparent 46%)," +
  "radial-gradient(ellipse at 82% 28%, rgba(var(--wave-cyan-rgb),0.58) 0%, transparent 48%)," +
  "radial-gradient(ellipse at 42% 78%, rgba(var(--wave-mint-rgb),0.46) 0%, transparent 50%)," +
  "radial-gradient(ellipse at 88% 90%, rgba(var(--wave-teal-rgb),0.52) 0%, transparent 46%)," +
  "linear-gradient(132deg, rgba(var(--wave-teal-rgb),0.28), rgba(var(--wave-foam-rgb),0.18) 48%, var(--bg))";

function readRgb(
  styles: CSSStyleDeclaration,
  name: string,
  fallback: [number, number, number],
): [number, number, number] {
  const raw = styles.getPropertyValue(name).trim();
  const parts = raw.split(",").map((n) => parseFloat(n));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  }
  return fallback.map((n) => n / 255) as [number, number, number];
}

type ThemeColors = {
  bg: [number, number, number];
  accent: [number, number, number];
  accent2: [number, number, number];
  cyan: [number, number, number];
  teal: [number, number, number];
  mint: [number, number, number];
  foam: [number, number, number];
  light: number;
};

function readThemeColors(): ThemeColors {
  const styles = getComputedStyle(document.documentElement);
  return {
    bg: readRgb(styles, "--bg-rgb", [222, 250, 245]),
    accent: readRgb(styles, "--accent-rgb", [8, 185, 190]),
    accent2: readRgb(styles, "--accent-2-rgb", [146, 244, 212]),
    cyan: readRgb(styles, "--wave-cyan-rgb", [29, 207, 212]),
    teal: readRgb(styles, "--wave-teal-rgb", [0, 166, 171]),
    mint: readRgb(styles, "--wave-mint-rgb", [128, 246, 203]),
    foam: readRgb(styles, "--wave-foam-rgb", [250, 255, 253]),
    light: document.documentElement.classList.contains("light") ? 1 : 0,
  };
}

function initializeWorkerBackground(
  canvas: HTMLCanvasElement,
  lowPowerViewport: boolean,
  reduced: boolean,
  applyCssFallback: () => void,
) {
  if (
    process.env.NODE_ENV !== "production"
    || typeof Worker === "undefined"
    || typeof canvas.transferControlToOffscreen !== "function"
  ) {
    return null;
  }

  let worker: Worker;
  try {
    worker = new Worker(new URL("./site-background.worker.ts", import.meta.url));
  } catch {
    return null;
  }

  const renderScale = lowPowerViewport ? MOBILE_RENDER_SCALE : DESKTOP_RENDER_SCALE;
  const targetFps = lowPowerViewport ? 30 : 60;
  const size = () => ({
    width: Math.max(2, Math.floor(window.innerWidth * renderScale)),
    height: Math.max(2, Math.floor(window.innerHeight * renderScale)),
  });

  let offscreen: OffscreenCanvas;
  try {
    offscreen = canvas.transferControlToOffscreen();
  } catch {
    worker.terminate();
    return null;
  }

  canvas.dataset.backgroundRenderer = "css";
  canvas.dataset.backgroundMode = "static";
  canvas.dataset.backgroundFps = String(targetFps);
  canvas.dataset.backgroundThread = "worker";
  canvas.dataset.backgroundProfile = "layered-desktop";

  let active = true;
  const failWorker = () => {
    if (!active) return;
    active = false;
    worker.terminate();
    delete canvas.dataset.backgroundThread;
    applyCssFallback();
  };

  const initialSize = size();
  worker.postMessage({
    type: "init",
    canvas: offscreen,
    ...initialSize,
    vertexShader: VERT,
    fragmentShader: DESKTOP_FRAG,
    colors: readThemeColors(),
    reduced,
    powerPreference: lowPowerViewport ? "low-power" : "high-performance",
    targetFps,
  }, [offscreen]);

  worker.onmessage = (event: MessageEvent<{ type: "ready" | "error" }>) => {
    if (event.data.type === "ready") {
      canvas.dataset.backgroundRenderer = "webgl";
      canvas.dataset.backgroundMode = reduced ? "static" : "animated";
      canvas.dataset.backgroundFps = reduced ? "0" : String(targetFps);
    } else {
      failWorker();
    }
  };
  worker.onerror = failWorker;

  const themeObserver = new MutationObserver(() => {
    worker.postMessage({ type: "colors", colors: readThemeColors() });
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  let resizeRaf = 0;
  const onResize = () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => worker.postMessage({ type: "resize", ...size() }));
  };
  window.addEventListener("resize", onResize);

  let pointerRaf = 0;
  let pointer = { x: 0.5, y: 0.5, amount: 0 };
  const sendPointer = () => {
    pointerRaf = 0;
    worker.postMessage({ type: "pointer", ...pointer });
  };
  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    pointer = {
      x: event.clientX / window.innerWidth,
      y: 1 - event.clientY / window.innerHeight,
      amount: 1,
    };
    if (!pointerRaf) pointerRaf = requestAnimationFrame(sendPointer);
  };
  const onLeave = () => {
    pointer = { ...pointer, amount: 0 };
    if (!pointerRaf) pointerRaf = requestAnimationFrame(sendPointer);
  };
  const interactivePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (interactivePointer) {
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);
  }

  const onVisibility = () => {
    worker.postMessage({ type: "visibility", visible: !document.hidden });
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    active = false;
    cancelAnimationFrame(resizeRaf);
    cancelAnimationFrame(pointerRaf);
    window.removeEventListener("resize", onResize);
    if (interactivePointer) {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    }
    document.removeEventListener("visibilitychange", onVisibility);
    themeObserver.disconnect();
    worker.terminate();
  };
}

export default function SiteBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let teardown: (() => void) | undefined;
    let idleId = 0;
    let fallbackTimer = 0;

    const initialize = () => {
      if (disposed) return;

      const mobileViewport = window.matchMedia(
        "(max-width: 675px), (hover: none), (pointer: coarse)",
      ).matches;
      const constrainedDevice = navigator.hardwareConcurrency > 0
        && navigator.hardwareConcurrency <= 4;
      const lowPowerViewport = mobileViewport || constrainedDevice;
      const performanceAudit = new URLSearchParams(window.location.search).get("audit") === "performance";
      const reduced = performanceAudit
        || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const applyCssFallback = () => {
        canvas.style.background = CSS_FALLBACK;
        canvas.dataset.backgroundRenderer = "css";
        canvas.dataset.backgroundMode = reduced ? "static" : "animated";
        canvas.dataset.backgroundFps = "0";
        canvas.dataset.backgroundProfile = "css-soft";
      };

      // Samsung Internet can expose OffscreenCanvas transfer support while
      // failing to create WebGL inside the worker. Once transferred, the DOM
      // canvas cannot be recovered for a main-thread retry, leaving phones on
      // the visibly different static CSS fallback. Mobile already runs at a
      // capped 30 fps and reduced backing resolution, so keep its compatible
      // WebGL renderer on the main thread and reserve workers for desktop.
      const workerTeardown = lowPowerViewport
        ? null
        : initializeWorkerBackground(
            canvas,
            lowPowerViewport,
            reduced,
            applyCssFallback,
          );
      if (workerTeardown) {
        teardown = workerTeardown;
        return;
      }

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: lowPowerViewport ? "low-power" : "high-performance",
    });
    if (!gl) {
      // Graceful CSS fallback when WebGL is unavailable.
      applyCssFallback();
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vertexShader = compile(gl.VERTEX_SHADER, VERT);
    const fragmentShader = compile(
      gl.FRAGMENT_SHADER,
      mobileViewport ? MOBILE_FRAG : DESKTOP_FRAG,
    );
    if (
      !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)
      || !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)
    ) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      applyCssFallback();
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(prog);
      applyCssFallback();
      return;
    }
    gl.useProgram(prog);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    const TARGET_FPS = lowPowerViewport ? 30 : 60;
    canvas.dataset.backgroundRenderer = "webgl";
    canvas.dataset.backgroundThread = "main";
    canvas.dataset.backgroundMode = reduced ? "static" : "animated";
    canvas.dataset.backgroundFps = reduced ? "0" : String(TARGET_FPS);
    canvas.dataset.backgroundProfile = mobileViewport
      ? "continuous-mobile"
      : "layered-desktop";

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, "u_res"),
      time: gl.getUniformLocation(prog, "u_time"),
      mouse: gl.getUniformLocation(prog, "u_mouse"),
      mouseAmt: gl.getUniformLocation(prog, "u_mouseAmt"),
      bg: gl.getUniformLocation(prog, "u_bg"),
      accent: gl.getUniformLocation(prog, "u_accent"),
      accent2: gl.getUniformLocation(prog, "u_accent2"),
      cyan: gl.getUniformLocation(prog, "u_cyan"),
      teal: gl.getUniformLocation(prog, "u_teal"),
      mint: gl.getUniformLocation(prog, "u_mint"),
      foam: gl.getUniformLocation(prog, "u_foam"),
      light: gl.getUniformLocation(prog, "u_light"),
    };

    const syncColors = () => {
      const colors = readThemeColors();
      gl.uniform3fv(U.bg, colors.bg);
      gl.uniform3fv(U.accent, colors.accent);
      gl.uniform3fv(U.accent2, colors.accent2);
      gl.uniform3fv(U.cyan, colors.cyan);
      gl.uniform3fv(U.teal, colors.teal);
      gl.uniform3fv(U.mint, colors.mint);
      gl.uniform3fv(U.foam, colors.foam);
      gl.uniform1f(U.light, colors.light);
    };

    // The simpler mobile shader can render above the old 0.62 scale while
    // remaining cheaper, reducing upscaling artifacts on high-DPR phones.
    const RENDER_SCALE = mobileViewport
      ? MOBILE_RENDER_SCALE
      : lowPowerViewport
        ? LOW_POWER_DESKTOP_RENDER_SCALE
        : DESKTOP_RENDER_SCALE;
    let canvasSizeInitialized = false;
    const resize = () => {
      const width = Math.max(2, Math.floor(window.innerWidth * RENDER_SCALE));
      const height = Math.max(2, Math.floor(window.innerHeight * RENDER_SCALE));
      if (canvasSizeInitialized && canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      canvasSizeInitialized = true;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, canvas.width, canvas.height);
    };
    resize();
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        resize();
        requestRender();
      });
    };
    window.addEventListener("resize", onResize);

    let mx = 0.5, my = 0.5, amt = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mx = e.clientX / window.innerWidth;
      my = 1 - e.clientY / window.innerHeight;
      amt = 1;
      requestRender();
    };
    const onLeave = () => {
      amt = 0;
      requestRender();
    };
    const interactivePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (interactivePointer) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onLeave);
    }

    const FRAME_MS = 1000 / TARGET_FPS;
    let raf = 0;
    let requestedRaf = 0;
    let running = true;
    let animationElapsed = 0;
    let previousRender = performance.now();

    const render = (now: number) => {
      if (!reduced) {
        animationElapsed += Math.min(Math.max(now - previousRender, 0), FRAME_MS * 2);
      }
      previousRender = now;
      gl.uniform1f(U.time, animationElapsed / 1000);
      gl.uniform2f(U.mouse, mx, my);
      gl.uniform1f(U.mouseAmt, amt);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const animate = (now: number) => {
      if (!running || reduced) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(animate);
      if (now - previousRender < FRAME_MS - 1) return;
      render(now);
    };

    function requestRender() {
      if (!running || (!reduced && raf) || requestedRaf) return;
      requestedRaf = requestAnimationFrame((now) => {
        requestedRaf = 0;
        render(now);
      });
    }

    syncColors();
    render(performance.now());
    if (!reduced) raf = requestAnimationFrame(animate);

    // Theme changes update immediately while the display-synchronized loop
    // keeps the same waves moving in both light and dark mode.
    const themeObs = new MutationObserver(() => {
      syncColors();
      render(performance.now());
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
        cancelAnimationFrame(requestedRaf);
        raf = 0;
        requestedRaf = 0;
      } else if (!running) {
        running = true;
        previousRender = performance.now();
        if (reduced) requestRender();
        else raf = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

      teardown = () => {
        running = false;
        cancelAnimationFrame(raf);
        cancelAnimationFrame(requestedRaf);
        cancelAnimationFrame(resizeRaf);
        window.removeEventListener("resize", onResize);
        if (interactivePointer) {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerout", onLeave);
        }
        document.removeEventListener("visibilitychange", onVisibility);
        themeObs.disconnect();
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
      };
    };

    const queueInitialization = () => {
      if (disposed) return;
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(initialize, { timeout: 750 });
      } else {
        fallbackTimer = window.setTimeout(initialize, 1);
      }
    };

    if (document.readyState === "complete") queueInitialization();
    else window.addEventListener("load", queueInitialization, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener("load", queueInitialization);
      if (idleId) window.cancelIdleCallback(idleId);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      teardown?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-background-fps="60"
      data-background-scale="adaptive"
      data-background-profile="css-soft"
      style={{ background: CSS_FALLBACK }}
      className="site-background pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
