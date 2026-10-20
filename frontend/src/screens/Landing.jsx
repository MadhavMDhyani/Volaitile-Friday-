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
