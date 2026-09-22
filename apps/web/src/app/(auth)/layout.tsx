export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-midnight lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Glow blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-violet opacity-30 blur-[100px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-teal opacity-20 blur-[110px]"
        />
        {/* Subtle grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]"
        />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet text-white">
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="5" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 5V3a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            Get a J*b
          </span>
        </div>

        <div className="relative max-w-md">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            Job search, organized
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight text-white">
            Land your next role faster.
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">
            Track applications, tailor resumes, and never lose sight of
            an opportunity again.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { title: "Pipeline at a glance", body: "Draft to offer — every application in one board." },
              { title: "Resume versions", body: "Keep a tailored resume for every role." },
              { title: "Momentum insights", body: "See where your search is gaining traction." },
            ].map((f) => (
              <li key={f.title} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet/25 text-violet-disabled">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{f.title}</span>
                  <span className="block text-sm text-white/55">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          Trusted by job seekers keeping hundreds of applications on track.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-56 w-[36rem] max-w-full -translate-x-1/2 rounded-full bg-violet opacity-[0.12] blur-[90px] dark:opacity-[0.2]"
        />
        <div className="relative w-full max-w-sm">
          {/* Mobile brand mark */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet text-white">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="5" width="16" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 12l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 5V3a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Get a J*b
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
