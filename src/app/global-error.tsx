"use client";

import { useEffect } from "react";

/** Last-resort screen: instead of a blank "Application error", offer a reload (once automatically after an update). */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error(error);
    try {
      if (!sessionStorage.getItem("mdg_reloaded")) {
        sessionStorage.setItem("mdg_reloaded", "1");
        location.reload(); // usually a new version was just published — a fresh load fixes it
      }
    } catch {}
  }, [error]);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#0c0c0c", color: "#eee", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, padding: 16, textAlign: "center" }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</p>
          <p style={{ fontSize: 14, opacity: 0.7 }}>{error.digest ? `Code ${error.digest}` : error.message}</p>
          <button onClick={() => { try { sessionStorage.removeItem("mdg_reloaded"); } catch {} location.href = "/"; }} style={{ marginTop: 12, padding: "10px 20px", borderRadius: 12, border: 0, background: "#d4a73a", fontWeight: 700 }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
