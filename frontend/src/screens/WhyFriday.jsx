import InfoPageLayout from '../components/landing/InfoPageLayout';
import Benefits from '../components/landing/Benefits';
import usePageMeta from '../hooks/usePageMeta';

export const WhyFriday = () => {
  usePageMeta({
    title: 'Why Volaitile Friday',
    description:
      'Why engineering teams choose Volaitile Friday: eliminate tab fatigue, collaborate without friction, and maintain full data sovereignty.',
  });

  return (
    <InfoPageLayout>
      <Benefits asH1={true} isPage={true} />
    </InfoPageLayout>
  );
};

export default WhyFriday;
