// Customer-facing pages (estimate, contract signing). Always light, no app navigation.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-surface text-text">
      <div className="bg-warn-soft px-4 py-1.5 text-center text-xs font-semibold text-warn">
        DEMO PREVIEW — sample customer &amp; data. Nothing here is signed, sent, recorded or charged.
      </div>
      {children}
    </div>
  );
}
