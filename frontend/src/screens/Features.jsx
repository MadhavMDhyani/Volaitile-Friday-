import InfoPageLayout from '../components/landing/InfoPageLayout';
import FeatureBento from '../components/landing/FeatureBento';
import usePageMeta from '../hooks/usePageMeta';

export const Features = () => {
  usePageMeta({
    title: 'Features',
    description:
      'Explore Volaitile Friday features: context-aware Friday AI assistant, multi-file code editor, and live Socket.IO room chat.',
  });

  return (
    <InfoPageLayout>
      <FeatureBento asH1={true} isPage={true} />
    </InfoPageLayout>
  );
};

export default Features;
