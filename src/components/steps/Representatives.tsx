import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useKYC } from '../../context/KYCContext';
import type { KYCUploadedDocument } from '../../types';
import { Button, Card, CardContent, ControlledTextField, Separator, Typography } from '../../ui';
import { AddressFields } from '../AddressFields';
import { RepDocuments } from '../RepDocuments';

const addressSchema = z.object({
  zipcode: z.string().min(1, 'CEP é obrigatório'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(1, 'Estado é obrigatório'),
  complement: z.string().optional(),
});

const representativeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  email: z.string().email('E-mail inválido'),
  taxID: z.string().min(1, 'CPF é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  address: addressSchema,
  hasSelfie: z.boolean().refine((v) => v, { message: 'Selfie é obrigatória' }),
  hasIdentityDoc: z
    .boolean()
    .refine((v) => v, { message: 'Documento de identidade (CNH ou RG) é obrigatório' }),
});

const representativesFormSchema = z.object({
  representatives: z
    .array(representativeSchema)
    .min(1, 'Pelo menos um representante é obrigatório'),
});

type RepresentativesFormInput = z.input<typeof representativesFormSchema>;
type RepresentativesFormValues = z.infer<typeof representativesFormSchema>;

type RepDocumentsMap = Record<number, KYCUploadedDocument[]>;

const EMPTY_ADDRESS = {
  zipcode: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
  state: '',
  complement: '',
};

const EMPTY_REP = {
  name: '',
  birthDate: '',
  email: '',
  taxID: '',
  phone: '',
  address: { ...EMPTY_ADDRESS },
  hasSelfie: false as boolean,
  hasIdentityDoc: false as boolean,
};

export const Representatives: FC = () => {
  const {
    company,
    goToNextStep,
    goToPreviousStep,
    markStepCompleted,
    saveStepData,
    getStepData,
    notifyNext,
    notifyBack,
  } = useKYC();

  const savedData = getStepData('representatives') as {
    representatives?: typeof EMPTY_REP[];
    repDocuments?: RepDocumentsMap;
  } | null;

  const buildDefaultReps = useMemo(() => {
    if (savedData?.representatives && savedData.representatives.length > 0) {
      return savedData.representatives;
    }

    if (company?.partners && company.partners.length > 0) {
      return company.partners.map((p) => ({
        ...EMPTY_REP,
        name: p.name || '',
        address: { ...EMPTY_ADDRESS },
      }));
    }

    return [{ ...EMPTY_REP }];
  }, [savedData, company?.partners]);

  const [repDocuments, setRepDocuments] = useState<RepDocumentsMap>(savedData?.repDocuments ?? {});

  const form = useForm<RepresentativesFormInput, unknown, RepresentativesFormValues>({
    resolver: zodResolver(representativesFormSchema),
    defaultValues: { representatives: buildDefaultReps },
    mode: 'onChange',
  });

  const { control, handleSubmit, formState, setValue } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'representatives' });

  const syncDocStatus = useCallback(
    (repIndex: number, docs: KYCUploadedDocument[]) => {
      const hasSelfie = docs.some((d) => d.documentType === 'PICTURE');
      const hasIdentityDoc =
        docs.some((d) => d.documentType === 'CNH') ||
        (docs.some((d) => d.documentType === 'CNH_FRONT') &&
          docs.some((d) => d.documentType === 'CNH_BACK')) ||
        (docs.some((d) => d.documentType === 'IDENTITY_FRONT') &&
          docs.some((d) => d.documentType === 'IDENTITY_BACK'));

      setValue(`representatives.${repIndex}.hasSelfie`, hasSelfie, { shouldValidate: true });
      setValue(`representatives.${repIndex}.hasIdentityDoc`, hasIdentityDoc, {
        shouldValidate: true,
      });
    },
    [setValue],
  );

  const handleDocUploaded = useCallback(
    (repIndex: number, doc: KYCUploadedDocument) => {
      setRepDocuments((prev) => {
        const updated = { ...prev, [repIndex]: [...(prev[repIndex] || []), doc] };
        syncDocStatus(repIndex, updated[repIndex]);
        return updated;
      });
    },
    [syncDocStatus],
  );

  const handleDocRemoved = useCallback(
    (repIndex: number, docId: string) => {
      setRepDocuments((prev) => {
        const updated = {
          ...prev,
          [repIndex]: (prev[repIndex] || []).filter((d) => d.id !== docId),
        };
        syncDocStatus(repIndex, updated[repIndex]);
        return updated;
      });
    },
    [syncDocStatus],
  );

  const onSubmit = useCallback(
    (values: RepresentativesFormValues) => {
      const stepData = {
        representatives: values.representatives,
        repDocuments,
      } as unknown as Record<string, unknown>;
      saveStepData('representatives', stepData);
      markStepCompleted('representatives');
      notifyNext({ 'representatives': stepData });
      goToNextStep();
    },
    [repDocuments, goToNextStep, markStepCompleted, saveStepData, notifyNext],
  );

  const handleBack = useCallback(() => {
    notifyBack();
    goToPreviousStep();
  }, [notifyBack, goToPreviousStep]);

  return (
    <Card>
      <CardContent className="pt-6">
        <Typography variant="h6" className="mb-1">
          Representantes
        </Typography>
        <Typography variant="body2" className="text-muted-foreground mb-6">
          Adicione os sócios ou representantes legais da empresa. Cada representante precisa
          fornecer seus dados pessoais e enviar os seguintes documentos: uma selfie/foto e a CNH
          (completa ou frente e verso) ou RG (frente e verso).
        </Typography>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Typography variant="h6">Representante {index + 1}</Typography>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          remove(index);
                          setRepDocuments((prev) => {
                            const next = { ...prev };
                            delete next[index];
                            const reindexed: RepDocumentsMap = {};
                            Object.keys(next)
                              .map(Number)
                              .sort((a, b) => a - b)
                              .forEach((key, i) => {
                                reindexed[i] = next[key];
                              });
                            return reindexed;
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ControlledTextField
                      name={`representatives.${index}.name`}
                      control={control}
                      label="Nome Completo"
                      placeholder="Nome e sobrenome"
                    />
                    <div>
                      <ControlledTextField
                        name={`representatives.${index}.birthDate`}
                        control={control}
                        label="Data de Nascimento"
                        placeholder="DD/MM/AAAA"
                        mask="00/00/0000"
                      />
                      <Typography variant="caption" className="text-muted-foreground mt-1">
                        No formato dia/mês/ano
                      </Typography>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ControlledTextField
                      name={`representatives.${index}.email`}
                      control={control}
                      label="E-mail"
                      placeholder="email@exemplo.com"
                    />
                    <div>
                      <ControlledTextField
                        name={`representatives.${index}.taxID`}
                        control={control}
                        label="CPF"
                        placeholder="000.000.000-00"
                        mask="000.000.000-00"
                      />
                      <Typography variant="caption" className="text-muted-foreground mt-1">
                        CPF do representante (somente números)
                      </Typography>
                    </div>
                  </div>

                  <div>
                    <ControlledTextField
                      name={`representatives.${index}.phone`}
                      control={control}
                      label="Telefone"
                      placeholder="+55 11 99999-9999"
                    />
                    <Typography variant="caption" className="text-muted-foreground mt-1">
                      Inclua o código do país e DDD
                    </Typography>
                  </div>

                  <Separator />

                  <Typography variant="body2" className="font-medium">
                    Endereço do Representante
                  </Typography>
                  <AddressFields prefix={`representatives.${index}.address`} />

                  <Separator />

                  <div>
                    <Typography variant="body2" className="font-medium mb-1">
                      Documentos do Representante
                    </Typography>
                    <Typography variant="caption" className="text-muted-foreground mb-4 block">
                      Envie: 1) Uma selfie/foto do representante. 2) CNH completa, ou CNH
                      frente/verso, ou RG frente/verso.
                    </Typography>
                    <RepDocuments
                      documents={repDocuments[index] || []}
                      onDocumentUploaded={(doc) => handleDocUploaded(index, doc)}
                      onDocumentRemoved={(docId) => handleDocRemoved(index, docId)}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={() => append({ ...EMPTY_REP })}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Representante
            </Button>

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button
                type="submit"
                disabled={!formState.isValid || formState.isSubmitting}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Próximo
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};
