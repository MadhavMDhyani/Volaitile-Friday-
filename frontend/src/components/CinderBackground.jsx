import { useRef, useEffect } from 'react';

/* ── Tuning Constants ─────────────────────────────────────────────
 *
 * EMBER_DENSITY     – embers per million pixels of screen area
 * MIN_COUNT / MAX_COUNT – hard bounds on ember count
 * SPEED_MIN / MAX   – upward drift in CSS-px per frame (~16 ms)
 * SWAY_AMPLITUDE    – horizontal sway magnitude (CSS-px per frame)
 * SWAY_FREQUENCY    – sine wave frequency for the sway
 * EMBER_MIN_R / MAX_R – radius range for normal embers (CSS-px)
 * LARGE_R           – max radius for soft "bokeh" embers
 * LARGE_CHANCE      – probability [0‑1] an ember spawns as large
 * FADE_IN_ZONE      – bottom fraction of screen where embers fade in
 * FADE_OUT_ZONE     – top fraction of screen where embers fade out
 * BG                – canvas clear colour (page base)
 * COLORS            – palette sampled for each ember
 * DPR_CAP           – max devicePixelRatio (perf guard)
 *
 * ────────────────────────────────────────────────────────────── */
const EMBER_DENSITY = 30;
const MIN_COUNT = 25;
const MAX_COUNT = 70;
const SPEED_MIN = 0.15;
const SPEED_MAX = 0.55;
const SWAY_AMPLITUDE = 0.35;
const SWAY_FREQUENCY = 0.006;
const EMBER_MIN_R = 0.5;
const EMBER_MAX_R = 2;
const LARGE_R = 4;
const LARGE_CHANCE = 0.12;
const FADE_IN_ZONE = 0.08;
const FADE_OUT_ZONE = 0.15;
const BG = '#0a0a0a';
const COLORS = ['#ff6a1a', '#ff7a2a', '#ff8a3d', '#ff5e10'];
const DPR_CAP = 2;

/* Three depth layers: far objects are slower, smaller, dimmer */
const LAYERS = [
  { speed: 0.5, size: 0.6, opacity: 0.35 },
  { speed: 0.75, size: 0.85, opacity: 0.6 },
  { speed: 1, size: 1, opacity: 1 },
];

/* ── Helpers ────────────────────────────────────────────────── */
function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pre-render a single ember as a tiny offscreen canvas with a radial
 *  gradient glow — much cheaper than calling createRadialGradient each
 *  frame, and avoids the heavy ctx.shadowBlur path. */
function createSprite(radius, color, dpr) {
  const pad = 2;
  const size = Math.ceil((radius * pad + pad) * 2 * dpr);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const cx = size / 2;
  const r = radius * dpr;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(cx, cx, 0, cx, cx, r * pad);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'transparent');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function spawnEmber(w, h, spreadY) {
  const li = Math.random() < 0.2 ? 0 : Math.random() < 0.5 ? 1 : 2;
  const layer = LAYERS[li];
  const isLarge = Math.random() < LARGE_CHANCE;
  const baseR = isLarge ? rand(EMBER_MAX_R, LARGE_R) : rand(EMBER_MIN_R, EMBER_MAX_R);
  return {
    x: rand(0, w),
    y: spreadY ? rand(0, h) : h + rand(10, 50),
    r: baseR * layer.size,
    speed: rand(SPEED_MIN, SPEED_MAX) * layer.speed,
    phase: rand(0, Math.PI * 2),
    swayAmp: SWAY_AMPLITUDE * (0.5 + Math.random()),
    opacity: (isLarge ? 0.45 : rand(0.55, 1)) * layer.opacity,
    color: pick(COLORS),
    isLarge,
    sprite: null,
  };
}

/* ── Component ─────────────────────────────────────────────── */
export const CinderBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const prefersStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w, h, embers;
    let animId = 0;
    let tick = 0;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(
        MAX_COUNT,
        Math.max(MIN_COUNT, Math.round((w * h * EMBER_DENSITY) / 1_000_000)),
      );

      embers = [];
      for (let i = 0; i < count; i++) {
        const e = spawnEmber(w, h, true);
        e.sprite = createSprite(e.r, e.color, dpr);
        embers.push(e);
      }
    }

    function draw() {
      /* Background fill */
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, w, h);

      /* Subtle warm vignette at the bottom edge */
      const vigH = h * 0.22;
      const vig = ctx.createLinearGradient(0, h - vigH, 0, h);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(255, 87, 34, 0.025)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, h - vigH, w, vigH);

      /* Embers */
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        const normY = 1 - e.y / h; // 0 at bottom, 1 at top
        let fade = 1;
        if (normY < FADE_IN_ZONE) fade = normY / FADE_IN_ZONE;
        else if (normY > 1 - FADE_OUT_ZONE) fade = (1 - normY) / FADE_OUT_ZONE;
        fade = Math.max(0, Math.min(1, fade));

        const alpha = e.opacity * fade;
        if (alpha < 0.01) continue;

        ctx.globalAlpha = alpha;
        const sz = e.sprite.width / dpr;
        ctx.drawImage(e.sprite, e.x - sz / 2, e.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      tick++;
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y -= e.speed;
        e.x += Math.sin(tick * SWAY_FREQUENCY + e.phase) * e.swayAmp;

        if (e.y < -30) {
          const ne = spawnEmber(w, h, false);
          ne.sprite = createSprite(ne.r, ne.color, dpr);
          embers[i] = ne;
        }
      }
    }

    function loop() {
      step();
      draw();
      animId = requestAnimationFrame(loop);
    }

    /* Initial render */
    resize();
    draw();

    if (!prefersStill) {
      animId = requestAnimationFrame(loop);
    }

    /* Pause when tab is hidden */
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animId);
        animId = 0;
      } else if (!prefersStill) {
        if (!animId) animId = requestAnimationFrame(loop);
      }
    }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
};

export default CinderBackground;
