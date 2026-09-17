"use client";

import { useState } from "react";
import { site, finishLabel } from "@/lib/site-config";
import { useExperience } from "@/lib/store";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

/** Form composes a WhatsApp message — no backend needed. */
export default function Contact() {
  const paint = useExperience((s) => s.paint);
  const finish = useExperience((s) => s.finish);
  const coverage = useExperience((s) => s.coverage);
  const [form, setForm] = useState<Record<"name" | "phone" | "car" | "service" | "message", string>>({
    name: "",
    phone: "",
    car: "",
    service: site.services[0].title,
    message: "",
  });

  const build = `${site.coverage.find((c) => c.id === coverage)?.name} · ${finishLabel(finish)} · ${site.paints.find((p) => p.id === paint)?.name}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      `Merhaba ${site.name}, teklif almak istiyorum.`,
      `Ad Soyad:  ${form.name}`,
      `Telefon:  ${form.phone}`,
      `Araç:  ${form.car}`,
      `Hizmet:  ${form.service}`,
      `Stüdyo seçimi:  ${build}`,
      form.message && `Not:  ${form.message}`,
    ]
      .filter(Boolean)
      .join("\n");
    window.open(`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const field = "w-full rounded-xl border hairline bg-ink/60 px-4 py-3.5 text-sm text-pearl placeholder:text-mist/70 outline-none transition-colors focus:border-gold";

  return (
    <section id="contact" className="relative px-6 py-32 md:px-10 md:py-40">
      <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading index="09" eyebrow="Randevu" title="Aracınız" accent="stüdyoyu hak ediyor." text="Ücretsiz ekspertiz için randevu alın. Boya kalınlığını ölçer, film örneklerini stüdyo ışığı altında gösterir ve net bir teklif sunarız." />
          <Reveal delay={200} className="mt-12 space-y-6">
            {[
              { icon: "pin", label: [site.contact.address, site.contact.city].filter(Boolean).join(", "), href: site.contact.mapUrl },
              { icon: "phone", label: site.contact.phone, href: `tel:${site.contact.phone.replace(/\s/g, "")}` },
              { icon: "mail", label: site.contact.email, href: `mailto:${site.contact.email}` },
            ]
              .filter((c) => c.label)
              .map((c) => (
              <a key={c.icon} href={c.href} className="group flex items-center gap-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 text-gold transition-colors group-hover:bg-gold group-hover:text-ink">
                  <Icon name={c.icon} className="h-4 w-4" />
                </span>
                <span className="text-pearl transition-colors group-hover:text-pearl">{c.label}</span>
              </a>
            ))}
            <div className="flex gap-5 border-t hairline pt-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
                <Icon name="clock" className="h-4 w-4" />
              </span>
              <dl className="grid flex-1 grid-cols-2 gap-y-2 text-sm">
                {site.contact.hours.map((h) => (
                  <div key={h.day} className="contents">
                    <dt className="text-mist">{h.day}</dt>
                    <dd className="text-right tabular-nums">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>

        <Reveal delay={150}>
          <form onSubmit={submit} className="glass rounded-3xl p-6 md:p-10">
            <div className="grid gap-4 sm:grid-cols-2">
              <input required className={field} placeholder="Ad Soyad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input required className={field} placeholder="Telefon" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={`${field} sm:col-span-2`} placeholder="Araç marka & model" value={form.car} onChange={(e) => setForm({ ...form, car: e.target.value })} />
              <select className={`${field} sm:col-span-2`} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
                {site.services.map((s) => (
                  <option key={s.title} className="bg-ink">
                    {s.title}
                  </option>
                ))}
              </select>
              <textarea rows={4} className={`${field} resize-none sm:col-span-2`} placeholder="Bilmemiz gereken bir şey var mı?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl border border-gold/25 bg-gold/[0.06] px-4 py-3 text-sm">
              <span className="text-mist">Stüdyo seçimi</span>
              <span className="text-right text-pearl">{build}</span>
            </div>
            <button type="submit" className="btn-gold mt-6 w-full rounded-full py-4 text-sm font-medium">
              WhatsApp ile teklif al
            </button>
            <p className="mt-4 text-center text-xs text-mist">Spam yok. Mesai saatleri içinde dönüş yapıyoruz.</p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
