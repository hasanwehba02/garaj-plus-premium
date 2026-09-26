"use client";

import { useEffect, useRef, useState } from "react";
import { StudioEngine } from "./studio3d";
import {
  useConfiguratorStore,
  subscribeStudio,
} from "@/lib/store/configuratorStore";
import { findStudioPartById, findStudioPartByPanelId, DEFAULT_CAMERA_VIEW } from "@/lib/car-config/studio-parts";
import { site } from "@/lib/site-config";
import { useExperience } from "@/lib/store";

interface CarStudio3DProps {
  className?: string;
}

export default function CarStudio3D({ className = "" }: CarStudio3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<StudioEngine | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadPercent, setLoadPercent] = useState(0);

  const hoveredPartId = useConfiguratorStore((s) => s.hoveredPartId);
  const selectedPartId = useConfiguratorStore((s) => s.selectedPartId);
  const panelProtections = useConfiguratorStore((s) => s.panelProtections);
  const globalPPFFinish = useConfiguratorStore((s) => s.globalPPFFinish);
  const rimFinishMode = useConfiguratorStore((s) => s.rimFinishMode);

  const {
    setHoveredPart,
    togglePanelProtection,
    focusPart,
    resetCamera,
  } = useConfiguratorStore.getState();

  const paint = useExperience((s) => s.paint);
  const paintHex = site.paints.find((p) => p.id === paint)?.hex ?? site.paints[0].hex;

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const engine = new StudioEngine(containerRef.current, canvasRef.current, {
      onPartHover: (id) => {
        useConfiguratorStore.setState({ hoveredPartId: id });
      },
      onPartClick: (region, rim) => {
        if (region) {
          const part = findStudioPartById(region);
          if (part) {
            togglePanelProtection(part.panelId);
            focusPart(part.id);
          }
        } else if (rim) {
          useConfiguratorStore.setState({
            activeTab: "rims",
            selectedPartId: rim,
          });
          focusPart(rim);
        } else {
          useConfiguratorStore.setState({ selectedPartId: null });
        }
      },
      onLoadProgress: (p) => setLoadPercent(p),
      onSceneReady: () => {
        setLoading(false);
        // Initial setup
        const state = useConfiguratorStore.getState();
        const activeRegions: string[] = [];
        for (const [panelId, prot] of Object.entries(state.panelProtections)) {
          if (prot.hasPPF) {
            const part = findStudioPartByPanelId(panelId);
            if (part && part.kind === "body") {
              activeRegions.push(part.id);
            }
          }
        }
        if (activeRegions.length > 0) {
          engine.applyPPF(activeRegions, state.globalPPFFinish);
        }
        engine.setRimFinish(state.rimFinishMode);
        engine.setPaintColor(paintHex);
      },
    });

    engine.loadModel(process.env.NEXT_PUBLIC_CAR_MODEL ?? "/models/car.glb");
    engineRef.current = engine;

    // Command listener
    const unsubscribe = subscribeStudio((cmd) => {
      if (!engineRef.current) return;
      switch (cmd.type) {
        case "applyPPF":
          engineRef.current.applyPPF(cmd.regions, cmd.finish);
          break;
        case "removePPF":
          engineRef.current.removePPF(cmd.regions);
          break;
        case "setRimFinishMode":
          engineRef.current.setRimFinish(cmd.mode);
          break;
        case "setPaintColor":
          engineRef.current.setPaintColor(cmd.hex);
          break;
        case "setCameraAngle":
          engineRef.current.setCameraView(cmd.viewpoint);
          break;
        case "highlightPart":
          engineRef.current.setHighlight(cmd.partId);
          break;
        case "hoverPart":
          engineRef.current.setHover(cmd.partId);
          break;
        case "resetCamera":
          engineRef.current.setCameraView(DEFAULT_CAMERA_VIEW);
          engineRef.current.setHighlight(null);
          break;
        case "resetAll":
          engineRef.current.setCameraView(DEFAULT_CAMERA_VIEW);
          break;
      }
    });

    // Resize observer
    const ro = new ResizeObserver(() => {
      engine.resize();
    });
    ro.observe(containerRef.current);

    return () => {
      unsubscribe();
      ro.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync Paint Color from Main Experience store
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaintColor(paintHex);
    }
  }, [paintHex]);

  // Sync Rim Finish Mode
  useEffect(() => {
    if (engineRef.current && !loading) {
      engineRef.current.setRimFinish(rimFinishMode);
    }
  }, [rimFinishMode, loading]);

  // Sync PPF Finish & Panel Protections
  useEffect(() => {
    if (!engineRef.current || loading) return;
    const activeRegions: string[] = [];
    const inactiveRegions: string[] = [];
    for (const [panelId, prot] of Object.entries(panelProtections)) {
      const part = findStudioPartByPanelId(panelId);
      if (part && part.kind === "body") {
        if (prot.hasPPF) {
          activeRegions.push(part.id);
        } else {
          inactiveRegions.push(part.id);
        }
      }
    }
    if (activeRegions.length > 0) {
      engineRef.current.applyPPF(activeRegions, globalPPFFinish);
    }
    if (inactiveRegions.length > 0) {
      engineRef.current.removePPF(inactiveRegions);
    }
  }, [globalPPFFinish, panelProtections, loading]);

  // Current Hovered / Selected Part Meta
  const activeHoverPart = hoveredPartId ? findStudioPartById(hoveredPartId) : null;
  const isHoverProtected =
    activeHoverPart &&
    panelProtections[activeHoverPart.panelId]?.hasPPF;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[460px] overflow-hidden rounded-3xl bg-[#050507] select-none ${className}`}
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#050507]/90 backdrop-blur-md">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
            <span className="absolute text-xs font-mono text-pearl">{loadPercent}%</span>
          </div>
          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-mist font-medium">
            3D Stüdyo Yükleniyor...
          </p>
        </div>
      )}

      {/* Dynamic Hover Tooltip Banner */}
      {activeHoverPart && !loading && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full glass border border-gold/40 shadow-xl shadow-gold/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
            <span className="text-xs font-semibold text-pearl tracking-wide">
              {activeHoverPart.nameTr}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/30">
              {activeHoverPart.kind === "rim"
                ? "Jant Özelleştir"
                : isHoverProtected
                ? `PPF Korumalı (${globalPPFFinish === "satin" ? "Saten" : "Parlak"})`
                : "Korumasız · Seçmek İçin Tıkla"}
            </span>
          </div>
        </div>
      )}

      {/* Quick Camera Angle Views Toolbar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 p-1.5 rounded-2xl glass border hairline backdrop-blur-md shadow-2xl">
        <button
          onClick={() => {
            resetCamera();
          }}
          className="px-3 py-1.5 rounded-xl text-xs text-mist hover:text-pearl hover:bg-pearl/10 transition-colors font-medium flex items-center gap-1.5"
          title="Genel Görünüm"
        >
          <span>360°</span>
          <span>Genel</span>
        </button>
        <button
          onClick={() => {
            focusPart("hood");
          }}
          className="px-3 py-1.5 rounded-xl text-xs text-mist hover:text-pearl hover:bg-pearl/10 transition-colors font-medium"
        >
          Ön Blok
        </button>
        <button
          onClick={() => {
            focusPart("door_fl");
          }}
          className="px-3 py-1.5 rounded-xl text-xs text-mist hover:text-pearl hover:bg-pearl/10 transition-colors font-medium"
        >
          Yan & Kapı
        </button>
        <button
          onClick={() => {
            focusPart("roof");
          }}
          className="px-3 py-1.5 rounded-xl text-xs text-mist hover:text-pearl hover:bg-pearl/10 transition-colors font-medium"
        >
          Tavan
        </button>
        <button
          onClick={() => {
            focusPart("bumper_r");
          }}
          className="px-3 py-1.5 rounded-xl text-xs text-mist hover:text-pearl hover:bg-pearl/10 transition-colors font-medium"
        >
          Arka
        </button>
        <button
          onClick={() => {
            useConfiguratorStore.setState({ activeTab: "rims" });
            focusPart("rim_front_left");
          }}
          className="px-3 py-1.5 rounded-xl text-xs text-gold border border-gold/30 bg-gold/10 hover:bg-gold/20 transition-colors font-medium flex items-center gap-1"
        >
          <span>✨</span>
          <span>Jantlar</span>
        </button>
      </div>

      {/* Helper Interaction Badge */}
      <div className="absolute top-5 right-5 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass border hairline text-[11px] text-mist pointer-events-none">
        <span>🖱️ Parçaya tıkla / Döndürmek için sürükle</span>
      </div>
    </div>
  );
}
