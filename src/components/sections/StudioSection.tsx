"use client";

import { site, finishLabel, type CoverageId, type PaintId } from "@/lib/site-config";
import { useExperience, type Finish } from "@/lib/store";
import Reveal from "../ui/Reveal";

export default function StudioSection() {
  const paint = useExperience((s) => s.paint);
  const finish = useExperience((s) => s.finish);
  const coverage = useExperience((s) => s.coverage);
  const { setPaint, setFinish, setCoverage } = useExperience.getState();

  const cov = site.coverage.find((c) => c.id === coverage)!;
  const paintName = site.paints.find((p) => p.id === paint)?.name;
  const paintHex = site.paints.find((p) => p.id === paint)?.hex ?? "#34373c";
  

  return (
    <section id="studio" data-stage="studio" className="relative flex min-h-[80svh] items-center px-4 py-24 md:px-10 md:py-28">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="glass w-full max-w-md rounded-3xl p-6 md:p-8">
          <div className="eyebrow flex items-center gap-4">
            <span className="text-gold">04</span>
            <span className="h-px w-10 bg-gold/50" />
            {site.wordmark} Stüdyo
          </div>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.02em] md:text-4xl">
            Korumanı <em className="font-display font-bold gold-text">tasarla.</em>
          </h2>
          <p className="mt-3 text-sm text-mist">Aracınız için rengi, yüzeyi ve kaplama alanını seçin — seçiminiz teklifinize birebir yansır.</p>

          <fieldset className="mt-7">
            <legend className="flex w-full justify-between text-[11px] uppercase tracking-[0.16em] text-mist">
              <span>Renk</span>
              <span className="text-pearl">{paintName}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {site.paints.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPaint(p.id as PaintId)}
                  aria-label={p.name}
                  aria-pressed={paint === p.id}
                  className={`relative h-10 w-10 rounded-full transition-transform duration-300 hover:scale-110 ${paint === p.id ? "ring-1 ring-gold ring-offset-4 ring-offset-[var(--bg-2)]" : ""}`}
                  style={{ background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,.55), ${p.hex} 38%, #000 120%)` }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="text-[11px] uppercase tracking-[0.16em] text-mist">Yüzey</legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["gloss", "satin"] as Finish[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFinish(f)}
                  aria-pressed={finish === f}
                  className={`rounded-xl border px-4 py-3 text-sm transition-colors duration-300 ${finish === f ? "border-gold bg-gold/10 text-pearl" : "hairline text-mist hover:text-pearl"}`}
                >
                  {finishLabel(f)}</button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-7">
            <legend className="text-[11px] uppercase tracking-[0.16em] text-mist">Kaplama alanı</legend>
            <div className="mt-3 space-y-2">
              {site.coverage.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCoverage(c.id as CoverageId)}
                  aria-pressed={coverage === c.id}
                  className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors duration-300 ${coverage === c.id ? "border-gold bg-gold/10" : "hairline hover:border-pearl/25"}`}
                >
                  <span>
                    <span className="block text-sm">{c.name}</span>
                    <span className="block text-xs text-mist">{c.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-7 flex items-end justify-between border-t hairline pt-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-mist">Seçiminiz</div>
              <div className="mt-1 text-base font-semibold">{cov.name} · {finishLabel(finish)}</div>
            </div>
            <a href="#contact" className="btn-gold rounded-full px-5 py-3 text-sm font-medium">
              Teklif al
            </a>
          </div>
        </Reveal>

        {/* live preview of the chosen build */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl border hairline">
            <div
              className="absolute inset-0 transition-all duration-500"
              style={{
                background: `linear-gradient(118deg, ${paintHex} 0%, rgba(255,255,255,${finish === "satin" ? 0.07 : 0.26}) 44%, ${paintHex} 100%)`,
                filter: finish === "satin" ? "saturate(.92) brightness(.96)" : "saturate(1.05)",
              }}
            />
            {/* the film, covering the chosen area */}
            <div
              className="absolute inset-y-0 left-0 border-r border-gold/50 bg-white/[0.07] transition-all duration-500"
              style={{ width: `${cov.extent * 100}%` }}
            />
            <div className="absolute left-5 top-5 rounded-full border border-gold/40 bg-ink/50 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-gold">
              PPF · %{Math.round(cov.extent * 100)}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
              <div>
                <div className="text-sm font-medium">{paintName}</div>
                <div className="text-sm text-mist">
                  {finishLabel(finish)} · {cov.name}
                </div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-mist">Seçiminiz teklif mesajınıza otomatik eklenir.</p>
        </div>
      </div>
    </section>
  );
}
