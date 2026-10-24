import { useEffect, useState, useRef } from 'react';

/**
 * Dev-only FPS probe component
 * Enabled only when import.meta.env.DEV && window.location.search.includes('fps')
 */
export const FpsProbe = () => {
  const isEnabled =
    Boolean(import.meta.env.DEV) &&
    typeof window !== 'undefined' &&
    window.location.search.includes('fps');

  const [metrics, setMetrics] = useState({
    avgFps: 60,
    currentFps: 60,
    onePercentLow: 60,
    framesOver16: 0,
    framesOver33: 0,
    maxFrameTime: 16.6,
  });

  const frameTimesRef = useRef([]); // { time: DOMHighResTimeStamp, delta: number }
  const totalOver16Ref = useRef(0);
  const totalOver33Ref = useRef(0);
  const maxDeltaRef = useRef(0);

  useEffect(() => {
    if (!isEnabled) return;

    let animId;
    let lastTimestamp = performance.now();
    let lastUiUpdate = performance.now();

    const loop = (now) => {
      const delta = now - lastTimestamp;
      lastTimestamp = now;

      // Ignore huge pause spikes (e.g. tab unfocused or debugger hit)
      if (delta > 0 && delta < 1000) {
        if (delta > 16.7) totalOver16Ref.current += 1;
        if (delta > 33.3) totalOver33Ref.current += 1;
        if (delta > maxDeltaRef.current) maxDeltaRef.current = delta;

        frameTimesRef.current.push({ time: now, delta });

        // Retain 3s sliding window
        const cutoff = now - 3000;
        while (frameTimesRef.current.length > 0 && frameTimesRef.current[0].time < cutoff) {
          frameTimesRef.current.shift();
        }
      }

      // Update UI every 200ms
      if (now - lastUiUpdate > 200) {
        lastUiUpdate = now;
        const windowFrames = frameTimesRef.current;
        if (windowFrames.length > 0) {
          const totalDelta = windowFrames.reduce((acc, f) => acc + f.delta, 0);
          const avgDelta = totalDelta / windowFrames.length;
          const avgFps = Math.round(1000 / avgDelta);

          const sortedDeltas = [...windowFrames].map((f) => f.delta).sort((a, b) => b - a);
          // 1% worst frame index
          const lowIdx = Math.min(
            sortedDeltas.length - 1,
            Math.max(0, Math.floor(sortedDeltas.length * 0.01))
          );
          const worst1PctDelta = sortedDeltas[lowIdx] || 16.6;
          const onePercentLow = Math.round(1000 / worst1PctDelta);
          const currentFps = Math.min(120, Math.round(1000 / Math.max(1, delta)));

          const currentMetrics = {
            avgFps: Math.min(120, avgFps),
            currentFps,
            onePercentLow: Math.min(120, onePercentLow),
            framesOver16: totalOver16Ref.current,
            framesOver33: totalOver33Ref.current,
            maxFrameTime: parseFloat(maxDeltaRef.current.toFixed(1)),
          };

          setMetrics(currentMetrics);
          window.__FPS_METRICS__ = currentMetrics;
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    // Global reset method for test automation
    window.__RESET_FPS__ = () => {
      frameTimesRef.current = [];
      totalOver16Ref.current = 0;
      totalOver33Ref.current = 0;
      maxDeltaRef.current = 0;
      setMetrics({
        avgFps: 60,
        currentFps: 60,
        onePercentLow: 60,
        framesOver16: 0,
        framesOver33: 0,
        maxFrameTime: 16.6,
      });
    };

    return () => {
      cancelAnimationFrame(animId);
      delete window.__RESET_FPS__;
      delete window.__FPS_METRICS__;
    };
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div
      id="fps-probe-hud"
      className="fixed bottom-4 right-4 z-[9999] pointer-events-auto flex flex-col gap-1.5 rounded-xl border border-accent/40 bg-[#07090e]/95 p-3 font-mono text-[11px] text-accent shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(217,138,90,0.3)] backdrop-blur-md select-none tabular-nums"
      style={{ minWidth: '185px' }}
      aria-label="Performance FPS HUD"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-1 text-[10px] text-white/50 uppercase tracking-wider">
        <span className="flex items-center gap-1.5 font-bold text-accent">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          FPS Probe (3s)
        </span>
        <button
          type="button"
          onClick={() => window.__RESET_FPS__?.()}
          className="text-white/60 hover:text-white transition-colors cursor-pointer"
          title="Reset sample metrics"
        >
          [reset]
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5">
        <span className="text-[#a89384]">Avg FPS:</span>
        <span className="text-right font-bold text-[#f3e6da]">{metrics.avgFps}</span>

        <span className="text-[#a89384]">Current:</span>
        <span className="text-right font-semibold text-accent">{metrics.currentFps}</span>

        <span className="text-[#a89384]">1% Low:</span>
        <span className="text-right font-semibold text-[#f3e6da]">{metrics.onePercentLow}</span>

        <span className="text-[#a89384]">Max frame:</span>
        <span
          className={`text-right font-semibold ${
            metrics.maxFrameTime > 33.3 ? 'text-red-400' : 'text-[#f3e6da]'
          }`}
        >
          {metrics.maxFrameTime}ms
        </span>

        <span className="text-[#a89384]">&gt;16.7ms:</span>
        <span className="text-right text-[#f3e6da]">{metrics.framesOver16}</span>

        <span className="text-[#a89384]">&gt;33.3ms:</span>
        <span
          className={`text-right font-bold ${
            metrics.framesOver33 > 0 ? 'text-red-400' : 'text-green-400'
          }`}
        >
          {metrics.framesOver33}
        </span>
      </div>
    </div>
  );
};

export default FpsProbe;
