"use client";

import { useEffect, useRef, useState } from "react";
import Reveal from "../ui/Reveal";

export default function HealingChapter() {
  const [healed, setHealed] = useState(false);
  const [heat, setHeat] = useState({ x: 50, y: 50, on: false });
  const box = useRef<HTMLDivElement>(null);

  // reset so the demo can be replayed
  useEffect(() => {
    if (!healed) return;
    const id = setTimeout(() => setHealed(false), 6000);
    return () => clearTimeout(id);
  }, [healed]);

  return (
    <section data-stage="healing" className="relative flex min-h-[130svh] items-end pt-[42svh] md:items-center md:px-10 md:pt-0">
      <div className="mx-auto flex w-full max-w-[1440px] justify-end">
        <div className="m-scrim w-full max-w-md px-6 pb-24 pt-20 md:p-0">
          <Reveal className="eyebrow flex items-center gap-4">
            <span className="text-gold">02</span>
            <span className="h-px w-10 bg-gold/50" />
            Kendini onarma
          </Reveal>
          <Reveal as="h2" delay={80} className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.02em] md:text-5xl">
            Isıyla <em className="font-display font-bold gold-text">kaybolan</em> çizikler.
          </Reveal>
          <Reveal as="p" delay={160} className="mt-5 leading-relaxed text-mist">
            Elastomer üst katman eski formuna geri döner. Güneş, ılık su ya da ısı tabancası — hafif çizikler saniyeler içinde kaybolur.
          </Reveal>

          <Reveal delay={240} className="mt-8">
            <div
              ref={box}
              onPointerMove={(e) => {
                const r = box.current!.getBoundingClientRect();
                setHeat({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, on: true });
              }}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHealed(true)}
              onPointerLeave={() => setHeat((h) => ({ ...h, on: false }))}
              onClick={() => setHealed((v) => !v)}
              className={`glass relative aspect-[16/10] cursor-crosshair overflow-hidden rounded-2xl ${healed ? "healed" : ""}`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,#3a3d44_0%,#16171a_55%,#0b0b0d_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,rgba(255,255,255,.09)_45%,transparent_60%)]" />
              <svg viewBox="0 0 320 200" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <g stroke="rgba(255,255,255,.55)" strokeWidth="0.9" fill="none" strokeLinecap="round">
                  <path className="scratch" d="M40 60 Q120 90 210 70" />
                  <path className="scratch" d="M70 130 Q150 110 260 140" />
                  <path className="scratch" d="M120 40 Q180 80 230 160" />
                  <path className="scratch" d="M30 150 Q90 120 140 150" />
                  <path className="scratch" d="M200 40 Q250 70 290 60" />
                </g>
              </svg>
              <div
                className="pointer-events-none absolute h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full transition-opacity duration-500"
                style={{
                  left: `${heat.x}%`,
                  top: `${heat.y}%`,
                  opacity: heat.on ? 1 : 0,
                  background: "radial-gradient(circle, rgba(242,214,126,.35), rgba(201,162,74,.08) 45%, transparent 70%)",
                  mixBlendMode: "screen",
                }}
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] uppercase tracking-[0.16em]">
                <span className="text-mist">{healed ? "Onarıldı" : "Isı uygulamak için dokunun"}</span>
                <span className={`h-1.5 w-1.5 rounded-full transition-colors duration-700 ${healed ? "bg-gold" : "bg-pearl/30"}`} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={320} className="mt-8 grid grid-cols-3 gap-4 border-t hairline pt-6 text-sm">
            {[
              ["Kendini onarır", "Üst katman"],
              ["Hidrofobik", "Suyu iter"],
              ["Sararmaz", "UV dayanımlı"],
            ].map(([a, b]) => (
              <div key={a}>
                <div className="font-medium">{a}</div>
                <div className="text-mist">{b}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
