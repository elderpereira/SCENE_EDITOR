import { useState } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import styles from './PropertiesPanel.module.css';

function NumField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function PropertiesPanel() {
  const selectedId = useSceneStore((s) => s.selectedId);
  const objects = useSceneStore((s) => s.objects);
  const sprites = useSceneStore((s) => s.sprites);
  const updateObject = useSceneStore((s) => s.updateObject);
  const removeObject = useSceneStore((s) => s.removeObject);
  const duplicateObject = useSceneStore((s) => s.duplicateObject);
  const arrangeObjectsInRow = useSceneStore((s) => s.arrangeObjectsInRow);
  const [rowGap, setRowGap] = useState(8);

  const obj = objects.find((o) => o.id === selectedId);

  if (!obj) {
    return (
      <div className={styles.panel}>
        <div className={styles.header}>Propriedades</div>
        <p className={styles.empty}>Selecione um objeto na cena</p>
      </div>
    );
  }

  const upd = (changes: Parameters<typeof updateObject>[1]) =>
    updateObject(obj.id, changes);

  const sprite = sprites.find((s) => s.key === obj.spriteKey);
  const sourceWidth = sprite?.width ?? 1;
  const sourceHeight = sprite?.height ?? 1;
  const objectWidth = Math.round(sourceWidth * Math.abs(obj.scaleX));
  const objectHeight = Math.round(sourceHeight * Math.abs(obj.scaleY));

  return (
    <div className={styles.panel}>
      <div className={styles.header}>Propriedades</div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Identificação</div>
        <div className={styles.field}>
          <label>Nome</label>
          <input
            type="text"
            value={obj.name}
            onChange={(e) => upd({ name: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Descrição / Comentário</label>
          <textarea
            className={styles.descriptionInput}
            value={obj.description}
            rows={3}
            placeholder="Regra de negócio, observação, instrução..."
            onChange={(e) => upd({ description: e.target.value })}
          />
        </div>
        <div className={styles.field}>
          <label>Sprite Key</label>
          <div className={styles.readOnly}>{obj.spriteKey}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Posição</div>
        <div className={styles.row}>
          <NumField label="X" value={Math.round(obj.x)} onChange={(v) => upd({ x: v })} />
          <NumField label="Y" value={Math.round(obj.y)} onChange={(v) => upd({ y: v })} />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Escala</div>
        <div className={styles.row}>
          <NumField label="Scale X" value={obj.scaleX} step={0.1} min={0.01} onChange={(v) => upd({ scaleX: v })} />
          <NumField label="Scale Y" value={obj.scaleY} step={0.1} min={0.01} onChange={(v) => upd({ scaleY: v })} />
        </div>
        <div className={styles.row}>
          <NumField
            label="Largura"
            value={objectWidth}
            min={1}
            onChange={(v) => upd({ scaleX: Math.max(0.01, v / sourceWidth) })}
          />
          <NumField
            label="Altura"
            value={objectHeight}
            min={1}
            onChange={(v) => upd({ scaleY: Math.max(0.01, v / sourceHeight) })}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Transformação</div>
        <NumField label="Ângulo (graus)" value={obj.angle} step={1} onChange={(v) => upd({ angle: v })} />
        <NumField label="Depth (z-index)" value={obj.depth} step={1} onChange={(v) => upd({ depth: v })} />
        <NumField label="Alpha (0–1)" value={obj.alpha} step={0.05} min={0} max={1} onChange={(v) => upd({ alpha: v })} />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Espelho</div>
        <div className={styles.checkRow}>
          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={obj.flipX}
              onChange={(e) => upd({ flipX: e.target.checked })}
            />
            Flip X
          </label>
          <label className={styles.checkField}>
            <input
              type="checkbox"
              checked={obj.flipY}
              onChange={(e) => upd({ flipY: e.target.checked })}
            />
            Flip Y
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Ações Rápidas</div>
        <div className={styles.actionsRow}>
          <button className="secondary" onClick={() => duplicateObject(obj.id)}>
            Duplicar
          </button>
          <button className="secondary" onClick={() => upd({ scaleX: 1, scaleY: 1 })}>
            Tamanho Original
          </button>
        </div>
        <div className={styles.actionsRow}>
          <div className={styles.gapField}>
            <label>Gap linha</label>
            <input
              type="number"
              min={0}
              step={1}
              value={rowGap}
              onChange={(e) => setRowGap(Number(e.target.value))}
            />
          </div>
          <button className="secondary" onClick={() => arrangeObjectsInRow(rowGap)}>
            Lado a lado
          </button>
        </div>
      </div>

      <button
        className={`${styles.removeBtn} danger`}
        onClick={() => removeObject(obj.id)}
      >
        🗑 Remover objeto
      </button>
    </div>
  );
}
