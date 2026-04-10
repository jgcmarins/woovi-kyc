import { FC } from 'react';
import { Toaster } from 'sonner';

import { KYCProvider, useKYC } from '../context/KYCContext';
import type { KYCConfig } from '../types';
import { Loading } from '../ui';
import { KYCStepper } from './KYCStepper';
import { Address } from './steps/Address';
import { CompanyData } from './steps/CompanyData';
import { CompanyDocuments } from './steps/CompanyDocuments';
import { Representatives } from './steps/Representatives';
import { Review } from './steps/Review';

const StepRenderer: FC = () => {
  const { currentStep } = useKYC();

  switch (currentStep) {
    case 'company-data':
      return <CompanyData />;
    case 'address':
      return <Address />;
    case 'company-documents':
      return <CompanyDocuments />;
    case 'representatives':
      return <Representatives />;
    case 'review':
      return <Review />;
  }
};

const WizardContent: FC = () => {
  const { isLoadingCompany } = useKYC();

  if (isLoadingCompany) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
        <Loading label="Buscando dados da empresa..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-4 sm:p-6">
      <KYCStepper />
      <StepRenderer />
      <Toaster richColors position="top-right" />
    </div>
  );
};

export const KYCWizard: FC<KYCConfig> = (config) => {
  return (
    <KYCProvider config={config}>
      <WizardContent />
    </KYCProvider>
  );
};
