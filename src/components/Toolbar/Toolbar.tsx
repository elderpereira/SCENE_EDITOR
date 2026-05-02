import { useRef } from 'react';
import { useSceneStore } from '../../store/useSceneStore';
import { exportScene, exportSceneZip } from '../../utils/exportScene';
import { buildProjectData, downloadProjectFile, readProjectFile } from '../../utils/projectFile';
import { savePreviewScene } from '../../utils/previewScene';
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
  const previewMode = useSceneStore((s) => s.previewMode);
  const setPreviewMode = useSceneStore((s) => s.setPreviewMode);
  const loadProject = useSceneStore((s) => s.loadProject);
  const inputRef = useRef<HTMLInputElement>(null);

  const saveProject = () => {
    const data = buildProjectData(sceneConfig, objects, sprites, showGrid, snapToGrid);
    downloadProjectFile(data);
  };

  const openProjectPicker = () => inputRef.current?.click();

  const handleProjectFile = async (files: FileList | null) => {
    if (!files?.length) return;

    try {
      const project = await readProjectFile(files[0]);
      loadProject(project);
    } catch {
      window.alert('Nao foi possivel abrir esse arquivo de projeto.');
    } finally {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>⚡ Scene Editor</span>

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className={styles.hiddenInput}
        onChange={(e) => {
          void handleProjectFile(e.target.files);
        }}
      />

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

      <button
        className={previewMode ? 'primary' : 'secondary'}
        onClick={() => setPreviewMode(!previewMode)}
        title="Mostrar hitboxes no editor"
      >
        Ver hitbox
      </button>

      <button
        className="secondary"
        onClick={() => {
          const data = { sceneConfig, objects, sprites };
          savePreviewScene(data);

          const previewUrl = `${window.location.origin}${window.location.pathname}?preview=phaser`;
          const previewWindow = window.open(previewUrl, '_blank');

          if (previewWindow) {
            setTimeout(() => {
              previewWindow.postMessage({ type: 'phaser-preview', data }, window.location.origin);
            }, 200);
          }
        }}
        title="Abrir preview Phaser em nova aba"
      >
        ▶ Teste Phaser
      </button>

      <button className="secondary" onClick={openProjectPicker} title="Abrir projeto salvo em arquivo JSON">
        📂 Abrir Projeto
      </button>
      <button className="secondary" onClick={saveProject} title="Baixar um arquivo do projeto atual">
        💾 Salvar Projeto
      </button>
      <button className="secondary" onClick={() => exportScene(sceneConfig, objects, sprites)}>
        ⬇ Exportar JSON
      </button>
      <button className="secondary" onClick={() => exportSceneZip(sceneConfig, objects, sprites)} title="Exporta um ZIP que inclui assets, scene.json e um preview Phaser standalone">
        📦 Exportar ZIP Phaser
      </button>
    </div>
  );
}
