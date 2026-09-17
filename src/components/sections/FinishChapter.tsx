"use client";

import { useExperience } from "@/lib/store";

export default function FinishChapter() {
  const m = useExperience((s) => Math.round(Math.min(1, Math.max(0, ((s.local.finish ?? 0) - 0.3) / 0.4)) * 60) / 60);

  return (
    <section data-stage="finish" data-local="finish" className="relative h-auto lg:h-[150vh]">
      <div className="flex items-center px-6 py-24 md:px-10 lg:sticky lg:top-0 lg:h-svh lg:py-0">
        <div className="mx-auto grid w-full max-w-[1440px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="max-w-md">
            <div className="eyebrow flex items-center gap-4">
              <span className="text-gold">03</span>
              <span className="h-px w-10 bg-gold/50" />
              Parlak ya da mat
            </div>
            <h2 className="mt-5 text-[2rem] font-semibold leading-[1.08] tracking-[-0.02em] md:mt-6 md:text-5xl">
              Parlaklığı koruyun. Ya da <em className="font-display font-bold gold-text">karakterini</em> değiştirin.
            </h2>
            <p className="mt-5 leading-relaxed text-mist">
              Parlak film, fabrika boyasını yeni atılmış vernik gibi derinleştirir. Mat film ise her rengi ipeksi, düşük parlaklıkta bir yüzeye
              dönüştürür — tamamen geri alınabilir, tamamen korumalı.
            </p>

            <div className="mt-6 md:mt-10">
              <div className="relative flex h-14 items-center rounded-full border hairline-strong p-1 text-[12px] uppercase tracking-[0.16em]">
                <div
                  className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-gold to-gold-bright transition-transform duration-300"
                  style={{ transform: `translateX(${m * 100}%)` }}
                />
                <span className={`relative z-10 flex-1 text-center transition-colors duration-500 ${m < 0.5 ? "text-ink" : "text-mist"}`}>Parlak</span>
                <span className={`relative z-10 flex-1 text-center transition-colors duration-500 ${m >= 0.5 ? "text-ink" : "text-mist"}`}>Mat</span>
              </div>
            </div>
          </div>

          {/* one surface, two finishes — cross-fades with the scroll */}
          <div className="relative mx-auto aspect-[5/4] w-full max-w-lg overflow-hidden rounded-3xl border hairline">
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: 1 - m,
                background:
                  "linear-gradient(115deg,#141619 0%,#3c424b 24%,#e9eef5 41%,#454b55 52%,#191b1f 70%,#0d0e11 100%)",
              }}
            />
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{ opacity: m, background: "linear-gradient(115deg,#212327 0%,#33363b 45%,#292b2f 70%,#1d1f22 100%)" }}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
              <div>
                <div className="text-sm font-medium">{m < 0.5 ? "Parlak PPF" : "Mat PPF"}</div>
                <div className="text-sm text-mist">{m < 0.5 ? "Ayna derinliği, ıslak görünüm." : "Yumuşak ışıltı, sofistike karakter."}</div>
              </div>
              <span className="text-[11px] uppercase tracking-[0.16em] text-gold">{m < 0.5 ? "gloss" : "satin"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
