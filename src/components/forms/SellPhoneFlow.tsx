'use client';

import { useState } from 'react';
import { SellPhoneWizard } from './SellPhoneWizard';
import { SellPhoneDetails } from './SellPhoneDetails';
import type { WizardState } from './SellPhoneParts';
import type { SellQuote } from '@/lib/pricing';

/**
 * Orchestrates the 8-step sell flow: the wizard owns steps 1-6, then hands
 * the accumulated state to the details form (steps 7-8). Keeping the state
 * here means going "Back" from step 7 returns to step 6 with everything the
 * visitor already answered still filled in.
 */
export function SellPhoneFlow() {
  const [stage, setStage] = useState<'wizard' | 'details'>('wizard');
  const [payload, setPayload] = useState<{
    state: WizardState;
    quote: SellQuote;
    images: File[];
  } | null>(null);

  if (stage === 'details' && payload) {
    return (
      <SellPhoneDetails
        state={payload.state}
        quote={payload.quote}
        imageCount={payload.images.length}
        onBack={() => setStage('wizard')}
      />
    );
  }

  return (
    <SellPhoneWizard
      onComplete={(data) => {
        setPayload(data);
        setStage('details');
      }}
    />
  );
}
