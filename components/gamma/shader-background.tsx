"use client";

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_t;
uniform vec2 u_mouse;
uniform float u_pull;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    s += a * snoise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;

  float t = u_t * 0.022;

  // How strongly this pixel is under the cursor. Falls off fast so the
  // interaction reads as local, not as the whole field sloshing about.
  vec2 toM = u_mouse - p;
  float md = length(toM);
  float grab = exp(-md * md * 1.9) * u_pull;

  // Parallax: the field shifts against the cursor, and curls toward it.
  vec2 sp = p - u_mouse * 0.10 + normalize(toM + 1e-5) * grab * 0.16;

  vec2 q = vec2(fbm(sp * 0.42 + vec2(0.0, t)),
                fbm(sp * 0.42 + vec2(3.7, 1.4) - t * 0.8));
  vec2 r = vec2(fbm(sp * 0.60 + 1.0 * q + vec2(1.7, 9.2) + t * 0.5),
                fbm(sp * 0.60 + 1.0 * q + vec2(8.3, 2.8) - t * 0.3));
  float f = fbm(sp * 0.70 + (1.1 + 0.5 * grab) * r) * 0.5 + 0.5;

  // Fills the whole hero; only the far edges fall away.
  float cloud = smoothstep(1.50, 0.30, length((uv - vec2(0.50, 0.50)) * vec2(0.78, 1.05)));
  float d = clamp(smoothstep(0.50, 1.04, f) * cloud + grab * 0.10, 0.0, 1.0);

  vec3 vd   = vec3(0.039, 0.043, 0.051);
  vec3 deep = vec3(0.024, 0.118, 0.078);
  vec3 mdc  = vec3(0.055, 0.235, 0.125);
  vec3 hot  = vec3(0.184, 0.910, 0.361);

  vec3 smoke = mix(deep, mdc, smoothstep(0.15, 0.68, d));
  smoke = mix(smoke, hot, smoothstep(0.86, 1.0, d) * 0.85);
  vec3 col = mix(vd, smoke, pow(d, 1.52) * 0.80);

  // Cursor lifts what it passes over rather than painting a disc on top.
  col += grab * vec3(0.028, 0.095, 0.052) * (0.35 + 0.65 * d);

  col *= 1.0 - 0.28 * smoothstep(0.70, 1.50, length(p));

  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.016;

  gl_FragColor = vec4(col, 1.0);
}
`;

export function ShaderBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const bail = () => {
      canvas.style.display = "none";
    };

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) return bail();

    const compile = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return bail();

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return bail();
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const attr = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_t");
    const uMouse = gl.getUniformLocation(program, "u_mouse");
    const uPull = gl.getUniformLocation(program, "u_pull");

    // Pointer in the shader's aspect-corrected space, eased so the smoke
    // trails the cursor instead of snapping to it.
    const to = { x: 0.35, y: 0, pull: 0 };
    const at = { x: 0.35, y: 0, pull: 0 };

    const draw = (time: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      at.x += (to.x - at.x) * 0.055;
      at.y += (to.y - at.y) * 0.055;
      at.pull += (to.pull - at.pull) * 0.04;

      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, time / 1000);
      gl.uniform2f(uMouse, at.x, at.y);
      gl.uniform1f(uPull, at.pull);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      draw(0);
      return;
    }

    // Skip GPU work once the hero has scrolled away.
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    // Tracked on window, not the canvas: the canvas sits behind the copy, so
    // pointer events never reach it.
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (!r.height) return;
      to.x = (e.clientX - r.left - r.width / 2) / r.height;
      to.y = (r.height / 2 - (e.clientY - r.top)) / r.height;
      to.pull = 1;
    };
    const onLeave = () => {
      to.pull = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    // Paint immediately so there is no blank frame before the first rAF tick.
    draw(0);

    let raf = 0;
    const loop = (time: number) => {
      if (visible) draw(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      io.disconnect();
      // Don't loseContext(): getContext() hands the same one back, and Strict
      // Mode's double-mount would then get a dead context and bail.
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
