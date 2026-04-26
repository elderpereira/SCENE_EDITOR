import { useSceneStore } from '../../store/useSceneStore';
import { exportScene, exportSceneZip } from '../../utils/exportScene';
import styles from './Toolbar.module.css';

export function Toolbar() {
  const sceneConfig = useSceneStore((s) => s.sceneConfig);
  const updateSceneConfig = useSceneStore((s) => s.updateSceneConfig);
  const objects = useSceneStore((s) => s.objects);
  const sprites = useSceneStore((s) => s.sprites);
  const showGrid = useSceneStore((s) => s.showGrid);
  const toggleGrid = useSceneStore((s) => s.toggleGrid);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useSceneStore((s) => s.toggleSnapToGrid);

  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>⚡ Scene Editor</span>

      <div className={styles.separator} />

      <div className={styles.group}>
        <label>Cena</label>
        <input
          type="text"
          value={sceneConfig.key}
          onChange={(e) => updateSceneConfig({ key: e.target.value })}
          placeholder="Nome da cena"
        />
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <label>W</label>
        <input
          type="number"
          value={sceneConfig.width}
          min={100}
          onChange={(e) => updateSceneConfig({ width: Number(e.target.value) })}
        />
        <label>H</label>
        <input
          type="number"
          value={sceneConfig.height}
          min={100}
          onChange={(e) => updateSceneConfig({ height: Number(e.target.value) })}
        />
      </div>

      <div className={styles.separator} />

      <div className={styles.group}>
        <label>BG</label>
        <input
          type="color"
          value={sceneConfig.background}
          onChange={(e) => updateSceneConfig({ background: e.target.value })}
        />
      </div>

      <label className={styles.gridToggle}>
        <input
          type="checkbox"
          checked={showGrid}
          onChange={toggleGrid}
        />
        Grid
      </label>

      <label className={styles.gridToggle}>
        <input
          type="checkbox"
          checked={snapToGrid}
          onChange={toggleSnapToGrid}
        />
        Snap
      </label>

      <div className={styles.spacer} />

      <button className="secondary" onClick={() => exportScene(sceneConfig, objects, sprites)}>
        ⬇ Exportar JSON
      </button>
      <button onClick={() => exportSceneZip(sceneConfig, objects, sprites)}>
        📦 Exportar ZIP
      </button>
    </div>
  );
}
