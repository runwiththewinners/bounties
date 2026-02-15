export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <h1 className="font-display text-5xl gold-text mb-4">RWTW Bounties</h1>
        <p className="text-txt-muted text-sm leading-relaxed mb-6">
          This app runs inside your Whop community. Members see bounties in their
          experience view, and your team manages everything from the dashboard.
        </p>
        <div className="card p-4 text-left text-sm text-txt-muted leading-relaxed">
          <p className="font-heading text-xs tracking-[1.5px] uppercase text-[var(--gold)] mb-2">
            Setup Checklist
          </p>
          <p className="mb-1">✅ Deploy to Vercel</p>
          <p className="mb-1">✅ Set Base URL in Whop App dashboard</p>
          <p className="mb-1">✅ Set App path to <code className="text-[var(--blue)]">/experiences/[experienceId]</code></p>
          <p className="mb-1">✅ Set Dashboard path to <code className="text-[var(--blue)]">/dashboard/[companyId]</code></p>
          <p>✅ Add your app to your Whop community</p>
        </div>
      </div>
    </div>
  );
}
