import { site } from "@/lib/site-config";
import Counter from "../ui/Counter";
import Reveal from "../ui/Reveal";

export default function Hero() {
  return (
    <section data-stage="hero" className="relative flex min-h-svh flex-col justify-between overflow-hidden px-6 pb-24 pt-32 md:pb-10 md:px-10 md:pt-40">
      <div className="aura" aria-hidden />
      <div className="film-stage" aria-hidden>
        <span className="film-card film-card--back" />
        <span className="film-card" />
      </div>
      <div className="mx-auto w-full max-w-[1440px]">
        <Reveal className="eyebrow flex items-center gap-4">
          <span className="h-px w-10 bg-gold" />
          Araç koruma & uygulama merkezi{site.contact.city && ` · ${site.contact.city}`}
        </Reveal>
        <Reveal as="h1" delay={120} className="mt-8 max-w-[12ch] text-[clamp(2.6rem,7vw,7rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
          Kusursuz boya için <em className="font-display font-bold gold-text">görünmez</em> zırh.
        </Reveal>
        <Reveal as="p" delay={260} className="mt-8 hidden max-w-md text-base leading-relaxed text-mist sm:block md:text-lg">
          {site.description}
        </Reveal>
        <Reveal delay={380} className="mt-10 flex flex-wrap gap-3">
          <a href="#studio" className="btn-gold rounded-full px-7 py-4 text-sm font-medium">
            Korumanı tasarla
          </a>
          <a href="#packages" className="btn-ghost rounded-full px-7 py-4 text-sm">
            Paketleri incele
          </a>
        </Reveal>
      </div>

      <div className="mx-auto mt-16 w-full max-w-[1440px]">
        <div className="grid grid-cols-2 gap-y-6 border-t hairline pt-6 md:grid-cols-4">
          {site.stats.map((s, i) => (
            <Reveal key={s.label} delay={500 + i * 90} className="pr-4">
              <div className="text-3xl font-semibold tracking-tight md:text-4xl">
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-mist">{s.label}</div>
            </Reveal>
          ))}
        </div>
        <div className="mt-8 hidden items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-mist md:flex">
          <span className="relative h-8 w-px overflow-hidden bg-pearl/15">
            <span className="absolute inset-x-0 top-0 h-3 animate-[drip_2s_ease-in-out_infinite] bg-gold" />
          </span>
          Aracı kaplamak için kaydırın
        </div>
      </div>
      <style>{`@keyframes drip{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}
