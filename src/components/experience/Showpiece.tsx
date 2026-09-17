"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience, type StageKey } from "@/lib/store";

/**
 * The 210-micron layer stack — top coat / TPU / adhesive / paint — that pulls
 * apart through the wrap chapter. Plain boxes, no model: it explains what the
 * client actually sells. Shown only on the "film" stage; the car covers the rest.
 */

const smooth = (t: number) => t * t * (3 - 2 * t);

function stageWeight(s: ReturnType<typeof useExperience.getState>, keys: StageKey[]) {
  const e = smooth(s.t);
  return (keys.includes(s.from) ? 1 - e : 0) + (keys.includes(s.to) ? e : 0);
}

const LAYERS = [
  { name: "top coat", color: "#f2f6ff", rough: 0.03, metal: 0, transmission: 0.85, h: 0.055 },
  { name: "TPU", color: "#dfe6ef", rough: 0.12, metal: 0, transmission: 0.45, h: 0.16 },
  { name: "adhesive", color: "#e8dcc2", rough: 0.35, metal: 0, transmission: 0.3, h: 0.06 },
  { name: "paint", color: "#0b0c0f", rough: 0.14, metal: 0.85, transmission: 0, h: 0.2 },
];

export default function LayerStack() {
  const group = useRef<THREE.Group>(null!);
  const low = useExperience.getState().quality === "low";
  const w = useRef(0);
  const slabs = useRef<THREE.Mesh[]>([]);

  const mats = useMemo(
    () =>
      LAYERS.map(
        (l) =>
          new THREE.MeshPhysicalMaterial({
            color: l.color,
            roughness: l.rough,
            metalness: l.metal,
            clearcoat: 1,
            clearcoatRoughness: 0.04,
            transparent: l.transmission > 0,
            opacity: l.transmission > 0 ? 0.85 : 1,
            transmission: low ? 0 : l.transmission,
            thickness: 0.2,
            envMapIntensity: 1.2,
          }),
      ),
    [low],
  );

  useFrame(({ clock }, dt) => {
    const s = useExperience.getState();
    const target = stageWeight(s, ["film"]);
    w.current += (target - w.current) * (1 - Math.exp(-dt * 3));
    group.current.visible = w.current > 0.01;
    if (!group.current.visible) return;

    // the stack pulls apart as the wrap chapter scrolls
    const spread = smooth(Math.min(1, Math.max(0, ((s.local.film ?? 0) - 0.05) / 0.8)));
    let y = 0;
    for (let i = LAYERS.length - 1; i >= 0; i--) {
      const m = slabs.current[i];
      if (!m) continue;
      m.position.y = y + spread * (LAYERS.length - 1 - i) * 0.42;
      y += LAYERS[i].h;
    }
    group.current.rotation.y = clock.elapsedTime * 0.12;
    group.current.scale.setScalar(0.9 + w.current * 0.1);
  });

  return (
    <group ref={group} position={[0, 0.75, 0]}>
      {LAYERS.map((l, i) => (
        <mesh
          key={l.name}
          ref={(el) => {
            if (el) slabs.current[i] = el;
          }}
          material={mats[i]}
          castShadow={false}
        >
          <boxGeometry args={[2.9, l.h, 1.9]} />
        </mesh>
      ))}
    </group>
  );
}

