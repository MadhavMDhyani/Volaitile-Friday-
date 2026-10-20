import { useEffect } from 'react';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import FeatureBento from '../components/landing/FeatureBento';
import ChatDemo from '../components/landing/ChatDemo';
import Benefits from '../components/landing/Benefits';
import HowItWorks from '../components/landing/HowItWorks';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';
import AuroraBackground from '../components/AuroraBackground';

export const Landing = () => {
  useEffect(() => {
    let frameId;
    let isTracking = false;
    let lastTime = 0;
    const frameDeltas = [];

    const loop = (currentTime) => {
      if (isTracking) {
        if (lastTime > 0) {
          const delta = currentTime - lastTime;
          frameDeltas.push(delta);
        }
        lastTime = currentTime;
      }
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    window.__landingPerf = {
      start: () => {
        frameDeltas.length = 0;
        lastTime = 0;
        isTracking = true;
      },
      stop: () => {
        isTracking = false;
      },
      getReport: () => {
        isTracking = false;
        if (frameDeltas.length === 0) return { avgFps: 60, worstFrameMs: 16.6, totalFrames: 0 };
        const sum = frameDeltas.reduce((a, b) => a + b, 0);
        const avgDelta = sum / frameDeltas.length;
        const avgFps = Math.round(1000 / avgDelta);
        const worstFrameMs = Math.round(Math.max(...frameDeltas) * 10) / 10;
        return { avgFps, worstFrameMs, totalFrames: frameDeltas.length };
      },
    };

    return () => {
      cancelAnimationFrame(frameId);
      delete window.__landingPerf;
    };
  }, []);
  return (
    <div className="relative min-h-screen w-full bg-[#05060a] text-[#fafafa] selection:bg-[#fafafa] selection:text-[#05060a] overflow-x-hidden">
      {/* Shared Aurora Orbs Background */}
      <AuroraBackground />

      {/* Sticky Translucent Glass Header */}
      <LandingNav />

      {/* Main Landing Sections */}
      <main id="main-content">
        <Hero />
        <FeatureBento />
        <ChatDemo />
        <Benefits />
        <HowItWorks />
        <FAQ />
        <FinalCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
