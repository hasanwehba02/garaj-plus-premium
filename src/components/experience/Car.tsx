"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useExperience, type StageKey } from "@/lib/store";
import { useConfiguratorStore } from "@/lib/store/configuratorStore";
import { site } from "@/lib/site-config";
import { findStudioPartById, findStudioPartByPanelId } from "@/lib/car-config/studio-parts";

const CAR_MODEL_URL = process.env.NEXT_PUBLIC_CAR_MODEL ?? "/models/car.glb";
if (typeof window !== "undefined") useGLTF.preload(CAR_MODEL_URL);

const MODEL_FIT = { length: 4.7, yaw: -Math.PI / 2, liftY: 0.005 };
const HALF = MODEL_FIT.length / 2 + 0.25;

const PAINT_MATERIAL_NAMES = ["w206_paint", "w206_color1", "w206_color2", "marina_bay_blue_metallic"];
const PAINT_MATERIAL = /^(w206_paint|w206_color|bodymat|body_?paint|carpaint|car_?paint|paint|exterior)(_?(phong|mat|material|lambert|standard|\d+))?$/i;
const PAINT_HINT = /\b(w206_paint|w206_color|carpaint|bodypaint|exterior|coachwork|bonnet|hood|fender|roof|door)\b/i;
const KEEP_HINT = /glass|window|lens|light|lamp|led|winker|reflect|chrome|mirror|tire|tyre|wheel|rim|hub|brake|rotor|caliper|susp|arm|bolt|exhaust|engine|chassis|mesh|carbon|gom|interior|seat|pedal|monitor|dash|gold|_bk|gloss.?black|stoplight|headlight/i;

// Returns standard panel ID (e.g. "kaput", "on_tampon", "camurluk_on_sol") matching PANELS data
export function classifyPaintPanelId(cx: number, cy: number, cz: number): string {
  const absZ = Math.abs(cz);

  // 1. Front Bumper
  if (cx > 1.95) return "on_tampon";

  // 2. Rear Bumper
  if (cx < -1.85) return "arka_tampon";

  // 3. Trunk Lid
  if (cx < -1.25 && cy > 0.72) return "bagaj_kapagi";

  // 4. Side Mirrors
  if (absZ > 0.82 && cy > 0.75 && cx > 0.40 && cx < 0.95) {
    return cz < 0 ? "ayna_sol" : "ayna_sag";
  }

  // 5. Roof & Pillars
  if (cy > 1.15 && cx > -1.10 && cx < 0.70) {
    return "tavan";
  }

  // 6. Hood vs Front Fenders
  if (cx > 0.85) {
    if (cy > 0.65 && absZ < 0.68) {
      return "kaput";
    }
    return cz < 0 ? "camurluk_on_sol" : "camurluk_on_sag";
  }

  // 7. Doors
  if (cx >= -0.25) {
    return cz < 0 ? "kapi_on_sol" : "kapi_on_sag";
  } else {
    return cz < 0 ? "kapi_arka_sol" : "kapi_arka_sag";
  }
}

function isExcludedObject(o: THREE.Object3D): boolean {
  if (o.name === "Plane" || /floor|ground|asphalt/i.test(o.name)) return true;
  const mesh = o as THREE.Mesh;
  if (mesh.isMesh && mesh.material) {
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (mat && /asphalt|floor|ground/i.test(mat.name)) return true;
  }
  return false;
}

function classifyPaint(root: THREE.Object3D) {
  const mats = new Map<string, THREE.Material>();
  const owners = new Map<string, string[]>();
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || isExcludedObject(mesh)) return;
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

function refineNonPaint(m: THREE.MeshStandardMaterial, accent: THREE.Color) {
  const n = m.name.toLowerCase();
  m.envMapIntensity = 1.0;
  if (/glass|window|lens|mirror/.test(n)) {
    m.color.set("#0c1219");
    m.metalness = 0.2;
    m.roughness = 0.05;
    m.envMapIntensity = 1.2;
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
  } else if (/stoplightred|stoplightcover|stoplight|taillight/.test(n)) {
    m.color.set("#b00a06");
    m.emissive.set("#ff1a0c");
    m.emissiveIntensity = 3.6;
    m.toneMapped = false;
  } else if (/winker|winkercover/.test(n)) {
    m.color.set("#c86000");
    m.emissive.set("#e06400");
    m.emissiveIntensity = 2;
  } else if (/headlight_led|light_led|headlight/.test(n)) {
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
    if (!mesh.isMesh || !mesh.geometry || !mesh.visible || isExcludedObject(mesh)) return;
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
  const { camera: r3fCamera } = useThree();
  const spin = useRef<THREE.Group>(null!);
  const live = useRef({ extent: 0, matte: 0, glow: 0, lastExtent: 0 });

  const isDragging = useRef(false);
  const pointerDownPos = useRef({ x: 0, y: 0 });
  const lastPointerX = useRef(0);
  const dragVelocity = useRef(0);
  const targetDragYaw = useRef(0);

  const built = useMemo(() => {
    const accent = new THREE.Color(site.theme.accent);
    const root = scene.clone(true);

    // Remove floor planes
    const toRemove: THREE.Object3D[] = [];
    root.traverse((o) => {
      if (isExcludedObject(o)) toRemove.push(o);
    });
    toRemove.forEach((o) => o.parent?.remove(o));

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
    const panelBuckets = new Map<
      string,
      { positions: number[]; normals: number[]; uvs: number[] }
    >();
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
      if (!mesh.isMesh || !mesh.geometry || isExcludedObject(mesh)) return;
      mesh.updateWorldMatrix(true, false);
      const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      if (!src) return;
      const g = norm(mesh.geometry, mesh.matrixWorld);

      if (paintIds.has(src.uuid)) {
        const pos = g.attributes.position.array;
        const normArr = g.attributes.normal?.array;
        const uvArr = g.attributes.uv?.array;

        for (let i = 0; i < pos.length; i += 9) {
          const cx = (pos[i] + pos[i + 3] + pos[i + 6]) / 3;
          const cy = (pos[i + 1] + pos[i + 4] + pos[i + 7]) / 3;
          const cz = (pos[i + 2] + pos[i + 5] + pos[i + 8]) / 3;

          const panelId = classifyPaintPanelId(cx, cy, cz);
          let bucket = panelBuckets.get(panelId);
          if (!bucket) {
            bucket = { positions: [], normals: [], uvs: [] };
            panelBuckets.set(panelId, bucket);
          }

          for (let v = 0; v < 9; v++) bucket.positions.push(pos[i + v]);
          if (normArr) for (let v = 0; v < 9; v++) bucket.normals.push(normArr[i + v]);
          if (uvArr) {
            const uvIdx = (i / 3) * 2;
            for (let v = 0; v < 6; v++) bucket.uvs.push(uvArr[uvIdx + v] ?? 0);
          }
        }
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

    const pickablePanelMeshes: THREE.Mesh[] = [];

    panelBuckets.forEach((data, panelId) => {
      if (data.positions.length === 0) return;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(data.positions, 3));
      if (data.normals.length === data.positions.length) {
        geo.setAttribute("normal", new THREE.Float32BufferAttribute(data.normals, 3));
      } else {
        geo.computeVertexNormals();
      }
      if (data.uvs.length === (data.positions.length / 3) * 2) {
        geo.setAttribute("uv", new THREE.Float32BufferAttribute(data.uvs, 2));
      }

      geo.computeBoundingBox();
      geo.computeBoundingSphere();
      const minX = geo.boundingBox!.min.x;
      const maxX = geo.boundingBox!.max.x;

      const baseMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(site.paints[0].hex),
        metalness: 0.80,
        roughness: 0.28,
        clearcoat: 0.60,
        clearcoatRoughness: 0.15,
        envMapIntensity: 1.15,
      });

      const baseMesh = new THREE.Mesh(geo, baseMat);
      baseMesh.name = `base_${panelId}`;
      baseMesh.userData.panelId = panelId;
      baseMesh.castShadow = true;
      baseMesh.matrixAutoUpdate = false;
      model.add(baseMesh);

      const ppfMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(site.paints[0].hex),
        metalness: 0.88,
        roughness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.80,
      });
      ppfMat.clearcoatNormalMap = noiseTex;
      ppfMat.clearcoatNormalScale = new THREE.Vector2(0.08, 0.08);

      const ppfMesh = new THREE.Mesh(geo, ppfMat);
      ppfMesh.name = `ppf_${panelId}`;
      ppfMesh.userData.panelId = panelId;
      ppfMesh.castShadow = true;
      ppfMesh.matrixAutoUpdate = false;
      model.add(ppfMesh);

      panelMeshes.push({ id: panelId, baseMesh, baseMat, ppfMesh, ppfMat, minX, maxX });
      pickablePanelMeshes.push(baseMesh, ppfMesh);
    });

    // Golden laser light blade that sweeps across the car from front (+X) to rear (-X)
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

    return { model, panelMeshes, pickablePanelMeshes, clipPPF, clipBase, bar, barCore, barGlow, wheelMaterials };
  }, [scene]);

  // Pointer drag & mouse click raycasting on 3D car in studio mode
  useEffect(() => {
    const raycaster = new THREE.Raycaster();

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target?.closest("button, input, select, textarea, a, .glass, [data-lenis-prevent]")) return;

      const s = useExperience.getState();
      if (s.from !== "studio" && s.to !== "studio") return;

      isDragging.current = true;
      pointerDownPos.current = { x: e.clientX, y: e.clientY };
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

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
      if (dist < 8) {
        // Direct click on car canvas
        const canvas = window.document.querySelector("canvas");
        if (canvas && r3fCamera) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

          raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), r3fCamera);
          const visibleMeshes = built.pickablePanelMeshes.filter((m) => m.visible);
          const hits = raycaster.intersectObjects(visibleMeshes, false);
          if (hits.length > 0) {
            const hitPanelId = hits[0].object.userData.panelId as string | undefined;
            if (hitPanelId) {
              const cfg = useConfiguratorStore.getState();
              cfg.togglePanelProtection(hitPanelId);
              cfg.focusPart(hitPanelId);
            }
          }
        }
      }
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
  }, [built.pickablePanelMeshes, r3fCamera]);

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
    // Sweeps across screen from Front (+HALF) to Rear (-HALF)
    const xSweep = THREE.MathUtils.lerp(HALF, -HALF, L.extent);

    // Update clipping planes according to turntable rotation yaw and laser position
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
        // Look up by panel ID directly (e.g. "kaput", "on_tampon", "tavan")
        const prot = cfg.panelProtections[id] ?? cfg.panelProtections[findStudioPartById(id)?.panelId ?? ""];
        isIntended = !!prot?.hasPPF;
        const finish = prot?.finish ?? cfg.globalPPFFinish;
        isSatin = finish === "satin" || s.finish === "satin";
      } else {
        isIntended = L.extent > 0.02;
        isSatin = L.matte > 0.3 || s.finish === "satin";
      }

      // Configure PPF Material Finish (Gloss TPU vs Satin TPU)
      let targetPPFMetalness = 0.88;
      let targetPPFRoughness = 0.06;
      let targetPPFClearcoat = 1.0;
      let targetPPFClearcoatRoughness = 0.02;
      let targetPPFEnv = 1.85;

      if (isSatin) {
        // Frozen Matte / Satin Finish
        targetPPFMetalness = 0.50;
        targetPPFRoughness = 0.65;
        targetPPFClearcoat = 0.05;
        targetPPFClearcoatRoughness = 0.60;
        targetPPFEnv = 0.80;
      }

      ppfMat.color.lerp(paintColor, 1 - Math.exp(-dt * 6));
      ppfMat.metalness = THREE.MathUtils.lerp(ppfMat.metalness, targetPPFMetalness, 1 - Math.exp(-dt * 8));
      ppfMat.roughness = THREE.MathUtils.lerp(ppfMat.roughness, targetPPFRoughness, 1 - Math.exp(-dt * 8));
      ppfMat.clearcoat = THREE.MathUtils.lerp(ppfMat.clearcoat, targetPPFClearcoat, 1 - Math.exp(-dt * 8));
      ppfMat.clearcoatRoughness = THREE.MathUtils.lerp(ppfMat.clearcoatRoughness, targetPPFClearcoatRoughness, 1 - Math.exp(-dt * 8));
      ppfMat.envMapIntensity = THREE.MathUtils.lerp(ppfMat.envMapIntensity, targetPPFEnv, 1 - Math.exp(-dt * 8));

      baseMat.color.lerp(paintColor, 1 - Math.exp(-dt * 6));

      if (isIntended) {
        if (isMidSweep) {
          // While sweeping, laser cuts smoothly through the panel geometry along X
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
        } else if (L.extent >= 0.995 || inStudio) {
          // Fully wrapped state in studio
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
      wm.color.lerp(rimColor, 1 - Math.exp(-dt * 6));
      wm.metalness = THREE.MathUtils.lerp(wm.metalness, targetMetalness, 1 - Math.exp(-dt * 6));
      wm.roughness = THREE.MathUtils.lerp(wm.roughness, targetRoughness, 1 - Math.exp(-dt * 6));
      wm.envMapIntensity = 1.6;
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
