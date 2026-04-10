"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function Home() {
  const [cnpj, setCnpj] = useState("");
  const router = useRouter();

  const cleaned = cnpj.replace(/\D/g, "");
  const isValid = cleaned.length === 14;

  function handleStart() {
    if (isValid) {
      router.push(`/${cleaned}`);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">woovi-kyc</h1>
          <p className="mt-2 text-muted-foreground">
            Demo do wizard de KYC para abertura de conta Woovi.
          </p>
        </div>

        <div className="space-y-4">
          <div className="text-left">
            <label
              htmlFor="cnpj"
              className="block text-sm font-medium mb-1"
            >
              CNPJ da Empresa
            </label>
            <input
              id="cnpj"
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
              placeholder="00.000.000/0000-00"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-base outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              O CNPJ será consultado na BrasilAPI para preencher os dados
              automaticamente.
            </p>
          </div>

          <button
            onClick={handleStart}
            disabled={!isValid}
            className="w-full rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Iniciar KYC
          </button>
        </div>

        <div className="flex gap-4 justify-center text-sm text-muted-foreground">
          <a
            href="https://woovi-kyc-docs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Documentação
          </a>
          <a
            href="https://github.com/jgcmarins/woovi-kyc"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.npmjs.com/package/woovi-kyc"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            npm
          </a>
        </div>
      </div>
    </div>
  );
}
