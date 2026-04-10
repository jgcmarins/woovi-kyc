# woovi-kyc — Documentation

## Table of Contents

- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [How It Works](#how-it-works)
- [Callbacks](#callbacks)
- [Payload Format](#payload-format)
- [File Uploads](#file-uploads)
- [Cloudflare R2 Setup Guide](#cloudflare-r2-setup-guide)
- [Customization](#customization)
- [TypeScript Types](#typescript-types)

---

## Installation

```bash
pnpm add woovi-kyc
# or
npm install woovi-kyc
# or
yarn add woovi-kyc
```

**Peer dependencies:** `react` (>=18) and `react-dom` (>=18).

---

## Basic Usage

```tsx
import { KYCWizard } from 'woovi-kyc';

function KYCPage() {
  return (
    <KYCWizard
      cnpj="12345678000100"
      onFileUploaded={async (file, metadata) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', metadata.documentType);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const { url } = await res.json();
        return url;
      }}
      onSubmit={async (data) => {
        await fetch('/api/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }}
      onError={(error) => console.error(error)}
    />
  );
}
```

The wizard queries `brasilapi.com.br/api/cnpj/v1/{cnpj}` and pre-fills: razão social, nome fantasia, CNAE, endereço, sócios.

---

## Configuration

### `KYCConfig` props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `cnpj` | `string` | Yes | Company CNPJ (digits only). Auto-fetches data from BrasilAPI. |
| `onNext` | `(data: KYCPayload) => void` | No | Called when user advances to the next step. |
| `onBack` | `(data: KYCPayload) => void` | No | Called when user goes back to the previous step. |
| `onFileUploaded` | `(file: File, metadata: KYCFileMetadata) => Promise<string>` | No | Called when user selects a file. Upload it and return the public URL. |
| `onFileRemoved` | `(fileUrl: string, data: KYCPayload) => void` | No | Called when a file is removed. |
| `onSubmit` | `(data: KYCPayload) => void \| Promise<void>` | No | Called when user clicks "Submit" on the Review step. |
| `onError` | `(error: Error) => void` | No | Called on any error. |

---

## How It Works

```
User fills form → Files uploaded via onFileUploaded → Review step → onSubmit(data)
```

**Step 1: Company Data** — Pre-filled from BrasilAPI (razão social, nome fantasia, CNAE). User completes business description, product, and goal.

**Step 2: Address** — CEP auto-fill from BrasilAPI. User confirms or adjusts the billing address.

**Step 3: Company Documents** — Upload social contract, ATA, or bylaws. Each file triggers `onFileUploaded`.

**Step 4: Representatives** — Add partners (pre-filled from BrasilAPI). Each needs personal data, address, selfie, and identity document (CNH or RG).

**Step 5: Review & Submit** — Shows all collected data with file previews. On "Enviar", calls `onSubmit(data)` with the full assembled payload.

### State Persistence

Form data is persisted in memory across step navigation within a session. If the user navigates from step 3 back to step 1, their data is preserved. However, data is **lost on page refresh** — this is intentional for v1 simplicity.

---

## Callbacks

All callbacks that receive `data` get the full assembled payload (in Woovi format) at the time of the event.

### `onNext(data)`

Called every time the user advances to the next step. Useful for saving progress to your backend, analytics, or logging.

### `onBack(data)`

Called every time the user navigates back.

### `onFileUploaded(file, metadata) → Promise<string>`

Called when the user selects or captures a file. The library provides the raw `File` object and metadata. **You are responsible for uploading** the file to your storage (S3, R2, GCS, etc.) and returning the public URL.

```tsx
onFileUploaded={async (file, metadata) => {
  // metadata: { documentType: 'CNH', fileName: 'cnh.pdf', mimeType: 'application/pdf' }

  // Example: upload to your backend
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const { url } = await res.json();
  return url; // the library uses this URL in the payload
}}
```

The returned URL is:
- Stored in the in-memory state
- Used for file previews in the UI
- Included in the payload as `fileUrl` (in `companyDocuments` and `representatives[].documents`)

### `onFileRemoved(fileUrl, data)`

Called when the user removes a previously uploaded file. The `fileUrl` is the same URL returned by `onFileUploaded`. You can use this to delete the file from your storage.

### `onSubmit(data)`

Called when the user clicks "Enviar para Análise" on the Review step. This is where you POST the data to your backend, which then forwards it to the Woovi API. Can return a `Promise` — the submit button shows a loading state until it resolves.

### `onError(error)`

Called on any error: BrasilAPI lookup failure, upload failure, or errors thrown by `onSubmit`.

---

## Payload Format

The `data` object passed to callbacks:

```json
{
  "officialName": "Empresa Ltda",
  "tradeName": "Minha Empresa",
  "taxID": "12345678000100",
  "businessDescription": "Comércio varejista de combustíveis",
  "businessProduct": "Gestão de frota e abastecimento",
  "businessLifetime": "5 anos e 3 meses",
  "businessGoal": "Processar pagamentos Pix para abastecimento de frota",
  "billingAddress": {
    "zipcode": "01001000",
    "street": "Praça da Sé",
    "number": "100",
    "neighborhood": "Sé",
    "city": "São Paulo",
    "state": "SP",
    "complement": null
  },
  "companyDocuments": [
    { "type": "SOCIAL_CONTRACT", "fileUrl": "https://your-storage.com/contract.pdf" }
  ],
  "representatives": [
    {
      "name": "João Silva",
      "birthDate": "1990-01-15",
      "email": "joao@empresa.com",
      "taxID": "12345678900",
      "phone": "+5511999999999",
      "address": {
        "zipcode": "04001000",
        "street": "Av Paulista",
        "number": "1000",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP"
      },
      "documents": [
        { "type": "PICTURE", "fileUrl": "https://your-storage.com/selfie.jpg" },
        { "type": "CNH", "fileUrl": "https://your-storage.com/cnh.pdf" }
      ]
    }
  ]
}
```

**Note:** During early steps, the payload contains only the data filled so far. `companyDocuments` and `representatives` will be empty arrays until those steps are completed.

---

## File Uploads

The library is **storage agnostic**. It does not upload files directly. Instead, when a user selects a file, the `onFileUploaded` callback is called with the raw `File` object. You handle the upload and return the public URL.

This means you can use any storage provider: **Cloudflare R2**, **AWS S3**, **Google Cloud Storage**, **Azure Blob Storage**, or even your own backend.

### Recommended: Cloudflare R2

We recommend Cloudflare R2 for its simplicity and zero egress fees. A ready-to-deploy Worker template is included in the [`worker/`](./worker) directory.

```tsx
const UPLOAD_URL = 'https://your-worker.workers.dev';

<KYCWizard
  cnpj="12345678000100"
  onFileUploaded={async (file, metadata) => {
    // 1. Get pre-signed URL from Worker
    const presignRes = await fetch(`${UPLOAD_URL}/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: metadata.fileName, contentType: metadata.mimeType }),
    });
    const { uploadUrl, publicUrl } = await presignRes.json();

    // 2. Upload file directly to R2
    await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': metadata.mimeType } });

    // 3. Return public URL
    return publicUrl;
  }}
/>
```

---

## Cloudflare R2 Setup Guide

### Step 1: Create a Cloudflare account

Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and create a free account.

### Step 2: Install Wrangler

```bash
pnpm add -g wrangler
wrangler login
```

### Step 3: Create an R2 bucket

```bash
wrangler r2 bucket create woovi-kyc-uploads
```

### Step 4: Deploy the Worker

```bash
cd worker
pnpm install
```

Edit `wrangler.toml`:
- Set `ALLOWED_ORIGINS` to your app's domain(s)
- Set `R2_PUBLIC_URL` to the deployed Worker URL + `/file`

```bash
pnpm run deploy
```

Wrangler outputs the Worker URL, e.g. `https://woovi-kyc-upload.yourname.workers.dev`.

### Step 5: Update `R2_PUBLIC_URL`

After the first deploy, update `wrangler.toml`:

```toml
R2_PUBLIC_URL = "https://woovi-kyc-upload.yourname.workers.dev/file"
```

Redeploy: `pnpm run deploy`

### Local Development

```bash
cd worker
pnpm run dev  # starts on http://localhost:8787
```

R2 is emulated locally by Wrangler. The `R2_PUBLIC_URL` defaults to `http://localhost:8787/file`.

### Security Notes

- **No API keys on the frontend.** The Worker accesses R2 via a binding, not credentials.
- **CORS protection.** Set `ALLOWED_ORIGINS` in `wrangler.toml` to restrict which domains can upload.
- **Random file paths.** Files are stored under `kyc/{uuid}/{fileName}`, making URLs unguessable.

---

## Customization

### Using individual components

```tsx
import { KYCProvider, useKYC, KYCStepper } from 'woovi-kyc';

function CustomWizard() {
  return (
    <KYCProvider config={{ cnpj: '12345678000100' }}>
      <KYCStepper />
      <MyCustomStepRenderer />
    </KYCProvider>
  );
}
```

### Accessing the CNPJ lookup utility

```tsx
import { fetchCnpjData } from 'woovi-kyc';

const company = await fetchCnpjData('12345678000100');
```

---

## TypeScript Types

```typescript
import type {
  KYCConfig,
  KYCCompanyData,
  KYCAddress,
  KYCUploadedDocument,
  KYCFileMetadata,
  KYCPayload,
} from 'woovi-kyc';
```

### `KYCConfig`

```typescript
type KYCConfig = {
  cnpj: string;
  onNext?: (data: KYCPayload) => void;
  onBack?: (data: KYCPayload) => void;
  onFileUploaded?: (file: File, metadata: KYCFileMetadata) => Promise<string>;
  onFileRemoved?: (fileUrl: string, data: KYCPayload) => void;
  onSubmit?: (data: KYCPayload) => void | Promise<void>;
  onError?: (error: Error) => void;
};
```

### `KYCFileMetadata`

```typescript
type KYCFileMetadata = {
  documentType: string;
  fileName: string;
  mimeType: string;
};
```

### `KYCPayload`

```typescript
type KYCPayload = Record<string, unknown>;
```

### `KYCUploadedDocument`

```typescript
type KYCUploadedDocument = {
  id: string;
  documentType: string;
  url: string;
  fileName: string;
  mimeType: string;
};
```

### `KYCCompanyData`

```typescript
type KYCCompanyData = {
  name: string | null;
  friendlyName: string | null;
  taxId: string | null;
  cnaeCode: number | null;
  cnaeDescription: string | null;
  businessStartDate: string | null;
  location: { ... } | null;
  partners: readonly { name: string | null }[] | null;
};
```

### `KYCAddress`

```typescript
type KYCAddress = {
  zipcode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string | null;
};
```
