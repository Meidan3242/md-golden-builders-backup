// Customer-facing pages (estimate, contract signing). Always light, no app navigation.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-surface text-text">
      {children}
    </div>
  );
}
