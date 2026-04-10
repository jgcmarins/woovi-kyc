export type KYCAddress = {
  zipcode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string | null;
};

export type KYCCompanyData = {
  name: string | null;
  friendlyName: string | null;
  taxId: string | null;
  cnaeCode: number | null;
  cnaeDescription: string | null;
  businessStartDate: string | null;
  location: {
    street: string | null;
    addressNumber: string | null;
    neighborhood: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
  } | null;
  partners: readonly { name: string | null }[] | null;
};

export type KYCUploadedDocument = {
  id: string;
  documentType: string;
  url: string;
  fileName: string;
  mimeType: string;
};

export type KYCFileMetadata = {
  documentType: string;
  fileName: string;
  mimeType: string;
};

export type KYCPayload = Record<string, unknown>;

export type KYCConfig = {
  cnpj: string;
  onNext?: (data: KYCPayload) => void;
  onBack?: (data: KYCPayload) => void;
  onFileUploaded?: (file: File, metadata: KYCFileMetadata) => Promise<string>;
  onFileRemoved?: (fileUrl: string, data: KYCPayload) => void;
  onSubmit?: (data: KYCPayload) => void | Promise<void>;
  onError?: (error: Error) => void;
};
