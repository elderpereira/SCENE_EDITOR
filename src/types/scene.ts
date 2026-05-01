export interface SpriteAsset {
  key: string;
  url: string;
  width: number;
  height: number;
  ext: string;
}

export interface HitboxPoint {
  x: number;
  y: number;
}

export interface SceneObject {
  id: string;
  name: string;
  description: string;
  type: 'image';
  spriteKey: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  depth: number;
  alpha: number;
  flipX: boolean;
  flipY: boolean;
  locked: boolean;
  hitboxEnabled: boolean;
  hitboxOffsetX: number;
  hitboxOffsetY: number;
  hitboxWidth: number;
  hitboxHeight: number;
  hitboxMode: 'rect' | 'polygon';
  hitboxPoints: HitboxPoint[];
}

export interface SceneConfig {
  key: string;
  width: number;
  height: number;
  background: string;
}

export interface EditorProjectData {
  version: 1;
  sprites: SpriteAsset[];
  sceneConfig: SceneConfig;
  objects: SceneObject[];
  showGrid: boolean;
  snapToGrid: boolean;
}
