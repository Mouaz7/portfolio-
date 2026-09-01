/// <reference lib="webworker" />

type ThemeColors = {
  bg: number[];
  accent: number[];
  accent2: number[];
  cyan: number[];
  teal: number[];
  mint: number[];
  foam: number[];
  light: number;
};

type WorkerMessage =
  | {
      type: "init";
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      vertexShader: string;
      fragmentShader: string;
      colors: ThemeColors;
      reduced: boolean;
      powerPreference: WebGLPowerPreference;
      targetFps: number;
    }
  | { type: "colors"; colors: ThemeColors }
  | { type: "resize"; width: number; height: number }
  | { type: "pointer"; x: number; y: number; amount: number }
  | { type: "visibility"; visible: boolean }
  | { type: "dispose" };

const scope = self as unknown as DedicatedWorkerGlobalScope;
let canvas: OffscreenCanvas | null = null;
let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let buffer: WebGLBuffer | null = null;
let uniforms: Record<string, WebGLUniformLocation | null> = {};
let colors: ThemeColors | null = null;
let reduced = false;
let running = false;
let targetFps = 60;
let animationElapsed = 0;
let previousRender = performance.now();
let mx = 0.5;
let my = 0.5;
let pointerAmount = 0;
let raf = 0;
let timer = 0;

function compileShader(type: number, source: string) {
  if (!gl) throw new Error("WebGL is unavailable");
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to allocate shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    throw new Error("Shader compilation failed");
  }
  return shader;
}

function applyColors() {
  if (!gl || !colors) return;
  gl.uniform3fv(uniforms.bg, colors.bg);
  gl.uniform3fv(uniforms.accent, colors.accent);
  gl.uniform3fv(uniforms.accent2, colors.accent2);
  gl.uniform3fv(uniforms.cyan, colors.cyan);
  gl.uniform3fv(uniforms.teal, colors.teal);
  gl.uniform3fv(uniforms.mint, colors.mint);
  gl.uniform3fv(uniforms.foam, colors.foam);
  gl.uniform1f(uniforms.light, colors.light);
}

function render(now: number) {
  if (!gl || !program) return;
  if (!reduced) {
    const maxDelta = (1000 / targetFps) * 2;
    animationElapsed += Math.min(Math.max(now - previousRender, 0), maxDelta);
  }
  previousRender = now;
  gl.uniform1f(uniforms.time, animationElapsed / 1000);
  gl.uniform2f(uniforms.mouse, mx, my);
  gl.uniform1f(uniforms.mouseAmount, pointerAmount);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function cancelFrame() {
  if (raf && typeof scope.cancelAnimationFrame === "function") scope.cancelAnimationFrame(raf);
  if (timer) scope.clearTimeout(timer);
  raf = 0;
  timer = 0;
}

function scheduleFrame() {
  if (!running || reduced) return;
  if (typeof scope.requestAnimationFrame === "function") {
    raf = scope.requestAnimationFrame(tick);
  } else {
    timer = scope.setTimeout(() => tick(performance.now()), 1000 / targetFps);
  }
}

function tick(now: number) {
  raf = 0;
  timer = 0;
  if (!running || reduced) return;
  if (
    typeof scope.requestAnimationFrame !== "function"
    || now - previousRender >= (1000 / targetFps) - 1
  ) {
    render(now);
  }
  scheduleFrame();
}

function resize(width: number, height: number) {
  if (!canvas || !gl || (canvas.width === width && canvas.height === height)) return;
  canvas.width = width;
  canvas.height = height;
  gl.viewport(0, 0, width, height);
  gl.uniform2f(uniforms.resolution, width, height);
  render(performance.now());
}

function dispose() {
  running = false;
  cancelFrame();
  if (gl && buffer) gl.deleteBuffer(buffer);
  if (gl && program) gl.deleteProgram(program);
  buffer = null;
  program = null;
  gl = null;
  canvas = null;
}

function initialize(message: Extract<WorkerMessage, { type: "init" }>) {
  canvas = message.canvas;
  reduced = message.reduced;
  targetFps = message.targetFps;
  colors = message.colors;
  canvas.width = message.width;
  canvas.height = message.height;
  gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    powerPreference: message.powerPreference,
  });
  if (!gl) throw new Error("WebGL is unavailable");

  const vertexShader = compileShader(gl.VERTEX_SHADER, message.vertexShader);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, message.fragmentShader);
  program = gl.createProgram();
  if (!program) throw new Error("Unable to allocate WebGL program");
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("WebGL program linking failed");
  }
  gl.useProgram(program);

  buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  uniforms = {
    resolution: gl.getUniformLocation(program, "u_res"),
    time: gl.getUniformLocation(program, "u_time"),
    mouse: gl.getUniformLocation(program, "u_mouse"),
    mouseAmount: gl.getUniformLocation(program, "u_mouseAmt"),
    bg: gl.getUniformLocation(program, "u_bg"),
    accent: gl.getUniformLocation(program, "u_accent"),
    accent2: gl.getUniformLocation(program, "u_accent2"),
    cyan: gl.getUniformLocation(program, "u_cyan"),
    teal: gl.getUniformLocation(program, "u_teal"),
    mint: gl.getUniformLocation(program, "u_mint"),
    foam: gl.getUniformLocation(program, "u_foam"),
    light: gl.getUniformLocation(program, "u_light"),
  };
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
  applyColors();
  running = true;
  previousRender = performance.now();
  render(previousRender);
  // Complete the first GPU draw before telling the main thread that WebGL is
  // ready. Without this synchronization, a screenshot (and occasionally one
  // browser paint) can still contain the CSS fallback under heavy GPU load.
  gl.finish();
  scheduleFrame();
  scope.postMessage({ type: "ready" });
}

scope.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  try {
    if (message.type === "init") initialize(message);
    else if (message.type === "colors") {
      colors = message.colors;
      applyColors();
      render(performance.now());
    } else if (message.type === "resize") resize(message.width, message.height);
    else if (message.type === "pointer") {
      mx = message.x;
      my = message.y;
      pointerAmount = message.amount;
    } else if (message.type === "visibility") {
      running = message.visible;
      cancelFrame();
      previousRender = performance.now();
      if (running) {
        render(previousRender);
        scheduleFrame();
      }
    } else if (message.type === "dispose") {
      dispose();
      scope.close();
    }
  } catch {
    dispose();
    scope.postMessage({ type: "error" });
  }
};

export {};
