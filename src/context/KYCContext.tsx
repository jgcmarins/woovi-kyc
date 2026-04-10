import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { assemblePayload } from '../lib/assemblePayload';
import { fetchCnpjData } from '../lib/brasilApi';
import type { KYCCompanyData, KYCConfig, KYCFileMetadata, KYCPayload } from '../types';

type KYCStep = 'company-data' | 'address' | 'company-documents' | 'representatives' | 'review';

const STEPS: KYCStep[] = [
  'company-data',
  'address',
  'company-documents',
  'representatives',
  'review',
];

type StepsFormData = Record<string, Record<string, unknown>>;

type KYCContextType = {
  company: KYCCompanyData | null;
  isLoadingCompany: boolean;
  currentStep: KYCStep;
  currentStepIndex: number;
  goToStep: (step: KYCStep) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  completedSteps: Set<KYCStep>;
  markStepCompleted: (step: KYCStep) => void;
  saveStepData: (step: KYCStep, data: Record<string, unknown>) => void;
  getStepData: (step: KYCStep) => Record<string, unknown> | null;
  getPayload: (freshStepData?: Record<string, Record<string, unknown>>) => KYCPayload;
  uploadFile: (file: File, metadata: KYCFileMetadata) => Promise<string>;
  notifyNext: (freshStepData?: Record<string, Record<string, unknown>>) => void;
  notifyBack: (freshStepData?: Record<string, Record<string, unknown>>) => void;
  notifyFileRemoved: (fileUrl: string) => void;
  notifySubmit: () => void | Promise<void>;
  onError?: (error: Error) => void;
};

const KYCContext = createContext<KYCContextType | null>(null);

type KYCProviderProps = {
  config: KYCConfig;
  children: ReactNode;
};

export const KYCProvider = ({ config, children }: KYCProviderProps) => {
  const {
    cnpj,
    onNext,
    onBack,
    onFileUploaded,
    onFileRemoved,
    onSubmit,
    onError,
  } = config;

  const [company, setCompany] = useState<KYCCompanyData | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [currentStep, setCurrentStep] = useState<KYCStep>('company-data');
  const [completedSteps, setCompletedSteps] = useState<Set<KYCStep>>(new Set());
  const [stepsFormData, setStepsFormData] = useState<StepsFormData>({});

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCompany(true);

    fetchCnpjData(cnpj)
      .then((data) => {
        if (cancelled) return;
        setCompany(data);
      })
      .catch((err) => {
        if (cancelled) return;
        onError?.(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCompany(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cnpj, onError]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const goToStep = useCallback(
    (step: KYCStep) => {
      const targetIndex = STEPS.indexOf(step);
      if (targetIndex <= currentStepIndex || completedSteps.has(step)) {
        setCurrentStep(step);
      }
    },
    [currentStepIndex, completedSteps],
  );

  const goToNextStep = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [currentStepIndex]);

  const goToPreviousStep = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex]);

  const markStepCompleted = useCallback((step: KYCStep) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  }, []);

  const saveStepData = useCallback((step: KYCStep, data: Record<string, unknown>) => {
    setStepsFormData((prev) => ({ ...prev, [step]: data }));
  }, []);

  const getStepData = useCallback(
    (step: KYCStep): Record<string, unknown> | null => {
      return stepsFormData[step] ?? null;
    },
    [stepsFormData],
  );

  const mergedPayload = useCallback(
    (freshStepData?: Record<string, Record<string, unknown>>) => {
      const merged = freshStepData ? { ...stepsFormData, ...freshStepData } : stepsFormData;
      return assemblePayload(merged);
    },
    [stepsFormData],
  );

  const getPayload = useCallback(
    (freshStepData?: Record<string, Record<string, unknown>>) => mergedPayload(freshStepData),
    [mergedPayload],
  );

  const uploadFile = useCallback(
    async (file: File, metadata: KYCFileMetadata): Promise<string> => {
      if (!onFileUploaded) {
        throw new Error('onFileUploaded callback is required for file uploads');
      }
      return onFileUploaded(file, metadata);
    },
    [onFileUploaded],
  );

  const notifyNext = useCallback(
    (freshStepData?: Record<string, Record<string, unknown>>) => {
      onNext?.(mergedPayload(freshStepData));
    },
    [onNext, mergedPayload],
  );

  const notifyBack = useCallback(
    (freshStepData?: Record<string, Record<string, unknown>>) => {
      onBack?.(mergedPayload(freshStepData));
    },
    [onBack, mergedPayload],
  );

  const notifyFileRemoved = useCallback(
    (fileUrl: string) => {
      onFileRemoved?.(fileUrl, mergedPayload());
    },
    [onFileRemoved, mergedPayload],
  );

  const notifySubmit = useCallback(() => {
    return onSubmit?.(mergedPayload());
  }, [onSubmit, mergedPayload]);

  const value = useMemo(
    () => ({
      company,
      isLoadingCompany,
      currentStep,
      currentStepIndex,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      completedSteps,
      markStepCompleted,
      saveStepData,
      getStepData,
      getPayload,
      uploadFile,
      notifyNext,
      notifyBack,
      notifyFileRemoved,
      notifySubmit,
      onError,
    }),
    [
      company,
      isLoadingCompany,
      currentStep,
      currentStepIndex,
      goToStep,
      goToNextStep,
      goToPreviousStep,
      completedSteps,
      markStepCompleted,
      saveStepData,
      getStepData,
      getPayload,
      uploadFile,
      notifyNext,
      notifyBack,
      notifyFileRemoved,
      notifySubmit,
      onError,
    ],
  );

  return <KYCContext.Provider value={value}>{children}</KYCContext.Provider>;
};

export const useKYC = (): KYCContextType => {
  const context = useContext(KYCContext);

  if (!context) {
    throw new Error('useKYC must be used within a KYCProvider');
  }

  return context;
};

export { STEPS, type KYCStep };
