"use client";

import { useRef } from "react";
import { site } from "@/lib/site-config";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "";
  };
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="group relative h-full overflow-hidden rounded-3xl border hairline bg-ink-2/70 p-8 transition-[transform,border-color] duration-500 ease-cine [transform-style:preserve-3d] hover:border-gold/40"
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 [background:radial-gradient(400px_circle_at_var(--mx)_var(--my),color-mix(in_oklab,var(--accent)_16%,transparent),transparent_60%)]" />
      {children}
    </div>
  );
}

export default function Services() {
  return (
    <section id="services" data-stage="top" className="relative px-6 py-32 md:px-10 md:py-44">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading index="05" eyebrow="Hizmetler" title="Aracınız için gereken" accent="her şey." />
          <Reveal as="p" delay={200} className="max-w-sm text-mist">
            Tek stüdyo, tek standart. Tüm hizmetler sertifikalı uygulayıcılarımız tarafından kendi bünyemizde yapılır.
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {site.services.map((s, i) => (
            <Reveal key={s.title} delay={i * 70}>
              <TiltCard>
                <div className="relative flex h-full flex-col [transform:translateZ(30px)]">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                      <Icon name={s.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-xs tabular-nums text-mist">0{i + 1}</span>
                  </div>
                  <h3 className="mt-10 text-2xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-mist">{s.text}</p>
                  <div className="mt-8 flex items-center justify-between border-t hairline pt-5 text-sm">
                    <span className="text-mist">Teklif için yazın</span>
                    <a href="#contact" className="flex items-center gap-2 text-gold transition-transform duration-500 group-hover:translate-x-1" aria-label={`${s.title} hakkında bilgi al`}>
                      Bilgi al <Icon name="arrow" className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
