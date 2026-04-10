import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1 gap-4 px-4">
      <h1 className="text-4xl font-bold">woovi-kyc</h1>
      <p className="text-lg text-fd-muted-foreground max-w-xl mx-auto">
        Open-source React KYC wizard for Woovi account registration.
        Company data, address, document uploads, and representative information — all in one component.
      </p>
      <div className="flex gap-3 justify-center mt-2">
        <Link
          href="/docs"
          className="px-6 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm"
        >
          Documentation
        </Link>
        <Link
          href="https://github.com/jgcmarins/woovi-kyc"
          className="px-6 py-2.5 rounded-lg border border-fd-border font-medium text-sm"
        >
          GitHub
        </Link>
      </div>
      <div className="flex gap-6 justify-center mt-4 text-sm text-fd-muted-foreground">
        <span>CNPJ auto-fill</span>
        <span>Storage agnostic</span>
        <span>Callback-driven</span>
        <span>5-step wizard</span>
      </div>
    </div>
  );
}
