import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  STUDIO_PARTS,
  getAllBodyRegionIds,
  getAllWheelPartIds,
} from "@/lib/car-config/studio-parts";
import type { StudioRegionId, WheelPartId } from "@/lib/car-config/types";

export interface LoadedStudioModel {
  root: THREE.Group;
  partMeshes: Map<string, THREE.Mesh[]>;
  pickableMeshes: THREE.Mesh[];
  bodyMaterials: THREE.MeshPhysicalMaterial[];
  rimMaterials: THREE.MeshPhysicalMaterial[];
}

const MODEL_FIT = { length: 4.7, yaw: Math.PI / 2, liftY: 0.005 };

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

export function matchNodeToPart(nodeName: string, meshName: string, matName: string): string | null {
  const combined = `${nodeName} ${meshName} ${matName}`.toLowerCase();

  // Check rims first with wheel positioning
  if (combined.includes("wheellf") || (combined.includes("wheel") && combined.includes("lf"))) {
    return "rim_front_left";
  }
  if (combined.includes("wheelrf") || (combined.includes("wheel") && combined.includes("rf"))) {
    return "rim_front_right";
  }
  if (combined.includes("wheellr") || (combined.includes("wheel") && combined.includes("lr"))) {
    return "rim_rear_left";
  }
  if (combined.includes("wheelrr") || (combined.includes("wheel") && combined.includes("rr"))) {
    return "rim_rear_right";
  }

  // Check studio parts patterns
  for (const part of STUDIO_PARTS) {
    for (const pattern of part.meshPatterns) {
      if (pattern.test(combined)) {
        return part.id;
      }
    }
  }

  // Fallback heuristics for body paint
  if (combined.includes("hood") || combined.includes("bonnet")) return "hood";
  if (combined.includes("bumper") && (combined.includes("f") || combined.includes("front"))) return "bumper_f";
  if (combined.includes("bumper") && (combined.includes("r") || combined.includes("rear"))) return "bumper_r";
  if (combined.includes("door") && combined.includes("l") && !combined.includes("r")) return "door_fl";
  if (combined.includes("door") && combined.includes("r")) return "door_fr";
  if (combined.includes("roof")) return "roof";
  if (combined.includes("mirror")) return "mirror_l";
  if (combined.includes("trunk") || combined.includes("boot")) return "trunk";

  return null;
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
        const root = gltf.scene;
        root.rotation.set(0, MODEL_FIT.yaw, 0);
        root.updateMatrixWorld(true);

        let box = visibleBox(root);
        const size = box.getSize(new THREE.Vector3());
        root.scale.setScalar(MODEL_FIT.length / (Math.max(size.x, size.z) || 1));
        root.updateMatrixWorld(true);

        box = visibleBox(root);
        const c = box.getCenter(new THREE.Vector3());
        const tyres = visibleBox(root, /tire|tyre|wheel|rim/i);
        const groundY = tyres.isEmpty() ? box.min.y : tyres.min.y;
        root.position.set(-c.x, -groundY + MODEL_FIT.liftY, -c.z);
        root.updateMatrixWorld(true);

        const partMeshes = new Map<string, THREE.Mesh[]>();
        const pickableMeshes: THREE.Mesh[] = [];
        const bodyMaterials: THREE.MeshPhysicalMaterial[] = [];
        const rimMaterials: THREE.MeshPhysicalMaterial[] = [];

        root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh || !mesh.geometry) return;

          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          const matName = mat?.name || "";
          const nodeName = mesh.name || "";
          const parentName = mesh.parent?.name || "";

          const matchedPartId = matchNodeToPart(
            `${parentName} ${nodeName}`,
            mesh.name,
            matName
          );

          if (matchedPartId) {
            mesh.userData.partId = matchedPartId;
            mesh.userData.kind = matchedPartId.startsWith("rim_") ? "rim" : "body";

            if (!partMeshes.has(matchedPartId)) {
              partMeshes.set(matchedPartId, []);
            }
            partMeshes.get(matchedPartId)!.push(mesh);
            pickableMeshes.push(mesh);
          } else {
            // General body paint mesh fallback
            const isPaintMat =
              /bodymat|marina_bay|carpaint|bodypaint/i.test(matName) &&
              !/glass|window|black|tire|tyre|interior|seat|light/i.test(matName);

            if (isPaintMat) {
              const defaultRegion = "hood"; // Fallback to hood or generic pickable
              mesh.userData.partId = defaultRegion;
              mesh.userData.kind = "body";
              if (!partMeshes.has(defaultRegion)) {
                partMeshes.set(defaultRegion, []);
              }
              partMeshes.get(defaultRegion)!.push(mesh);
              pickableMeshes.push(mesh);
            }
          }
        });

        // Ensure all body parts have at least something assigned or fallback
        const bodyRegions = getAllBodyRegionIds();
        const existingMeshes = pickableMeshes.filter((m) => m.userData.kind === "body");
        if (existingMeshes.length > 0) {
          bodyRegions.forEach((r, idx) => {
            if (!partMeshes.has(r)) {
              const assignedMesh = existingMeshes[idx % existingMeshes.length];
              partMeshes.set(r, [assignedMesh]);
            }
          });
        }

        resolve({
          root,
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
