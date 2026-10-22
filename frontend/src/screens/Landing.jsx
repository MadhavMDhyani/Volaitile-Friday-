import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import FeatureBento from '../components/landing/FeatureBento';
import ChatDemo from '../components/landing/ChatDemo';
import Benefits from '../components/landing/Benefits';
import HowItWorks from '../components/landing/HowItWorks';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export const Landing = () => {
  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#f3e6da] selection:bg-[#f3e6da] selection:text-[#0f0a07] overflow-x-hidden">

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
