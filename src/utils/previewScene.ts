import type { SceneConfig, SceneObject, SpriteAsset } from '../types/scene';

const PREVIEW_STORAGE_KEY = 'phaser-preview-scene';

export interface PreviewSceneData {
  sceneConfig: SceneConfig;
  objects: SceneObject[];
  sprites: SpriteAsset[];
}

export function savePreviewScene(data: PreviewSceneData): void {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Falha ao salvar preview no storage', error);
  }
}

export function loadPreviewScene(): PreviewSceneData | null {
  try {
    const raw = localStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PreviewSceneData;
  } catch (error) {
    console.warn('Falha ao carregar preview do storage', error);
    return null;
  }
}

export function clearPreviewScene(): void {
  try {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    // ignore
  }
}
