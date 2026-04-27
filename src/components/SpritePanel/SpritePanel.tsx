import { useRef } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { SpriteAsset } from '../../types/scene';
import { toUniqueSnakeCase } from '../../utils/snakeCase';
import { SpriteItem } from './SpriteItem';
import styles from './SpritePanel.module.css';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

function getImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = url;
  });
}

export function SpritePanel() {
  const sprites = useSceneStore((s) => s.sprites);
  const addSprite = useSceneStore((s) => s.addSprite);
  const removeSprite = useSceneStore((s) => s.removeSprite);
  const renameSprite = useSceneStore((s) => s.renameSprite);
  const addObject = useSceneStore((s) => s.addObject);
  const sceneConfig = useSceneStore((s) => s.sceneConfig);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const usedKeys = new Set(sprites.map((sprite) => sprite.key));

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) return;
      const url = await readFileAsDataUrl(file);
      const { width, height } = await getImageSize(url);
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const key = toUniqueSnakeCase(baseName, Array.from(usedKeys));
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const sprite: SpriteAsset = {
        key,
        url,
        width,
        height,
        ext,
      };

      usedKeys.add(key);
      addSprite(sprite);
    }

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span>Sprites</span>
        <button className={styles.uploadBtn} onClick={() => inputRef.current?.click()}>
          + Upload
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          void handleFiles(e.target.files);
        }}
      />

      <div className={styles.list}>
        {sprites.length === 0 && (
          <p className={styles.empty}>Nenhum sprite carregado.<br />Clique em "+ Upload"</p>
        )}
        {sprites.map((sprite) => (
          <SpriteItem
            key={sprite.key}
            sprite={sprite}
            onClick={() => addObject(sprite.key, sprites, sceneConfig)}
            onRemove={() => removeSprite(sprite.key)}
            onRename={(newKey) => renameSprite(sprite.key, newKey)}
            usedKeys={sprites.map((s) => s.key)}
          />
        ))}
      </div>
    </div>
  );
}
