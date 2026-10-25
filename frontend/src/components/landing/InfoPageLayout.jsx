import LandingNav from './LandingNav';
import Footer from './Footer';
import FinalCTA from './FinalCTA';

export const InfoPageLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#f3e6da] selection:bg-[#f3e6da] selection:text-[#0f0a07] overflow-x-hidden flex flex-col justify-between">
      <LandingNav />
      <main id="main-content" className="pt-20 sm:pt-24 flex-1">
        {children}
        <FinalCTA compact={true} />
      </main>
      <Footer />
    </div>
  );
};

export default InfoPageLayout;
