"use client";

import { useExperience } from "@/lib/store";

const steps = [
  { t: "Arındırma", d: "Demir tozu, zift ve kil — kusursuz temiz bir yüzey." },
  { t: "Hassas kesim", d: "Aracınızın modeline özel plotter kalıplar." },
  { t: "El işçiliği & katlanmış kenar", d: "Görünür çizgi yok. Kalkan kenar yok." },
];

export default function FilmChapter() {
  const pct = useExperience((s) => Math.round(Math.min(1, Math.max(0, ((s.local.film ?? 0) - 0.08) / 0.84)) * 100));

  return (
    <section data-stage="film" data-local="film" className="relative h-[320vh]">
      <div className="sticky top-0 flex h-svh items-end md:items-center md:px-10">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="m-scrim max-w-md px-6 pb-24 pt-28 md:rounded-3xl md:glass md:p-9">
            <div className="eyebrow flex items-center gap-4">
              <span className="text-gold">01</span>
              <span className="h-px w-10 bg-gold/50" />
              Kaplama
            </div>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.02em] md:text-5xl">
              Optik kalitede <em className="font-display font-bold gold-text">kristal</em> netlik.
            </h2>
            <p className="mt-5 hidden leading-relaxed text-mist md:block">
              8.5 mil kalınlığında, kendini onaran termoplastik poliüretan; panel panel uygulanır. Taş darbeleri, çizikler ve yol izleri boyanıza değil, filme çarpar.
            </p>

            <div className="mt-8 flex items-end justify-between">
              <div className="text-6xl font-semibold tabular-nums tracking-tight md:text-7xl">
                <span className="text-2xl text-gold">%</span>
                {pct}
              </div>
              <div className="pb-2 text-right text-[11px] uppercase tracking-[0.16em] text-mist">Korunan yüzey</div>
            </div>
            <div className="mt-3 h-px w-full bg-pearl/10">
              <div className="h-px bg-gradient-to-r from-gold to-gold-bright" style={{ width: `${pct}%` }} />
            </div>

            <ol className="mt-6 space-y-3 md:mt-8 md:space-y-4">
              {steps.map((s, i) => {
                const on = pct >= (i / steps.length) * 100 + 5;
                return (
                  <li key={s.t} className={`flex gap-4 transition-opacity duration-700 ${on ? "opacity-100" : "opacity-35"}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full border transition-colors duration-700 ${on ? "border-gold bg-gold" : "border-pearl/40"}`} />
                    <div>
                      <div className="text-sm font-medium">{s.t}</div>
                      <div className="hidden text-sm text-mist md:block">{s.d}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
