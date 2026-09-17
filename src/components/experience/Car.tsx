"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useExperience, type StageKey } from "@/lib/store";
import { site } from "@/lib/site-config";

/**
 * Hero vehicle + the PPF film effect.
 *
 * - GLB is cloned, fitted, merged by material ONCE (a handful of draw calls).
 * - Body paint gets one MeshPhysicalMaterial driven by the studio (colour,
 *   gloss ↔ satin).
 * - The film is a slightly inflated copy of the paint geometry with an
 *   iridescent clear material, revealed nose → tail by a clipping plane.
 *   A gold light-bar rides the clip edge while the film is moving.
 *
 * Swap the car: drop a GLB in /public/models and set NEXT_PUBLIC_CAR_MODEL.
 * Tune MODEL_FIT if it faces the wrong way. `?debug` logs materials.
 * NOTE: import mergeGeometries from three/examples (not three-stdlib).
 * NOTE: never ship a KHR_mesh_quantization ("gltf-transform quantize") GLB
 * here — this code applies world matrices to the attributes, and writing the
 * result back into quantized int storage distorts the model.
 */

const CAR_MODEL_URL = process.env.NEXT_PUBLIC_CAR_MODEL ?? "/models/car.glb";
if (typeof window !== "undefined") useGLTF.preload(CAR_MODEL_URL);

const MODEL_FIT = { length: 4.9, yaw: Math.PI / 2, liftY: 0.005 };
const HALF = MODEL_FIT.length / 2 + 0.25;

/** Exact body-paint material names for the current model (checked first,
 *  case-insensitive). The BMW X5 M's body shell is "Marina_Bay_Blue_Metallic".
 *  Add the client's model's paint material here when swapping cars. */
const PAINT_MATERIAL_NAMES = ["marina_bay_blue_metallic"];

const PAINT_MATERIAL = /^(bodymat|body_?paint|carpaint|car_?paint|paint|exterior)(_?(phong|mat|material|lambert|standard|\d+))?$/i;
const PAINT_HINT = /\b(carpaint|bodypaint|exterior|coachwork|bonnet|hood|fender|roof|door)\b/i;
const KEEP_HINT = /glass|window|lens|light|lamp|led|winker|reflect|chrome|mirror|tire|tyre|wheel|rim|hub|brake|rotor|caliper|susp|arm|bolt|exhaust|engine|chassis|mesh|carbon|gom|interior|seat|pedal|monitor|dash|gold|_bk|gloss.?black|stoplight|headlight/i;

const debug = () => typeof window !== "undefined" && new URLSearchParams(location.search).has("debug");

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
  if (!paint.size) {
    // Unknown model with no helpful names: repaint the single largest bright,
    // opaque material — on a car that is always the body shell.
    const areas = new Map<string, number>();
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const pos = mesh.geometry.attributes.position;
      if (!pos) return;
      const idx = mesh.geometry.index;
      const tris = idx ? idx.count / 3 : pos.count / 3;
      const step = Math.max(1, Math.floor(tris / 200));
      let area = 0;
      for (let t = 0; t < tris; t += step) {
        const i = t * 3;
        const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
        a.fromBufferAttribute(pos, i0); b.fromBufferAttribute(pos, i1); c.fromBufferAttribute(pos, i2);
        area += b.sub(a).cross(c.sub(a)).length() * 0.5 * step;
      }
      const m = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material;
      if (m) areas.set(m.uuid, (areas.get(m.uuid) ?? 0) + area);
    });
    let best: string | null = null, bestArea = 0;
    for (const [id, area] of areas) {
      const m = mats.get(id) as THREE.MeshStandardMaterial;
      const bright = m?.color ? m.color.r + m.color.g + m.color.b > 0.25 : false;
      if (area > bestArea && bright && !KEEP_HINT.test(m.name)) { bestArea = area; best = id; }
    }
    if (best) paint.add(best);
  }
  if (debug()) console.log("[car] materials", [...mats.values()].map((m) => `${paint.has(m.uuid) ? "★" : " "} ${m.name}`));
  return paint;
}

function refineNonPaint(m: THREE.MeshStandardMaterial, accent: THREE.Color) {
  const n = m.name.toLowerCase();
  m.envMapIntensity = 0.9;
  if (/glass|window|lens|mirror/.test(n)) {
    m.color.set("#05070a");
    m.metalness = 0.2;
    m.roughness = 0.05;
    m.envMapIntensity = 1.0;
    // side/roof glass: tint it like a real film job so the pale interior and
    // studio reflections don't wash the car out
    if (/window|windscreen|windshield/.test(n)) {
      m.transparent = true;
      m.opacity = Math.max(m.opacity ?? 1, 0.7);
    }
  } else if (/tire|tyre|gom(?!.*black.?q)/.test(n)) {
    m.color.set("#0c0c0c");
    m.roughness = 0.85;
    m.metalness = 0;
    m.envMapIntensity = 0.5;
  } else if (/wheel|rim|rotar|rotor|bolt|susarm|enginesilver|suspension_silver|pedalssilver|light.?silver|exhaust/.test(n)) {
    m.color.set("#2a2b2e");
    m.metalness = 1;
    m.roughness = 0.18;
    m.envMapIntensity = 1.5;
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
    m.emissiveIntensity = 2.4;
    m.toneMapped = false;
  } else if (/winker|winkercover/.test(n)) {
    m.color.set("#c86000");
    m.emissive.set("#e06400");
    m.emissiveIntensity = 1.2;
  } else if (/headlight_led|light_led/.test(n)) {
    m.color.set("#f2f6ff");
    m.emissive.set("#dfe9ff");
    m.emissiveIntensity = 7;
    m.toneMapped = false;
  } else if (/^lights?$/.test(n) || /drl|daytime|taillight|rearlight/.test(n)) {
    // lamp lenses: faintly lit so the car looks alive, not switched off
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
    // brand accent on calipers / details
    m.color.copy(accent);
    m.metalness = 0.8;
    m.roughness = 0.3;
  } else if (/interior|seat|dash|monitor|pedal|gold/.test(n)) {
    m.color.multiplyScalar(0.5);
    m.roughness = 0.7;
  } else {
    m.roughness = Math.min(m.roughness ?? 0.8, 0.5);
  }
  m.needsUpdate = true;
  return m;
}

/** Fine random normal noise — used as a clear-coat normal so the gloss has the
 *  faint orange-peel texture of real automotive lacquer instead of a mirror. */
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

/** Bounding box of the parts you can actually SEE. Car models often ship
 *  invisible helper//collision meshes (this BMW has a fully transparent one)
 *  and measuring those makes the car float above the floor and mis-scales it. */
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
    if (mat.transparent && (mat.opacity ?? 1) <= 0.05) return; // invisible helper
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
  const cov = site.coverage.find((c) => c.id === s.coverage)?.extent ?? 1;
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
      return { extent: cov, matte: s.finish === "satin" ? 1 : 0 };
  }
}

export default function Car() {
  const { scene } = useGLTF(CAR_MODEL_URL);
  const spin = useRef<THREE.Group>(null!);
  const live = useRef({ extent: 0, matte: 0, glow: 0, lastExtent: 0 });

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
    // Stand the car on its tyres — not on whatever geometry hangs lowest.
    const tyres = visibleBox(root, TIRE);
    const groundY = tyres.isEmpty() ? box.min.y : tyres.min.y;
    root.position.set(-c.x, -groundY + MODEL_FIT.liftY, -c.z);
    root.updateMatrixWorld(true);
    box = visibleBox(root);
    const fitted = box.getSize(new THREE.Vector3());
    if (debug())
      console.log(
        `[car] fit → ${fitted.x.toFixed(2)}×${fitted.y.toFixed(2)}×${fitted.z.toFixed(2)} · ` +
          `floor gap ${box.min.y.toFixed(3)}m · tyres ${tyres.isEmpty() ? "not found" : "grounded"}`,
      );

    const paintIds = classifyPaint(root);
    const refined = new Map<string, THREE.Material>();
    const groups = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const paintGeos: THREE.BufferGeometry[] = [];

    const norm = (g: THREE.BufferGeometry, m: THREE.Matrix4) => {
      const geo = g.index ? g.toNonIndexed() : g.clone();
      geo.applyMatrix4(m);
      // Mirrored nodes (negative determinant — how most car models build their
      // second side) come out wound backwards, so their faces get culled and
      // the body looks see-through. Reverse the winding to make them solid.
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
      if (paintIds.has(src.uuid)) return void paintGeos.push(g);
      let mat = refined.get(src.uuid);
      if (!mat) {
        mat = "roughness" in src ? refineNonPaint(src as THREE.MeshStandardMaterial, accent) : src;
        refined.set(src.uuid, mat);
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

    const paintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(site.paints[0].hex),
      metalness: 0.85,
      roughness: 0.16,
      clearcoat: 1,
      clearcoatRoughness: 0.035,
      envMapIntensity: 1.45,
    });
    paintMat.clearcoatNormalMap = clearcoatNoise();
    paintMat.clearcoatNormalScale = new THREE.Vector2(0.09, 0.09);
    const paintGeo = paintGeos.length ? mergeGeometries(paintGeos, false) : null;
    if (paintGeo) {
      const pm = new THREE.Mesh(paintGeo, paintMat);
      pm.castShadow = true;
      model.add(pm);
    }

    // film shell: visible where x >= -constant (nose side first)
    const clip = new THREE.Plane(new THREE.Vector3(1, 0, 0), -HALF);
    const filmMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#fff6e4"),
      transparent: true,
      opacity: 0.2,
      metalness: 0,
      roughness: 0.04,
      clearcoat: 1,
      clearcoatRoughness: 0.01,
      iridescence: useExperience.getState().quality === "low" ? 0 : 1,
      iridescenceIOR: 1.35,
      iridescenceThicknessRange: [180, 520],
      envMapIntensity: 1.4,
      depthWrite: false,
      clippingPlanes: [clip],
    });
    const film = new THREE.Group();
    if (paintGeo) {
      const fm = new THREE.Mesh(paintGeo, filmMat);
      fm.renderOrder = 2;
      film.add(fm);
      film.scale.set(1.006, 1.012, 1.012);
    }

    // light bar that rides the film edge
    const alpha = glowTexture();
    // some models carry a stray high mesh that inflates the bbox — clamp so the
    // wrap light-bar stays car-sized whatever the GLB reports
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

    if (debug()) console.log(`[car] ${model.children.length} draw calls · ${fitted.x.toFixed(2)}×${fitted.y.toFixed(2)}×${fitted.z.toFixed(2)}`);

    return { model, film, paintMat, filmMat, clip, bar, barCore, barGlow };
  }, [scene]);

  const paintColor = useMemo(() => new THREE.Color(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useExperience.getState();
    const L = live.current;
    const e = s.t * s.t * (3 - 2 * s.t);
    const A = stageTargets(s.from, s);
    const B = stageTargets(s.to, s);
    const extentT = THREE.MathUtils.lerp(A.extent, B.extent, e);
    const matteT = THREE.MathUtils.lerp(A.matte, B.matte, e);

    const k = 1 - Math.exp(-dt * (s.reducedMotion ? 30 : 4));
    L.extent += (extentT - L.extent) * k;
    L.matte += (matteT - L.matte) * (1 - Math.exp(-dt * 3));

    // paint
    const hex = site.paints.find((p) => p.id === s.paint)?.hex ?? site.paints[0].hex;
    paintColor.set(hex);
    const pm = built.paintMat;
    pm.color.lerp(paintColor, 1 - Math.exp(-dt * 3));
    pm.metalness = THREE.MathUtils.lerp(0.85, 0.5, L.matte);
    pm.roughness = THREE.MathUtils.lerp(0.16, 0.6, L.matte);
    pm.clearcoat = THREE.MathUtils.lerp(1, 0.08, L.matte);
    pm.clearcoatRoughness = THREE.MathUtils.lerp(0.035, 0.55, L.matte);
    pm.envMapIntensity = THREE.MathUtils.lerp(1.45, 0.95, L.matte);

    // film
    const x = THREE.MathUtils.lerp(HALF, -HALF, L.extent); // edge position, nose → tail
    built.clip.constant = -x;
    built.filmMat.opacity = THREE.MathUtils.lerp(0.2, 0.08, L.matte);
    built.filmMat.roughness = THREE.MathUtils.lerp(0.04, 0.5, L.matte);
    built.film.visible = L.extent > 0.002;

    const speed = Math.abs(L.extent - L.lastExtent) / Math.max(dt, 1e-3);
    L.lastExtent = L.extent;
    const inFilm = (s.from === "film" || s.to === "film") && L.extent > 0.01 && L.extent < 0.99;
    const glowT = Math.min(1, speed * 3 + (inFilm ? 1 : 0)) * (L.extent > 0.005 && L.extent < 0.995 ? 1 : 0);
    L.glow += (glowT - L.glow) * (1 - Math.exp(-dt * 6));
    built.bar.position.x = x;
    built.bar.visible = L.glow > 0.01;
    // the bar only reads as a blade from the side — seen from the front/back it
    // becomes a flat slab, so fade it out as the view turns towards the car's axis
    camera.getWorldDirection(camDir);
    const yaw = spin.current?.rotation.y ?? 0;
    const along = Math.abs(camDir.x * Math.cos(yaw) - camDir.z * Math.sin(yaw));
    const side = Math.pow(Math.max(0, 1 - along), 3);
    built.bar.visible = L.glow * side > 0.01;
    (built.barCore.material as THREE.MeshBasicMaterial).opacity = L.glow * side;
    (built.barGlow.material as THREE.MeshBasicMaterial).opacity = L.glow * side * 0.35;

    // the layer stack owns the wrap chapter — the car steps aside for it
    const filmShare = (s.from === "film" ? 1 - e : 0) + (s.to === "film" ? e : 0);
    spin.current.visible = filmShare < 0.5;

    // slow turntable in the studio; ease home elsewhere
    const share = (s.from === "studio" ? 1 - e : 0) + (s.to === "studio" ? e : 0);
    const g = spin.current;
    if (share > 0.4 && !s.reducedMotion) g.rotation.y += dt * 0.22 * share;
    else {
      const home = Math.round(g.rotation.y / (Math.PI * 2)) * Math.PI * 2;
      g.rotation.y += (home - g.rotation.y) * (1 - Math.exp(-dt * 1.6));
    }
  });

  return (
    <group ref={spin}>
      <primitive object={built.model} />
      <primitive object={built.film} />
      <primitive object={built.bar} />
    </group>
  );
}
