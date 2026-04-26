import { useEffect, useState } from 'react';
import type { SpriteAsset } from '../../types/scene';
import { toUniqueSnakeCase } from '../../utils/snakeCase';
import styles from './SpriteItem.module.css';

interface Props {
  sprite: SpriteAsset;
  onClick: () => void;
  onRemove: () => void;
  onRename: (newKey: string) => void;
  usedKeys: string[];
}

export function SpriteItem({ sprite, onClick, onRemove, onRename, usedKeys }: Props) {
  const [draftKey, setDraftKey] = useState(sprite.key);

  useEffect(() => {
    setDraftKey(sprite.key);
  }, [sprite.key]);

  function commitKeyChange() {
    const otherKeys = usedKeys.filter((k) => k !== sprite.key);
    const normalized = toUniqueSnakeCase(draftKey, otherKeys);
    setDraftKey(normalized);
    if (normalized !== sprite.key) {
      onRename(normalized);
    }
  }

  return (
    <div className={styles.item} onClick={onClick} title="Clique para adicionar à cena">
      <img className={styles.thumb} src={sprite.url} alt={sprite.key} />
      <div className={styles.info}>
        <input
          className={styles.keyInput}
          value={draftKey}
          onChange={(e) => setDraftKey(e.target.value)}
          onBlur={commitKeyChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          title="Nome do sprite (snake_case)"
        />
        <div className={styles.dims}>{sprite.width}×{sprite.height}</div>
      </div>
      <button
        className={styles.removeBtn}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remover sprite"
      >
        ✕
      </button>
    </div>
  );
}
