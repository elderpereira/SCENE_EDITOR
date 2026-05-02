import styles from './App.module.css';
import { Toolbar } from './components/Toolbar/Toolbar';
import { SpritePanel } from './components/SpritePanel/SpritePanel';
import { SceneCanvas } from './components/SceneCanvas/SceneCanvas';
import { PropertiesPanel } from './components/PropertiesPanel/PropertiesPanel';
import { SceneHierarchy } from './components/SceneHierarchy/SceneHierarchy';
import { PhaserPreview } from './components/PhaserPreview/PhaserPreview';

export default function App() {
  const params = new URLSearchParams(window.location.search);

  if (params.get('preview') === 'phaser') {
    return <PhaserPreview />;
  }

  return (
    <div className={styles.app}>
      <div className={styles['toolbar-area']}>
        <Toolbar />
      </div>
      <div className={styles['left-area']}>
        <SpritePanel />
        <SceneHierarchy />
      </div>
      <div className={styles['canvas-area']}>
        <SceneCanvas />
      </div>
      <div className={styles['right-area']}>
        <PropertiesPanel />
      </div>
    </div>
  );
}
