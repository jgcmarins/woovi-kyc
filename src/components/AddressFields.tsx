import { Loader2 } from 'lucide-react';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { toast } from 'sonner';

import { ControlledTextField, Typography } from '../ui';

type AddressFieldsProps = {
  prefix: string;
  disabled?: boolean;
};

const BRASIL_API_CEP_URL = 'https://brasilapi.com.br/api/cep/v1';

export const AddressFields: FC<AddressFieldsProps> = ({ prefix, disabled }) => {
  const { control, setValue, watch } = useFormContext();
  const [loadingCep, setLoadingCep] = useState(false);
  const lastFetchedCep = useRef('');

  const zipcode = watch(`${prefix}.zipcode`) as string | undefined;

  const fetchCep = useCallback(
    async (cep: string) => {
      if (lastFetchedCep.current === cep) return;
      lastFetchedCep.current = cep;

      setLoadingCep(true);
      try {
        const response = await fetch(`${BRASIL_API_CEP_URL}/${cep}`);
        if (!response.ok) return;

        const data = await response.json();

        if (data.street) setValue(`${prefix}.street`, data.street, { shouldDirty: true });
        if (data.neighborhood)
          setValue(`${prefix}.neighborhood`, data.neighborhood, { shouldDirty: true });
        if (data.city) setValue(`${prefix}.city`, data.city, { shouldDirty: true });
        if (data.state) setValue(`${prefix}.state`, data.state, { shouldDirty: true });
      } catch {
        toast.error('Erro ao buscar CEP.');
      } finally {
        setLoadingCep(false);
      }
    },
    [prefix, setValue],
  );

  useEffect(() => {
    const cleaned = zipcode?.replace(/\D/g, '') ?? '';
    if (cleaned.length === 8) {
      fetchCep(cleaned);
    }
  }, [zipcode, fetchCep]);

  return (
    <div className="space-y-4">
      <Typography variant="body2" className="text-muted-foreground">
        Ao digitar o CEP, os campos serão preenchidos automaticamente.
      </Typography>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative">
          <ControlledTextField
            name={`${prefix}.zipcode`}
            control={control}
            label="CEP"
            placeholder="00000-000"
            disabled={disabled}
          />
          {loadingCep && (
            <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <ControlledTextField
          name={`${prefix}.state`}
          control={control}
          label="Estado"
          placeholder="SP"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <ControlledTextField
            name={`${prefix}.street`}
            control={control}
            label="Rua"
            placeholder="Rua Exemplo"
            disabled={disabled}
          />
        </div>
        <ControlledTextField
          name={`${prefix}.number`}
          control={control}
          label="Número"
          placeholder="123"
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ControlledTextField
          name={`${prefix}.neighborhood`}
          control={control}
          label="Bairro"
          placeholder="Centro"
          disabled={disabled}
        />
        <ControlledTextField
          name={`${prefix}.city`}
          control={control}
          label="Cidade"
          placeholder="São Paulo"
          disabled={disabled}
        />
      </div>
      <ControlledTextField
        name={`${prefix}.complement`}
        control={control}
        label="Complemento"
        placeholder="Sala 101 (opcional)"
        disabled={disabled}
      />
    </div>
  );
};
