import { site } from "@/lib/site-config";
import Logo from "../ui/Logo";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t hairline px-6 pt-20 md:px-10">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col justify-between gap-12 md:flex-row">
          <div className="max-w-sm">
            <Logo className="h-16" />
            <p className="mt-6 font-display text-2xl text-pearl/90">{site.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
            <ul className="space-y-3">
              {site.nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-mist transition-colors hover:text-pearl">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
            <ul className="space-y-3 text-mist">
              <li>{site.contact.phone}</li>
              <li>{site.contact.email}</li>
              <li>
                <a href={`https://instagram.com/${site.contact.instagram}`} className="transition-colors hover:text-pearl">
                  @{site.contact.instagram}
                </a>
              </li>
            </ul>
            <ul className="space-y-3 text-mist">
              <li>{site.contact.address}</li>
              <li>{site.contact.city}</li>
            </ul>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none mt-20 select-none text-center text-[clamp(3rem,11vw,12rem)] font-semibold leading-[0.8] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_color-mix(in_oklab,var(--accent)_45%,transparent)] [mask-image:linear-gradient(to_bottom,black_30%,transparent)]">
          {site.wordmark}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t hairline pb-24 pt-8 text-xs text-mist md:pb-8 md:flex-row">
          <span>
            © {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.
          </span>
          <a href={site.modelCredit.href} className="hover:text-pearl" target="_blank" rel="noreferrer">
            {site.modelCredit.text} · {site.modelCredit.license}
          </a>
        </div>
      </div>
    </footer>
  );
}
