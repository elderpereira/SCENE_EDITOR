import localforage from 'localforage';
import type { StateStorage } from 'zustand/middleware';

const storage = localforage.createInstance({
  name: 'scene-editor',
  storeName: 'editor-projects',
});

export const editorStorage: StateStorage = {
  getItem: async (name) => {
    const value = await storage.getItem<string>(name);
    return value ?? null;
  },
  setItem: async (name, value) => {
    await storage.setItem(name, value);
  },
  removeItem: async (name) => {
    await storage.removeItem(name);
  },
};