"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site-config";
import { useExperience } from "@/lib/store";
import Logo from "./Logo";

export default function Nav() {
  const progress = useExperience((s) => Math.round(s.progress * 400) / 400);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={`transition-all duration-700 ease-cine ${scrolled ? "glass border-x-0 border-t-0" : "border-b border-transparent"}`}>
        <nav className="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-6 md:h-20 md:px-10">
          <a href="#" aria-label={`${site.name} ana sayfa`} className="h-11 text-sm">
            <Logo className="h-11" />
          </a>
          <ul className="hidden items-center gap-9 lg:flex">
            {site.nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="group relative text-[13px] tracking-wide text-pearl/90 transition-colors hover:text-pearl">
                  {n.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-gold transition-all duration-500 ease-cine group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className={`hidden text-[13px] tabular-nums text-mist transition-colors hover:text-pearl ${/\d/.test(site.contact.phone) ? "xl:block" : ""}`}>
              {site.contact.phone}
            </a>
            <a href="#contact" className="btn-gold hidden rounded-full px-5 py-2.5 text-[13px] font-medium sm:inline-block">
              Randevu al
            </a>
            <button onClick={() => setOpen((v) => !v)} className="relative h-10 w-10 lg:hidden" aria-label="Menü" aria-expanded={open}>
              <span className={`absolute left-2 right-2 h-px bg-pearl transition-transform duration-500 ${open ? "top-5 rotate-45" : "top-4"}`} />
              <span className={`absolute left-2 right-2 h-px bg-pearl transition-transform duration-500 ${open ? "top-5 -rotate-45" : "top-6"}`} />
            </button>
          </div>
        </nav>
        <div className="h-px bg-transparent">
          <div className="h-px bg-gradient-to-r from-gold/0 via-gold to-gold-bright" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className={`glass fixed inset-x-0 top-[73px] origin-top border-x-0 transition-all duration-500 ease-cine lg:hidden ${open ? "scale-y-100 opacity-100" : "pointer-events-none scale-y-95 opacity-0"}`}>
        <ul className="flex flex-col px-6 py-6">
          {site.nav.map((n) => (
            <li key={n.href} className="border-b hairline last:border-0">
              <a href={n.href} onClick={() => setOpen(false)} className="block py-4 font-display text-2xl">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
