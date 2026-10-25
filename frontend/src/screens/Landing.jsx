import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import Footer from '../components/landing/Footer';

export const Landing = () => {
  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#f3e6da] selection:bg-[#f3e6da] selection:text-[#0f0a07] overflow-x-hidden flex flex-col justify-between">
      {/* Sticky Translucent Glass Header */}
      <LandingNav />

      {/* Main Landing Hero */}
      <main id="main-content" className="flex-1">
        <Hero />
      </main>

      {/* Slim Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
