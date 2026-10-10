import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MD Golden Builders",
  description: "Leads, projects and payments — all in one place.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Runs before paint: "auto" theme = light 7am–7pm, dark otherwise.
const themeScript = `(function(){try{var m=localStorage.getItem('theme')||'auto';var h=new Date().getHours();var t=m==='auto'?(h>=7&&h<19?'light':'dark'):m;document.documentElement.dataset.theme=t;document.documentElement.dataset.themeMode=m;}catch(e){document.documentElement.dataset.theme='light';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
