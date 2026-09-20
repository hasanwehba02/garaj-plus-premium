"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useExperience, type StageKey } from "@/lib/store";
import { useConfiguratorStore } from "@/lib/store/configuratorStore";

type Key = { pos: [number, number, number]; target: [number, number, number]; fov: number; shift: number; mLift: number };

export const KEYS: Record<StageKey, Key> = {
  hero: { pos: [6.4, 1.35, 6.8], target: [0, 0.62, 0], fov: 30, shift: 1.25, mLift: -0.05 },
  film: { pos: [0.3, 1.05, 9.4], target: [0, 0.6, 0], fov: 30, shift: 1.55, mLift: 0.42 },
  healing: { pos: [3.9, 1.3, 3.1], target: [1.4, 0.6, 0.35], fov: 36, shift: -0.9, mLift: 0.42 },
  finish: { pos: [-6.2, 1.8, 5.2], target: [-0.2, 0.55, 0], fov: 30, shift: 1.3, mLift: 0.42 },
  studio: { pos: [7.2, 3.1, 7.4], target: [0, 0.5, 0], fov: 28, shift: 1.25, mLift: 0.5 },
  top: { pos: [0.01, 13, 2.6], target: [0, 0, 0], fov: 30, shift: 0, mLift: 0 },
  outro: { pos: [-8, 0.85, -6.2], target: [0, 0.75, 0], fov: 26, shift: 0, mLift: 0.3 },
};

const STUDIO_KEYS: Record<string, Key> = {
  front_three_quarter: { pos: [6.4, 2.2, 5.0], target: [0, 0.55, 0], fov: 28, shift: 1.1, mLift: 0.45 },
  hood: { pos: [6.8, 1.45, 0], target: [0.9, 0.55, 0], fov: 25, shift: 0.85, mLift: 0.35 },
  side: { pos: [0.2, 1.25, 6.8], target: [0.1, 0.50, 0], fov: 27, shift: 0.85, mLift: 0.35 },
  rear: { pos: [-6.8, 1.45, 0], target: [-0.9, 0.55, 0], fov: 26, shift: 0.85, mLift: 0.35 },
  roof: { pos: [0.2, 7.8, 2.2], target: [0, 0.5, 0], fov: 28, shift: 0.7, mLift: 0.3 },
  wheels: { pos: [0.2, 1.25, 6.8], target: [0.1, 0.50, 0], fov: 27, shift: 0.85, mLift: 0.35 },
};

const INTRO = new THREE.Vector3(12, 4.2, 13);

export default function CameraRig() {
  const cur = useRef({ pos: INTRO.clone(), tgt: new THREE.Vector3(0, 0.6, 0), shift: 0, lift: 0, fov: 30 });
  const mouse = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const v = useRef({ a: new THREE.Vector3(), b: new THREE.Vector3(), dir: new THREE.Vector3(), right: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), camUp: new THREE.Vector3() });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera, size }, dt) => {
    const s = useExperience.getState();
    const c = cur.current;
    const { a, b, dir, right, look, up, camUp } = v.current;
    const cam = camera as THREE.PerspectiveCamera;

    const e = s.t * s.t * (3 - 2 * s.t);
    const studioAngle = useConfiguratorStore.getState().studioCameraAngle ?? "front_three_quarter";
    const studioKey = STUDIO_KEYS[studioAngle] ?? KEYS.studio;

    const A = s.from === "studio" ? studioKey : KEYS[s.from];
    const B = s.to === "studio" ? studioKey : KEYS[s.to];

    a.fromArray(A.pos).lerp(b.fromArray(B.pos), e);
    const tx = THREE.MathUtils.lerp(A.target[0], B.target[0], e);
    const ty = THREE.MathUtils.lerp(A.target[1], B.target[1], e);
    const tz = THREE.MathUtils.lerp(A.target[2], B.target[2], e);
    const narrow = size.width < 900;
    const shift = narrow ? 0 : THREE.MathUtils.lerp(A.shift, B.shift, e);
    const lift = narrow ? THREE.MathUtils.lerp(A.mLift, B.mLift, e) : 0;
    let fov = THREE.MathUtils.lerp(A.fov, B.fov, e);
    const aspect = size.width / Math.max(1, size.height);
    if (aspect < 1.2) {
      const kf = THREE.MathUtils.clamp(0.95 / aspect, 1, 2.2);
      fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov / 2)) * kf));
    }

    // gentle pointer parallax
    const m = mouse.current;
    const mk = 1 - Math.exp(-dt * 2.5);
    m.sx += ((s.reducedMotion ? 0 : m.x) - m.sx) * mk;
    m.sy += ((s.reducedMotion ? 0 : m.y) - m.sy) * mk;
    a.x += m.sx * 0.3;
    a.y -= m.sy * 0.18;

    const k = s.sceneReady ? 1 - Math.exp(-dt * (s.reducedMotion ? 30 : 4.5)) : 0;
    c.pos.lerp(a, k);
    c.tgt.x += (tx - c.tgt.x) * k;
    c.tgt.y += (ty - c.tgt.y) * k;
    c.tgt.z += (tz - c.tgt.z) * k;
    c.shift += (shift - c.shift) * (s.sceneReady ? k : 1);
    c.fov += (fov - c.fov) * (s.sceneReady ? k : 1);
    c.lift += (lift - c.lift) * (s.sceneReady ? k : 1);

    cam.position.copy(c.pos);
    dir.subVectors(c.tgt, c.pos).normalize();
    right.crossVectors(dir, up).normalize();
    look.copy(c.tgt).addScaledVector(right, -c.shift);
    if (c.lift) {
      camUp.crossVectors(right, dir);
      look.addScaledVector(camUp, -c.lift * c.pos.distanceTo(c.tgt) * Math.tan(THREE.MathUtils.degToRad(c.fov / 2)));
    }
    cam.lookAt(look);
    if (Math.abs(cam.fov - c.fov) > 0.001) {
      cam.fov = c.fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
