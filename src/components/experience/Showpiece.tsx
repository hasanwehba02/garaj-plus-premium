"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import { site } from "@/lib/site-config";

/**
 * The whole 3D experience — no car model, nothing that can look fake.
 *
 * A cross-section of what the client sells: protection film laid over paint.
 *   top coat · TPU · adhesive · PAINT
 *
 * hero/outro → assembled, turning slowly
 * film       → the layers pull apart as you scroll (the 210-micron story)
 * finish     → the paint layer goes gloss ↔ satin
 * studio     → paint takes the chosen colour; coverage slides the film across it
 */

const W = 3.2;
const D = 2.1;

const LAYERS = [
  { key: "top", name: "top coat", color: "#f4f8ff", rough: 0.03, metal: 0, opacity: 0.55, h: 0.05, film: true },
  { key: "tpu", name: "TPU", color: "#e3eaf3", rough: 0.1, metal: 0, opacity: 0.6, h: 0.17, film: true },
  { key: "glue", name: "adhesive", color: "#e9dcc0", rough: 0.4, metal: 0, opacity: 0.5, h: 0.05, film: true },
  { key: "paint", name: "paint", color: "#2a2d33", rough: 0.16, metal: 0.85, opacity: 1, h: 0.26, film: false },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function Showpiece() {
  const group = useRef<THREE.Group>(null!);
  const slabs = useRef<THREE.Mesh[]>([]);
  const live = useRef({ spread: 0, matte: 0, cover: 1 });
  const colour = useMemo(() => new THREE.Color(), []);

  const mats = useMemo(
    () =>
      LAYERS.map(
        (l) =>
          new THREE.MeshPhysicalMaterial({
            color: l.color,
            roughness: l.rough,
            metalness: l.metal,
            clearcoat: 1,
            clearcoatRoughness: 0.03,
            transparent: l.opacity < 1,
            opacity: l.opacity,
            envMapIntensity: l.film ? 1.8 : 1.45,
            iridescence: l.film ? 0.6 : 0,
            iridescenceIOR: 1.3,
          }),
      ),
    [],
  );

  useFrame(({ clock }, dt) => {
    const s = useExperience.getState();
    const e = smooth(s.t);
    const share = (k: string) => (s.from === k ? 1 - e : 0) + (s.to === k ? e : 0);
    const L = live.current;
    const k = 1 - Math.exp(-dt * 3.5);

    // pull apart through the wrap chapter, assembled everywhere else
    const spreadTarget = share("film") * smooth(clamp01(((s.local.film ?? 0) - 0.05) / 0.8));
    L.spread += (spreadTarget - L.spread) * k;

    // gloss ↔ satin: scroll-driven in the finish chapter, otherwise the studio choice
    const inFinish = share("finish");
    const matteTarget =
      inFinish > 0.5 ? smooth(clamp01(((s.local.finish ?? 0) - 0.3) / 0.4)) : s.finish === "satin" ? 1 : 0;
    L.matte += (matteTarget - L.matte) * (1 - Math.exp(-dt * 3));

    // how much of the paint the film covers — the studio's coverage choice
    const coverTarget = share("studio") > 0.4 ? (site.coverage.find((c) => c.id === s.coverage)?.extent ?? 1) : 1;
    L.cover += (coverTarget - L.cover) * k;

    let y = 0;
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      const m = slabs.current[i];
      if (!m) continue;
      m.position.y = y + L.spread * (LAYERS.length - 1 - i) * 0.4;
      y += LAYERS[i].h;
      if (LAYERS[i].film) {
        // film slides across the paint from one edge
        m.scale.x = Math.max(0.02, L.cover);
        m.position.x = (W / 2) * (1 - L.cover);
      }
    }

    // paint layer follows the studio swatch + finish
    const pm = mats[LAYERS.length - 1];
    colour.set(site.paints.find((p) => p.id === s.paint)?.hex ?? site.paints[0].hex);
    pm.color.lerp(colour, 1 - Math.exp(-dt * 3));
    pm.metalness = THREE.MathUtils.lerp(0.85, 0.5, L.matte);
    pm.roughness = THREE.MathUtils.lerp(0.16, 0.6, L.matte);
    pm.clearcoat = THREE.MathUtils.lerp(1, 0.06, L.matte);
    pm.clearcoatRoughness = THREE.MathUtils.lerp(0.03, 0.55, L.matte);

    group.current.rotation.y = clock.elapsedTime * 0.1;
  });

  return (
    <group ref={group} position={[0, 0.95, 0]}>
      {LAYERS.map((l, i) => (
        <mesh
          key={l.key}
          ref={(el) => {
            if (el) slabs.current[i] = el;
          }}
          material={mats[i]}
        >
          <boxGeometry args={[W, l.h, D]} />
        </mesh>
      ))}
    </group>
  );
}
