"use client";

import { useState } from "react";
import { KYCWizard } from "woovi-kyc";
import type { KYCFileMetadata, KYCPayload } from "woovi-kyc";

const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || "http://localhost:8787";

function getUploadPrefix(cnpj: string, documentType: string): string {
  const companyDocTypes = ["SOCIAL_CONTRACT", "ATA", "BYLAWS"];
  const folder = companyDocTypes.includes(documentType) ? "company" : "representatives";
  return `${cnpj}/${folder}`;
}

async function uploadToR2(cnpj: string, file: File, metadata: KYCFileMetadata): Promise<string> {
  const presignRes = await fetch(`${UPLOAD_URL}/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: metadata.fileName,
      contentType: metadata.mimeType,
      prefix: getUploadPrefix(cnpj, metadata.documentType),
    }),
  });

  if (!presignRes.ok) {
    throw new Error("Failed to get pre-signed URL");
  }

  const { uploadUrl, publicUrl } = await presignRes.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": metadata.mimeType },
  });

  if (!uploadRes.ok) {
    throw new Error("Failed to upload file");
  }

  return publicUrl;
}

function CnpjForm({ onStart }: { onStart: (cnpj: string) => void }) {
  const [cnpj, setCnpj] = useState("");

  const cleaned = cnpj.replace(/\D/g, "");
  const isValid = cleaned.length === 14;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">woovi-kyc</h1>
          <p className="mt-2 text-zinc-500">
            Demo do wizard de KYC para abertura de conta Woovi.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-left">
            <label
              htmlFor="cnpj"
              className="block text-sm font-medium text-zinc-700 mb-1"
            >
              CNPJ da Empresa
            </label>
            <input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-base outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
            <p className="mt-1 text-xs text-zinc-400">
              O CNPJ será consultado na BrasilAPI para preencher os dados
              automaticamente.
            </p>
          </div>

          <button
            onClick={() => onStart(cleaned)}
            disabled={!isValid}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Iniciar KYC
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [cnpj, setCnpj] = useState<string | null>(null);

  if (!cnpj) {
    return <CnpjForm onStart={setCnpj} />;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <button
          onClick={() => setCnpj(null)}
          className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          &larr; Voltar
        </button>
      </div>

      <KYCWizard
        cnpj={cnpj}
        onNext={(data: KYCPayload) => {
          console.log("[onNext]", data);
        }}
        onBack={(data: KYCPayload) => {
          console.log("[onBack]", data);
        }}
        onFileUploaded={async (file: File, metadata: KYCFileMetadata) => {
          console.log("[onFileUploaded]", metadata);
          const url = await uploadToR2(cnpj, file, metadata);
          console.log("[onFileUploaded] uploaded to:", url);
          return url;
        }}
        onFileRemoved={(fileUrl: string, data: KYCPayload) => {
          console.log("[onFileRemoved]", fileUrl, data);
        }}
        onSubmit={(data: KYCPayload) => {
          console.log("[onSubmit]", data);
          alert("KYC payload logged to console!");
        }}
        onError={(error: Error) => {
          console.error("[onError]", error);
        }}
      />
    </div>
  );
}
