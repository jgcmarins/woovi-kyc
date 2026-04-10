# Cloudflare R2 Setup Guide

Step-by-step guide to set up Cloudflare R2 as the file storage backend for `woovi-kyc`.

This is **optional** — the library is storage agnostic and works with any provider (S3, GCS, Azure, etc.). We recommend R2 for its simplicity and zero egress fees.

---

## Step 1: Create a Cloudflare account

Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and create a free account.

R2 requires a payment method on file (free tier: 10GB storage, 10M reads/month, 1M writes/month).

---

## Step 2: Install Wrangler

```bash
pnpm add -g wrangler
wrangler login
```

---

## Step 3: Create an R2 bucket

```bash
wrangler r2 bucket create woovi-kyc-uploads
```

---

## Step 4: Configure the Worker

The `worker/` directory in this repository contains a ready-to-deploy Cloudflare Worker that handles presigned URLs, file uploads, and file serving.

```bash
cd worker
pnpm install
```

There are two config files:

- `wrangler-local.toml` — for local development (localhost URLs)
- `wrangler-cf.toml` — for Cloudflare production

Edit `wrangler-cf.toml`:
- Set `ALLOWED_ORIGINS` to your app's domain(s)
- Set `R2_PUBLIC_URL` to the deployed Worker URL + `/file`

---

## Step 5: Deploy

```bash
pnpm run deploy
```

Wrangler outputs the Worker URL, e.g. `https://woovi-kyc-upload.yourname.workers.dev`.

---

## Step 6: Update `R2_PUBLIC_URL`

After the first deploy, update `wrangler-cf.toml`:

```toml
R2_PUBLIC_URL = "https://woovi-kyc-upload.yourname.workers.dev/file"
```

Redeploy: `pnpm run deploy`

---

## Local Development

```bash
cd worker
pnpm run dev  # starts on http://localhost:8787
```

R2 is emulated locally by Wrangler. Files are stored in a local directory, not in the cloud.

---

## Usage with woovi-kyc

Pass the Worker URL to your `onFileUploaded` callback:

```tsx
const UPLOAD_URL = 'https://woovi-kyc-upload.yourname.workers.dev';

<KYCWizard
  cnpj="12345678000100"
  onFileUploaded={async (file, metadata) => {
    // 1. Get pre-signed URL from Worker
    const presignRes = await fetch(`${UPLOAD_URL}/presign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: metadata.fileName,
        contentType: metadata.mimeType,
        prefix: `${cnpj}/company`, // optional: organize by CNPJ
      }),
    });
    const { uploadUrl, publicUrl } = await presignRes.json();

    // 2. Upload file directly to R2
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': metadata.mimeType },
    });

    // 3. Return public URL
    return publicUrl;
  }}
/>
```

---

## Security Notes

- **No API keys on the frontend.** The Worker accesses R2 via a binding, not credentials.
- **CORS protection.** Set `ALLOWED_ORIGINS` in `wrangler-cf.toml` to restrict which domains can upload.
- **File organization.** Files are stored under `kyc/{prefix}/{fileName}`. Use the `prefix` parameter to organize by CNPJ or other identifiers.
