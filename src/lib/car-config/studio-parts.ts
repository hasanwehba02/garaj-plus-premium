import type { StudioPartDef, StudioRegionId, WheelPartId } from "./types";

export const DEFAULT_CAMERA_VIEW = {
  pos: [4.2, 1.8, 3.4] as [number, number, number],
  target: [0, 0.7, 0] as [number, number, number],
  fov: 42,
};

export const STUDIO_PARTS: StudioPartDef[] = [
  // Front End
  {
    id: "hood",
    panelId: "kaput",
    name: "Hood",
    nameTr: "Kaput",
    kind: "body",
    category: "front",
    camera: { pos: [3.4, 2.2, 0.4], target: [1.2, 0.8, 0], fov: 38 },
    meshPatterns: [/hood/i, /bonnet/i, /kaput/i],
  },
  {
    id: "bumper_f",
    panelId: "on_tampon",
    name: "Front Bumper",
    nameTr: "Ön Tampon",
    kind: "body",
    category: "front",
    camera: { pos: [3.8, 1.2, 0.2], target: [1.9, 0.6, 0], fov: 38 },
    meshPatterns: [/bumper_?f/i, /front_?bumper/i, /on_tampon/i],
  },
  {
    id: "fender_fl",
    panelId: "camurluk_on_sol",
    name: "Front Left Fender",
    nameTr: "Sol Ön Çamurluk",
    kind: "body",
    category: "front",
    camera: { pos: [2.5, 1.4, -2.4], target: [1.3, 0.7, -0.9], fov: 38 },
    meshPatterns: [/fender_?f.*l/i, /fender_?l.*f/i, /wing_?f.*l/i, /camurluk_on_sol/i],
  },
  {
    id: "fender_fr",
    panelId: "camurluk_on_sag",
    name: "Front Right Fender",
    nameTr: "Sağ Ön Çamurluk",
    kind: "body",
    category: "front",
    camera: { pos: [2.5, 1.4, 2.4], target: [1.3, 0.7, 0.9], fov: 38 },
    meshPatterns: [/fender_?f.*r/i, /fender_?r.*f/i, /wing_?f.*r/i, /camurluk_on_sag/i],
  },

  // Doors
  {
    id: "door_fl",
    panelId: "kapi_on_sol",
    name: "Front Left Door",
    nameTr: "Sol Ön Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [0.4, 1.3, -3.4], target: [0.3, 0.8, -0.9], fov: 36 },
    meshPatterns: [/door.*fl/i, /kapi_on_sol/i],
  },
  {
    id: "door_fr",
    panelId: "kapi_on_sag",
    name: "Front Right Door",
    nameTr: "Sağ Ön Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [0.4, 1.3, 3.4], target: [0.3, 0.8, 0.9], fov: 36 },
    meshPatterns: [/door.*fr/i, /kapi_on_sag/i],
  },
  {
    id: "door_rl",
    panelId: "kapi_arka_sol",
    name: "Rear Left Door",
    nameTr: "Sol Arka Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [-0.9, 1.4, -3.2], target: [-0.6, 0.8, -0.9], fov: 36 },
    meshPatterns: [/door.*rl/i, /kapi_arka_sol/i],
  },
  {
    id: "door_rr",
    panelId: "kapi_arka_sag",
    name: "Rear Right Door",
    nameTr: "Sağ Arka Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [-0.9, 1.4, 3.2], target: [-0.6, 0.8, 0.9], fov: 36 },
    meshPatterns: [/door.*rr/i, /kapi_arka_sag/i],
  },

  // Roof & Mirrors
  {
    id: "roof",
    panelId: "tavan",
    name: "Roof & Pillars",
    nameTr: "Tavan ve Direkler",
    kind: "body",
    category: "roof_mirrors",
    camera: { pos: [0.2, 3.4, 0.1], target: [-0.1, 1.2, 0], fov: 40 },
    meshPatterns: [/roof/i, /tavan/i],
  },
  {
    id: "mirror_l",
    panelId: "ayna_sol",
    name: "Left Mirror",
    nameTr: "Sol Yan Ayna",
    kind: "body",
    category: "roof_mirrors",
    camera: { pos: [1.0, 1.4, -2.2], target: [0.65, 0.95, -0.95], fov: 30 },
    meshPatterns: [/mirror.*l/i, /ayna_sol/i],
  },
  {
    id: "mirror_r",
    panelId: "ayna_sag",
    name: "Right Mirror",
    nameTr: "Sağ Yan Ayna",
    kind: "body",
    category: "roof_mirrors",
    camera: { pos: [1.0, 1.4, 2.2], target: [0.65, 0.95, 0.95], fov: 30 },
    meshPatterns: [/mirror.*r/i, /ayna_sag/i],
  },

  // Rear End
  {
    id: "bumper_r",
    panelId: "arka_tampon",
    name: "Rear Bumper",
    nameTr: "Arka Tampon & Eşik",
    kind: "body",
    category: "rear",
    camera: { pos: [-3.8, 1.3, 0.2], target: [-1.9, 0.6, 0], fov: 38 },
    meshPatterns: [/bumper_?r/i, /arka_tampon/i],
  },
  {
    id: "trunk",
    panelId: "bagaj_kapagi",
    name: "Trunk Lid",
    nameTr: "Bagaj Kapağı",
    kind: "body",
    category: "rear",
    camera: { pos: [-3.5, 1.9, 0.2], target: [-1.5, 1.0, 0], fov: 38 },
    meshPatterns: [/trunk/i, /bagaj/i],
  },

  // Wheels / Rims
  {
    id: "rim_front_left",
    panelId: "jant_on_sol",
    name: "Front Left Wheel Rim",
    nameTr: "Sol Ön Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [1.7, 0.6, -2.6], target: [1.55, 0.38, -0.85], fov: 28 },
    meshPatterns: [/wheel.*ft.*l/i, /rim.*fl/i, /jant_on_sol/i],
  },
  {
    id: "rim_front_right",
    panelId: "jant_on_sag",
    name: "Front Right Wheel Rim",
    nameTr: "Sağ Ön Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [1.7, 0.6, 2.6], target: [1.55, 0.38, 0.85], fov: 28 },
    meshPatterns: [/wheel.*ft.*r/i, /rim.*fr/i, /jant_on_sag/i],
  },
  {
    id: "rim_rear_left",
    panelId: "jant_arka_sol",
    name: "Rear Left Wheel Rim",
    nameTr: "Sol Arka Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [-1.4, 0.6, -2.6], target: [-1.25, 0.38, -0.85], fov: 28 },
    meshPatterns: [/wheel.*bk.*l/i, /rim.*rl/i, /jant_arka_sol/i],
  },
  {
    id: "rim_rear_right",
    panelId: "jant_arka_sag",
    name: "Rear Right Wheel Rim",
    nameTr: "Sağ Arka Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [-1.4, 0.6, 2.6], target: [-1.25, 0.38, 0.85], fov: 28 },
    meshPatterns: [/wheel.*bk.*r/i, /rim.*rr/i, /jant_arka_sag/i],
  },
];

export function findStudioPartById(id: string): StudioPartDef | undefined {
  return STUDIO_PARTS.find((p) => p.id === id);
}

export function findStudioPartByPanelId(panelId: string): StudioPartDef | undefined {
  return STUDIO_PARTS.find((p) => p.panelId === panelId);
}

export function getAllBodyRegionIds(): StudioRegionId[] {
  return STUDIO_PARTS.filter((p) => p.kind === "body").map((p) => p.id as StudioRegionId);
}

export function getAllWheelPartIds(): WheelPartId[] {
  return ["rim_front_left", "rim_front_right", "rim_rear_left", "rim_rear_right"];
}
