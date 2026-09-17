import { site } from "@/lib/site-config";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

export default function Reviews() {
  return (
    <section className="relative px-6 py-32 md:px-10">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading align="center" eyebrow="Google yorumları" title="13 yıllık güven," accent="araç sahiplerinden." />
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {site.reviews.map((r, i) => (
            <Reveal key={i} delay={i * 100}>
              <figure className="flex h-full flex-col rounded-3xl border hairline bg-ink-2/70 p-8">
                <div className="flex gap-1 text-gold">
                  {Array.from({ length: r.rating }, (_, k) => (
                    <Icon key={k} name="star" className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-6 flex-1 text-lg font-medium leading-relaxed text-pearl/90">“{r.text}”</blockquote>
                <figcaption className="mt-8 border-t hairline pt-5 text-sm">
                  <div>{r.name}</div>
                  <div className="text-mist">{r.car}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
