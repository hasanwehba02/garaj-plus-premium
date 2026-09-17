import { site } from "@/lib/site-config";
import Icon from "../ui/Icon";
import Reveal from "../ui/Reveal";
import SectionHeading from "../ui/SectionHeading";

function Cell({ v, first }: { v: boolean | string; first: boolean }) {
  if (v === true) return <Icon name="check" className={`mx-auto h-5 w-5 ${first ? "text-gold" : "text-pearl/70"}`} />;
  if (v === false) return <Icon name="x" className="mx-auto h-4 w-4 text-pearl/25" />;
  if (v === "partial") return <span className="text-xs text-mist">Kısmen</span>;
  return <span className={`text-sm ${first ? "text-gold" : "text-mist"}`}>{v}</span>;
}

export default function Compare() {
  const { columns, rows } = site.compare;
  return (
    <section data-stage="top" className="relative px-6 py-32 md:px-10">
      <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <SectionHeading index="07" eyebrow="Neden film" title="Kaplamalar parlatır. Darbeyi" accent="film karşılar." text="Seramik ve wax boyayı güzel gösterir. Darbeyi fiziksel olarak emen — ve ardından kendini onaran — tek çözüm boya koruma filmidir." />
        <Reveal delay={150} className="overflow-x-auto rounded-3xl border hairline bg-ink-2/70">
          <table className="w-full min-w-[520px] text-left">
            <thead>
              <tr className="border-b hairline">
                <th className="p-5 text-[11px] font-normal uppercase tracking-[0.16em] text-mist">Özellik</th>
                {columns.map((c, i) => (
                  <th key={c} className={`p-5 text-center text-sm font-medium ${i === 0 ? "bg-gold/10 text-gold" : "text-pearl/90"}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b hairline last:border-0">
                  <td className="p-5 text-sm text-pearl">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className={`p-5 text-center ${i === 0 ? "bg-gold/[0.06]" : ""}`}>
                      <Cell v={v} first={i === 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}
