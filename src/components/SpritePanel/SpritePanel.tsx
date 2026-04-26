import { useRef } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import type { SpriteAsset } from '../../types/scene';
import { toUniqueSnakeCase } from '../../utils/snakeCase';
import { SpriteItem } from './SpriteItem';
import styles from './SpritePanel.module.css';

export function SpritePanel() {
  const sprites = useSceneStore((s) => s.sprites);
  const addSprite = useSceneStore((s) => s.addSprite);
  const removeSprite = useSceneStore((s) => s.removeSprite);
  const renameSprite = useSceneStore((s) => s.renameSprite);
  const addObject = useSceneStore((s) => s.addObject);
  const sceneConfig = useSceneStore((s) => s.sceneConfig);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const baseName = file.name.replace(/\.[^.]+$/, '');
        const key = toUniqueSnakeCase(baseName, sprites.map((s) => s.key));
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
        const sprite: SpriteAsset = {
          key,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          ext,
        };
        addSprite(sprite);
      };
      img.src = url;
    });
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
        onChange={(e) => handleFiles(e.target.files)}
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
