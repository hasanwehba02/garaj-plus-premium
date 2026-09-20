export type StudioRegionId =
  | "hood"
  | "bumper_f"
  | "bumper_r"
  | "door_fl"
  | "door_fr"
  | "door_rl"
  | "door_rr"
  | "roof"
  | "mirror_l"
  | "mirror_r"
  | "fender_fl"
  | "fender_fr"
  | "quarter_rl"
  | "quarter_rr"
  | "trunk"
  | "side_skirts";

export type WheelPartId =
  | "rim_front_left"
  | "rim_front_right"
  | "rim_rear_left"
  | "rim_rear_right"
  | "wheel_rims";

export type PartKind = "body" | "rim" | "caliper" | "glass" | "trim";

export type PPFFinish = "gloss" | "satin";

export type RimFinishMode = "gloss_black" | "dark_chrome" | "satin_silver" | "matte_black";

export interface CameraViewpoint {
  pos: [number, number, number];
  target: [number, number, number];
  fov?: number;
}

export interface StudioPartDef {
  id: StudioRegionId | WheelPartId;
  panelId: string;
  name: string;
  nameTr: string;
  kind: PartKind;
  category: "front" | "doors" | "rear" | "roof_mirrors" | "wheels" | "other";
  camera: CameraViewpoint;
  meshPatterns: RegExp[];
}

export interface PanelProtectionState {
  hasPPF: boolean;
  finish: PPFFinish;
}

export interface PanelData {
  id: string;
  name: string;
  category: "front" | "doors" | "rear" | "roof_mirrors" | "wheels";
  basePrice: number; // In Turkish Lira (TL)
  satinExtraPrice: number;
  description: string;
  regionId: StudioRegionId | WheelPartId;
}

export interface ConfiguratorPackage {
  id: string;
  name: string;
  tagline: string;
  description: string;
  badge?: string;
  panelIds: string[];
  discountPercent: number;
  highlighted?: boolean;
}

export type StudioCommand =
  | { type: "applyPPF"; regions: string[]; finish: PPFFinish }
  | { type: "removePPF"; regions: string[] }
  | { type: "setRimFinishMode"; mode: RimFinishMode }
  | { type: "setPaintColor"; hex: string }
  | { type: "setCameraAngle"; viewpoint: CameraViewpoint }
  | { type: "highlightPart"; partId: string | null }
  | { type: "hoverPart"; partId: string | null }
  | { type: "resetCamera" }
  | { type: "resetAll" };
