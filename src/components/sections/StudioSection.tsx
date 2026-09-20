"use client";

import { useMemo } from "react";
import { site, type CoverageId } from "@/lib/site-config";
import { useExperience, type Finish } from "@/lib/store";
import { useConfiguratorStore } from "@/lib/store/configuratorStore";
import { PANELS, CATEGORY_LABELS } from "@/data/panels";
import { PACKAGES } from "@/data/packages";
import Reveal from "../ui/Reveal";
import Icon from "../ui/Icon";
import type { RimFinishMode } from "@/lib/car-config/types";

const RIM_OPTIONS: {
  id: RimFinishMode;
  name: string;
  detail: string;
  previewColor: string;
}[] = [
  {
    id: "gloss_black",
    name: "Parlak Siyah (Gloss Black)",
    detail: "Piano black ayna parlaklığı",
    previewColor: "#0a0a0c",
  },
  {
    id: "dark_chrome",
    name: "Füme Krom (Dark Chrome)",
    detail: "Antrasit metalik krom",
    previewColor: "#32353a",
  },
  {
    id: "satin_silver",
    name: "Saten Gümüş (Satin Silver)",
    detail: "İpeksi fırçalanmış alüminyum",
    previewColor: "#b8bcc2",
  },
  {
    id: "matte_black",
    name: "Mat Siyah (Matte Black)",
    detail: "Işık yansıtmayan mat doku",
    previewColor: "#141518",
  },
];



const PANEL_CAMERA_MAP: Record<string, "front_three_quarter" | "hood" | "side" | "rear" | "roof" | "wheels"> = {
  kaput: "hood",
  on_tampon: "hood",
  camurluk_on_sol: "front_three_quarter",
  camurluk_on_sag: "front_three_quarter",
  kapi_on_sol: "side",
  kapi_on_sag: "side",
  kapi_arka_sol: "side",
  kapi_arka_sag: "side",
  tavan: "roof",
  ayna_sol: "front_three_quarter",
  ayna_sag: "front_three_quarter",
  arka_tampon: "rear",
  bagaj_kapagi: "rear",
  jant_on_sol: "wheels",
  jant_on_sag: "wheels",
  jant_arka_sol: "wheels",
  jant_arka_sag: "wheels",
};

export default function StudioSection() {
  const finish = useExperience((s) => s.finish);
  const { setFinish, setCoverage } = useExperience.getState();

  const activePackageId = useConfiguratorStore((s) => s.activePackageId);
  const rimFinishMode = useConfiguratorStore((s) => s.rimFinishMode);
  const panelProtections = useConfiguratorStore((s) => s.panelProtections);
  const activeTab = useConfiguratorStore((s) => s.activeTab);
  const activeCategory = useConfiguratorStore((s) => s.activeCategory);
  const studioCameraAngle = useConfiguratorStore((s) => s.studioCameraAngle);
  const studioRotationDeg = useConfiguratorStore((s) => s.studioRotationDeg);
  const isAutoSpinning = useConfiguratorStore((s) => s.isAutoSpinning);

  const {
    setActiveTab,
    setActiveCategory,
    setStudioCameraAngle,
    setStudioRotationDeg,
    toggleAutoSpinning,
    togglePanelProtection,
    setGlobalPPFFinish,
    setRimFinishMode,
    applyPackage,
    selectAllPanels,
    deselectAllPanels,
    resetAll,
    getCalculations,
  } = useConfiguratorStore.getState();

  const calc = getCalculations();
  const activePackage = PACKAGES.find((p) => p.id === activePackageId);

  const filteredPanels = useMemo(() => {
    if (activeCategory === "all") return PANELS;
    return PANELS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const handlePackageClick = (pkgId: string) => {
    applyPackage(pkgId);
    if (pkgId === "full") {
      setCoverage("full" as CoverageId);
      setStudioCameraAngle("front_three_quarter");
    } else if (pkgId === "front") {
      setCoverage("front" as CoverageId);
      setStudioCameraAngle("hood");
    } else if (pkgId === "urban") {
      setCoverage("track" as CoverageId);
      setStudioCameraAngle("front_three_quarter");
    } else {
      setCoverage("custom" as CoverageId);
    }
  };

  const handleFinishChange = (f: Finish) => {
    setFinish(f);
    setGlobalPPFFinish(f);
  };

  const handlePanelToggle = (panelId: string) => {
    togglePanelProtection(panelId);
    setCoverage("custom" as CoverageId);
    const targetAngle = PANEL_CAMERA_MAP[panelId];
    if (targetAngle) {
      setStudioCameraAngle(targetAngle);
    }
  };

  const handleSelectAll = () => {
    selectAllPanels();
    setCoverage("full" as CoverageId);
    setStudioCameraAngle("front_three_quarter");
  };

  const handleDeselectAll = () => {
    deselectAllPanels();
    setCoverage("custom" as CoverageId);
  };

  const whatsappUrl = useMemo(() => {
    const activePanelsList = PANELS.filter((p) => panelProtections[p.id]?.hasPPF)
      .map((p) => p.name)
      .join(", ");

    const selectedRim = RIM_OPTIONS.find((r) => r.id === rimFinishMode)?.name;
    const finishName = finish === "satin" ? "Saten Mat TPU" : "Parlak TPU";

    const msg = encodeURIComponent(
      `Merhaba Garaj+, 3D Stüdyo'da aracıma özel PPF ve Jant konfigürasyonu hazırladım:\n\n` +
      `Paket: ${activePackage?.name ?? "Özel Seçim"}\n` +
      `PPF Yüzey: ${finishName}\n` +
      `Jant Bitişi: ${selectedRim}\n` +
      `Korunan Paneller (${calc.activeCount} adet): ${activePanelsList || "Seçilmedi"}\n` +
      `Tahmini Tutar: ${calc.totalPrice.toLocaleString("tr-TR")} TL\n\n` +
      `Randevu ve uygulama detayları için bilgi alabilir miyim?`
    );
    return `https://wa.me/${site.contact.whatsapp}?text=${msg}`;
  }, [panelProtections, activePackageId, finish, rimFinishMode, calc, activePackage]);

  return (
    <section
      id="studio"
      data-stage="studio"
      className="relative flex min-h-[135svh] items-end px-3 pb-24 pt-[40svh] md:items-center md:px-10 md:py-28 cursor-grab active:cursor-grabbing"
    >
      <div className="mx-auto w-full max-w-[1440px]">
        <Reveal className="w-full max-w-lg">
          <div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            className="glass w-full rounded-3xl p-4 sm:p-7 shadow-2xl border hairline overflow-hidden z-20 relative backdrop-blur-xl"
          >
            {/* Header & Reset */}
            <div className="flex items-center justify-between pb-2.5 border-b hairline">
              <div className="eyebrow flex items-center gap-3">
                <span className="text-gold font-mono font-bold">04</span>
                <span className="h-px w-8 bg-gold/50" />
                {site.wordmark} Stüdyo
              </div>
              <button
                onClick={() => {
                  resetAll();
                  setCoverage("full" as CoverageId);
                  setFinish("gloss");
                  setStudioCameraAngle("front_three_quarter");
                }}
                className="text-xs text-mist hover:text-gold transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/5 touch-manipulation"
                title="Seçimleri Sıfırla"
              >
                <Icon name="spark" className="w-3.5 h-3.5" />
                <span>Sıfırla</span>
              </button>
            </div>

            <h2 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight tracking-[-0.02em] text-pearl">
              PPF & Jant <em className="font-display font-bold gold-text not-italic">Özelleştirme</em>
            </h2>
            <p className="mt-1 text-xs text-mist leading-relaxed">
              Paketleri, panel korumalarını ve jant kaplamasını canlı deneyimleyin. 3D aracı serbestçe döndürebilirsiniz.
            </p>

            {/* Tab Selector */}
            <div className="mt-3.5 grid grid-cols-3 gap-1 p-1 bg-white/5 rounded-2xl border hairline">
              <button
                onClick={() => {
                  setActiveTab("packages");
                  setStudioCameraAngle("front_three_quarter");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                  activeTab === "packages"
                    ? "bg-gold text-ink shadow-md"
                    : "text-mist hover:text-pearl"
                }`}
              >
                Paketler
              </button>
              <button
                onClick={() => {
                  setActiveTab("panels");
                  setStudioCameraAngle("front_three_quarter");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                  activeTab === "panels"
                    ? "bg-gold text-ink shadow-md"
                    : "text-mist hover:text-pearl"
                }`}
              >
                Paneller ({calc.activeCount})
              </button>
              <button
                onClick={() => {
                  setActiveTab("rims");
                  setStudioCameraAngle("side");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-semibold transition-all touch-manipulation ${
                  activeTab === "rims"
                    ? "bg-gold text-ink shadow-md"
                    : "text-mist hover:text-pearl"
                }`}
              >
                Jantlar
              </button>
            </div>

            {/* TAB 1: PACKAGES */}
            {activeTab === "packages" && (
              <div
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                className="mt-3.5 space-y-2 max-h-[250px] sm:max-h-[280px] overflow-y-auto pr-1 touch-scroll"
              >
                {PACKAGES.map((pkg) => {
                  const isSelected = activePackageId === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => handlePackageClick(pkg.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-gold bg-gold/10 shadow-md shadow-gold/5"
                          : "hairline hover:border-pearl/25 bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-pearl">
                              {pkg.name}
                            </span>
                            {pkg.badge && (
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                                {pkg.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gold/90 font-medium mt-0.5">
                            {pkg.tagline}
                          </p>
                        </div>
                        {pkg.discountPercent > 0 && (
                          <span className="text-xs font-mono font-bold text-gold px-2 py-0.5 rounded-md bg-gold/10 border border-gold/30">
                            -%{pkg.discountPercent}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-mist mt-1 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: INDIVIDUAL PANELS */}
            {activeTab === "panels" && (
              <div
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                className="mt-3.5 space-y-3"
              >
                {/* PPF Finish Selector (Moved to Panels) */}
                <div>
                  <label className="text-[10px] uppercase font-mono tracking-wider text-mist block mb-1">
                    PPF Yüzey Bitişi
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["gloss", "satin"] as Finish[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => handleFinishChange(f)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          finish === f
                            ? "border-gold bg-gold/15 text-pearl ring-1 ring-gold/40 shadow-sm"
                            : "hairline text-mist hover:text-pearl bg-white/[0.02]"
                        }`}
                      >
                        <div className="text-[11px] font-semibold">
                          {f === "gloss" ? "Parlak TPU (Gloss)" : "Saten Mat TPU"}
                        </div>
                        <div className="text-[9px] text-mist mt-0.5">
                          {f === "gloss" ? "Ayna berraklığı" : "Dondurulmuş mat"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select All & Deselect All Quick Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t hairline">
                  <div className="text-[11px] text-mist">
                    Seçili: <strong className="text-pearl">{calc.activeCount}</strong> / {calc.totalPanels} panel
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleSelectAll}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 transition-colors"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-mist hover:text-pearl border hairline transition-colors"
                    >
                      Tümünü Temizle
                    </button>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs touch-scroll no-scrollbar">
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
                      onClick={() => {
                        setActiveCategory(cat);
                        if (cat === "all") setStudioCameraAngle("front_three_quarter");
                        else if (cat === "wheels" || cat === "doors") setStudioCameraAngle("side");
                        else if (cat === "front") setStudioCameraAngle("hood");
                        else if (cat === "rear") setStudioCameraAngle("rear");
                        else if (cat === "roof_mirrors") setStudioCameraAngle("roof");
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors touch-manipulation ${
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
                <div
                  data-lenis-prevent="true"
                  onWheel={(e) => e.stopPropagation()}
                  className="space-y-1.5 max-h-[160px] sm:max-h-[175px] overflow-y-auto pr-1 touch-scroll"
                >
                  {filteredPanels.map((panel) => {
                    const isProtected = !!panelProtections[panel.id]?.hasPPF;
                    return (
                      <div
                        key={panel.id}
                        onClick={() => handlePanelToggle(panel.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all touch-manipulation ${
                          isProtected
                            ? "border-gold/60 bg-gold/10"
                            : "hairline hover:border-pearl/20 bg-white/[0.02]"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-pearl">
                            {panel.name}
                          </div>
                          <div className="text-[10px] text-gold font-mono">
                            {panel.basePrice.toLocaleString("tr-TR")} TL
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                            isProtected
                              ? "bg-gold text-ink"
                              : "border hairline text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: RIMS (Dedicated Rim Customization) */}
            {activeTab === "rims" && (
              <div
                data-lenis-prevent="true"
                onWheel={(e) => e.stopPropagation()}
                className="mt-3.5 space-y-3 max-h-[250px] sm:max-h-[280px] overflow-y-auto pr-1 touch-scroll"
              >
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-semibold text-pearl">
                      Jant Kişiselleştirme & Kaplama
                    </span>
                    <p className="text-[10px] text-mist">
                      Jantların kaplama dokusunu ve renk tonunu canlı seçin.
                    </p>
                  </div>
                  <button
                    onClick={() => setStudioCameraAngle("side")}
                    className="text-[10px] text-gold hover:underline font-mono touch-manipulation"
                  >
                    Janta Odaklan
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {RIM_OPTIONS.map((rim) => {
                    const isSelected = rimFinishMode === rim.id;
                    return (
                      <div
                        key={rim.id}
                        onClick={() => {
                          setRimFinishMode(rim.id);
                          setStudioCameraAngle("side");
                        }}
                        className={`flex items-center gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all touch-manipulation ${
                          isSelected
                            ? "border-gold bg-gold/10 ring-1 ring-gold/40 shadow-sm"
                            : "hairline hover:border-pearl/20 bg-white/[0.02]"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-white/30 flex-shrink-0 shadow-inner"
                          style={{ backgroundColor: rim.previewColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-pearl truncate">
                            {rim.name.split(" ")[0]} {rim.name.split(" ")[1]}
                          </div>
                          <div className="text-[10px] text-mist truncate">
                            {rim.detail}
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-gold font-bold text-xs">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PRICE SUMMARY & WHATSAPP CTA */}
            <div className="mt-4 pt-3 border-t hairline space-y-2.5">
              <div className="space-y-1 text-xs">
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
                <div className="flex justify-between items-baseline pt-1 border-t hairline">
                  <span className="text-xs font-semibold text-pearl">Tahmini Tutar</span>
                  <span className="text-xl font-bold font-mono gold-text">
                    {calc.totalPrice.toLocaleString("tr-TR")} TL
                  </span>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-lg shadow-gold/15 transition-transform active:scale-[0.98] touch-manipulation"
              >
                <Icon name="spark" className="w-4 h-4" />
                <span>Teklif Al & Randevu Oluştur</span>
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
