import { site } from "@/lib/site-config";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

export default function Faq() {
  return (
    <section className="relative px-6 py-32 md:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-[1fr_1.3fr]">
        <SectionHeading eyebrow="SSS" title="Merak" accent="edilenler." text="Başka bir sorunuz mu var? Bize yazın — genellikle bir saat içinde uygulayıcılarımızdan biri yanıt verir." />
        <div className="border-t hairline">
          {site.faq.map((f, i) => (
            <Reveal key={f.q} delay={i * 60}>
              <details className="group border-b hairline">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold transition-colors hover:text-gold">
                  {f.q}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border hairline-strong transition-transform duration-500 group-open:rotate-45 group-open:border-gold group-open:text-gold">
                    <Icon name="plus" className="h-4 w-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-7 pr-14 leading-relaxed text-mist">{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
