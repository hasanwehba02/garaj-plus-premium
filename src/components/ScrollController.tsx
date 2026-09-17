"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { useExperience, type StageKey } from "@/lib/store";

export let lenisInstance: Lenis | null = null;

type Range = { key: StageKey; local?: string; a: number; b: number };

/**
 * One Lenis instance for the page. Each `[data-stage]` section gets a scroll
 * range [a, b] where the camera "holds" on that stage:
 *   - short sections hold when centred in the viewport (a = b)
 *   - tall sticky chapters hold for their whole pinned length
 * Between ranges we publish from/to/t so the camera glides.
 */
export default function ScrollController() {
  useEffect(() => {
    const st = useExperience.getState();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    st.setReducedMotion(mq.matches);

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    st.setQuality(coarse || (typeof mem === "number" && mem <= 4) || window.innerWidth < 820 ? "low" : "high");

    const lenis = new Lenis({ lerp: 0.14, smoothWheel: !mq.matches, touchMultiplier: 1.3 });
    lenisInstance = lenis;

    let ranges: Range[] = [];
    const measure = () => {
      const vh = window.innerHeight;
      ranges = [...document.querySelectorAll<HTMLElement>("[data-stage]")]
        .map((el) => {
          const top = el.getBoundingClientRect().top + window.scrollY;
          const h = el.offsetHeight;
          const [a, b] = h <= vh * 1.05 ? [top + h / 2 - vh / 2, top + h / 2 - vh / 2] : [top, top + h - vh];
          return { key: el.dataset.stage as StageKey, local: el.dataset.local, a: Math.max(0, a), b: Math.max(0, b) };
        })
        .sort((x, y) => x.a - y.a);
    };

    let last = "";
    const publish = () => {
      if (!ranges.length) return;
      const y = window.scrollY;
      let from = ranges[0].key;
      let to = from;
      let t = 0;
      for (let i = 0; i < ranges.length; i++) {
        const r = ranges[i];
        const next = ranges[i + 1];
        if (y < r.a) break;
        if (y <= r.b || !next) { from = to = r.key; t = 0; if (y <= r.b) break; continue; }
        if (y < next.a) { from = r.key; to = next.key; t = (y - r.b) / Math.max(1, next.a - r.b); break; }
      }
      const local: Record<string, number> = {};
      for (const r of ranges) {
        if (!r.local) continue;
        local[r.local] = r.b > r.a ? Math.min(1, Math.max(0, (y - r.a) / (r.b - r.a))) : y >= r.a ? 1 : 0;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? y / max : 0;
      const sig = `${from}${to}${t.toFixed(4)}${Object.values(local).map((v) => v.toFixed(4)).join()}${progress.toFixed(3)}`;
      if (sig !== last) {
        last = sig;
        useExperience.getState().setScroll({ from, to, t, local, progress });
      }
    };

    measure();
    publish();
    const ro = new ResizeObserver(() => { measure(); publish(); });
    ro.observe(document.body);

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      publish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener("scroll", publish, { passive: true });

    // smooth in-page anchors
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!;
      const target = id === "#" ? 0 : document.querySelector<HTMLElement>(id);
      if (target === null) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", publish);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return null;
}
