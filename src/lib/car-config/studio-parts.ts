import type { StudioPartDef, StudioRegionId, WheelPartId } from "./types";

export const DEFAULT_CAMERA_VIEW = {
  pos: [3.4, 1.8, 4.2] as [number, number, number],
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
    camera: { pos: [0.3, 2.2, 3.2], target: [0, 0.8, 1.2], fov: 38 },
    meshPatterns: [/hood/i, /bonnet/i, /polySurface219/i, /polySurface287/i],
  },
  {
    id: "bumper_f",
    panelId: "on_tampon",
    name: "Front Bumper",
    nameTr: "Ön Tampon",
    kind: "body",
    category: "front",
    camera: { pos: [0.1, 1.2, 3.6], target: [0, 0.6, 1.8], fov: 38 },
    meshPatterns: [/bumper_?f/i, /front_?bumper/i, /polySurface253/i, /polySurface357/i, /polySurface37/i],
  },
  {
    id: "fender_fl",
    panelId: "camurluk_on_sol",
    name: "Front Left Fender",
    nameTr: "Sol Ön Çamurluk",
    kind: "body",
    category: "front",
    camera: { pos: [-2.6, 1.4, 2.4], target: [-0.9, 0.7, 1.1], fov: 38 },
    meshPatterns: [/fender_?f.*l/i, /fender_?l.*f/i, /wing_?f.*l/i, /polySurface41/i],
  },
  {
    id: "fender_fr",
    panelId: "camurluk_on_sag",
    name: "Front Right Fender",
    nameTr: "Sağ Ön Çamurluk",
    kind: "body",
    category: "front",
    camera: { pos: [2.6, 1.4, 2.4], target: [0.9, 0.7, 1.1], fov: 38 },
    meshPatterns: [/fender_?f.*r/i, /fender_?r.*f/i, /wing_?f.*r/i, /polySurface39/i],
  },

  // Doors
  {
    id: "door_fl",
    panelId: "kapi_on_sol",
    name: "Front Left Door",
    nameTr: "Sol Ön Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [-3.4, 1.3, 0.4], target: [-0.9, 0.8, 0.2], fov: 36 },
    meshPatterns: [/door.*l/i, /door_?f.*l/i, /polySurface199/i, /polySurface308/i],
  },
  {
    id: "door_fr",
    panelId: "kapi_on_sag",
    name: "Front Right Door",
    nameTr: "Sağ Ön Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [3.4, 1.3, 0.4], target: [0.9, 0.8, 0.2], fov: 36 },
    meshPatterns: [/door.*r/i, /door_?f.*r/i, /polySurface331/i],
  },
  {
    id: "door_rl",
    panelId: "kapi_arka_sol",
    name: "Rear Left Door",
    nameTr: "Sol Arka Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [-3.2, 1.4, -1.0], target: [-0.9, 0.8, -0.7], fov: 36 },
    meshPatterns: [/door_?r.*l/i, /rear_?door.*l/i, /polySurface66/i],
  },
  {
    id: "door_rr",
    panelId: "kapi_arka_sag",
    name: "Rear Right Door",
    nameTr: "Sağ Arka Kapı",
    kind: "body",
    category: "doors",
    camera: { pos: [3.2, 1.4, -1.0], target: [0.9, 0.8, -0.7], fov: 36 },
    meshPatterns: [/door_?r.*r/i, /rear_?door.*r/i, /polySurface47/i],
  },

  // Roof & Mirrors
  {
    id: "roof",
    panelId: "tavan",
    name: "Roof & Pillars",
    nameTr: "Tavan ve Direkler",
    kind: "body",
    category: "roof_mirrors",
    camera: { pos: [0.1, 3.5, 0.2], target: [0, 1.2, 0], fov: 40 },
    meshPatterns: [/roof/i, /innershellroof/i, /polySurface310/i, /polySurface311/i, /polySurface312/i],
  },
  {
    id: "mirror_l",
    panelId: "ayna_sol",
    name: "Left Mirror",
    nameTr: "Sol Yan Ayna",
    kind: "body",
    category: "roof_mirrors",
    camera: { pos: [-2.2, 1.4, 1.2], target: [-1.0, 1.0, 0.7], fov: 30 },
    meshPatterns: [/mirror.*l/i, /sidemirror.*l/i, /pCube22_BodyMat/i, /polySurface63_BodyMat/i],
  },
  {
    id: "mirror_r",
    panelId: "ayna_sag",
    name: "Right Mirror",
    nameTr: "Sağ Yan Ayna",
    kind: "body",
    category: "roof_mirrors",
    camera: { pos: [2.2, 1.4, 1.2], target: [1.0, 1.0, 0.7], fov: 30 },
    meshPatterns: [/mirror.*r/i, /sidemirror.*r/i, /pCube192_BodyMat/i, /polySurface305_BodyMat/i],
  },

  // Rear End
  {
    id: "bumper_r",
    panelId: "arka_tampon",
    name: "Rear Bumper",
    nameTr: "Arka Tampon & Eşik",
    kind: "body",
    category: "rear",
    camera: { pos: [0.1, 1.3, -3.8], target: [0, 0.6, -1.8], fov: 38 },
    meshPatterns: [/bumper_?r/i, /rear_?bumper/i, /polySurface264/i, /polySurface266/i],
  },
  {
    id: "trunk",
    panelId: "bagaj_kapagi",
    name: "Trunk Lid",
    nameTr: "Bagaj Kapağı",
    kind: "body",
    category: "rear",
    camera: { pos: [0.1, 1.9, -3.5], target: [0, 1.0, -1.5], fov: 38 },
    meshPatterns: [/trunk/i, /boot/i, /tailgate/i, /polySurface14_BodyMat/i, /polySurface46_BodyMat/i],
  },

  // Wheels / Rims
  {
    id: "rim_front_left",
    panelId: "jant_on_sol",
    name: "Front Left Wheel Rim",
    nameTr: "Sol Ön Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [-2.6, 0.6, 1.7], target: [-0.95, 0.42, 1.45], fov: 28 },
    meshPatterns: [/wheellf/i, /wheel_?f.*l/i, /polySurface321.*wheellf/i],
  },
  {
    id: "rim_front_right",
    panelId: "jant_on_sag",
    name: "Front Right Wheel Rim",
    nameTr: "Sağ Ön Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [2.6, 0.6, 1.7], target: [0.95, 0.42, 1.45], fov: 28 },
    meshPatterns: [/wheelrf/i, /wheel_?f.*r/i, /polySurface321.*wheelrf/i],
  },
  {
    id: "rim_rear_left",
    panelId: "jant_arka_sol",
    name: "Rear Left Wheel Rim",
    nameTr: "Sol Arka Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [-2.6, 0.6, -1.7], target: [-0.95, 0.42, -1.45], fov: 28 },
    meshPatterns: [/wheellr/i, /wheel_?r.*l/i, /polySurface321.*wheellr/i],
  },
  {
    id: "rim_rear_right",
    panelId: "jant_arka_sag",
    name: "Rear Right Wheel Rim",
    nameTr: "Sağ Arka Jant",
    kind: "rim",
    category: "wheels",
    camera: { pos: [2.6, 0.6, -1.7], target: [0.95, 0.42, -1.45], fov: 28 },
    meshPatterns: [/wheelrr/i, /wheel_?r.*r/i, /polySurface321.*wheelrr/i],
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
