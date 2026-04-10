import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FC, useCallback, useState } from 'react';

import { useKYC } from '../../context/KYCContext';
import type { KYCUploadedDocument } from '../../types';
import { Button, Card, CardContent, Typography } from '../../ui';
import { DocumentUploader } from '../DocumentUploader';

const COMPANY_DOCUMENT_TYPES = [
  { value: 'SOCIAL_CONTRACT', label: 'Contrato Social' },
  { value: 'ATA', label: 'Ata' },
  { value: 'BYLAWS', label: 'Estatuto' },
];

export const CompanyDocuments: FC = () => {
  const { goToNextStep, goToPreviousStep, markStepCompleted, saveStepData, getStepData, notifyNext, notifyBack } = useKYC();

  const savedData = getStepData('company-documents') as { documents?: KYCUploadedDocument[] } | null;
  const [documents, setDocuments] = useState<KYCUploadedDocument[]>(savedData?.documents ?? []);

  const handleDocumentUploaded = useCallback((doc: KYCUploadedDocument) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const handleDocumentRemoved = useCallback((documentId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== documentId));
  }, []);

  const handleNext = useCallback(() => {
    const stepData = { documents };
    saveStepData('company-documents', stepData);
    markStepCompleted('company-documents');
    notifyNext({ 'company-documents': stepData });
    goToNextStep();
  }, [documents, goToNextStep, markStepCompleted, saveStepData, notifyNext]);

  const handleBack = useCallback(() => {
    notifyBack();
    goToPreviousStep();
  }, [notifyBack, goToPreviousStep]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Typography variant="h6" className="mb-1">
          Documentos da Empresa
        </Typography>
        <Typography variant="body2" className="text-muted-foreground mb-6">
          Envie os documentos da empresa necessários para a abertura da conta. Os tipos aceitos são:
          Contrato Social, Ata ou Estatuto.
        </Typography>

        <div className="mb-4 p-4 rounded-lg bg-muted/50">
          <Typography variant="body2" className="font-medium mb-2">
            Formatos aceitos
          </Typography>
          <Typography variant="caption" className="text-muted-foreground">
            Imagens (PNG, JPEG) ou PDF. Tamanho máximo: 10MB por arquivo.
          </Typography>
        </div>

        <DocumentUploader
          documentTypeOptions={COMPANY_DOCUMENT_TYPES}
          documents={documents}
          onDocumentUploaded={handleDocumentUploaded}
          onDocumentRemoved={handleDocumentRemoved}
        />

        {documents.length === 0 && (
          <Typography variant="caption" className="text-amber-600 block mt-2">
            Envie pelo menos 1 documento da empresa para continuar.
          </Typography>
        )}

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button type="button" onClick={handleNext} disabled={documents.length === 0}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Próximo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
