import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EditorProjectData, HitboxPoint, SceneConfig, SceneObject, SpriteAsset } from '../types/scene';
import { generateId } from '../utils/generateId';
import { toSnakeCase } from '../utils/snakeCase';
import { editorStorage } from '../utils/editorStorage';

const STORAGE_KEY = 'scene-editor-project';

const DEFAULT_SCENE_CONFIG: SceneConfig = {
  key: 'MinhaScene',
  width: 1280,
  height: 720,
  background: '#1a1a2e',
};

function getSpriteSize(spriteKey: string, sprites: SpriteAsset[]) {
  const sprite = sprites.find((item) => item.key === spriteKey);
  return {
    width: Math.max(1, sprite?.width ?? 64),
    height: Math.max(1, sprite?.height ?? 64),
  };
}

function normalizeObjects(objects: SceneObject[], sprites: SpriteAsset[]): SceneObject[] {
  return objects.map((obj) => {
    const size = getSpriteSize(obj.spriteKey, sprites);
    const hitboxWidth = Math.max(1, obj.hitboxWidth ?? size.width);
    const hitboxHeight = Math.max(1, obj.hitboxHeight ?? size.height);

    return {
      ...obj,
      locked: obj.locked ?? false,
      hitboxEnabled: obj.hitboxEnabled ?? false,
      hitboxOffsetX: obj.hitboxOffsetX ?? -hitboxWidth / 2,
      hitboxOffsetY: obj.hitboxOffsetY ?? -hitboxHeight / 2,
      hitboxWidth,
      hitboxHeight,
      hitboxMode: obj.hitboxMode ?? 'rect',
      hitboxPoints: obj.hitboxPoints ?? [],
    };
  });
}

interface SceneStore {
  sprites: SpriteAsset[];
  addSprite: (sprite: SpriteAsset) => void;
  removeSprite: (key: string) => void;
  renameSprite: (oldKey: string, newKey: string) => void;

  sceneConfig: SceneConfig;
  updateSceneConfig: (config: Partial<SceneConfig>) => void;

  objects: SceneObject[];
  addObject: (spriteKey: string, _sprites: SpriteAsset[], config: SceneConfig) => void;
  updateObject: (id: string, changes: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  duplicateObject: (id: string) => void;
  moveObjectUp: (id: string) => void;
  moveObjectDown: (id: string) => void;
  moveObjectToTop: (id: string) => void;
  moveObjectToBottom: (id: string) => void;

  hitboxEditMode: boolean;
  setHitboxEditMode: (enabled: boolean) => void;
  addHitboxPoint: (id: string, point: HitboxPoint) => void;
  updateHitboxPoint: (id: string, index: number, point: HitboxPoint) => void;
  removeLastHitboxPoint: (id: string) => void;
  clearHitboxPoints: (id: string) => void;

  selectedId: string | null;
  setSelectedId: (id: string | null) => void;

  loadProject: (project: EditorProjectData) => void;

  showGrid: boolean;
  toggleGrid: () => void;
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;
}

export const useSceneStore = create<SceneStore>()(persist((set, get) => ({
  sprites: [],
  addSprite: (sprite) =>
    set((state) => ({ sprites: [...state.sprites, sprite] })),
  removeSprite: (key) =>
    set((state) => ({
      sprites: state.sprites.filter((s) => s.key !== key),
    })),
  renameSprite: (oldKey, newKey) =>
    set((state) => ({
      sprites: state.sprites.map((s) =>
        s.key === oldKey ? { ...s, key: newKey } : s
      ),
      objects: state.objects.map((o) => {
        if (o.spriteKey !== oldKey) return o;
        return {
          ...o,
          spriteKey: newKey,
          name: o.name === oldKey ? newKey : o.name,
        };
      }),
    })),

  sceneConfig: DEFAULT_SCENE_CONFIG,
  updateSceneConfig: (config) =>
    set((state) => ({ sceneConfig: { ...state.sceneConfig, ...config } })),

  objects: [],
  addObject: (spriteKey, _sprites, config) => {
    const size = getSpriteSize(spriteKey, _sprites);
    const newObj: SceneObject = {
      id: generateId(),
      name: spriteKey,
      description: '',
      type: 'image',
      spriteKey,
      x: config.width / 2,
      y: config.height / 2,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      depth: get().objects.length,
      alpha: 1,
      flipX: false,
      flipY: false,
      locked: false,
      hitboxEnabled: false,
      hitboxOffsetX: -size.width / 2,
      hitboxOffsetY: -size.height / 2,
      hitboxWidth: size.width,
      hitboxHeight: size.height,
      hitboxMode: 'rect',
      hitboxPoints: [],
    };
    set((state) => ({ objects: [...state.objects, newObj], selectedId: newObj.id }));
  },
  updateObject: (id, changes) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...changes } : obj
      ),
    })),
  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  duplicateObject: (id) =>
    set((state) => {
      const source = state.objects.find((o) => o.id === id);
      if (!source) return state;

      const usedNames = state.objects.map((o) => o.name);
      const baseName = toSnakeCase(`${source.name}_copy`) || 'obj_copy';
      let newName = baseName;
      let i = 2;
      while (usedNames.includes(newName)) {
        newName = `${baseName}_${i}`;
        i += 1;
      }

      const maxDepth = state.objects.reduce((acc, obj) => Math.max(acc, obj.depth), 0);
      const clone: SceneObject = {
        ...source,
        id: generateId(),
        name: newName,
        x: source.x + 32,
        y: source.y + 32,
        depth: maxDepth + 1,
      };

      return {
        objects: [...state.objects, clone],
        selectedId: clone.id,
      };
    }),
  moveObjectUp: (id) =>
    set((state) => {
      const sorted = [...state.objects].sort((a, b) => a.depth - b.depth);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx <= 0) return state;
      const prev = sorted[idx - 1];
      const curr = sorted[idx];
      const prevDepth = prev.depth;
      const currDepth = curr.depth;
      return {
        objects: state.objects.map((o) => {
          if (o.id === curr.id) return { ...o, depth: prevDepth };
          if (o.id === prev.id) return { ...o, depth: currDepth };
          return o;
        }),
      };
    }),
  moveObjectDown: (id) =>
    set((state) => {
      const sorted = [...state.objects].sort((a, b) => a.depth - b.depth);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx < 0 || idx >= sorted.length - 1) return state;
      const next = sorted[idx + 1];
      const curr = sorted[idx];
      const nextDepth = next.depth;
      const currDepth = curr.depth;
      return {
        objects: state.objects.map((o) => {
          if (o.id === curr.id) return { ...o, depth: nextDepth };
          if (o.id === next.id) return { ...o, depth: currDepth };
          return o;
        }),
      };
    }),
  moveObjectToTop: (id) =>
    set((state) => {
      if (state.objects.length <= 1) return state;

      const sorted = [...state.objects].sort((a, b) => a.depth - b.depth);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx <= 0) return state;

      const reordered = [...sorted];
      const [target] = reordered.splice(idx, 1);
      reordered.unshift(target);

      return {
        objects: state.objects.map((obj) => {
          const nextDepth = reordered.findIndex((item) => item.id === obj.id);
          return nextDepth < 0 ? obj : { ...obj, depth: nextDepth };
        }),
      };
    }),
  moveObjectToBottom: (id) =>
    set((state) => {
      if (state.objects.length <= 1) return state;

      const sorted = [...state.objects].sort((a, b) => a.depth - b.depth);
      const idx = sorted.findIndex((o) => o.id === id);
      if (idx < 0 || idx === sorted.length - 1) return state;

      const reordered = [...sorted];
      const [target] = reordered.splice(idx, 1);
      reordered.push(target);

      return {
        objects: state.objects.map((obj) => {
          const nextDepth = reordered.findIndex((item) => item.id === obj.id);
          return nextDepth < 0 ? obj : { ...obj, depth: nextDepth };
        }),
      };
    }),

  hitboxEditMode: false,
  setHitboxEditMode: (enabled) => set({ hitboxEditMode: enabled }),
  addHitboxPoint: (id, point) =>
    set((state) => ({
      objects: state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        return {
          ...obj,
          hitboxEnabled: true,
          hitboxMode: 'polygon',
          hitboxPoints: [...obj.hitboxPoints, point],
        };
      }),
    })),
  updateHitboxPoint: (id, index, point) =>
    set((state) => ({
      objects: state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        return {
          ...obj,
          hitboxPoints: obj.hitboxPoints.map((current, i) =>
            i === index ? point : current
          ),
        };
      }),
    })),
  removeLastHitboxPoint: (id) =>
    set((state) => ({
      objects: state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        return {
          ...obj,
          hitboxPoints: obj.hitboxPoints.slice(0, -1),
        };
      }),
    })),
  clearHitboxPoints: (id) =>
    set((state) => ({
      objects: state.objects.map((obj) => {
        if (obj.id !== id) return obj;
        return {
          ...obj,
          hitboxPoints: [],
        };
      }),
    })),

  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id, hitboxEditMode: false }),
  loadProject: (project) =>
    set({
      sprites: project.sprites,
      sceneConfig: { ...DEFAULT_SCENE_CONFIG, ...project.sceneConfig },
      objects: normalizeObjects(project.objects, project.sprites),
      selectedId: null,
      hitboxEditMode: false,
      showGrid: project.showGrid,
      snapToGrid: project.snapToGrid,
    }),

  showGrid: false,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  snapToGrid: false,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
}), {
  name: STORAGE_KEY,
  version: 3,
  storage: createJSONStorage(() => editorStorage),
  partialize: (state) => ({
    sprites: state.sprites,
    sceneConfig: state.sceneConfig,
    objects: state.objects,
    showGrid: state.showGrid,
    snapToGrid: state.snapToGrid,
    selectedId: state.selectedId,
  }),
  onRehydrateStorage: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore browser storage access failures
    }
  },
  migrate: (persistedState) => {
    const state = persistedState as Partial<SceneStore>;

    const sprites = state.sprites ?? [];
    const objects = normalizeObjects((state.objects ?? []) as SceneObject[], (sprites ?? []) as SpriteAsset[]);

    const persistedSelectedId = (state.selectedId && objects.some((o) => o.id === state.selectedId))
      ? state.selectedId
      : null;

    return {
      ...state,
      sprites,
      sceneConfig: { ...DEFAULT_SCENE_CONFIG, ...(state.sceneConfig ?? {}) },
      objects,
      showGrid: state.showGrid ?? false,
      snapToGrid: state.snapToGrid ?? false,
      selectedId: persistedSelectedId,
      hitboxEditMode: false,
    } as Partial<SceneStore>;
  },
}));
