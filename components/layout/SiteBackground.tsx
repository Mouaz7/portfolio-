"use client";

import { useEffect, useRef } from "react";

/**
 * Single shared GPU backdrop for EVERY page — one consistent theme across the
 * whole site. A hand-written GLSL fragment shader runs fractal-Brownian-motion
 * noise with domain warping that flows slowly through the brand colors
 * (bg → accent → accent-2), with a soft pointer-reactive glow. Colors are read
 * live from the DB-driven CSS variables, so it adapts automatically to BOTH
 * dark and light mode (re-reads on theme flip). Falls back to a static frame
 * under prefers-reduced-motion, and to a plain themed gradient if WebGL is
 * unavailable. Pure WebGL — no libraries.
 */
const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform float u_mouseAmt;
uniform vec3  u_bg;
uniform vec3  u_accent;
uniform vec3  u_accent2;
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
  // 4 octaves is plenty for this soft, low-frequency nebula (was 6) — cheaper.
  for (int i = 0; i < 4; i++){
    v += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p = uv;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.05;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, -t)));
  vec2 r = vec2(fbm(p + 1.6 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p + 1.6 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(p + 2.4 * r);

  // Pointer glow — gentle, softer in light mode so it never darkens.
  float md = distance(uv, u_mouse);
  float glow = u_mouseAmt * smoothstep(0.45, 0.0, md) * mix(0.16, 0.26, u_light);
  f += glow * mix(0.35, 0.5, u_light);

  // Tone the brand colors per mode:
  //  - DARK: pull toward the bg so it's a DEEP, muted nebula (never neon).
  //  - LIGHT: keep them as clearly visible pastels (airy, but real color — not white).
  vec3 acc  = mix(u_accent,  u_bg, 0.42);
  acc  = mix(acc,  vec3(1.0), u_light * 0.22);
  vec3 acc2 = mix(u_accent2, u_bg, 0.40);
  acc2 = mix(acc2, vec3(1.0), u_light * 0.30);

  // Higher thresholds + capped coverage = mostly background, accents as glows.
  // Light mode leans on the teal accent; indigo stays a subtle hint (no purple).
  float s1 = mix(0.46, 0.30, u_light);
  float s2 = mix(0.72, 0.62, u_light);
  float cov = mix(0.7, 0.95, u_light);
  float acc2Amt = mix(0.65, 0.45, u_light);

  vec3 col = u_bg;
  col = mix(col, acc, smoothstep(s1, s1 + 0.42, f) * cov);
  col = mix(col, acc2, smoothstep(s2, s2 + 0.42, f + 0.25 * r.x) * acc2Amt);
  col += acc * glow * mix(0.18, 0.3, u_light);

  // Vignette toward bg — keeps it grounded & dark at the edges.
  float vig = smoothstep(1.2, 0.25, distance(uv, vec2(0.5)));
  float vigMix = mix(0.3, 0.5, u_light);
  col = mix(u_bg, col, vigMix + (1.0 - vigMix) * vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

function readRgb(name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(",").map((n) => parseFloat(n));
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return [parts[0] / 255, parts[1] / 255, parts[2] / 255];
  }
  return fallback.map((n) => n / 255) as [number, number, number];
}

export default function SiteBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) {
      // Graceful CSS fallback when WebGL is unavailable.
      canvas.style.background =
        "radial-gradient(60vw 60vw at 20% 10%, rgba(var(--accent-rgb),0.18), transparent 70%)," +
        "radial-gradient(64vw 64vw at 85% 95%, rgba(var(--accent-2-rgb),0.16), transparent 70%), var(--bg)";
      return;
    }

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

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
      light: gl.getUniformLocation(prog, "u_light"),
    };

    let colors = {
      bg: readRgb("--bg-rgb", [10, 11, 16]),
      accent: readRgb("--accent-rgb", [25, 227, 194]),
      accent2: readRgb("--accent-2-rgb", [109, 139, 255]),
      light: document.documentElement.classList.contains("light") ? 1 : 0,
    };
    const refreshColors = () => {
      colors = {
        bg: readRgb("--bg-rgb", [10, 11, 16]),
        accent: readRgb("--accent-rgb", [25, 227, 194]),
        accent2: readRgb("--accent-2-rgb", [109, 139, 255]),
        light: document.documentElement.classList.contains("light") ? 1 : 0,
      };
    };
    const themeObs = new MutationObserver(refreshColors);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // Decorative low-frequency noise → render BELOW CSS resolution and let the
    // browser scale the canvas up. ~0.44x the pixels of a 1:1 buffer (and far
    // less than DPR=2 fullscreen) with no visible quality loss, a big GPU win.
    const RENDER_SCALE = 0.66;
    const resize = () => {
      canvas.width = Math.max(2, Math.floor(window.innerWidth * RENDER_SCALE));
      canvas.height = Math.max(2, Math.floor(window.innerHeight * RENDER_SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(resize);
    };
    window.addEventListener("resize", onResize);

    let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, amt = 0, tamt = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      tmx = e.clientX / window.innerWidth;
      tmy = 1 - e.clientY / window.innerHeight;
      tamt = 1;
    };
    const onLeave = () => { tamt = 0; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerout", onLeave);

    const start = performance.now();
    const FRAME_MS = 1000 / 30; // 30fps is ample for this very slow drift; halves GPU work vs 60fps
    let raf = 0;
    let last = -Infinity;
    let running = true;

    const render = (now: number) => {
      mx += (tmx - mx) * 0.06;
      my += (tmy - my) * 0.06;
      amt += (tamt - amt) * 0.05;
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.time, reduced ? 0 : (now - start) / 1000);
      gl.uniform2f(U.mouse, mx, my);
      gl.uniform1f(U.mouseAmt, amt);
      gl.uniform3fv(U.bg, colors.bg);
      gl.uniform3fv(U.accent, colors.accent);
      gl.uniform3fv(U.accent2, colors.accent2);
      gl.uniform1f(U.light, colors.light);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      render(now);
    };

    if (reduced) {
      render(performance.now()); // single static frame, then idle
    } else {
      raf = requestAnimationFrame(loop);
    }

    // Stop drawing entirely when the tab is hidden — no wasted GPU/battery.
    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced && !running) {
        running = true;
        last = -Infinity;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      themeObs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
