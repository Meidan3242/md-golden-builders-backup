"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { findMapPins } from "@/app/actions/map";

/** Runs by itself on the map page while some projects still have no pin. */
export function MapPinsFinder({ missing }: { missing: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState(`Finding map pins… ${missing} addresses to go`);
  useEffect(() => {
    let stop = false;
    (async () => {
      for (let round = 0; round < 30 && !stop; round++) {
        try {
          const r = await findMapPins();
          if (r.error) return setMsg(`Couldn't find pins right now (${r.error}). Open the map again later.`);
          // A round where nothing new was found and only slow addresses failed: stop for now, they're retried next visit.
          if (!r.done && r.left > 0) {
            setMsg(`${r.left} address${r.left === 1 ? "" : "es"} didn't answer — they're tried again next time you open the map.`);
            return router.refresh();
          }
          if (r.left <= 0) {
            setMsg("");
            return router.refresh();
          }
          setMsg(`Finding map pins… ${r.left} addresses to go`);
          router.refresh();
        } catch {
          return setMsg("Couldn't find pins right now. Open the map again later.");
        }
      }
    })();
    return () => {
      stop = true;
    };
  }, [router]);
  return msg ? <p className="mb-3 rounded-xl bg-info-soft px-4 py-2 text-sm text-info">{msg}</p> : null;
}
