# woovi-kyc demo

Next.js app for testing the `woovi-kyc` library locally.

## Setup

```bash
pnpm install
```

Copy `.env.example` to `.env.local` and adjust if needed:

```bash
cp .env.example .env.local
```

## Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## File Uploads (optional)

To test file uploads locally, start the Cloudflare Worker:

```bash
cd ../worker
pnpm install
pnpm dev
```

The worker starts on `http://localhost:8787` and emulates R2 locally.

## Deploy on Vercel

1. Push to GitHub
2. Import the `demo/` directory on [Vercel](https://vercel.com)
3. Set the **Root Directory** to `demo`
4. Add environment variable `NEXT_PUBLIC_UPLOAD_URL` pointing to your deployed Cloudflare Worker
