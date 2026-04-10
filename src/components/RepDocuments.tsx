import { Camera, CheckCircle2, CircleAlert, Upload } from 'lucide-react';
import { FC, useCallback, useMemo, useState } from 'react';

import type { KYCUploadedDocument } from '../types';
import { Badge, Label, RadioGroup, RadioGroupItem, Separator, Typography } from '../ui';
import { DocumentUploader } from './DocumentUploader';

const SELFIE_TYPES = [{ value: 'PICTURE', label: 'Selfie / Foto' }];

type DocumentOption = 'CNH' | 'CNH_FRONT_BACK' | 'RG_FRONT_BACK';

const DOCUMENT_OPTIONS: { value: DocumentOption; label: string }[] = [
  { value: 'CNH', label: 'CNH (completa)' },
  { value: 'CNH_FRONT_BACK', label: 'CNH (frente e verso)' },
  { value: 'RG_FRONT_BACK', label: 'RG (frente e verso)' },
];

function getDocTypesForOption(option: DocumentOption) {
  switch (option) {
    case 'CNH':
      return [{ value: 'CNH', label: 'CNH' }];
    case 'CNH_FRONT_BACK':
      return [
        { value: 'CNH_FRONT', label: 'CNH (frente)' },
        { value: 'CNH_BACK', label: 'CNH (verso)' },
      ];
    case 'RG_FRONT_BACK':
      return [
        { value: 'IDENTITY_FRONT', label: 'RG (frente)' },
        { value: 'IDENTITY_BACK', label: 'RG (verso)' },
      ];
  }
}

type RepDocumentsProps = {
  documents: readonly KYCUploadedDocument[];
  onDocumentUploaded: (doc: KYCUploadedDocument) => void;
  onDocumentRemoved: (documentId: string) => void;
  disabled?: boolean;
};

export const RepDocuments: FC<RepDocumentsProps> = ({
  documents,
  onDocumentUploaded,
  onDocumentRemoved,
  disabled,
}) => {
  const selfieDocuments = useMemo(
    () => documents.filter((d) => d.documentType === 'PICTURE'),
    [documents],
  );

  const identityDocuments = useMemo(
    () => documents.filter((d) => d.documentType !== 'PICTURE'),
    [documents],
  );

  const hasSelfie = selfieDocuments.length > 0;

  const inferredOption = useMemo((): DocumentOption | null => {
    const types = identityDocuments.map((d) => d.documentType);
    if (types.includes('CNH')) return 'CNH';
    if (types.includes('CNH_FRONT') || types.includes('CNH_BACK')) return 'CNH_FRONT_BACK';
    if (types.includes('IDENTITY_FRONT') || types.includes('IDENTITY_BACK')) return 'RG_FRONT_BACK';
    return null;
  }, [identityDocuments]);

  const [selectedDocOption, setSelectedDocOption] = useState<DocumentOption | null>(inferredOption);

  const activeDocTypes = selectedDocOption ? getDocTypesForOption(selectedDocOption) : [];

  const handleDocOptionChange = useCallback((value: string) => {
    setSelectedDocOption(value as DocumentOption);
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <Typography variant="body2" className="font-medium">
            Selfie / Foto do Representante
          </Typography>
          {hasSelfie ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Enviado
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CircleAlert className="h-3 w-3" />
              Pendente
            </Badge>
          )}
        </div>
        <Typography variant="caption" className="text-muted-foreground block">
          Tire uma foto ou envie uma selfie do representante. O rosto deve estar visível e
          centralizado.
        </Typography>
        <DocumentUploader
          documentTypeOptions={SELFIE_TYPES}
          documents={selfieDocuments}
          onDocumentUploaded={onDocumentUploaded}
          onDocumentRemoved={onDocumentRemoved}
          disabled={disabled}
          enableCamera
          maxDocuments={1}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Upload className="h-4 w-4 text-muted-foreground" />
          <Typography variant="body2" className="font-medium">
            Documento de Identidade
          </Typography>
          {identityDocuments.length > 0 ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {identityDocuments.length} enviado(s)
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <CircleAlert className="h-3 w-3" />
              Pendente
            </Badge>
          )}
        </div>
        <Typography variant="caption" className="text-muted-foreground block">
          Selecione o tipo de documento e faça o upload.
        </Typography>

        <RadioGroup
          value={selectedDocOption ?? ''}
          onValueChange={handleDocOptionChange}
          className="flex flex-col sm:flex-row gap-3"
          disabled={disabled}
        >
          {DOCUMENT_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <RadioGroupItem value={opt.value} id={`doc-${opt.value}`} />
              <Label htmlFor={`doc-${opt.value}`} className="font-normal cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedDocOption && activeDocTypes.length > 0 && (
          <div className="space-y-4 pt-2">
            {activeDocTypes.map((docType) => {
              const docsOfType = identityDocuments.filter((d) => d.documentType === docType.value);
              const hasDoc = docsOfType.length > 0;

              return (
                <div key={docType.value} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Typography variant="caption" className="font-medium">
                      {docType.label}
                    </Typography>
                    {hasDoc ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        OK
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1">
                        <CircleAlert className="h-3 w-3 text-amber-600" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <DocumentUploader
                    documentTypeOptions={[docType]}
                    documents={docsOfType}
                    onDocumentUploaded={onDocumentUploaded}
                    onDocumentRemoved={onDocumentRemoved}
                    disabled={disabled}
                    maxDocuments={1}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
