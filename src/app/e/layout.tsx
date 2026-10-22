// The customer's own estimate (private link). Always light, no app navigation, never indexed.
export const metadata = { robots: { index: false, follow: false } };

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-surface text-text">
      {children}
    </div>
  );
}
