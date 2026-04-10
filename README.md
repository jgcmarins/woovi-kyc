# woovi-kyc

Open-source React KYC wizard for opening Woovi accounts. Handles the full onboarding UI: company data, address, document uploads, and representative information.

**[Live Demo](https://woovi-kyc-demo.vercel.app/)**

## Screenshots

| Company Data | Address | Documents |
|:---:|:---:|:---:|
| ![Company Data](https://raw.githubusercontent.com/jgcmarins/woovi-kyc/main/images/1.png) | ![Address](https://raw.githubusercontent.com/jgcmarins/woovi-kyc/main/images/2.png) | ![Documents](https://raw.githubusercontent.com/jgcmarins/woovi-kyc/main/images/3.png) |

## Features

- **CNPJ auto-fill** — fetches company data from BrasilAPI
- **CEP auto-fill** — fetches address from BrasilAPI
- **Storage agnostic** — you handle file uploads (S3, R2, GCS, etc.)
- **Callback-driven** — 5 callbacks give you full control over what happens at each step
- **5-step wizard** — Company Data → Address → Documents → Representatives → Review
- **In-memory persistence** — form data persists across step navigation within a session

## Quick Start

```bash
pnpm add woovi-kyc
# or
npm install woovi-kyc
# or
yarn add woovi-kyc
```

**Peer dependencies:** `react` (>=18) and `react-dom` (>=18).

```tsx
import { KYCWizard } from 'woovi-kyc';

function App() {
  return (
    <KYCWizard
      cnpj="12345678000100"
      onFileUploaded={async (file, metadata) => {
        // Upload to your storage (S3, R2, GCS, etc.)
        const url = await myUploadFunction(file, metadata);
        return url; // return the public URL
      }}
      onSubmit={(data) => {
        // POST data to your backend → forward to Woovi API
        console.log('Submit!', data);
      }}
      onError={(error) => console.error(error)}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `cnpj` | `string` | Yes | Company CNPJ (digits only). Auto-fetches data from BrasilAPI. |
| `onNext` | `(data) => void` | No | Called when user advances a step. Receives the full assembled payload. |
| `onBack` | `(data) => void` | No | Called when user goes back a step. Receives the full assembled payload. |
| `onFileUploaded` | `(file, metadata) => Promise<string>` | No | Called when user selects a file. You upload it and return the public URL. |
| `onFileRemoved` | `(fileUrl, data) => void` | No | Called when a file is removed. Receives the file URL and full payload. |
| `onSubmit` | `(data) => void \| Promise<void>` | No | Called when user clicks "Submit" on the Review step. Receives the final payload. |
| `onError` | `(error: Error) => void` | No | Called on any error (BrasilAPI, upload, etc.). |

## Payload Format

All callbacks receive a `data` object in this format:

```json
{
  "officialName": "Empresa Ltda",
  "tradeName": "Minha Empresa",
  "taxID": "12345678000100",
  "businessDescription": "...",
  "businessProduct": "...",
  "businessLifetime": "...",
  "businessGoal": "...",
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
    { "type": "SOCIAL_CONTRACT", "fileUrl": "https://your-storage/..." }
  ],
  "representatives": [
    {
      "name": "João Silva",
      "birthDate": "1990-01-15",
      "email": "joao@empresa.com",
      "taxID": "12345678900",
      "phone": "+5511999999999",
      "address": { ... },
      "documents": [
        { "type": "PICTURE", "fileUrl": "https://your-storage/..." },
        { "type": "CNH", "fileUrl": "https://your-storage/..." }
      ]
    }
  ]
}
```

## File Uploads

The library is **storage agnostic**. When a user selects a file, `onFileUploaded` is called with the raw `File` object and metadata. You handle the upload and return the public URL.

We recommend **Cloudflare R2** for its simplicity and zero egress fees. See the `worker/` directory for a ready-to-deploy Worker template. See [DOCS.md](./DOCS.md) for the full setup guide.

## Documentation

See [DOCS.md](./DOCS.md) for detailed documentation including Cloudflare R2 setup, customization, and TypeScript types.

## License

MIT
