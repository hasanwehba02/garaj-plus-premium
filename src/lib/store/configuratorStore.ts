"use client";

import { create } from "zustand";
import type {
  PPFFinish,
  RimFinishMode,
  StudioCommand,
  CameraViewpoint,
  PanelProtectionState,
} from "../car-config/types";
import {
  STUDIO_PARTS,
  DEFAULT_CAMERA_VIEW,
  findStudioPartByPanelId,
  findStudioPartById,
  getAllBodyRegionIds,
} from "../car-config/studio-parts";
import { PANELS } from "@/data/panels";
import { PACKAGES } from "@/data/packages";

type StudioListener = (cmd: StudioCommand) => void;
const studioListeners = new Set<StudioListener>();

export function subscribeStudio(listener: StudioListener): () => void {
  studioListeners.add(listener);
  return () => {
    studioListeners.delete(listener);
  };
}

export function dispatchStudioCommand(cmd: StudioCommand): void {
  studioListeners.forEach((fn) => {
    try {
      fn(cmd);
    } catch (e) {
      console.error("[StudioCommand Error]", e);
    }
  });
}

// Default initial state: full package selected
const initialPanelProtections: Record<string, PanelProtectionState> = {};
const fullPackage = PACKAGES.find((p) => p.id === "full");
if (fullPackage) {
  for (const panel of PANELS) {
    initialPanelProtections[panel.id] = {
      hasPPF: fullPackage.panelIds.includes(panel.id),
      finish: "gloss",
    };
  }
}

interface ConfiguratorState {
  // Selections
  activePackageId: string;
  globalPPFFinish: PPFFinish;
  rimFinishMode: RimFinishMode;
  panelProtections: Record<string, PanelProtectionState>;

  // Interaction State
  hoveredPartId: string | null;
  selectedPartId: string | null;
  activeCategory: "all" | "front" | "doors" | "rear" | "roof_mirrors" | "wheels";
  activeTab: "packages" | "panels" | "rims" | "summary";
  studioCameraAngle: "front_three_quarter" | "hood" | "side" | "rear" | "roof" | "wheels";
  studioRotationDeg: number;
  isAutoSpinning: boolean;

  // Actions
  setActiveTab: (tab: "packages" | "panels" | "rims" | "summary") => void;
  setActiveCategory: (cat: "all" | "front" | "doors" | "rear" | "roof_mirrors" | "wheels") => void;
  setStudioCameraAngle: (angle: "front_three_quarter" | "hood" | "side" | "rear" | "roof" | "wheels") => void;
  setStudioRotationDeg: (deg: number) => void;
  toggleAutoSpinning: () => void;
  setHoveredPart: (partId: string | null) => void;
  setSelectedPart: (partId: string | null) => void;

  togglePanelProtection: (panelId: string) => void;
  setGlobalPPFFinish: (finish: PPFFinish) => void;
  setRimFinishMode: (mode: RimFinishMode) => void;
  applyPackage: (packageId: string) => void;
  focusPart: (partIdOrPanelId: string) => void;
  resetCamera: () => void;
  selectAllPanels: () => void;
  deselectAllPanels: () => void;
  resetAll: () => void;

  // Pricing calculations
  getCalculations: () => {
    subtotal: number;
    discountAmount: number;
    totalPrice: number;
    activeCount: number;
    totalPanels: number;
  };
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  activePackageId: "full",
  globalPPFFinish: "gloss",
  rimFinishMode: "gloss_black",
  panelProtections: initialPanelProtections,

  hoveredPartId: null,
  selectedPartId: null,
  activeCategory: "all",
  activeTab: "packages",
  studioCameraAngle: "front_three_quarter",
  studioRotationDeg: 0,
  isAutoSpinning: true,

  setActiveTab: (tab) => {
    // When switching to panels or rims, stop spinning so user can inspect
    const isSpinning = tab === "packages";
    if (tab === "rims") {
      set({ activeTab: tab, isAutoSpinning: false, studioCameraAngle: "side" });
    } else if (tab === "packages") {
      set({ activeTab: tab, isAutoSpinning: isSpinning, studioCameraAngle: "front_three_quarter" });
    } else {
      set({ activeTab: tab, isAutoSpinning: false, studioCameraAngle: "front_three_quarter" });
    }
  },
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setStudioCameraAngle: (studioCameraAngle) => set({ studioCameraAngle, isAutoSpinning: false, studioRotationDeg: 0 }),
  setStudioRotationDeg: (studioRotationDeg) => set({ studioRotationDeg, isAutoSpinning: false }),
  toggleAutoSpinning: () => set((state) => ({ isAutoSpinning: !state.isAutoSpinning })),

  setHoveredPart: (partId) => {
    set({ hoveredPartId: partId });
    dispatchStudioCommand({ type: "hoverPart", partId });
  },

  setSelectedPart: (partId) => {
    set({ selectedPartId: partId });
    dispatchStudioCommand({ type: "highlightPart", partId });
  },

  togglePanelProtection: (panelId: string) => {
    const state = get();
    const current = state.panelProtections[panelId];
    const willProtect = !current?.hasPPF;
    const finish = state.globalPPFFinish;

    const updatedProtections = {
      ...state.panelProtections,
      [panelId]: {
        hasPPF: willProtect,
        finish,
      },
    };

    set({
      activePackageId: "custom",
      panelProtections: updatedProtections,
    });

    const part = findStudioPartByPanelId(panelId);
    if (part) {
      if (part.kind === "body") {
        if (willProtect) {
          dispatchStudioCommand({
            type: "applyPPF",
            regions: [part.id],
            finish,
          });
        } else {
          dispatchStudioCommand({
            type: "removePPF",
            regions: [part.id],
          });
        }
      }
    }
  },

  setGlobalPPFFinish: (finish: PPFFinish) => {
    const state = get();
    const updatedProtections: Record<string, PanelProtectionState> = {};
    const protectedRegions: string[] = [];

    for (const [panelId, prot] of Object.entries(state.panelProtections)) {
      updatedProtections[panelId] = {
        ...prot,
        finish,
      };
      if (prot.hasPPF) {
        const part = findStudioPartByPanelId(panelId);
        if (part && part.kind === "body") {
          protectedRegions.push(part.id);
        }
      }
    }

    set({
      globalPPFFinish: finish,
      panelProtections: updatedProtections,
    });

    if (protectedRegions.length > 0) {
      dispatchStudioCommand({
        type: "applyPPF",
        regions: protectedRegions,
        finish,
      });
    }
  },

  setRimFinishMode: (mode: RimFinishMode) => {
    set({ rimFinishMode: mode });
    dispatchStudioCommand({ type: "setRimFinishMode", mode });
  },

  applyPackage: (packageId: string) => {
    const pkg = PACKAGES.find((p) => p.id === packageId);
    if (!pkg) return;

    const state = get();
    const updatedProtections: Record<string, PanelProtectionState> = {};
    const appliedRegions: string[] = [];
    const removedRegions: string[] = [];

    for (const panel of PANELS) {
      const isIncluded = pkg.panelIds.includes(panel.id);
      updatedProtections[panel.id] = {
        hasPPF: isIncluded,
        finish: state.globalPPFFinish,
      };

      const part = findStudioPartByPanelId(panel.id);
      if (part && part.kind === "body") {
        if (isIncluded) {
          appliedRegions.push(part.id);
        } else {
          removedRegions.push(part.id);
        }
      }
    }

    set({
      activePackageId: packageId,
      panelProtections: updatedProtections,
    });

    if (appliedRegions.length > 0) {
      dispatchStudioCommand({
        type: "applyPPF",
        regions: appliedRegions,
        finish: state.globalPPFFinish,
      });
    }
    if (removedRegions.length > 0) {
      dispatchStudioCommand({
        type: "removePPF",
        regions: removedRegions,
      });
    }
  },

  focusPart: (partIdOrPanelId: string) => {
    const part =
      findStudioPartById(partIdOrPanelId) || findStudioPartByPanelId(partIdOrPanelId);
    if (part) {
      set({ selectedPartId: part.id });
      dispatchStudioCommand({
        type: "setCameraAngle",
        viewpoint: part.camera,
      });
      dispatchStudioCommand({
        type: "highlightPart",
        partId: part.id,
      });
    }
  },

  resetCamera: () => {
    dispatchStudioCommand({
      type: "setCameraAngle",
      viewpoint: DEFAULT_CAMERA_VIEW,
    });
    dispatchStudioCommand({ type: "highlightPart", partId: null });
    set({ selectedPartId: null, hoveredPartId: null });
  },

  selectAllPanels: () => {
    const state = get();
    const updated: Record<string, PanelProtectionState> = {};
    for (const p of PANELS) {
      updated[p.id] = { hasPPF: true, finish: state.globalPPFFinish };
    }
    set({ activePackageId: "full", panelProtections: updated });
  },

  deselectAllPanels: () => {
    const state = get();
    const updated: Record<string, PanelProtectionState> = {};
    for (const p of PANELS) {
      updated[p.id] = { hasPPF: false, finish: state.globalPPFFinish };
    }
    set({ activePackageId: "custom", panelProtections: updated });
  },

  resetAll: () => {
    const state = get();
    state.applyPackage("full");
    state.setGlobalPPFFinish("gloss");
    state.setRimFinishMode("gloss_black");
    state.resetCamera();
  },

  getCalculations: () => {
    const state = get();
    let subtotal = 0;
    let activeCount = 0;

    for (const panel of PANELS) {
      const prot = state.panelProtections[panel.id];
      if (prot?.hasPPF) {
        activeCount++;
        const base = panel.basePrice;
        const satin = prot.finish === "satin" ? panel.satinExtraPrice : 0;
        subtotal += base + satin;
      }
    }

    const pkg = PACKAGES.find((p) => p.id === state.activePackageId);
    const discountPercent = pkg?.discountPercent ?? 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const totalPrice = subtotal - discountAmount;

    return {
      subtotal,
      discountAmount,
      totalPrice,
      activeCount,
      totalPanels: PANELS.length,
    };
  },
}));
