"use client";

import { useEffect, useState } from "react";
import { useExperience } from "@/lib/store";
import { site } from "@/lib/site-config";
import Logo from "./Logo";

export default function Loader() {
  const progress = useExperience((s) => s.loadProgress);
  const ready = useExperience((s) => s.sceneReady);
  const [gone, setGone] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 20000);
    return () => clearTimeout(id);
  }, []);

  const done = ready || timedOut;
  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => setGone(true), 1400);
    return () => clearTimeout(id);
  }, [done]);

  if (gone) return null;
  const pct = Math.round(done ? 100 : Math.min(progress, 99));

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink transition-opacity duration-[1200ms] ease-cine ${done ? "pointer-events-none opacity-0" : "opacity-100"}`}
      role="status"
      aria-label="Yükleniyor"
    >
      <div className="flex flex-col items-center gap-10">
        <Logo className="h-32" showText={false} />
        <div className="w-56">
          <div className="h-px w-full bg-pearl/10">
            <div className="h-px bg-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex justify-between text-[11px] uppercase tracking-[0.16em] text-mist">
            <span>Stüdyo hazırlanıyor</span>
            <span className="tabular-nums text-pearl">{pct}%</span>
          </div>
        </div>
      </div>
      <p className="absolute bottom-10 font-display text-lg text-mist">{site.tagline}</p>
    </div>
  );
}
