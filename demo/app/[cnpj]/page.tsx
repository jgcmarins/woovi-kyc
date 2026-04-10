"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
      aria-label="Toggle theme"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

export default function KYCPage() {
  const params = useParams<{ cnpj: string }>();
  const router = useRouter();
  const cnpj = params.cnpj;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Voltar
        </button>
        <div className="flex items-center gap-3">
          <a
            href="https://woovi-kyc-docs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline hover:text-foreground transition-colors"
          >
            Docs
          </a>
          <ThemeToggle />
        </div>
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
