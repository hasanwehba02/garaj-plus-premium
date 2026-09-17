"use client";

import { Component, Suspense, useEffect, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { useExperience } from "@/lib/store";
import Studio from "./Studio";
import Car from "./Car";
import CameraRig from "./CameraRig";

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[scene] car model failed to load:", err);
    useExperience.getState().setSceneReady(true);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Mirrors drei's loader progress into our store (DOM loader reads it). */
function ProgressBridge() {
  const progress = useProgress((s) => s.progress);
  useEffect(() => useExperience.getState().setLoadProgress(progress), [progress]);
  return null;
}

/** Compiles shaders up front, then tells the loader it can lift. */
function Ready() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let cancelled = false;
    const done = () => {
      if (cancelled) return;
      requestAnimationFrame(() => requestAnimationFrame(() => useExperience.getState().setSceneReady(true)));
    };
    gl.compileAsync(scene, camera).then(done, done);
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);
  return null;
}

const HIDDEN = new Set(["top", "outro"]);

export default function Scene() {
  const quality = useExperience((s) => s.quality);
  // stop rendering once the car is hidden behind the lower sections (all devices)
  const paused = useExperience((s) => HIDDEN.has(s.from) && HIDDEN.has(s.to));
  const high = quality === "high";

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={high ? [1, 1.5] : [1, 1.25]}
      style={{ position: "absolute", inset: 0 }}
      gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.85 }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      camera={{ position: [11, 3.2, 12], fov: 30, near: 0.1, far: 120 }}
    >
      <PerformanceMonitor onDecline={() => useExperience.getState().setQuality("low")} />
      <ProgressBridge />
      <CameraRig />
      <Suspense fallback={null}>
        <Studio high={high} />
        <SceneBoundary>
          <Car />
        </SceneBoundary>
        <Ready />
      </Suspense>
    </Canvas>
  );
}
