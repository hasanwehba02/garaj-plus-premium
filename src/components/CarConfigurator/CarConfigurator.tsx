"use client";

import { useMemo } from "react";
import {
  useConfiguratorStore,
} from "@/lib/store/configuratorStore";
import { PANELS, CATEGORY_LABELS } from "@/data/panels";
import { PACKAGES } from "@/data/packages";
import { site, type PaintId } from "@/lib/site-config";
import { useExperience } from "@/lib/store";
import type { PPFFinish, RimFinishMode } from "@/lib/car-config/types";
import CarStudio3D from "./CarStudio3D";
import Icon from "../ui/Icon";

const RIM_OPTIONS: {
  id: RimFinishMode;
  name: string;
  detail: string;
  previewColor: string;
}[] = [
  {
    id: "gloss_black",
    name: "Parlak Siyah (Gloss Black)",
    detail: "Derin ayna parlaklığında piano black kaplama",
    previewColor: "#0a0a0c",
  },
  {
    id: "dark_chrome",
    name: "Füme Krom (Dark Chrome)",
    detail: "Metalik gölgeli antrasit krom görünüm",
    previewColor: "#32353a",
  },
  {
    id: "satin_silver",
    name: "Saten Gümüş (Satin Silver)",
    detail: "İpeksi mat gümüş fırçalanmış alüminyum",
    previewColor: "#b8bcc2",
  },
  {
    id: "matte_black",
    name: "Mat Siyah (Matte Black)",
    detail: "Işık yansıtmayan agresif mat doku",
    previewColor: "#141518",
  },
];

export default function CarConfigurator() {
  const activePackageId = useConfiguratorStore((s) => s.activePackageId);
  const globalPPFFinish = useConfiguratorStore((s) => s.globalPPFFinish);
  const rimFinishMode = useConfiguratorStore((s) => s.rimFinishMode);
  const panelProtections = useConfiguratorStore((s) => s.panelProtections);
  const activeTab = useConfiguratorStore((s) => s.activeTab);
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);

  const {
    setActiveTab,
    setActiveCategory,
    togglePanelProtection,
    setGlobalPPFFinish,
    setRimFinishMode,
    applyPackage,
    focusPart,
    resetAll,
    getCalculations,
  } = useConfiguratorStore.getState();

  const paint = useExperience((s) => s.paint);
  const setPaint = useExperience((s) => s.setPaint);

  const calc = getCalculations();
  const activePackage = PACKAGES.find((p) => p.id === activePackageId);
  const activePaint = site.paints.find((p) => p.id === paint);

  const filteredPanels = useMemo(() => {
    if (activeCategory === "all") return PANELS;
    return PANELS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  // Generate WhatsApp inquiry text
  const whatsappUrl = useMemo(() => {
    const activePanelsList = PANELS.filter((p) => panelProtections[p.id]?.hasPPF)
      .map((p) => p.name)
      .join(", ");

    const selectedRim = RIM_OPTIONS.find((r) => r.id === rimFinishMode)?.name;
    const finishName = globalPPFFinish === "satin" ? "Saten Mat TPU" : "Parlak TPU";

    const msg = encodeURIComponent(
      `Merhaba Garaj+, 3D Stüdyo'da aracıma özel PPF konfigürasyonu hazırladım:\n\n` +
      `🚗 Paket: ${activePackage?.name ?? "Özel Seçim"}\n` +
      `🛡️ PPF Yüzey: ${finishName}\n` +
      `🎨 Araç Rengi: ${activePaint?.name}\n` +
      `✨ Jant Bitişi: ${selectedRim}\n` +
      `📋 Korunan Paneller (${calc.activeCount} adet): ${activePanelsList || "Seçilmedi"}\n` +
      `💰 Tahmini Fiyat: ${calc.totalPrice.toLocaleString("tr-TR")} TL\n\n` +
      `Randevu ve detaylar için bilgi alabilir miyim?`
    );
    return `https://wa.me/${site.contact.whatsapp}?text=${msg}`;
  }, [panelProtections, activePackageId, globalPPFFinish, rimFinishMode, paint, calc]);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Left / Top: 3D Interactive Viewport */}
      <div className="lg:col-span-7 xl:col-span-8 sticky top-24">
        <CarStudio3D className="h-[480px] sm:h-[560px] lg:h-[680px] shadow-2xl border hairline" />
      </div>

      {/* Right / Sidebar: Interactive Customization Controls */}
      <div className="lg:col-span-5 xl:col-span-4 glass rounded-3xl p-5 sm:p-7 border hairline shadow-2xl flex flex-col gap-6">
        {/* Header with Title & Reset */}
        <div className="flex items-center justify-between pb-4 border-b hairline">
          <div>
            <div className="eyebrow flex items-center gap-2 text-xs">
              <span className="text-gold font-mono">04.1</span>
              <span>Kişiselleştirme Stüdyosu</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-pearl mt-1">
              PPF & Jant Tasarımı
            </h3>
          </div>
          <button
            onClick={() => resetAll()}
            className="text-xs text-mist hover:text-gold transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-white/5"
            title="Tüm seçimleri sıfırla"
          >
            <Icon name="spark" className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-2xl border hairline">
          <button
            onClick={() => setActiveTab("packages")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "packages"
                ? "bg-gold text-ink shadow-md"
                : "text-mist hover:text-pearl"
            }`}
          >
            Paketler
          </button>
          <button
            onClick={() => setActiveTab("panels")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "panels"
                ? "bg-gold text-ink shadow-md"
                : "text-mist hover:text-pearl"
            }`}
          >
            Paneller ({calc.activeCount})
          </button>
          <button
            onClick={() => setActiveTab("rims")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "rims"
                ? "bg-gold text-ink shadow-md"
                : "text-mist hover:text-pearl"
            }`}
          >
            Jant & Bitiş
          </button>
        </div>

        {/* TAB 1: PACKAGES */}
        {activeTab === "packages" && (
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {PACKAGES.map((pkg) => {
              const isSelected = activePackageId === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => applyPackage(pkg.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? "border-gold bg-gold/10 shadow-lg shadow-gold/5"
                      : "hairline hover:border-pearl/30 bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-pearl">
                          {pkg.name}
                        </span>
                        {pkg.badge && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gold/90 font-medium mt-0.5">
                        {pkg.tagline}
                      </p>
                    </div>
                    {pkg.discountPercent > 0 && (
                      <span className="text-xs font-mono font-bold text-gold px-2 py-1 rounded-lg bg-gold/10 border border-gold/30">
                        -%{pkg.discountPercent}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-mist mt-2 leading-relaxed">
                    {pkg.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: INDIVIDUAL PANELS */}
        {activeTab === "panels" && (
          <div className="space-y-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {(
                [
                  "all",
                  "front",
                  "doors",
                  "roof_mirrors",
                  "rear",
                  "wheels",
                ] as const
              ).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] whitespace-nowrap transition-colors ${
                    activeCategory === cat
                      ? "bg-gold text-ink font-semibold"
                      : "hairline text-mist hover:text-pearl bg-white/5"
                  }`}
                >
                  {cat === "all" ? "Tümü" : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Panel List */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {filteredPanels.map((panel) => {
                const isProtected = !!panelProtections[panel.id]?.hasPPF;
                return (
                  <div
                    key={panel.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isProtected
                        ? "border-gold/60 bg-gold/10"
                        : "hairline hover:border-pearl/20 bg-white/[0.02]"
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => focusPart(panel.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-pearl">
                          {panel.name}
                        </span>
                        <span className="text-[10px] font-mono text-mist">
                          🔍 Odaklan
                        </span>
                      </div>
                      <div className="text-[11px] text-gold font-mono mt-0.5">
                        {panel.basePrice.toLocaleString("tr-TR")} TL
                      </div>
                    </div>

                    <button
                      onClick={() => togglePanelProtection(panel.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isProtected
                          ? "bg-gold text-ink"
                          : "border hairline text-mist hover:text-pearl hover:bg-white/5"
                      }`}
                    >
                      {isProtected ? "Korumada ✓" : "+ Ekle"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RIMS & PPF FINISH */}
        {activeTab === "rims" && (
          <div className="space-y-5 max-h-[380px] overflow-y-auto pr-1">
            {/* PPF Finish (Gloss vs Satin) */}
            <div>
              <label className="text-xs uppercase tracking-wider text-mist font-medium block mb-2">
                PPF Yüzey Bitişi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setGlobalPPFFinish("gloss")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    globalPPFFinish === "gloss"
                      ? "border-gold bg-gold/10 text-pearl ring-1 ring-gold/40"
                      : "hairline text-mist hover:text-pearl"
                  }`}
                >
                  <div className="text-xs font-semibold">Parlak TPU (Gloss)</div>
                  <div className="text-[11px] text-mist mt-1">
                    Kristal netliğinde derin ayna parlaklığı
                  </div>
                </button>
                <button
                  onClick={() => setGlobalPPFFinish("satin")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    globalPPFFinish === "satin"
                      ? "border-gold bg-gold/10 text-pearl ring-1 ring-gold/40"
                      : "hairline text-mist hover:text-pearl"
                  }`}
                >
                  <div className="text-xs font-semibold">Saten Mat TPU</div>
                  <div className="text-[11px] text-mist mt-1">
                    Gövdeyi ipeksi dondurulmuş mata dönüştürür
                  </div>
                </button>
              </div>
            </div>

            {/* Rim Customization (Jant Kişiselleştirme) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase tracking-wider text-mist font-medium">
                  Jant Kişiselleştirme
                </label>
                <button
                  onClick={() => focusPart("rim_front_left")}
                  className="text-[11px] text-gold hover:underline"
                >
                  Janta Yaklaş
                </button>
              </div>
              <div className="space-y-2">
                {RIM_OPTIONS.map((rim) => {
                  const isSelected = rimFinishMode === rim.id;
                  return (
                    <div
                      key={rim.id}
                      onClick={() => setRimFinishMode(rim.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                          : "hairline hover:border-pearl/20 bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-white/20 shadow-inner flex-shrink-0"
                        style={{ backgroundColor: rim.previewColor }}
                      />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-pearl">
                          {rim.name}
                        </div>
                        <div className="text-[11px] text-mist">{rim.detail}</div>
                      </div>
                      {isSelected && (
                        <span className="text-gold font-bold text-xs">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicle Base Paint Swatches */}
            <div>
              <label className="text-xs uppercase tracking-wider text-mist font-medium block mb-2">
                Gövde Alt Boya Rengi
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {site.paints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPaint(p.id as PaintId)}
                    aria-label={p.name}
                    className={`relative w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                      paint === p.id
                        ? "ring-2 ring-gold ring-offset-2 ring-offset-[#08090c]"
                        : ""
                    }`}
                    style={{
                      background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7), ${p.hex} 40%, #000 120%)`,
                    }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRICE SUMMARY & WHATSAPP CTA */}
        <div className="pt-4 border-t hairline space-y-4">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-mist">
              <span>Seçilen Paneller ({calc.activeCount} adet)</span>
              <span>{calc.subtotal.toLocaleString("tr-TR")} TL</span>
            </div>
            {calc.discountAmount > 0 && (
              <div className="flex justify-between text-gold font-medium">
                <span>Paket İndirimi (-%{activePackage?.discountPercent})</span>
                <span>-{calc.discountAmount.toLocaleString("tr-TR")} TL</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t hairline">
              <span className="text-sm font-semibold text-pearl">
                Tahmini Toplam
              </span>
              <span className="text-2xl font-bold font-mono gold-text">
                {calc.totalPrice.toLocaleString("tr-TR")} TL
              </span>
            </div>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-xl shadow-gold/15 transition-transform active:scale-[0.98]"
          >
            <Icon name="spark" className="w-4 h-4" />
            <span>Teklif Al & Randevu Oluştur</span>
          </a>
        </div>
      </div>
    </div>
  );
}
