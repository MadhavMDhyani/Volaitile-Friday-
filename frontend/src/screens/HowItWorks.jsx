import InfoPageLayout from '../components/landing/InfoPageLayout';
import HowItWorksSection from '../components/landing/HowItWorks';
import ChatDemo from '../components/landing/ChatDemo';
import usePageMeta from '../hooks/usePageMeta';

export const HowItWorks = () => {
  usePageMeta({
    title: 'How It Works',
    description:
      'Learn how Volaitile Friday works: create a project, invite collaborators, edit code in real time, and ask Friday AI in live room chat.',
  });

  return (
    <InfoPageLayout>
      <HowItWorksSection asH1={true} isPage={true} />
      <ChatDemo isPage={true} />
    </InfoPageLayout>
  );
};

export default HowItWorks;
