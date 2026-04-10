interface Env {
  KYC_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
  ALLOWED_ORIGINS: string;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getAllowedOrigins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
}

function getCorsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = getAllowedOrigins(env);
  const isAllowed = allowed.includes('*') || allowed.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function corsResponse(request: Request, env: Env): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(request, env) });
}

function withCors(response: Response, request: Request, env: Env): Response {
  const cors = getCorsHeaders(request, env);
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(cors)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}

// POST /presign — generate an upload URL (the Worker itself acts as upload proxy)
async function handlePresign(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as { fileName?: string; contentType?: string; prefix?: string };
  const { fileName, contentType, prefix } = body;

  if (!fileName || !contentType) {
    return json({ error: 'fileName and contentType are required' }, 400);
  }

  const basePath = prefix ? `kyc/${prefix}` : `kyc/${crypto.randomUUID()}`;
  const key = `${basePath}/${fileName}`;

  const workerUrl = new URL(request.url);
  const uploadUrl = `${workerUrl.origin}/upload/${key}`;
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return json({ uploadUrl, publicUrl, key });
}

// PUT /upload/:key — receive file and store in R2
async function handleUpload(request: Request, env: Env, key: string): Promise<Response> {
  const contentType = request.headers.get('Content-Type') ?? 'application/octet-stream';

  if (!request.body) {
    return json({ error: 'Request body is required' }, 400);
  }

  await env.KYC_BUCKET.put(key, request.body, {
    httpMetadata: { contentType },
  });

  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return json({ url: publicUrl, key });
}

// GET /file/:key — serve file from R2 (for preview/download)
async function handleFileServe(env: Env, key: string): Promise<Response> {
  const object = await env.KYC_BUCKET.get(key);

  if (!object) {
    return json({ error: 'File not found' }, 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType ?? 'application/octet-stream');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('ETag', object.httpEtag);

  return new Response(object.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return corsResponse(request, env);
    }

    let response: Response;

    if (url.pathname === '/presign' && request.method === 'POST') {
      response = await handlePresign(request, env);
    } else if (url.pathname.startsWith('/upload/') && request.method === 'PUT') {
      const key = url.pathname.slice('/upload/'.length);
      response = await handleUpload(request, env, key);
    } else if (url.pathname.startsWith('/file/') && request.method === 'GET') {
      const key = url.pathname.slice('/file/'.length);
      response = await handleFileServe(env, key);
      return withCors(response, request, env);
    } else if (url.pathname === '/health') {
      response = json({ status: 'ok' });
    } else {
      response = json({ error: 'Not found' }, 404);
    }

    return withCors(response, request, env);
  },
};
