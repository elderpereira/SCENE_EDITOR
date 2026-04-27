import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EditorProjectData, SceneConfig, SceneObject, SpriteAsset } from '../types/scene';
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

function normalizeObjects(objects: SceneObject[]): SceneObject[] {
  return objects.map((obj) => ({
    ...obj,
    locked: obj.locked ?? false,
  }));
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

  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
  loadProject: (project) =>
    set({
      sprites: project.sprites,
      sceneConfig: { ...DEFAULT_SCENE_CONFIG, ...project.sceneConfig },
      objects: normalizeObjects(project.objects),
      selectedId: null,
      showGrid: project.showGrid,
      snapToGrid: project.snapToGrid,
    }),

  showGrid: false,
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  snapToGrid: false,
  toggleSnapToGrid: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
}), {
  name: STORAGE_KEY,
  version: 1,
  storage: createJSONStorage(() => editorStorage),
  partialize: (state) => ({
    sprites: state.sprites,
    sceneConfig: state.sceneConfig,
    objects: state.objects,
    showGrid: state.showGrid,
    snapToGrid: state.snapToGrid,
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

    return {
      ...state,
      sprites: state.sprites ?? [],
      sceneConfig: { ...DEFAULT_SCENE_CONFIG, ...(state.sceneConfig ?? {}) },
      objects: normalizeObjects((state.objects ?? []) as SceneObject[]),
      showGrid: state.showGrid ?? false,
      snapToGrid: state.snapToGrid ?? false,
      selectedId: null,
    } as Partial<SceneStore>;
  },
}));
