// The customer's own contract (private link). Always light, no app navigation, never indexed.
export const metadata = { robots: { index: false, follow: false } };

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="light" className="min-h-screen bg-[#f4f1ea] text-text sm:py-8 print:bg-white print:py-0">
      {children}
    </div>
  );
}
