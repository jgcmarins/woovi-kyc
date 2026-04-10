# woovi-kyc Upload Worker

Cloudflare Worker that handles file uploads to R2 for the `woovi-kyc` package.

**No API keys are exposed to the frontend.** The Worker accesses R2 through a binding configured in `wrangler.toml`.

## How it works

```
Browser                     Worker                    R2 Bucket
  │                           │                          │
  │ POST /presign             │                          │
  │ { fileName, contentType } │                          │
  │ ─────────────────────────>│                          │
  │ { uploadUrl, publicUrl }  │                          │
  │ <─────────────────────────│                          │
  │                           │                          │
  │ PUT /upload/{key}         │                          │
  │ [file bytes]              │  put(key, body)          │
  │ ─────────────────────────>│ ────────────────────────>│
  │ { url, key }              │                          │
  │ <─────────────────────────│                          │
  │                           │                          │
  │ GET /file/{key}           │  get(key)                │
  │ ─────────────────────────>│ ────────────────────────>│
  │ [file bytes]              │ [file bytes]             │
  │ <─────────────────────────│ <────────────────────────│
```

## Setup

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Node.js 18+

### 1. Install dependencies

```bash
cd worker
pnpm install
```

### 2. Login to Cloudflare

```bash
pnpm wrangler login
```

### 3. Create the R2 bucket

```bash
pnpm wrangler r2 bucket create woovi-kyc-uploads
```

### 4. Configure `wrangler.toml`

Edit `wrangler.toml` and update:

- `R2_PUBLIC_URL` — where uploaded files will be accessible. By default, the Worker itself serves files at `/file/{key}`. If you deploy to `https://woovi-kyc-upload.yourname.workers.dev`, set it to `https://woovi-kyc-upload.yourname.workers.dev/file`.

- `ALLOWED_ORIGINS` — comma-separated list of allowed origins for CORS. Add your app's domain.

### 5. Local development

```bash
pnpm run dev
```

The Worker will start on `http://localhost:8787`. Use this as the `uploadUrl` in your app:

```tsx
<KYCWizard
  uploadUrl="http://localhost:8787"
  // ...
/>
```

### 6. Deploy to production

```bash
pnpm run deploy
```

After deploy, Wrangler prints the Worker URL (e.g. `https://woovi-kyc-upload.yourname.workers.dev`). Update `R2_PUBLIC_URL` in `wrangler.toml` and redeploy:

```toml
R2_PUBLIC_URL = "https://woovi-kyc-upload.yourname.workers.dev/file"
ALLOWED_ORIGINS = "https://yourapp.com"
```

```bash
pnpm run deploy
```

## API Reference

### `POST /presign`

Request a pre-signed upload URL.

**Request:**
```json
{
  "fileName": "document.pdf",
  "contentType": "application/pdf"
}
```

**Response:**
```json
{
  "uploadUrl": "https://worker-url/upload/kyc/uuid/document.pdf",
  "publicUrl": "https://worker-url/file/kyc/uuid/document.pdf",
  "key": "kyc/uuid/document.pdf"
}
```

### `PUT /upload/{key}`

Upload a file. Send the raw file as the request body with the correct `Content-Type` header.

**Response:**
```json
{
  "url": "https://worker-url/file/kyc/uuid/document.pdf",
  "key": "kyc/uuid/document.pdf"
}
```

### `GET /file/{key}`

Download/preview a file. Returns the raw file with correct `Content-Type` and caching headers.

### `GET /health`

Health check endpoint.

## Security

- The Worker accesses R2 through a **binding**, not API keys. The binding is configured in `wrangler.toml` and only the Worker can use it.
- CORS restricts which origins can call the Worker. Always set `ALLOWED_ORIGINS` to your app's domain in production.
- Files are stored with a random UUID prefix, making them unguessable.
- For additional security, you can add authentication (e.g. check a Bearer token from your backend).
