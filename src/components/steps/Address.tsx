import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FC, useMemo } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useKYC } from '../../context/KYCContext';
import { Button, Card, CardContent, Typography } from '../../ui';
import { AddressFields } from '../AddressFields';

const addressSchema = z.object({
  billingAddress: z.object({
    zipcode: z.string().min(1, 'CEP é obrigatório'),
    street: z.string().min(1, 'Rua é obrigatória'),
    number: z.string().min(1, 'Número é obrigatório'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
    complement: z.string().optional(),
  }),
});

type AddressValues = z.infer<typeof addressSchema>;

export const Address: FC = () => {
  const { company, goToNextStep, goToPreviousStep, markStepCompleted, saveStepData, getStepData, notifyNext, notifyBack } =
    useKYC();

  const savedData = getStepData('address') as { billingAddress?: Record<string, string> } | null;

  const defaultValues: AddressValues = useMemo(
    () => ({
      billingAddress: {
        zipcode: savedData?.billingAddress?.zipcode || company?.location?.postalCode || '',
        street: savedData?.billingAddress?.street || company?.location?.street || '',
        number: savedData?.billingAddress?.number || company?.location?.addressNumber || '',
        neighborhood: savedData?.billingAddress?.neighborhood || company?.location?.neighborhood || '',
        city: savedData?.billingAddress?.city || company?.location?.city || '',
        state: savedData?.billingAddress?.state || company?.location?.region || '',
        complement: savedData?.billingAddress?.complement || '',
      },
    }),
    [savedData, company],
  );

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, formState } = form;

  const onSubmit: SubmitHandler<AddressValues> = (values) => {
    const stepData = values as unknown as Record<string, unknown>;
    saveStepData('address', stepData);
    markStepCompleted('address');
    notifyNext({ 'address': stepData });
    goToNextStep();
  };

  const handleBack = () => {
    notifyBack();
    goToPreviousStep();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Typography variant="h6" className="mb-1">
          Endereço de Cobrança
        </Typography>
        <Typography variant="body2" className="text-muted-foreground mb-2">
          Informe o endereço comercial da empresa.
        </Typography>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AddressFields prefix="billingAddress" />

            <div className="flex justify-between pt-4">
              <Button type="button" variant="outline" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button type="submit" disabled={!formState.isValid}>
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
