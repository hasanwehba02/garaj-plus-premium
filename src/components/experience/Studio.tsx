"use client";

import { useMemo } from "react";
import { Environment, ContactShadows, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { site } from "@/lib/site-config";

/**
 * Dark private-showroom stage: obsidian void, a reflective floor, overhead
 * softbox strips for long body-line reflections, a champagne-gold rim from
 * one side, a cool steel rim from the other, and a thin gold turntable ring.
 */
function useHorizonTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 8;
    c.height = 512;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#030304");
    g.addColorStop(0.42, "#0b0b0d");
    g.addColorStop(0.5, "#17161a");
    g.addColorStop(0.56, "#0a0a0c");
    g.addColorStop(1, "#030304");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);
}

export default function Studio({ high }: { high: boolean }) {
  const horizon = useHorizonTexture();
  const accent = site.theme.accent;
  const bg = site.theme.bg;

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 14, 34]} />

      <ambientLight intensity={0.06} />
      <spotLight
        position={[0.5, 9, 1]}
        angle={0.5}
        penumbra={0.85}
        intensity={high ? 120 : 90}
        color="#fffaf2"
        shadow-mapSize={1024}
        shadow-bias={-0.0002}
      />
      <spotLight position={[-7, 2.6, -5]} angle={0.7} penumbra={1} intensity={90} color={accent} />
      <spotLight position={[7.5, 2.4, -5.5]} angle={0.7} penumbra={1} intensity={55} color="#e6e6e6" />
      <spotLight position={[4, 1.2, 6]} angle={0.8} penumbra={1} intensity={30} color="#ffffff" />

      {/* Real photo-studio HDRI (Poly Haven, CC0) — this is what makes the
          paint read as real: true soft-box shapes and bounce in reflections. */}
      <Environment files="/hdri/studio.hdr" resolution={high ? 512 : 256} environmentIntensity={0.85} />

      <ContactShadows position={[0, 0.012, 0]} scale={8} far={1.6} blur={1.7} opacity={0.95} resolution={high ? 1024 : 512} color="#000000" frames={1} />

      <mesh rotation-x={-Math.PI / 2}>
        <circleGeometry args={[30, 64]} />
        {high ? (
          <MeshReflectorMaterial
            resolution={768}
            blur={[220, 55]}
            mixBlur={1}
            mixStrength={2.6}
            roughness={0.85}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#0b0b0d"
            metalness={0.6}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color="#0c0c0e" roughness={0.55} metalness={0.4} />
        )}
      </mesh>

      {/* turntable rings */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.004}>
        <ringGeometry args={[3.3, 3.318, 160]} />
        <meshBasicMaterial color={accent} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.004}>
        <ringGeometry args={[3.7, 3.705, 160]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} toneMapped={false} />
      </mesh>

      <mesh>
        <sphereGeometry args={[40, 32, 24]} />
        <meshBasicMaterial map={horizon} side={THREE.BackSide} fog={false} />
      </mesh>
    </>
  );
}
