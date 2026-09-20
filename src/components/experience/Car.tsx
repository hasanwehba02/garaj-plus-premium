"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useExperience, type StageKey } from "@/lib/store";
import { useConfiguratorStore } from "@/lib/store/configuratorStore";
import { site } from "@/lib/site-config";

const CAR_MODEL_URL = process.env.NEXT_PUBLIC_CAR_MODEL ?? "/models/car.glb";
if (typeof window !== "undefined") useGLTF.preload(CAR_MODEL_URL);

const MODEL_FIT = { length: 4.7, yaw: Math.PI / 2, liftY: 0.005 };
const HALF = MODEL_FIT.length / 2 + 0.25;

const PAINT_MATERIAL_NAMES = ["marina_bay_blue_metallic"];
const PAINT_MATERIAL = /^(bodymat|body_?paint|carpaint|car_?paint|paint|exterior)(_?(phong|mat|material|lambert|standard|\d+))?$/i;
const PAINT_HINT = /\b(carpaint|bodypaint|exterior|coachwork|bonnet|hood|fender|roof|door)\b/i;
const KEEP_HINT = /glass|window|lens|light|lamp|led|winker|reflect|chrome|mirror|tire|tyre|wheel|rim|hub|brake|rotor|caliper|susp|arm|bolt|exhaust|engine|chassis|mesh|carbon|gom|interior|seat|pedal|monitor|dash|gold|_bk|gloss.?black|stoplight|headlight/i;

function classifyPaint(root: THREE.Object3D) {
  const mats = new Map<string, THREE.Material>();
  const owners = new Map<string, string[]>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      if (!m) continue;
      mats.set(m.uuid, m);
      owners.set(m.uuid, [...(owners.get(m.uuid) ?? []), mesh.name]);
    }
  });
  const paint = new Set<string>();
  for (const [id, m] of mats) if (PAINT_MATERIAL_NAMES.includes(m.name.trim().toLowerCase())) paint.add(id);
  if (!paint.size) for (const [id, m] of mats) if (PAINT_MATERIAL.test(m.name.trim())) paint.add(id);
  if (!paint.size)
    for (const [id, m] of mats)
      if (PAINT_HINT.test(`${m.name} ${(owners.get(id) ?? []).join(" ")}`) && !KEEP_HINT.test(m.name)) paint.add(id);
  return paint;
}

function classifyPaintPanel(meshName: string): string {
  const s = meshName.toLowerCase();
  if (s.includes("polysurface219") || s.includes("polysurface287")) return "kaput";
  if (s.includes("polysurface253") || s.includes("polysurface37")) return "on_tampon";
  if (s.includes("polysurface41")) return "camurluk_on_sol";
  if (s.includes("polysurface39")) return "camurluk_on_sag";
  if (s.includes("polysurface304") || s.includes("polysurface199")) return "kapi_on_sol";
  if (s.includes("polysurface331") || s.includes("polysurface308")) return "kapi_on_sag";
  if (s.includes("polysurface66") || s.includes("polysurface65")) return "kapi_arka_sol";
  if (s.includes("polysurface47")) return "kapi_arka_sag";
  if (s.includes("polysurface310") || s.includes("polysurface311") || s.includes("polysurface312")) return "tavan";
  if (s.includes("pcube22") || s.includes("polysurface63")) return "ayna_sol";
  if (s.includes("pcube192") || s.includes("polysurface305")) return "ayna_sag";
  if (s.includes("polysurface14") || s.includes("polysurface46")) return "bagaj_kapagi";
  if (s.includes("polysurface357") || s.includes("polysurface264") || s.includes("polysurface266")) return "arka_tampon";
  return "kaput";
}

function refineNonPaint(m: THREE.MeshStandardMaterial, accent: THREE.Color) {
  const n = m.name.toLowerCase();
  m.envMapIntensity = 0.9;
  if (/glass|window|lens|mirror/.test(n)) {
    m.color.set("#0c1219");
    m.metalness = 0.2;
    m.roughness = 0.05;
    m.envMapIntensity = 1.0;
    if (/window|windscreen|windshield/.test(n)) {
      m.transparent = true;
      m.opacity = Math.max(m.opacity ?? 1, 0.45);
    }
  } else if (/tire|tyre|gom(?!.*black.?q)/.test(n)) {
    m.color.set("#0c0c0c");
    m.roughness = 0.85;
    m.metalness = 0;
    m.envMapIntensity = 0.5;
  } else if (/wheel|rim|rotar|rotor|bolt|susarm|enginesilver|suspension_silver|pedalssilver|light.?silver|exhaust/.test(n)) {
    m.color.set("#0d0e12");
    m.metalness = 0.95;
    m.roughness = 0.14;
    m.envMapIntensity = 1.6;
  } else if (/gloss.?black|glossblack|bodymat_bk|body.?mat.?bk|interior_glossblack|meshblack/.test(n)) {
    m.color.set("#050506");
    m.metalness = 0.5;
    m.roughness = 0.2;
    m.envMapIntensity = 1;
  } else if (/carbon|chassis_black|suspention_black|suspension_black|gomblack/.test(n)) {
    m.color.multiplyScalar(0.8);
    m.roughness = 0.42;
    m.metalness = 0.35;
  } else if (/stoplightred|stoplightcover/.test(n)) {
    m.color.set("#b00a06");
    m.emissive.set("#ff1a0c");
    m.emissiveIntensity = 3.6;
    m.toneMapped = false;
  } else if (/winker|winkercover/.test(n)) {
    m.color.set("#c86000");
    m.emissive.set("#e06400");
    m.emissiveIntensity = 2;
  } else if (/headlight_led|light_led/.test(n)) {
    m.color.set("#f2f6ff");
    m.emissive.set("#dfe9ff");
    m.emissiveIntensity = 7;
    m.toneMapped = false;
  } else if (/^lights?$/.test(n) || /drl|daytime|taillight|rearlight/.test(n)) {
    m.color.set("#eef3ff");
    m.emissive.set("#eaf1ff");
    m.emissiveIntensity = 3.2;
    m.metalness = 0.1;
    m.roughness = 0.12;
    m.toneMapped = false;
  } else if (/headlightbk|lightreflec|lightsilver/.test(n)) {
    m.color.set("#0b0d11");
    m.metalness = 1;
    m.roughness = 0.08;
    m.envMapIntensity = 1.4;
  } else if (/suspention_red|suspension_red|camcover|interior_red|interior_linecolor|wheelhubcolor/.test(n)) {
    m.color.copy(accent);
    m.metalness = 0.8;
    m.roughness = 0.3;
  } else if (/interior|seat|dash|monitor|pedal|gold/.test(n)) {
    m.color.multiplyScalar(0.9);
    m.roughness = 0.55;
    m.envMapIntensity = 1.2;
  } else {
    m.roughness = Math.min(m.roughness ?? 0.8, 0.5);
  }
  m.needsUpdate = true;
  return m;
}

function clearcoatNoise() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = 118 + Math.random() * 20;
    img.data[i + 1] = 118 + Math.random() * 20;
    img.data[i + 2] = 255;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  return tex;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.5, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  return new THREE.CanvasTexture(c);
}

function visibleBox(root: THREE.Object3D, only?: RegExp) {
  const box = new THREE.Box3();
  const tmp = new THREE.Box3();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry || !mesh.visible) return;
    const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as
      | (THREE.Material & { opacity?: number })
      | undefined;
    if (!mat) return;
    if (mat.transparent && (mat.opacity ?? 1) <= 0.05) return;
    if (only && !only.test(mat.name)) return;
    mesh.updateWorldMatrix(true, false);
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    tmp.copy(mesh.geometry.boundingBox!).applyMatrix4(mesh.matrixWorld);
    box.union(tmp);
  });
  return box;
}

const TIRE = /tire|tyre|wheel|rim/i;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

type Targets = { extent: number; matte: number };

function stageTargets(key: StageKey, s: ReturnType<typeof useExperience.getState>): Targets {
  const configState = useConfiguratorStore.getState();
  const pkg = configState.activePackageId;
  const panelProts = configState.panelProtections;

  let targetExtent = 1;
  if (pkg === "front") targetExtent = 0.45;
  else if (pkg === "urban") targetExtent = 0.65;
  else if (pkg === "full") targetExtent = 1.0;
  else if (pkg === "custom") {
    const hasHood = !!panelProts["kaput"]?.hasPPF;
    const hasBumper = !!panelProts["on_tampon"]?.hasPPF;
    const hasDoors = !!panelProts["kapi_on_sol"]?.hasPPF || !!panelProts["kapi_on_sag"]?.hasPPF;
    const hasRear = !!panelProts["arka_tampon"]?.hasPPF || !!panelProts["bagaj_kapagi"]?.hasPPF;
    const activeCount = Object.values(panelProts).filter((p) => p.hasPPF).length;

    if (activeCount === 0) targetExtent = 0;
    else if (hasRear) targetExtent = 1.0;
    else if (hasDoors) targetExtent = 0.70;
    else if (hasHood && !hasBumper && activeCount === 1) targetExtent = 0.32;
    else if (hasBumper || hasHood) targetExtent = 0.48;
    else targetExtent = Math.min(1, Math.max(0.25, activeCount / 10));
  }

  const cov = site.coverage.find((c) => c.id === s.coverage)?.extent ?? targetExtent;
  const isSatin = s.finish === "satin" || configState.globalPPFFinish === "satin";

  switch (key) {
    case "hero":
      return { extent: 0, matte: 0 };
    case "film":
      return { extent: smooth(0.08, 0.92, s.local.film ?? 0), matte: 0 };
    case "healing":
      return { extent: 1, matte: 0 };
    case "finish":
      return { extent: 1, matte: smooth(0.3, 0.7, s.local.finish ?? 0) };
    default:
      return { extent: pkg ? targetExtent : cov, matte: isSatin ? 1 : 0 };
  }
}

export default function Car() {
  const { scene } = useGLTF(CAR_MODEL_URL);
  const spin = useRef<THREE.Group>(null!);
  const live = useRef({ extent: 0, matte: 0, glow: 0, lastExtent: 0 });

  const isDragging = useRef(false);
  const lastPointerX = useRef(0);
  const dragVelocity = useRef(0);
  const targetDragYaw = useRef(0);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target?.closest("button, input, select, textarea, a, .glass")) return;

      const s = useExperience.getState();
      if (s.from !== "studio" && s.to !== "studio") return;

      isDragging.current = true;
      lastPointerX.current = e.clientX;
      dragVelocity.current = 0;
      useConfiguratorStore.setState({ isAutoSpinning: false });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastPointerX.current;
      lastPointerX.current = e.clientX;
      const deltaRad = dx * 0.0075;
      targetDragYaw.current += deltaRad;
      dragVelocity.current = deltaRad;
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const built = useMemo(() => {
    const accent = new THREE.Color(site.theme.accent);
    const root = scene.clone(true);
    root.rotation.set(0, MODEL_FIT.yaw, 0);
    root.updateMatrixWorld(true);
    let box = visibleBox(root);
    const size = box.getSize(new THREE.Vector3());
    root.scale.setScalar(MODEL_FIT.length / (Math.max(size.x, size.z) || 1));
    root.updateMatrixWorld(true);
    box = visibleBox(root);
    const c = box.getCenter(new THREE.Vector3());
    const tyres = visibleBox(root, TIRE);
    const groundY = tyres.isEmpty() ? box.min.y : tyres.min.y;
    root.position.set(-c.x, -groundY + MODEL_FIT.liftY, -c.z);
    root.updateMatrixWorld(true);
    box = visibleBox(root);
    const fitted = box.getSize(new THREE.Vector3());

    const paintIds = classifyPaint(root);
    const refined = new Map<string, THREE.Material>();
    const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const panelGeos = new Map<string, THREE.BufferGeometry[]>();
    const wheelMaterials: THREE.MeshStandardMaterial[] = [];

    const norm = (g: THREE.BufferGeometry, m: THREE.Matrix4) => {
      const geo = g.index ? g.toNonIndexed() : g.clone();
      geo.applyMatrix4(m);
      if (m.determinant() < 0) {
        for (const key of Object.keys(geo.attributes)) {
          const attr = geo.attributes[key] as THREE.BufferAttribute;
          const arr = attr.array as unknown as number[];
          const n = attr.itemSize;
          for (let i = 0; i < attr.count; i += 3) {
            for (let k = 0; k < n; k++) {
              const b = (i + 1) * n + k;
              const c = (i + 2) * n + k;
              const t = arr[b];
              arr[b] = arr[c];
              arr[c] = t;
            }
          }
          attr.needsUpdate = true;
        }
      }
      if (!geo.attributes.normal) geo.computeVertexNormals();
      if (!geo.attributes.uv) geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
      for (const k of Object.keys(geo.attributes)) if (!["position", "normal", "uv"].includes(k)) geo.deleteAttribute(k);
      geo.morphAttributes = {};
      return geo;
    };

    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.updateWorldMatrix(true, false);
      const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (!src) return;
      const g = norm(mesh.geometry, mesh.matrixWorld);

      if (paintIds.has(src.uuid)) {
        const panelId = classifyPaintPanel(mesh.name);
        if (!panelGeos.has(panelId)) panelGeos.set(panelId, []);
        panelGeos.get(panelId)!.push(g);
        return;
      }

      let mat = refined.get(src.uuid);
      if (!mat) {
        mat = "roughness" in src ? refineNonPaint(src as THREE.MeshStandardMaterial, accent) : src;
        refined.set(src.uuid, mat);

        if (/wheel|rim|wheel2mat|wheelhubcolor/i.test(src.name)) {
          wheelMaterials.push(mat as THREE.MeshStandardMaterial);
        }
      }
      groups.set(mat, [...(groups.get(mat) ?? []), g]);
    });

    const model = new THREE.Group();
    for (const [mat, geos] of groups) {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) continue;
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.matrixAutoUpdate = false;
      model.add(mesh);
    }

    // 100% Solid Exterior Body Panels (Base Paint + Synchronized Progressive PPF Meshes)
    const noiseTex = clearcoatNoise();
    const clipPPF = new THREE.Plane(new THREE.Vector3(1, 0, 0), -HALF);
    const clipBase = new THREE.Plane(new THREE.Vector3(-1, 0, 0), HALF);

    const panelMeshes: {
      id: string;
      baseMesh: THREE.Mesh;
      baseMat: THREE.MeshPhysicalMaterial;
      ppfMesh: THREE.Mesh;
      ppfMat: THREE.MeshPhysicalMaterial;
      minX: number;
      maxX: number;
    }[] = [];

    panelGeos.forEach((geos, panelId) => {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) return;

      if (!merged.boundingBox) merged.computeBoundingBox();
      const minX = merged.boundingBox!.min.x;
      const maxX = merged.boundingBox!.max.x;

      const baseMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(site.paints[0].hex),
        metalness: 0.82,
        roughness: 0.26,
        clearcoat: 0.65,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.15,
      });
      baseMat.clearcoatNormalMap = noiseTex;
      baseMat.clearcoatNormalScale = new THREE.Vector2(0.09, 0.09);

      const baseMesh = new THREE.Mesh(merged, baseMat);
      baseMesh.castShadow = true;
      baseMesh.matrixAutoUpdate = false;
      model.add(baseMesh);

      const ppfMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(site.paints[0].hex),
        metalness: 0.88,
        roughness: 0.10,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.70,
      });
      ppfMat.clearcoatNormalMap = noiseTex;
      ppfMat.clearcoatNormalScale = new THREE.Vector2(0.09, 0.09);

      const ppfMesh = new THREE.Mesh(merged, ppfMat);
      ppfMesh.castShadow = true;
      ppfMesh.matrixAutoUpdate = false;
      model.add(ppfMesh);

      panelMeshes.push({ id: panelId, baseMesh, baseMat, ppfMesh, ppfMat, minX, maxX });
    });

    // Golden laser light blade that sweeps across the car during wrap
    const alpha = glowTexture();
    const bodyH = Math.min(fitted.y, 2.3);
    const barGeo = new THREE.BoxGeometry(1, bodyH * 1.3, fitted.z * 1.18);
    const barCore = new THREE.Mesh(
      barGeo,
      new THREE.MeshBasicMaterial({ color: site.theme.accentBright, transparent: true, opacity: 0, alphaMap: alpha, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    barCore.scale.x = 0.005;
    const barGlow = new THREE.Mesh(
      barGeo,
      new THREE.MeshBasicMaterial({ color: site.theme.accent, transparent: true, opacity: 0, alphaMap: alpha, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    barGlow.scale.x = 0.07;
    const bar = new THREE.Group();
    bar.position.y = bodyH * 0.55;
    bar.add(barCore, barGlow);

    return { model, panelMeshes, clipPPF, clipBase, bar, barCore, barGlow, wheelMaterials };
  }, [scene]);

  const paintColor = useMemo(() => new THREE.Color(), []);
  const rimColor = useMemo(() => new THREE.Color("#0d0e12"), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useExperience.getState();
    const cfg = useConfiguratorStore.getState();
    const L = live.current;
    const e = s.t * s.t * (3 - 2 * s.t);
    const A = stageTargets(s.from, s);
    const B = stageTargets(s.to, s);
    const extentT = THREE.MathUtils.lerp(A.extent, B.extent, e);
    const matteT = THREE.MathUtils.lerp(A.matte, B.matte, e);

    const k = 1 - Math.exp(-dt * (s.reducedMotion ? 30 : 4));
    L.extent += (extentT - L.extent) * k;
    L.matte += (matteT - L.matte) * (1 - Math.exp(-dt * 3));

    // Base paint color
    const hex = site.paints.find((p) => p.id === s.paint)?.hex ?? site.paints[0].hex;
    paintColor.set(hex);

    const inStudio = s.from === "studio" || s.to === "studio";
    const xSweep = THREE.MathUtils.lerp(HALF, -HALF, L.extent);

    // Update clipping planes according to car rotation yaw and laser position
    const yaw = spin.current?.rotation.y ?? 0;
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);

    built.clipPPF.normal.set(cosY, 0, -sinY);
    built.clipPPF.constant = -xSweep;

    built.clipBase.normal.set(-cosY, 0, sinY);
    built.clipBase.constant = xSweep;

    const isMidSweep = L.extent > 0.005 && L.extent < 0.995;

    // Update each panel: PPF applies strictly and progressively as the laser line crosses that exact part
    built.panelMeshes.forEach(({ id, baseMesh, baseMat, ppfMesh, ppfMat, minX, maxX }) => {
      let isIntended = false;
      let isSatin = false;

      if (inStudio) {
        const prot = cfg.panelProtections[id];
        isIntended = !!prot?.hasPPF;
        const finish = prot?.finish ?? cfg.globalPPFFinish;
        isSatin = finish === "satin";
      } else {
        isIntended = L.extent > 0.02;
        isSatin = L.matte > 0.3;
      }

      // Configure PPF Material Finish (Gloss TPU vs Satin TPU)
      let targetPPFMetalness = 0.88;
      let targetPPFRoughness = 0.10;
      let targetPPFClearcoat = 1.0;
      let targetPPFClearcoatRoughness = 0.02;
      let targetPPFEnv = 1.70;

      if (isSatin) {
        targetPPFMetalness = 0.52;
        targetPPFRoughness = 0.58;
        targetPPFClearcoat = 0.15;
        targetPPFClearcoatRoughness = 0.48;
        targetPPFEnv = 0.90;
      }

      ppfMat.color.lerp(paintColor, 1 - Math.exp(-dt * 4));
      ppfMat.metalness = THREE.MathUtils.lerp(ppfMat.metalness, targetPPFMetalness, 1 - Math.exp(-dt * 5));
      ppfMat.roughness = THREE.MathUtils.lerp(ppfMat.roughness, targetPPFRoughness, 1 - Math.exp(-dt * 5));
      ppfMat.clearcoat = THREE.MathUtils.lerp(ppfMat.clearcoat, targetPPFClearcoat, 1 - Math.exp(-dt * 5));
      ppfMat.clearcoatRoughness = THREE.MathUtils.lerp(ppfMat.clearcoatRoughness, targetPPFClearcoatRoughness, 1 - Math.exp(-dt * 5));
      ppfMat.envMapIntensity = THREE.MathUtils.lerp(ppfMat.envMapIntensity, targetPPFEnv, 1 - Math.exp(-dt * 5));
      ppfMat.needsUpdate = true;

      baseMat.color.lerp(paintColor, 1 - Math.exp(-dt * 4));
      baseMat.needsUpdate = true;

      if (isIntended) {
        if (isMidSweep) {
          // While sweeping, laser cuts smoothly through the panel geometry
          if (xSweep > maxX) {
            // Laser hasn't reached this panel yet: 100% factory base
            baseMesh.visible = true;
            baseMat.clippingPlanes = null;
            ppfMesh.visible = false;
          } else if (xSweep < minX) {
            // Laser has completely crossed this panel: 100% PPF
            baseMesh.visible = false;
            ppfMesh.visible = true;
            ppfMat.clippingPlanes = null;
          } else {
            // Laser is currently crossing this exact panel: hardware-clip cleanly at the laser line!
            baseMesh.visible = true;
            baseMat.clippingPlanes = [built.clipBase];
            ppfMesh.visible = true;
            ppfMat.clippingPlanes = [built.clipPPF];
          }
        } else if (L.extent >= 0.995) {
          // Fully wrapped state
          baseMesh.visible = false;
          ppfMesh.visible = true;
          ppfMat.clippingPlanes = null;
        } else {
          // Zero extent state
          baseMesh.visible = true;
          baseMat.clippingPlanes = null;
          ppfMesh.visible = false;
        }
      } else {
        // Panel does not have PPF: always show raw base paint
        baseMesh.visible = true;
        baseMat.clippingPlanes = null;
        ppfMesh.visible = false;
      }
    });

    // Rim Finish Customization (Jant Bitişi)
    const rimMode = cfg.rimFinishMode ?? "gloss_black";
    let targetRoughness = 0.14;
    let targetMetalness = 0.95;

    if (rimMode === "gloss_black") {
      rimColor.set("#0d0e12");
      targetMetalness = 0.95;
      targetRoughness = 0.12;
    } else if (rimMode === "dark_chrome") {
      rimColor.set("#2f3238");
      targetMetalness = 0.98;
      targetRoughness = 0.22;
    } else if (rimMode === "satin_silver") {
      rimColor.set("#b8bcc2");
      targetMetalness = 0.88;
      targetRoughness = 0.46;
    } else if (rimMode === "matte_black") {
      rimColor.set("#151619");
      targetMetalness = 0.60;
      targetRoughness = 0.75;
    }

    built.wheelMaterials.forEach((wm) => {
      wm.color.lerp(rimColor, 1 - Math.exp(-dt * 4));
      wm.metalness = THREE.MathUtils.lerp(wm.metalness, targetMetalness, 1 - Math.exp(-dt * 4));
      wm.roughness = THREE.MathUtils.lerp(wm.roughness, targetRoughness, 1 - Math.exp(-dt * 4));
      wm.envMapIntensity = 1.6;
      wm.needsUpdate = true;
    });

    // Wrap laser glow animation
    built.bar.position.x = xSweep;
    const speed = Math.abs(L.extent - L.lastExtent) / Math.max(dt, 1e-3);
    L.lastExtent = L.extent;
    const inFilm = (s.from === "film" || s.to === "film") && L.extent > 0.01 && L.extent < 0.99;
    const glowT = Math.min(1, speed * 3 + (inFilm ? 1 : 0)) * (L.extent > 0.005 && L.extent < 0.995 ? 1 : 0);
    L.glow += (glowT - L.glow) * (1 - Math.exp(-dt * 6));
    camera.getWorldDirection(camDir);
    const along = Math.abs(camDir.x * Math.cos(yaw) - camDir.z * Math.sin(yaw));
    const side = Math.pow(Math.max(0, 1 - along), 3);
    built.bar.visible = L.glow * side > 0.01;
    (built.barCore.material as THREE.MeshBasicMaterial).opacity = L.glow * side;
    (built.barGlow.material as THREE.MeshBasicMaterial).opacity = L.glow * side * 0.35;

    // Turntable and mouse drag rotation
    const g = spin.current;
    if (inStudio && !cfg.isAutoSpinning) {
      if (!isDragging.current && Math.abs(dragVelocity.current) > 1e-5) {
        dragVelocity.current *= Math.pow(0.90, dt * 60);
        targetDragYaw.current += dragVelocity.current;
      }
      g.rotation.y += (targetDragYaw.current - g.rotation.y) * (1 - Math.exp(-dt * 15));
    } else {
      const share = (s.from === "studio" ? 1 - e : 0) + (s.to === "studio" ? e : 0);
      if (share > 0.4 && !s.reducedMotion) {
        g.rotation.y += dt * 0.22 * share;
        targetDragYaw.current = g.rotation.y;
      } else {
        const home = Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2;
        g.rotation.y += (home - g.rotation.y) * (1 - Math.exp(-dt * 1.6));
        targetDragYaw.current = home;
      }
    }
  });

  return (
    <group ref={spin}>
      <primitive object={built.model} />
      <primitive object={built.bar} />
    </group>
  );
}


