import type { KYCUploadedDocument, KYCPayload } from '../types';

type RepDocumentsMap = Record<number, KYCUploadedDocument[]>;

type StepsFormData = Record<string, Record<string, unknown>>;

function brToIso(br: string): string {
  if (!br) return '';
  const [d, m, y] = br.split('/');
  return d && m && y ? `${y}-${m}-${d}` : br;
}

export function assemblePayload(stepsData: StepsFormData): KYCPayload {
  const companyData = stepsData['company-data'] as Record<string, string> | undefined;
  const addressData = stepsData['address'] as { billingAddress?: Record<string, string> } | undefined;
  const companyDocsData = stepsData['company-documents'] as { documents?: KYCUploadedDocument[] } | undefined;
  const repsData = stepsData['representatives'] as {
    representatives?: Array<{
      name: string;
      birthDate: string;
      email: string;
      taxID: string;
      phone: string;
      address: Record<string, string>;
    }>;
    repDocuments?: RepDocumentsMap;
  } | undefined;

  const companyDocuments = (companyDocsData?.documents ?? []).map((doc) => ({
    type: doc.documentType,
    fileUrl: doc.url,
  }));

  const representatives = (repsData?.representatives ?? []).map((rep, idx) => {
    const docs = (repsData?.repDocuments?.[idx] ?? []).map((doc) => ({
      type: doc.documentType,
      fileUrl: doc.url,
    }));

    return {
      name: rep.name,
      birthDate: brToIso(rep.birthDate),
      email: rep.email,
      taxID: rep.taxID,
      phone: rep.phone,
      address: rep.address,
      documents: docs,
    };
  });

  return {
    officialName: companyData?.officialName ?? '',
    tradeName: companyData?.tradeName ?? '',
    taxID: companyData?.taxID ?? '',
    businessDescription: companyData?.businessDescription ?? '',
    businessProduct: companyData?.businessProduct ?? '',
    businessLifetime: companyData?.businessLifetime ?? '',
    businessGoal: companyData?.businessGoal ?? '',
    billingAddress: addressData?.billingAddress ?? {},
    companyDocuments,
    representatives,
  };
}
