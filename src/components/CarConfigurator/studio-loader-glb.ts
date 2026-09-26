import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  STUDIO_PARTS,
  getAllBodyRegionIds,
  getAllWheelPartIds,
} from "@/lib/car-config/studio-parts";
import type { StudioRegionId, WheelPartId } from "@/lib/car-config/types";
import { site } from "@/lib/site-config";

export interface LoadedStudioModel {
  root: THREE.Group;
  partMeshes: Map<string, THREE.Mesh[]>;
  pickableMeshes: THREE.Mesh[];
  bodyMaterials: THREE.MeshPhysicalMaterial[];
  rimMaterials: THREE.MeshPhysicalMaterial[];
}

const MODEL_FIT = { length: 4.7, yaw: -Math.PI / 2, liftY: 0.005 };

export function classifySpatialPanel(cx: number, cy: number, cz: number): StudioRegionId {
  const absZ = Math.abs(cz);

  // 1. Front Bumper (front-most along +X)
  if (cx > 1.95) return "bumper_f";

  // 2. Rear Bumper (rear-most along -X)
  if (cx < -1.85) return "bumper_r";

  // 3. Trunk Lid (rear upper deck)
  if (cx < -1.25 && cy > 0.72) return "trunk";

  // 4. Side Mirrors (pods sticking out on sides)
  if (absZ > 0.82 && cy > 0.75 && cx > 0.40 && cx < 0.95) {
    return cz < 0 ? "mirror_l" : "mirror_r";
  }

  // 5. Roof & Pillars (high up at Y > 1.15)
  if (cy > 1.15 && cx > -1.10 && cx < 0.70) {
    return "roof";
  }

  // 6. Hood vs Front Fenders (between front bumper and windshield)
  if (cx > 0.85) {
    if (cy > 0.65 && absZ < 0.68) {
      return "hood";
    }
    return cz < 0 ? "fender_fl" : "fender_fr";
  }

  // 7. Doors & Rear Fenders (X between -1.85 and 0.85)
  if (cx >= -0.25) {
    return cz < 0 ? "door_fl" : "door_fr";
  } else {
    return cz < 0 ? "door_rl" : "door_rr";
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

function refineNonPaintMaterial(m: THREE.MeshStandardMaterial) {
  const n = m.name.toLowerCase();
  m.envMapIntensity = 1.0;

  if (/glass|window|lens|windshield/i.test(n)) {
    m.color.set("#0c1219");
    m.metalness = 0.2;
    m.roughness = 0.05;
    m.envMapIntensity = 1.2;
    m.transparent = true;
    m.opacity = 0.55;
  } else if (/tire|tyre|rubber/i.test(n)) {
    m.color.set("#0c0c0c");
    m.roughness = 0.85;
    m.metalness = 0.05;
    m.envMapIntensity = 0.4;
  } else if (/wheel|rim|rotar|rotor|brake|caliper/i.test(n)) {
    m.color.set("#0e1014");
    m.metalness = 0.95;
    m.roughness = 0.14;
    m.envMapIntensity = 1.6;
  } else if (/stoplight|taillight|rearlight/i.test(n)) {
    m.color.set("#b00a06");
    m.emissive.set("#ff1a0c");
    m.emissiveIntensity = 3.6;
  } else if (/headlight_led|light_led|headlight/i.test(n)) {
    m.color.set("#f2f6ff");
    m.emissive.set("#dfe9ff");
    m.emissiveIntensity = 5.0;
  } else if (/chrome|exhaust|silver/i.test(n)) {
    m.color.set("#f0f3f6");
    m.metalness = 0.98;
    m.roughness = 0.08;
    m.envMapIntensity = 1.6;
  }
}

export async function loadCarStudioModel(
  url: string,
  onProgress?: (percent: number) => void
): Promise<LoadedStudioModel> {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
    loader.setDRACOLoader(draco);

    loader.load(
      url,
      (gltf) => {
        const rawScene = gltf.scene;

        // Remove floor planes / asphalt meshes
        const toRemove: THREE.Object3D[] = [];
        rawScene.traverse((o) => {
          if (isExcludedObject(o)) {
            toRemove.push(o);
          }
        });
        toRemove.forEach((o) => o.parent?.remove(o));

        // Align and fit model
        rawScene.rotation.set(0, MODEL_FIT.yaw, 0);
        rawScene.updateMatrixWorld(true);

        let box = visibleBox(rawScene);
        const size = box.getSize(new THREE.Vector3());
        rawScene.scale.setScalar(MODEL_FIT.length / (Math.max(size.x, size.z) || 1));
        rawScene.updateMatrixWorld(true);

        box = visibleBox(rawScene);
        const c = box.getCenter(new THREE.Vector3());
        const tyres = visibleBox(rawScene, /tire|tyre|wheel|rim/i);
        const groundY = tyres.isEmpty() ? box.min.y : tyres.min.y;
        rawScene.position.set(-c.x, -groundY + MODEL_FIT.liftY, -c.z);
        rawScene.updateMatrixWorld(true);

        const model = new THREE.Group();
        const partMeshes = new Map<string, THREE.Mesh[]>();
        const pickableMeshes: THREE.Mesh[] = [];
        const bodyMaterials: THREE.MeshPhysicalMaterial[] = [];
        const rimMaterials: THREE.MeshPhysicalMaterial[] = [];

        const nonPaintGroups = new Map<THREE.Material, THREE.BufferGeometry[]>();
        const rimBuckets = new Map<WheelPartId, THREE.BufferGeometry[]>();
        getAllWheelPartIds().forEach((id) => rimBuckets.set(id, []));

        const panelBuckets = new Map<
          StudioRegionId,
          { positions: number[]; normals: number[]; uvs: number[] }
        >();
        getAllBodyRegionIds().forEach((id) => {
          panelBuckets.set(id, { positions: [], normals: [], uvs: [] });
        });

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
          if (!geo.attributes.uv) {
            geo.setAttribute(
              "uv",
              new THREE.BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2)
            );
          }
          return geo;
        };

        rawScene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh || !mesh.geometry || isExcludedObject(mesh)) return;
          mesh.updateWorldMatrix(true, false);

          const src = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (!src) return;

          const g = norm(mesh.geometry, mesh.matrixWorld);
          const matName = (src.name || "").toLowerCase();
          const nodeName = (mesh.name || "").toLowerCase();
          const parentName = (mesh.parent?.name || "").toLowerCase();
          const combined = `${parentName} ${nodeName} ${matName}`;

          // Identify wheels / rims
          let wheelId: WheelPartId | null = null;
          if (
            combined.includes("wheel.ft.l") ||
            combined.includes("wheellf") ||
            (combined.includes("wheel") && combined.includes("ft.l")) ||
            combined.includes("wheelftl")
          ) {
            wheelId = "rim_front_left";
          } else if (
            combined.includes("wheel.ft.r") ||
            combined.includes("wheelrf") ||
            (combined.includes("wheel") && combined.includes("ft.r")) ||
            combined.includes("wheelftr")
          ) {
            wheelId = "rim_front_right";
          } else if (
            combined.includes("wheel.bk.l") ||
            combined.includes("wheellr") ||
            (combined.includes("wheel") && combined.includes("bk.l")) ||
            combined.includes("wheelbkl")
          ) {
            wheelId = "rim_rear_left";
          } else if (
            combined.includes("wheel.bk.r") ||
            combined.includes("wheelrr") ||
            (combined.includes("wheel") && combined.includes("bk.r")) ||
            combined.includes("wheelbkr")
          ) {
            wheelId = "rim_rear_right";
          }

          if (wheelId && /wheel|rim|spoke|hub|brake|caliper/i.test(combined)) {
            rimBuckets.get(wheelId)?.push(g);
            return;
          }

          // Check if body paint
          const isPaint =
            /w206_paint|w206_color|bodymat|carpaint|body_?paint|marina_bay/i.test(matName) ||
            /w206_paint|w206_color/i.test(nodeName);

          if (isPaint) {
            const pos = g.attributes.position?.array;
            const normArr = g.attributes.normal?.array;
            const uvArr = g.attributes.uv?.array;

            if (pos) {
              for (let i = 0; i < pos.length; i += 9) {
                const cx = (pos[i] + pos[i + 3] + pos[i + 6]) / 3;
                const cy = (pos[i + 1] + pos[i + 4] + pos[i + 7]) / 3;
                const cz = (pos[i + 2] + pos[i + 5] + pos[i + 8]) / 3;

                const panelId = classifySpatialPanel(cx, cy, cz);
                const bucket = panelBuckets.get(panelId);
                if (!bucket) continue;

                for (let v = 0; v < 9; v++) bucket.positions.push(pos[i + v]);
                if (normArr) for (let v = 0; v < 9; v++) bucket.normals.push(normArr[i + v]);
                if (uvArr) {
                  const uvIdx = (i / 3) * 2;
                  for (let v = 0; v < 6; v++) bucket.uvs.push(uvArr[uvIdx + v] ?? 0);
                }
              }
            }
            return;
          }

          // Non-paint objects
          if ("roughness" in src) {
            refineNonPaintMaterial(src as THREE.MeshStandardMaterial);
          }
          nonPaintGroups.set(src, [...(nonPaintGroups.get(src) ?? []), g]);
        });

        // 1. Add non-paint merged meshes
        for (const [mat, geos] of nonPaintGroups) {
          const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
          if (!merged) continue;
          merged.computeBoundingBox();
          merged.computeBoundingSphere();
          const mesh = new THREE.Mesh(merged, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.matrixAutoUpdate = false;
          model.add(mesh);
        }

        // 2. Add wheel rim meshes
        rimBuckets.forEach((geos, wheelId) => {
          if (geos.length === 0) return;
          const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
          if (!merged) return;
          merged.computeBoundingBox();
          merged.computeBoundingSphere();

          const rimMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color("#0a0a0c"),
            metalness: 0.95,
            roughness: 0.12,
            clearcoat: 1.0,
            clearcoatRoughness: 0.04,
            envMapIntensity: 1.6,
          });

          const rimMesh = new THREE.Mesh(merged, rimMat);
          rimMesh.name = wheelId;
          rimMesh.userData.partId = wheelId;
          rimMesh.userData.kind = "rim";
          rimMesh.castShadow = true;
          rimMesh.receiveShadow = true;
          rimMesh.matrixAutoUpdate = false;

          model.add(rimMesh);
          partMeshes.set(wheelId, [rimMesh]);
          pickableMeshes.push(rimMesh);
          rimMaterials.push(rimMat);
        });

        // 3. Add body panel meshes
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

          const panelMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(site.paints[0].hex),
            metalness: 0.88,
            roughness: 0.10,
            clearcoat: 1.0,
            clearcoatRoughness: 0.02,
            envMapIntensity: 1.7,
          });

          const panelMesh = new THREE.Mesh(geo, panelMat);
          panelMesh.name = panelId;
          panelMesh.userData.partId = panelId;
          panelMesh.userData.kind = "body";
          panelMesh.castShadow = true;
          panelMesh.receiveShadow = true;
          panelMesh.matrixAutoUpdate = false;

          model.add(panelMesh);
          partMeshes.set(panelId, [panelMesh]);
          pickableMeshes.push(panelMesh);
          bodyMaterials.push(panelMat);
        });

        resolve({
          root: model,
          partMeshes,
          pickableMeshes,
          bodyMaterials,
          rimMaterials,
        });
      },
      (xhr) => {
        if (xhr.total && xhr.total > 0 && onProgress) {
          onProgress(Math.round((xhr.loaded / xhr.total) * 100));
        }
      },
      (err) => {
        draco.dispose();
        reject(err);
      }
    );
  });
}
