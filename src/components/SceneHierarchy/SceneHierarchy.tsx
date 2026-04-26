import { useSceneStore } from '../../store/useSceneStore';
import styles from './SceneHierarchy.module.css';

export function SceneHierarchy() {
  const objects = useSceneStore((s) => s.objects);
  const selectedId = useSceneStore((s) => s.selectedId);
  const setSelectedId = useSceneStore((s) => s.setSelectedId);
  const moveObjectUp = useSceneStore((s) => s.moveObjectUp);
  const moveObjectDown = useSceneStore((s) => s.moveObjectDown);

  const sorted = [...objects].sort((a, b) => a.depth - b.depth);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        Hierarquia
        <span className={styles.count}>{objects.length}</span>
      </div>
      <div className={styles.list}>
        {sorted.length === 0 && (
          <p className={styles.empty}>Nenhum objeto na cena</p>
        )}
        {sorted.map((obj, idx) => (
          <div
            key={obj.id}
            className={`${styles.item} ${selectedId === obj.id ? styles.selected : ''}`}
            onClick={() => setSelectedId(obj.id)}
          >
            <span className={styles.icon}>🖼</span>
            <span className={styles.name}>{obj.name}</span>
            <span className={styles.depth}>d:{obj.depth}</span>
            <div className={styles.orderBtns} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.orderBtn}
                title="Subir camada"
                disabled={idx === 0}
                onClick={() => moveObjectUp(obj.id)}
              >▲</button>
              <button
                className={styles.orderBtn}
                title="Descer camada"
                disabled={idx === sorted.length - 1}
                onClick={() => moveObjectDown(obj.id)}
              >▼</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
