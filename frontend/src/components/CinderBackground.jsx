import { useRef, useEffect } from 'react';

/* ── Tuning Constants ─────────────────────────────────────────────
 *
 * EMBER_DENSITY     – embers per million pixels of screen area
 * MIN_COUNT / MAX_COUNT – hard bounds on ember count
 * SPEED_MIN / MAX   – upward drift in CSS-px per second
 * SWAY_SPEED_MIN/MAX– horizontal sway rate in CSS-px per second
 * SWAY_FREQ_MIN/MAX – sway angular frequency (rad/sec)
 * EMBER_MIN_R / MAX_R – radius range for normal embers (CSS-px)
 * LARGE_R           – max radius for soft "bokeh" embers
 * LARGE_CHANCE      – probability [0‑1] an ember spawns as large
 * FADE_IN_ZONE      – bottom fraction of screen where embers fade in
 * FADE_OUT_ZONE     – top fraction of screen where embers fade out
 * COLORS            – palette sampled for each ember
 * DPR_CAP           – max devicePixelRatio (perf guard)
 * FIXED_STEP        – fixed physics timestep (60 updates/sec)
 *
 * ────────────────────────────────────────────────────────────── */
const EMBER_DENSITY = 30;
const MIN_COUNT = 25;
const MAX_COUNT = 70;
const SPEED_MIN = 10;
const SPEED_MAX = 35;
const SWAY_SPEED_MIN = 12;
const SWAY_SPEED_MAX = 24;
const SWAY_FREQ_MIN = 0.5;
const SWAY_FREQ_MAX = 0.9;
const EMBER_MIN_R = 0.5;
const EMBER_MAX_R = 2;
const LARGE_R = 4;
const LARGE_CHANCE = 0.12;
const FADE_IN_ZONE = 0.08;
const FADE_OUT_ZONE = 0.15;
const COLORS = ['#d98a5a', '#e0975f', '#f0b088', '#c47a4a'];
const DPR_CAP = 2;
const FIXED_STEP = 1 / 60; // 60 updates/sec maximum

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
 *  gradient glow — cached by bucketed radius, color, and dpr. */
function createSprite(radius, color, dpr) {
  const pad = 2;
  const size = Math.ceil((radius * pad + pad) * 2 * dpr);
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const cx = size / 2;
  const r = radius * dpr;
  const g = c.getContext('2d');
  if (!g) return c;
  const grad = g.createRadialGradient(cx, cx, 0, cx, cx, r * pad);
  grad.addColorStop(0, color);
  grad.addColorStop(0.35, color);
  grad.addColorStop(1, 'transparent');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

// Global sprite cache: Map<`${color}_${radiusBucket}_${dpr}`, HTMLCanvasElement>
const spriteCache = new Map();

function getRadiusBucket(radius) {
  return (Math.round(radius * 2) / 2).toFixed(1);
}

function getCachedSprite(radius, color, dpr) {
  const bucket = getRadiusBucket(radius);
  const key = `${color}_${bucket}_${dpr}`;
  let sprite = spriteCache.get(key);
  if (!sprite) {
    sprite = createSprite(parseFloat(bucket), color, dpr);
    spriteCache.set(key, sprite);
  }
  return sprite;
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
    swaySpeed: rand(SWAY_SPEED_MIN, SWAY_SPEED_MAX),
    swayFreq: rand(SWAY_FREQ_MIN, SWAY_FREQ_MAX),
    opacity: (isLarge ? 0.45 : rand(0.55, 1)) * layer.opacity,
    color: pick(COLORS),
    isLarge,
    sprite: null,
  };
}

/* ── Component ─────────────────────────────────────────────── */
export const CinderBackground = ({ intensity = 1 }) => {
  const canvasRef = useRef(null);
  const intensityRef = useRef(intensity);
  const redrawRef = useRef(null);

  intensityRef.current = intensity;

  useEffect(() => {
    if (redrawRef.current) {
      redrawRef.current();
    }
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let w = window.innerWidth;
    let h = window.innerHeight;
    let lastW = w;
    let lastH = h;
    let embers = [];
    let animId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    let elapsedTime = 0;
    let resizeTimer = null;

    function buildEmbers() {
      const baseCount = Math.min(
        MAX_COUNT,
        Math.max(MIN_COUNT, Math.round((w * h * EMBER_DENSITY) / 1_000_000)),
      );
      const count = Math.max(10, Math.round(baseCount * intensityRef.current));

      embers = [];
      for (let i = 0; i < count; i++) {
        const e = spawnEmber(w, h, true);
        e.sprite = getCachedSprite(e.r, e.color, dpr);
        embers.push(e);
      }
    }

    function syncCanvasDimensions() {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      /* Clear canvas: body already has background color (#140d09) */
      ctx.clearRect(0, 0, w, h);

      /* Draw embers */
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        const normY = 1 - e.y / h; // 0 at bottom, 1 at top
        let fade = 1;
        if (normY < FADE_IN_ZONE) fade = normY / FADE_IN_ZONE;
        else if (normY > 1 - FADE_OUT_ZONE) fade = (1 - normY) / FADE_OUT_ZONE;
        fade = Math.max(0, Math.min(1, fade));

        const alpha = e.opacity * fade * intensityRef.current;
        if (alpha < 0.008 || !e.sprite) continue;

        ctx.globalAlpha = alpha;
        const sz = e.sprite.width / dpr;
        ctx.drawImage(e.sprite, e.x - sz / 2, e.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }

    redrawRef.current = draw;

    function step(dt) {
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.y -= e.speed * dt;
        e.x += Math.sin(elapsedTime * e.swayFreq + e.phase) * (e.swaySpeed * dt);

        if (e.y < -30) {
          const ne = spawnEmber(w, h, false);
          ne.sprite = getCachedSprite(ne.r, ne.color, dpr);
          embers[i] = ne;
        }
      }
    }

    function loop(now) {
      let frameTime = (now - lastTime) / 1000;
      lastTime = now;
      if (frameTime > 0.1) frameTime = 0.1;
      accumulator += frameTime;

      let updates = 0;
      while (accumulator >= FIXED_STEP && updates < 4) {
        step(FIXED_STEP);
        accumulator -= FIXED_STEP;
        elapsedTime += FIXED_STEP;
        updates++;
      }
      if (accumulator > FIXED_STEP) accumulator = 0;

      draw();
      animId = requestAnimationFrame(loop);
    }

    /* Debounced resize (150ms): rebuild sprites/embers only if size changed > 10% */
    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newW = window.innerWidth;
        const newH = window.innerHeight;
        const dw = Math.abs(newW - lastW) / (lastW || 1);
        const dh = Math.abs(newH - lastH) / (lastH || 1);

        w = newW;
        h = newH;
        lastW = newW;
        lastH = newH;

        syncCanvasDimensions();

        if (dw > 0.1 || dh > 0.1 || embers.length === 0) {
          spriteCache.clear();
          buildEmbers();
        }
        draw();
      }, 150);
    }

    /* Pause loop when tab is hidden or offscreen */
    function onVisibility() {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else if (!mediaQuery.matches) {
        lastTime = performance.now();
        accumulator = 0;
        if (!animId) {
          animId = requestAnimationFrame(loop);
        }
      }
    }

    function onMotionPrefChange(e) {
      if (e.matches) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
        draw();
      } else {
        lastTime = performance.now();
        accumulator = 0;
        if (!animId) {
          animId = requestAnimationFrame(loop);
        }
      }
    }

    /* Initialize */
    syncCanvasDimensions();
    buildEmbers();
    draw();

    if (!mediaQuery.matches) {
      lastTime = performance.now();
      animId = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    mediaQuery.addEventListener('change', onMotionPrefChange);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      mediaQuery.removeEventListener('change', onMotionPrefChange);
      redrawRef.current = null;
    };
  }, []);

  return (
    <>
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
      {/* Standalone CSS bottom vignette replacing canvas draw */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[rgb(var(--accent-rgb)/0.025)] to-transparent"
        style={{ zIndex: -1 }}
      />
    </>
  );
};

export default CinderBackground;
