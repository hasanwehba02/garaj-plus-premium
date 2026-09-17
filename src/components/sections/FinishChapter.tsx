"use client";

import { useExperience } from "@/lib/store";

export default function FinishChapter() {
  const m = useExperience((s) => Math.round(Math.min(1, Math.max(0, ((s.local.finish ?? 0) - 0.3) / 0.4)) * 60) / 60);

  return (
    <section data-stage="finish" data-local="finish" className="relative h-[230vh]">
      <div className="sticky top-0 flex h-svh items-end md:items-center md:px-10">
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="m-scrim max-w-md px-6 pb-24 pt-28 md:p-0">
            <div className="eyebrow flex items-center gap-4">
              <span className="text-gold">03</span>
              <span className="h-px w-10 bg-gold/50" />
              Parlak ya da mat
            </div>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.02em] md:text-5xl">
              Parlaklığı koruyun. Ya da <em className="font-display font-bold gold-text">karakterini</em> değiştirin.
            </h2>
            <p className="mt-5 hidden leading-relaxed text-mist md:block">
              Parlak film, fabrika boyasını yeni atılmış vernik gibi derinleştirir. Mat film ise her rengi ipeksi, düşük parlaklıkta bir yüzeye dönüştürür — tamamen geri alınabilir, tamamen korumalı.
            </p>

            <div className="mt-6 md:mt-10">
              <div className="relative flex h-14 items-center rounded-full border hairline-strong p-1 text-[11px] uppercase tracking-[0.16em]">
                <div
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-gold to-gold-bright"
                  style={{ transform: `translateX(${m * 100}%)` }}
                />
                <span className={`relative z-10 flex-1 text-center transition-colors duration-500 ${m < 0.5 ? "text-ink" : "text-mist"}`}>Parlak</span>
                <span className={`relative z-10 flex-1 text-center transition-colors duration-500 ${m >= 0.5 ? "text-ink" : "text-mist"}`}>Mat</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
                <div className={`transition-opacity duration-500 ${m < 0.5 ? "opacity-100" : "opacity-40"}`}>
                  <div className="font-medium">Parlak PPF</div>
                  <div className="text-mist">Ayna derinliği, ıslak görünümlü yansımalar.</div>
                </div>
                <div className={`transition-opacity duration-500 ${m >= 0.5 ? "opacity-100" : "opacity-40"}`}>
                  <div className="font-medium">Mat PPF</div>
                  <div className="text-mist">Yumuşak ışıltı, sofistike karakter.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
