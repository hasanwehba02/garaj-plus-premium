import { site } from "@/lib/site-config";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

export default function Process() {
  return (
    <section id="process" data-stage="outro" className="relative px-6 py-32 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading index="08" eyebrow="Süreç" title="Altı aşama." accent="Sıfır kestirme." />
        <div className="relative mt-20 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-gold/60 via-pearl/15 to-transparent lg:block" />
          {site.process.map((p, i) => (
            <Reveal key={p.title} delay={i * 120} className="relative">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-ink font-display text-xl text-gold">
                {i + 1}
              </div>
              <h3 className="mt-8 text-xl font-semibold tracking-tight">{p.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist">{p.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
