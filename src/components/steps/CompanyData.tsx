import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { FC, useMemo } from 'react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useKYC } from '../../context/KYCContext';
import { Button, Card, CardContent, ControlledTextField, Typography } from '../../ui';

const companyDataSchema = z.object({
  officialName: z.string().min(1, 'Razão Social é obrigatória'),
  tradeName: z.string().min(1, 'Nome Fantasia é obrigatório'),
  taxID: z.string().min(1, 'CNPJ é obrigatório'),
  businessDescription: z.string().min(1, 'Descrição do Negócio é obrigatória'),
  businessProduct: z.string().min(1, 'Produto/Serviço é obrigatório'),
  businessLifetime: z.string().min(1, 'Tempo de Atividade é obrigatório'),
  businessGoal: z.string().min(1, 'Objetivo da Conta é obrigatório'),
});

type CompanyDataValues = z.infer<typeof companyDataSchema>;

function formatBusinessLifetime(startDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years > 0 && months > 0)
    return `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}`;
  if (years > 0) return `${years} ano${years > 1 ? 's' : ''}`;
  if (months > 0) return `${months} ${months > 1 ? 'meses' : 'mês'}`;
  return 'Menos de 1 mês';
}

export const CompanyData: FC = () => {
  const { company, goToNextStep, markStepCompleted, saveStepData, getStepData, notifyNext } = useKYC();

  const savedData = getStepData('company-data');

  const defaultValues: CompanyDataValues = useMemo(
    () => ({
      officialName: (savedData?.officialName as string) || company?.name || '',
      tradeName: (savedData?.tradeName as string) || company?.friendlyName || '',
      taxID: (savedData?.taxID as string) || company?.taxId || '',
      businessDescription: (savedData?.businessDescription as string) || company?.cnaeDescription || '',
      businessProduct: (savedData?.businessProduct as string) || '',
      businessLifetime: (savedData?.businessLifetime as string) || (company?.businessStartDate ? formatBusinessLifetime(company.businessStartDate) : ''),
      businessGoal: (savedData?.businessGoal as string) || '',
    }),
    [savedData, company],
  );

  const form = useForm<CompanyDataValues>({
    resolver: zodResolver(companyDataSchema),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, formState } = form;

  const onSubmit: SubmitHandler<CompanyDataValues> = (values) => {
    saveStepData('company-data', values);
    markStepCompleted('company-data');
    notifyNext({ 'company-data': values });
    goToNextStep();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Typography variant="h6" className="mb-1">
          Dados da Empresa
        </Typography>
        <Typography variant="body2" className="text-muted-foreground mb-6">
          Informe os dados básicos da empresa. Esses dados serão utilizados para o registro da conta.
        </Typography>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <ControlledTextField
                  name="officialName"
                  control={form.control}
                  label="Razão Social"
                  placeholder="Empresa Ltda"
                  disabled={true}
                />
                <Typography variant="caption" className="text-muted-foreground mt-1">
                  Nome oficial registrado na Receita Federal
                </Typography>
              </div>
              <ControlledTextField
                name="tradeName"
                control={form.control}
                label="Nome Fantasia"
                placeholder="Minha Empresa"
              />
            </div>

            <div>
              <ControlledTextField
                name="taxID"
                control={form.control}
                label="CNPJ"
                placeholder="00.000.000/0000-00"
                mask="00.000.000/0000-00"
                disabled={true}
              />
            </div>

            <ControlledTextField
              name="businessDescription"
              control={form.control}
              label="Descrição do Negócio"
              placeholder="Ex: Transporte e logística de cargas"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ControlledTextField
                name="businessProduct"
                control={form.control}
                label="Produto/Serviço"
                placeholder="Ex: Gestão de frota e abastecimento"
              />
              <ControlledTextField
                name="businessLifetime"
                control={form.control}
                label="Tempo de Atividade"
                placeholder="Ex: 5 anos"
              />
            </div>

            <ControlledTextField
              name="businessGoal"
              control={form.control}
              label="Objetivo da Conta"
              placeholder="Ex: Processar pagamentos Pix para abastecimento de frota"
            />

            <div className="flex justify-end pt-4">
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
