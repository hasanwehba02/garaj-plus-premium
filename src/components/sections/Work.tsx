import Image from "next/image";
import { site } from "@/lib/site-config";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

/** Real cars from the studio's own Instagram. */
export default function Work() {
  return (
    <section id="work" className="relative px-6 py-28 md:px-10 md:py-36">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow="İşlerimiz" title="Stüdyomuzdan" accent="son çalışmalar." />
          <Reveal delay={150}>
            <a
              href={`https://instagram.com/${site.contact.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm"
            >
              @{site.contact.instagram} <Icon name="arrow" className="h-4 w-4" />
            </a>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {site.gallery.map((g, i) => (
            <Reveal key={g.src} delay={i * 90}>
              <figure className="group relative aspect-[4/5] overflow-hidden rounded-3xl border hairline">
                <Image
                  src={g.src}
                  alt={`${g.car} — ${g.work} · ${site.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-[1200ms] ease-cine group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-90" />
                <figcaption className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6">
                  <span className="text-lg font-medium">{g.car}</span>
                  <span className="text-[11px] uppercase tracking-[0.16em] text-gold">{g.work}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
