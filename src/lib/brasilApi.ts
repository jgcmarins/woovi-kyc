import type { KYCCompanyData } from '../types';

const BRASIL_API_CNPJ_URL = 'https://brasilapi.com.br/api/cnpj/v1';

type BrasilApiCnpjResponse = {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  cnae_fiscal: number;
  cnae_fiscal_descricao: string;
  data_inicio_atividade: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  qsa: readonly { nome_socio: string }[];
};

export async function fetchCnpjData(cnpj: string): Promise<KYCCompanyData> {
  const cleaned = cnpj.replace(/\D/g, '');
  const response = await fetch(`${BRASIL_API_CNPJ_URL}/${cleaned}`);

  if (!response.ok) {
    throw new Error(`BrasilAPI CNPJ lookup failed: ${response.status}`);
  }

  const data: BrasilApiCnpjResponse = await response.json();

  return {
    name: data.razao_social || null,
    friendlyName: data.nome_fantasia || null,
    taxId: data.cnpj || cleaned,
    cnaeCode: data.cnae_fiscal || null,
    cnaeDescription: data.cnae_fiscal_descricao || null,
    businessStartDate: data.data_inicio_atividade || null,
    location: {
      street: data.logradouro || null,
      addressNumber: data.numero || null,
      neighborhood: data.bairro || null,
      city: data.municipio || null,
      region: data.uf || null,
      postalCode: data.cep || null,
    },
    partners: data.qsa?.map((p) => ({ name: p.nome_socio || null })) ?? null,
  };
}
