import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { FC, useCallback, useMemo, useState } from 'react';

import { useKYC } from '../../context/KYCContext';
import type { KYCUploadedDocument } from '../../types';
import {
  Button,
  Card,
  CardContent,
  FilePreviewCard,
  type FilePreviewData,
  FilePreviewDialog,
  Separator,
  Typography,
} from '../../ui';

const DOC_TYPE_LABELS: Record<string, string> = {
  SOCIAL_CONTRACT: 'Contrato Social',
  ATA: 'Ata',
  BYLAWS: 'Estatuto',
  PICTURE: 'Selfie / Foto',
  CNH: 'CNH (completa)',
  CNH_FRONT: 'CNH (frente)',
  CNH_BACK: 'CNH (verso)',
  IDENTITY_FRONT: 'RG (frente)',
  IDENTITY_BACK: 'RG (verso)',
};

type RepDocumentsMap = Record<number, KYCUploadedDocument[]>;

function inferMimeType(url: string): string | null {
  const ext = url.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return map[ext] ?? null;
}

export const Review: FC = () => {
  const { getPayload, getStepData, goToPreviousStep, notifySubmit, notifyBack, onError } = useKYC();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<FilePreviewData | null>(null);

  const payload = getPayload();

  const rawCompanyDocs = getStepData('company-documents') as { documents?: KYCUploadedDocument[] } | null;
  const rawRepDocs = (getStepData('representatives') as { repDocuments?: RepDocumentsMap } | null)?.repDocuments;

  const companyDocsMimeMap = useMemo(() => {
    const map: Record<string, KYCUploadedDocument> = {};
    for (const doc of rawCompanyDocs?.documents ?? []) {
      map[doc.url] = doc;
    }
    return map;
  }, [rawCompanyDocs]);

  const repDocsMimeMap = useMemo(() => {
    const map: Record<string, KYCUploadedDocument> = {};
    if (rawRepDocs) {
      for (const docs of Object.values(rawRepDocs)) {
        for (const doc of docs) {
          map[doc.url] = doc;
        }
      }
    }
    return map;
  }, [rawRepDocs]);

  const companyData = payload as Record<string, unknown>;
  const billingAddress = companyData.billingAddress as Record<string, string> | undefined;
  const companyDocuments = companyData.companyDocuments as Array<{ type: string; fileUrl: string }> | undefined;
  const representatives = companyData.representatives as Array<{
    name: string;
    birthDate: string;
    email: string;
    taxID: string;
    phone: string;
    address: Record<string, string>;
    documents: Array<{ type: string; fileUrl: string }>;
  }> | undefined;

  const hasAllData = useMemo(() => {
    return !!(
      companyData.officialName &&
      billingAddress?.zipcode &&
      companyDocuments?.length &&
      representatives?.length
    );
  }, [companyData, billingAddress, companyDocuments, representatives]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await notifySubmit();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsSubmitting(false);
    }
  }, [notifySubmit, onError]);

  const handleBack = useCallback(() => {
    notifyBack();
    goToPreviousStep();
  }, [notifyBack, goToPreviousStep]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Typography variant="h6" className="mb-1">
            Revisar e Enviar
          </Typography>
          <Typography variant="body2" className="text-muted-foreground mb-6">
            Revise todos os dados antes de enviar. Após o envio, seus dados serão analisados e você
            receberá um retorno em até 72 horas.
          </Typography>

          {hasAllData ? (
            <div className="space-y-4">
              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  Dados da Empresa
                </Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DataField label="Razão Social" value={companyData.officialName as string} />
                  <DataField label="Nome Fantasia" value={companyData.tradeName as string} />
                  <DataField label="CNPJ" value={companyData.taxID as string} />
                  <DataField label="Descrição do Negócio" value={companyData.businessDescription as string} />
                  <DataField label="Produto/Serviço" value={companyData.businessProduct as string} />
                  <DataField label="Tempo de Atividade" value={companyData.businessLifetime as string} />
                  <div className="sm:col-span-2">
                    <DataField label="Objetivo da Conta" value={companyData.businessGoal as string} />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Typography variant="body2" className="font-medium mb-2">
                  Endereço de Cobrança
                </Typography>
                {billingAddress?.zipcode ? (
                  <Typography variant="caption" className="text-muted-foreground">
                    {billingAddress.street}, {billingAddress.number} -{' '}
                    {billingAddress.neighborhood}, {billingAddress.city}/
                    {billingAddress.state} - CEP {billingAddress.zipcode}
                    {billingAddress.complement ? ` (${billingAddress.complement})` : ''}
                  </Typography>
                ) : (
                  <Typography variant="caption" className="text-muted-foreground">
                    —
                  </Typography>
                )}
              </div>

              <Separator />

              <div>
                <Typography variant="body2" className="font-medium mb-3">
                  Documentos da Empresa ({companyDocuments?.length ?? 0})
                </Typography>
                {companyDocuments && companyDocuments.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {companyDocuments.map((doc, i) => {
                      const raw = companyDocsMimeMap[doc.fileUrl];
                      const mimeType = raw?.mimeType ?? inferMimeType(doc.fileUrl);
                      return (
                        <FilePreviewCard
                          key={i}
                          label={DOC_TYPE_LABELS[doc.type] ?? doc.type}
                          fileName={raw?.fileName ?? doc.fileUrl.split('/').pop() ?? 'Documento'}
                          mimeType={mimeType}
                          previewUrl={doc.fileUrl}
                          onPreview={setPreviewDoc}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Typography variant="caption" className="text-muted-foreground">
                    Nenhum documento enviado
                  </Typography>
                )}
              </div>

              <Separator />

              <div>
                <Typography variant="body2" className="font-medium mb-3">
                  Representantes ({representatives?.length ?? 0})
                </Typography>
                {representatives && representatives.length > 0 ? (
                  <div className="space-y-4">
                    {representatives.map((rep, i) => (
                      <Card key={i} className="border-dashed">
                        <CardContent className="pt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Typography variant="body2" className="font-medium">
                              {rep.name || `Representante ${i + 1}`}
                            </Typography>
                            {rep.taxID && (
                              <Typography variant="caption" className="text-muted-foreground">
                                CPF: {rep.taxID}
                              </Typography>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {rep.email && <DataField label="E-mail" value={rep.email} small />}
                            {rep.phone && <DataField label="Telefone" value={rep.phone} small />}
                            {rep.birthDate && (
                              <DataField label="Data de Nascimento" value={rep.birthDate} small />
                            )}
                          </div>

                          {rep.address && (
                            <div>
                              <Typography variant="caption" className="text-muted-foreground">
                                Endereço
                              </Typography>
                              <Typography variant="caption" className="font-medium block">
                                {rep.address.street}, {rep.address.number} -{' '}
                                {rep.address.neighborhood}, {rep.address.city}/{rep.address.state}{' '}
                                - CEP {rep.address.zipcode}
                                {rep.address.complement ? ` (${rep.address.complement})` : ''}
                              </Typography>
                            </div>
                          )}

                          {rep.documents && rep.documents.length > 0 && (
                            <div>
                              <Typography
                                variant="caption"
                                className="text-muted-foreground font-medium mb-2 block"
                              >
                                Documentos ({rep.documents.length})
                              </Typography>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {rep.documents.map((doc, j) => {
                                  const raw = repDocsMimeMap[doc.fileUrl];
                                  const mimeType = raw?.mimeType ?? inferMimeType(doc.fileUrl);
                                  return (
                                    <FilePreviewCard
                                      key={j}
                                      label={DOC_TYPE_LABELS[doc.type] ?? doc.type}
                                      fileName={raw?.fileName ?? doc.fileUrl.split('/').pop() ?? 'Documento'}
                                      mimeType={mimeType}
                                      previewUrl={doc.fileUrl}
                                      onPreview={setPreviewDoc}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Typography variant="caption" className="text-muted-foreground">
                    Nenhum representante adicionado
                  </Typography>
                )}
              </div>
            </div>
          ) : (
            <Typography variant="body2" className="text-muted-foreground">
              Preencha todas as etapas anteriores para visualizar o resumo.
            </Typography>
          )}

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !hasAllData} size="lg">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar para Análise
            </Button>
          </div>
        </CardContent>
      </Card>

      <FilePreviewDialog data={previewDoc} onClose={() => setPreviewDoc(null)} />
    </div>
  );
};

const DataField: FC<{ label: string; value?: string | null; small?: boolean }> = ({
  label,
  value,
  small,
}) => (
  <div>
    <Typography variant="caption" className="text-muted-foreground">
      {label}
    </Typography>
    <Typography variant={small ? 'caption' : 'body2'} className="font-medium block">
      {value || '—'}
    </Typography>
  </div>
);
