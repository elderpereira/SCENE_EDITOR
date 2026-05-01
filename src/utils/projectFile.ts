import type { EditorProjectData, SceneConfig, SceneObject, SpriteAsset } from '../types/scene';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function buildProjectData(
  sceneConfig: SceneConfig,
  objects: SceneObject[],
  sprites: SpriteAsset[],
  showGrid: boolean,
  snapToGrid: boolean
): EditorProjectData {
  return {
    version: 1,
    sceneConfig,
    objects,
    sprites,
    showGrid,
    snapToGrid,
  };
}

export function downloadProjectFile(data: EditorProjectData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `${data.sceneConfig.key || 'scene'}-editor.json`);
}

export async function readProjectFile(file: File): Promise<EditorProjectData> {
  const raw = JSON.parse(await file.text()) as Partial<EditorProjectData>;

  if (!raw || !raw.sceneConfig || !Array.isArray(raw.sprites) || !Array.isArray(raw.objects)) {
    throw new Error('Arquivo de projeto inválido');
  }

  return {
    version: 1,
    sceneConfig: raw.sceneConfig,
    sprites: raw.sprites,
    objects: raw.objects.map((obj) => ({
      ...obj,
      locked: obj.locked ?? false,
      hitboxEnabled: obj.hitboxEnabled ?? false,
      hitboxOffsetX: obj.hitboxOffsetX ?? -((obj.hitboxWidth ?? 64) / 2),
      hitboxOffsetY: obj.hitboxOffsetY ?? -((obj.hitboxHeight ?? 64) / 2),
      hitboxWidth: Math.max(1, obj.hitboxWidth ?? 64),
      hitboxHeight: Math.max(1, obj.hitboxHeight ?? 64),
      hitboxMode: obj.hitboxMode ?? 'rect',
      hitboxPoints: obj.hitboxPoints ?? [],
    })),
    showGrid: raw.showGrid ?? false,
    snapToGrid: raw.snapToGrid ?? false,
  };
}