import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { loadCarStudioModel, type LoadedStudioModel } from "./studio-loader-glb";
import type {
  PPFFinish,
  RimFinishMode,
  StudioRegionId,
  WheelPartId,
  CameraViewpoint,
} from "@/lib/car-config/types";
import { DEFAULT_CAMERA_VIEW, findStudioPartById } from "@/lib/car-config/studio-parts";
import { site } from "@/lib/site-config";

// --- GLSL Shader Extensions for onBeforeCompile ---

const SWEEP_VERT = `
varying vec3 vStudioWorldPos;
#include <common>
`;

const SWEEP_VERT_MAIN = `
#include <begin_vertex>
vStudioWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
`;

const SWEEP_FRAG = `
varying vec3 vStudioWorldPos;
uniform float uSweepX;
uniform float uSweepActive;
uniform float uHighlight;
uniform float uTime;
uniform vec3 uSweepColor;
#include <common>
`;

const SWEEP_FRAG_MAIN = `
#include <emissivemap_fragment>
{
  // 1. PPF install laser scanline (sweeps across X axis from Front to Rear)
  float edge = 1.0 - smoothstep(0.0, 0.35, abs(vStudioWorldPos.x - uSweepX));
  totalEmissiveRadiance += uSweepColor * edge * uSweepActive * 2.6;

  // 2. Selection / Hover glowing pulse (golden emissive highlight)
  float pulse = 0.5 + 0.5 * sin(uTime * 5.2);
  totalEmissiveRadiance += vec3(1.0, 0.83, 0.45) * uHighlight * (0.12 + 0.18 * pulse);
}
`;

const PPF_VALUES = {
  gloss: { metal: 0.88, rough: 0.10, clear: 1.0, clearRough: 0.02, env: 1.70 },
  satin: { metal: 0.52, rough: 0.58, clear: 0.15, clearRough: 0.48, env: 0.90 },
};

const BASE_BODY_VALUES = {
  metal: 0.82,
  rough: 0.26,
  clear: 0.65,
  clearRough: 0.12,
  env: 1.15,
};

const RIM_VALUES: Record<
  RimFinishMode,
  { metal: number; rough: number; clear: number; colorHex: string }
> = {
  gloss_black: { metal: 0.95, rough: 0.12, clear: 1.0, colorHex: "#0a0a0c" },
  dark_chrome: { metal: 0.98, rough: 0.22, clear: 0.85, colorHex: "#32353a" },
  satin_silver: { metal: 0.88, rough: 0.48, clear: 0.3, colorHex: "#b8bcc2" },
  matte_black: { metal: 0.65, rough: 0.72, clear: 0.1, colorHex: "#141518" },
};

export interface StudioPartRuntime {
  id: string;
  kind: "body" | "rim";
  meshes: THREE.Mesh[];
  material: THREE.MeshPhysicalMaterial;
  paintColor: THREE.Color;
  targetColor: THREE.Color;
  paintRoughness: number;
  targetRoughness: number;
  paintMetalness: number;
  targetMetalness: number;
  paintClearcoat: number;
  targetClearcoat: number;
  paintClearcoatRoughness: number;
  targetClearcoatRoughness: number;
  paintEnvMapIntensity: number;
  targetEnvMapIntensity: number;
  isPPF: boolean;
  ppfFinish: PPFFinish;
  highlight: number;
  targetHighlight: number;
  sweepT: number;
  uniforms: {
    uSweepX: { value: number };
    uSweepActive: { value: number };
    uHighlight: { value: number };
    uTime: { value: number };
    uSweepColor: { value: THREE.Color };
  };
}

export interface StudioCallbacks {
  onPartHover: (partId: string | null) => void;
  onPartClick: (region: StudioRegionId | null, rim: WheelPartId | null) => void;
  onLoadProgress?: (percent: number) => void;
  onSceneReady?: () => void;
}

export class StudioEngine {
  private container: HTMLElement;
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private startTime: number;
  private lastTime: number;
  private reqId: number | null = null;

  private parts = new Map<string, StudioPartRuntime>();
  private pickables: THREE.Mesh[] = [];
  private cb: StudioCallbacks;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private pointerDownPos = new THREE.Vector2();
  private isPointerDown = false;
  private isHoverActive = false;

  private hoverId: string | null = null;
  private highlightId: string | null = null;
  private cameraTarget = new THREE.Vector3(
    DEFAULT_CAMERA_VIEW.target[0],
    DEFAULT_CAMERA_VIEW.target[1],
    DEFAULT_CAMERA_VIEW.target[2]
  );
  private cameraPosTarget = new THREE.Vector3(
    DEFAULT_CAMERA_VIEW.pos[0],
    DEFAULT_CAMERA_VIEW.pos[1],
    DEFAULT_CAMERA_VIEW.pos[2]
  );

  private isDestroyed = false;

  constructor(container: HTMLElement, canvas: HTMLCanvasElement, cb: StudioCallbacks) {
    this.container = container;
    this.canvas = canvas;
    this.cb = cb;
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#050507");

    // Camera
    const aspect = container.clientWidth / (container.clientHeight || 1);
    this.camera = new THREE.PerspectiveCamera(DEFAULT_CAMERA_VIEW.fov, aspect, 0.1, 100);
    this.camera.position.set(...DEFAULT_CAMERA_VIEW.pos);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Studio Environment Reflections (Crucial for Gloss vs Satin rendering)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;

    // Controls
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(...DEFAULT_CAMERA_VIEW.target);
    this.controls.minDistance = 2.0;
    this.controls.maxDistance = 8.5;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.02;
    this.controls.minPolarAngle = 0.2;

    this.setupLighting();
    this.setupGround();
    this.bindEvents();
    this.startLoop();
  }

  private setupLighting(): void {
    const amb = new THREE.AmbientLight("#e6edf8", 0.9);
    this.scene.add(amb);

    const key = new THREE.DirectionalLight("#fff3db", 2.4);
    key.position.set(4, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0002;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight("#a8c8ff", 1.4);
    fill.position.set(-5, 4, -3);
    this.scene.add(fill);

    const top = new THREE.DirectionalLight("#ffffff", 1.8);
    top.position.set(0, 7, 0);
    this.scene.add(top);
  }

  private setupGround(): void {
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundMat = new THREE.MeshStandardMaterial({
      color: "#08090c",
      roughness: 0.35,
      metalness: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const ringGeo = new THREE.RingGeometry(2.6, 2.62, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#c6a858",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.002;
    this.scene.add(ring);
  }

  public async loadModel(url: string = "/models/car.glb"): Promise<void> {
    try {
      const loaded: LoadedStudioModel = await loadCarStudioModel(url, (p) => {
        this.cb.onLoadProgress?.(p);
      });

      this.scene.add(loaded.root);
      this.pickables = loaded.pickableMeshes;

      // Create interactive runtime parts
      loaded.partMeshes.forEach((meshes, partId) => {
        const isRim = partId.startsWith("rim_");
        const defaultColor = new THREE.Color(
          isRim ? "#0a0a0c" : site.paints[0].hex
        );

        const uniforms = {
          uSweepX: { value: -10.0 },
          uSweepActive: { value: 0.0 },
          uHighlight: { value: 0.0 },
          uTime: { value: 0.0 },
          uSweepColor: { value: new THREE.Color("#d4af37") },
        };

        const initVals = isRim
          ? { metal: 0.95, rough: 0.12, clear: 1.0, clearRough: 0.04, env: 1.6 }
          : PPF_VALUES.gloss;

        const mat = new THREE.MeshPhysicalMaterial({
          color: defaultColor.clone(),
          metalness: initVals.metal,
          roughness: initVals.rough,
          clearcoat: initVals.clear,
          clearcoatRoughness: initVals.clearRough,
          envMapIntensity: initVals.env,
        });

        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uSweepX = uniforms.uSweepX;
          shader.uniforms.uSweepActive = uniforms.uSweepActive;
          shader.uniforms.uHighlight = uniforms.uHighlight;
          shader.uniforms.uTime = uniforms.uTime;
          shader.uniforms.uSweepColor = uniforms.uSweepColor;

          shader.vertexShader = SWEEP_VERT + shader.vertexShader;
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            SWEEP_VERT_MAIN
          );

          shader.fragmentShader = SWEEP_FRAG + shader.fragmentShader;
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <emissivemap_fragment>",
            SWEEP_FRAG_MAIN
          );
        };

        meshes.forEach((mesh) => {
          mesh.material = mat;
        });

        const runtime: StudioPartRuntime = {
          id: partId,
          kind: isRim ? "rim" : "body",
          meshes,
          material: mat,
          paintColor: defaultColor.clone(),
          targetColor: defaultColor.clone(),
          paintRoughness: initVals.rough,
          targetRoughness: initVals.rough,
          paintMetalness: initVals.metal,
          targetMetalness: initVals.metal,
          paintClearcoat: initVals.clear,
          targetClearcoat: initVals.clear,
          paintClearcoatRoughness: initVals.clearRough,
          targetClearcoatRoughness: initVals.clearRough,
          paintEnvMapIntensity: initVals.env,
          targetEnvMapIntensity: initVals.env,
          isPPF: !isRim,
          ppfFinish: "gloss",
          highlight: 0,
          targetHighlight: 0,
          sweepT: 1.0,
          uniforms,
        };

        this.parts.set(partId, runtime);
      });

      this.cb.onSceneReady?.();
    } catch (e) {
      console.error("[StudioEngine] Failed to load model:", e);
    }
  }

  // --- Material Updates & Animation ---

  public applyPPF(regions: string[], finish: PPFFinish): void {
    const pv = PPF_VALUES[finish];
    regions.forEach((regionId) => {
      const part = this.parts.get(regionId);
      if (!part || part.kind !== "body") return;

      part.isPPF = true;
      part.ppfFinish = finish;
      part.targetMetalness = pv.metal;
      part.targetRoughness = pv.rough;
      part.targetClearcoat = pv.clear;
      part.targetClearcoatRoughness = pv.clearRough;
      part.targetEnvMapIntensity = pv.env;

      // Start laser scanline animation
      part.sweepT = 0;
      part.uniforms.uSweepActive.value = 1.0;
      part.uniforms.uSweepX.value = 3.2;
    });
  }

  public removePPF(regions: string[]): void {
    regions.forEach((regionId) => {
      const part = this.parts.get(regionId);
      if (!part || part.kind !== "body") return;

      part.isPPF = false;
      part.targetMetalness = BASE_BODY_VALUES.metal;
      part.targetRoughness = BASE_BODY_VALUES.rough;
      part.targetClearcoat = BASE_BODY_VALUES.clear;
      part.targetClearcoatRoughness = BASE_BODY_VALUES.clearRough;
      part.targetEnvMapIntensity = BASE_BODY_VALUES.env;

      // Quick sweep effect on removal
      part.sweepT = 0;
      part.uniforms.uSweepActive.value = 1.0;
      part.uniforms.uSweepX.value = -3.2;
    });
  }

  public setRimFinish(mode: RimFinishMode): void {
    const rv = RIM_VALUES[mode];
    const targetColor = new THREE.Color(rv.colorHex);

    this.parts.forEach((part) => {
      if (part.kind === "rim") {
        part.targetColor.copy(targetColor);
        part.targetMetalness = rv.metal;
        part.targetRoughness = rv.rough;
        part.targetClearcoat = rv.clear;
        part.targetEnvMapIntensity = 1.6;
      }
    });
  }

  public setPaintColor(hex: string): void {
    const col = new THREE.Color(hex);
    this.parts.forEach((part) => {
      if (part.kind === "body") {
        part.targetColor.copy(col);
      }
    });
  }

  public setCameraView(vp: CameraViewpoint): void {
    this.cameraPosTarget.set(...vp.pos);
    this.cameraTarget.set(...vp.target);
    if (vp.fov && Math.abs(this.camera.fov - vp.fov) > 0.5) {
      this.camera.fov = vp.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  public setHighlight(partId: string | null): void {
    this.highlightId = partId;
  }

  public setHover(partId: string | null): void {
    this.hoverId = partId;
  }

  // --- Animation Loop ---

  private update(dt: number, time: number): void {
    const lerpSpeed = Math.min(1, dt * 7.5);

    // Update parts, uniforms, and materials
    this.parts.forEach((part) => {
      part.uniforms.uTime.value = time;

      // Laser sweep animation (sweeps across X from Front +3.2 to Rear -3.2)
      if (part.sweepT < 1.0) {
        part.sweepT += dt * 1.4;
        const currentX = THREE.MathUtils.lerp(3.2, -3.2, part.sweepT);
        part.uniforms.uSweepX.value = currentX;
        if (part.sweepT >= 1.0) {
          part.uniforms.uSweepActive.value = 0.0;
        }
      }

      // Highlight pulse interpolation
      const isPartRim = part.kind === "rim";
      const isHovered =
        this.hoverId === part.id ||
        (isPartRim && this.hoverId === "wheel_rims");
      const isSelected =
        this.highlightId === part.id ||
        (isPartRim && this.highlightId === "wheel_rims");

      const targetGlow = isSelected || isHovered ? 1.0 : 0.0;
      part.highlight += (targetGlow - part.highlight) * Math.min(1, dt * 10);
      part.uniforms.uHighlight.value = part.highlight;

      // Smooth material property tweens
      const m = part.material;
      m.color.lerp(part.targetColor, lerpSpeed);
      m.roughness += (part.targetRoughness - m.roughness) * lerpSpeed;
      m.metalness += (part.targetMetalness - m.metalness) * lerpSpeed;
      m.clearcoat += (part.targetClearcoat - m.clearcoat) * lerpSpeed;
      m.clearcoatRoughness +=
        (part.targetClearcoatRoughness - m.clearcoatRoughness) * lerpSpeed;
      m.envMapIntensity +=
        (part.targetEnvMapIntensity - m.envMapIntensity) * lerpSpeed;
      m.needsUpdate = true;
    });

    // Smooth Camera Transition
    if (this.camera.position.distanceTo(this.cameraPosTarget) > 0.01) {
      this.camera.position.lerp(this.cameraPosTarget, Math.min(1, dt * 4.5));
    }
    if (this.controls.target.distanceTo(this.cameraTarget) > 0.01) {
      this.controls.target.lerp(this.cameraTarget, Math.min(1, dt * 4.5));
    }

    this.controls.update();
  }

  private startLoop(): void {
    const loop = () => {
      if (this.isDestroyed) return;
      const now = performance.now();
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;
      const time = (now - this.startTime) / 1000;

      this.update(dt, time);
      this.renderer.render(this.scene, this.camera);
      this.reqId = requestAnimationFrame(loop);
    };
    this.reqId = requestAnimationFrame(loop);
  }

  // --- Interaction & Event Binding ---

  private bindEvents(): void {
    const el = this.canvas;

    el.addEventListener("pointerdown", this.onPointerDown);
    el.addEventListener("pointermove", this.onPointerMove);
    el.addEventListener("pointerup", this.onPointerUp);
    el.addEventListener("pointerleave", this.onPointerLeave);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isPointerDown = true;
    this.pointerDownPos.set(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.isHoverActive = true;

    // Raycast hover
    if (this.pickables.length > 0) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.pickables, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.partId as string | undefined;
        if (id) {
          this.hoverId = id;
          this.cb.onPartHover(id);
          this.canvas.style.cursor = "pointer";
          return;
        }
      }
    }

    if (this.hoverId !== null) {
      this.hoverId = null;
      this.cb.onPartHover(null);
      this.canvas.style.cursor = "grab";
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (!this.isPointerDown) return;
    this.isPointerDown = false;

    // Distinguish drag vs click (< 8px movement)
    const dist = Math.hypot(
      e.clientX - this.pointerDownPos.x,
      e.clientY - this.pointerDownPos.y
    );

    if (dist < 8 && this.pickables.length > 0) {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const hits = this.raycaster.intersectObjects(this.pickables, false);
      if (hits.length > 0) {
        const id = hits[0].object.userData.partId as string | undefined;
        if (id) {
          const part = this.parts.get(id);
          const rimPart = part?.kind === "rim" ? (id as WheelPartId) : null;
          const bodyPart = part?.kind === "body" ? (id as StudioRegionId) : null;
          this.cb.onPartClick(bodyPart, rimPart);
          return;
        }
      }
      this.cb.onPartClick(null, null);
    }
  };

  private onPointerLeave = (): void => {
    this.isPointerDown = false;
    this.isHoverActive = false;
    this.hoverId = null;
    this.cb.onPartHover(null);
  };

  public resize(): void {
    if (!this.container || this.isDestroyed) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  public destroy(): void {
    this.isDestroyed = true;
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId);
    }
    const el = this.canvas;
    el.removeEventListener("pointerdown", this.onPointerDown);
    el.removeEventListener("pointermove", this.onPointerMove);
    el.removeEventListener("pointerup", this.onPointerUp);
    el.removeEventListener("pointerleave", this.onPointerLeave);

    this.controls.dispose();
    this.renderer.dispose();
  }
}
