"use client";

import { create } from "zustand";
import { site, type CoverageId, type PaintId } from "./site-config";

/**
 * Shared state between the DOM and the single persistent 3D canvas.
 *
 * Scroll → `from`/`to`/`t` (which camera stage we are between) and `local`
 * (0..1 progress inside tall sticky chapters, keyed by `data-local`).
 * The 3D components read these via `getState()` inside useFrame, so scrolling
 * never re-renders React.
 */

export type StageKey = "hero" | "film" | "healing" | "finish" | "studio" | "top" | "outro";
export type Finish = "gloss" | "satin";

type State = {
  from: StageKey;
  to: StageKey;
  t: number;
  local: Record<string, number>;
  progress: number;

  paint: PaintId;
  finish: Finish;
  coverage: CoverageId;

  quality: "high" | "low";
  reducedMotion: boolean;
  loadProgress: number;
  sceneReady: boolean;

  setScroll: (p: Partial<Pick<State, "from" | "to" | "t" | "local" | "progress">>) => void;
  setPaint: (p: PaintId) => void;
  setFinish: (f: Finish) => void;
  setCoverage: (c: CoverageId) => void;
  setQuality: (q: "high" | "low") => void;
  setReducedMotion: (v: boolean) => void;
  setLoadProgress: (v: number) => void;
  setSceneReady: (v: boolean) => void;
};

export const useExperience = create<State>((set) => ({
  from: "hero",
  to: "hero",
  t: 0,
  local: {},
  progress: 0,

  paint: site.defaultPaint as PaintId,
  finish: "gloss",
  coverage: site.defaultCoverage as CoverageId,

  quality: "high",
  reducedMotion: false,
  loadProgress: 0,
  sceneReady: false,

  setScroll: (p) => set(p),
  setPaint: (paint) => set({ paint }),
  setFinish: (finish) => set({ finish }),
  setCoverage: (coverage) => set({ coverage }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setLoadProgress: (loadProgress) => set({ loadProgress }),
  setSceneReady: (sceneReady) => set({ sceneReady }),
}));
