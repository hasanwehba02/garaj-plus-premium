import { site } from "@/lib/site-config";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

export default function Packages() {
  return (
    <section id="packages" className="relative px-6 py-32 md:px-10 md:py-40">
      <div className="mx-auto max-w-[1440px]">
        <SectionHeading align="center" index="06" eyebrow="Filmler" title="Kullandığımız" accent="seçkin ürünler." text="Her araç farklıdır. Net fiyat, aracınızın yerinde ücretsiz incelenmesinin ardından verilir." />

        <div className="mt-20 grid items-stretch gap-5 lg:grid-cols-3">
          {site.packages.map((p, i) => (
            <Reveal key={p.name} delay={i * 110} className={p.featured ? "lg:-my-6" : ""}>
              <div
                className={`relative flex h-full flex-col overflow-hidden rounded-3xl p-8 md:p-10 ${
                  p.featured ? "border border-gold/60 bg-[linear-gradient(160deg,color-mix(in_oklab,var(--accent)_16%,var(--bg-2)),var(--bg-2)_55%)]" : "border hairline bg-ink-2/70"
                }`}
              >
                {p.featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-gold px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink">En çok tercih edilen</span>
                )}
                <div className="eyebrow text-gold">{p.name}</div>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight">{p.title}</h3>
                <div className="mt-8 text-3xl font-semibold tracking-tight">Ücretsiz fiyat al</div>
                <div className="mt-1 text-xs text-mist">{p.note}</div>
                <ul className="mt-8 flex-1 space-y-3.5 border-t hairline pt-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                      <span className="text-pearl">{f}</span>
                    </li>
                  ))}
                </ul>
                <a href="#contact" className={`mt-10 rounded-full py-4 text-center text-sm font-medium ${p.featured ? "btn-gold" : "btn-ghost"}`}>
                  {p.name} için fiyat al
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
