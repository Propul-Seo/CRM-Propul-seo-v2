import { PenLine } from 'lucide-react';
import { PlaceholderPage } from './_PlaceholderPage';

export function SignaturesPage() {
  return (
    <PlaceholderPage
      eyebrow="Signatures"
      title="Documents à signer"
      subtitle="Documents en attente de signature électronique."
      icon={PenLine}
    />
  );
}
