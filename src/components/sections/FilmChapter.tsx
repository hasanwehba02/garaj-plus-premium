"use client";

import { useExperience } from "@/lib/store";

const steps = [
  { t: "Arındırma", d: "Demir tozu, zift ve kil — kusursuz temiz bir yüzey." },
  { t: "Hassas kesim", d: "Aracınızın modeline özel plotter kalıplar." },
  { t: "El işçiliği & katlanmış kenar", d: "Görünür çizgi yok. Kalkan kenar yok." },
];

const layers = [
  { name: "Üst kaplama", sub: "Kendini onaran", h: 14, tone: "linear-gradient(100deg,rgba(255,255,255,.85),rgba(255,255,255,.35))" },
  { name: "TPU", sub: "210 micron gövde", h: 44, tone: "linear-gradient(100deg,rgba(226,234,245,.7),rgba(226,234,245,.25))" },
  { name: "Yapıştırıcı", sub: "İz bırakmadan sökülür", h: 12, tone: "linear-gradient(100deg,rgba(233,220,192,.6),rgba(233,220,192,.2))" },
  { name: "Boya", sub: "Fabrika boyanız", h: 52, tone: "linear-gradient(100deg,#2b2e34,#0c0d10)" },
];

export default function FilmChapter() {
  const pct = useExperience((s) => Math.round(Math.min(1, Math.max(0, ((s.local.film ?? 0) - 0.08) / 0.84)) * 100));

  return (
    <section data-stage="film" data-local="film" className="relative h-[190vh]">
      <div className="sticky top-0 flex h-svh items-center px-6 md:px-10">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-md">
            <div className="eyebrow flex items-center gap-4">
              <span className="text-gold">01</span>
              <span className="h-px w-10 bg-gold/50" />
              Kaplama
            </div>
            <h2 className="mt-5 text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] md:mt-6 md:text-5xl">
              Optik kalitede <em className="font-display font-bold gold-text">kristal</em> netlik.
            </h2>
            <p className="mt-5 leading-relaxed text-mist">
              8.5 mil kalınlığında, kendini onaran termoplastik poliüretan; panel panel uygulanır. Taş darbeleri, çizikler ve yol izleri boyanıza
              değil, filme çarpar.
            </p>

            <div className="mt-8 flex items-end justify-between">
              <div className="text-5xl font-semibold tabular-nums tracking-tight md:text-7xl">
                <span className="text-2xl text-gold">%</span>
                {pct}
              </div>
              <div className="pb-2 text-right text-[11px] uppercase tracking-[0.16em] text-mist">Korunan yüzey</div>
            </div>
            <div className="mt-3 h-px w-full bg-pearl/10">
              <div className="h-px bg-gradient-to-r from-gold to-gold-bright transition-[width] duration-200" style={{ width: `${pct}%` }} />
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

          {/* the film, layer by layer — separates as you scroll */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-x-10 -inset-y-16 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_65%)] blur-2xl" aria-hidden />
            <div className="relative">
              {layers.map((l, i) => (
                <div
                  key={l.name}
                  className="transition-transform duration-500 ease-cine"
                  style={{ transform: `translateY(${-(pct / 100) * (layers.length - 1 - i) * 30}px)` }}
                >
                  <div
                    className="rounded-2xl border hairline shadow-[0_24px_60px_-30px_rgba(0,0,0,.9)]"
                    style={{ height: l.h, background: l.tone }}
                  />
                  <div className="mb-4 mt-2 flex items-baseline justify-between text-[11px] uppercase tracking-[0.16em]">
                    <span className="text-pearl">{l.name}</span>
                    <span className="text-mist">{l.sub}</span>
                  </div>
                </div>
              ))}
              <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-gold/40 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-gold">
                STIL TECH · 210 micron
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
