import { useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import { useSceneStore } from '../../store/useSceneStore';
import { SceneObject } from './SceneObject';
import styles from './SceneCanvas.module.css';

const GRID_SIZE = 32;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

export function SceneCanvas() {
  const sceneConfig = useSceneStore((s) => s.sceneConfig);
  const objects = useSceneStore((s) => s.objects);
  const sprites = useSceneStore((s) => s.sprites);
  const selectedId = useSceneStore((s) => s.selectedId);
  const setSelectedId = useSceneStore((s) => s.setSelectedId);
  const removeObject = useSceneStore((s) => s.removeObject);
  const showGrid = useSceneStore((s) => s.showGrid);

  const stageRef = useRef<any>(null);
  const scaleRef = useRef(1);
  // isPanning tracks middle-mouse / space+drag pan state
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Delete key handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        removeObject(selectedId);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, removeObject]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scaleRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const factor = 1.08;
    const newScale = direction > 0
      ? Math.min(oldScale * factor, MAX_SCALE)
      : Math.max(oldScale / factor, MIN_SCALE);

    scaleRef.current = newScale;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.scale({ x: newScale, y: newScale });
    stage.position(newPos);
  }, []);

  // Middle-mouse pan
  function handleMouseDown(e: any) {
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      isPanningRef.current = true;
      lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
    }
  }

  function handleMouseMove(e: any) {
    if (!isPanningRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const dx = e.evt.clientX - lastPosRef.current.x;
    const dy = e.evt.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
    stage.position({ x: stage.x() + dx, y: stage.y() + dy });
  }

  function handleMouseUp(e: any) {
    if (e.evt.button === 1) {
      isPanningRef.current = false;
    }
  }

  // Build grid lines
  const gridLines: JSX.Element[] = [];
  if (showGrid) {
    for (let x = 0; x <= sceneConfig.width; x += GRID_SIZE) {
      gridLines.push(
        <Line
          key={`vg-${x}`}
          points={[x, 0, x, sceneConfig.height]}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          listening={false}
        />
      );
    }
    for (let y = 0; y <= sceneConfig.height; y += GRID_SIZE) {
      gridLines.push(
        <Line
          key={`hg-${y}`}
          points={[0, y, sceneConfig.width, y]}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
          listening={false}
        />
      );
    }
  }

  // Sort objects by depth
  const sortedObjects = [...objects].sort((a, b) => a.depth - b.depth);

  return (
    <div className={styles.wrapper}>
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 52}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === 'bg') {
            setSelectedId(null);
          }
        }}
      >
        <Layer>
          {/* Scene background */}
          <Rect
            name="bg"
            x={0}
            y={0}
            width={sceneConfig.width}
            height={sceneConfig.height}
            fill={sceneConfig.background}
            onClick={() => setSelectedId(null)}
          />

          {/* Grid */}
          {gridLines}

          {/* Scene border */}
          <Rect
            x={0}
            y={0}
            width={sceneConfig.width}
            height={sceneConfig.height}
            stroke="rgba(124,77,255,0.4)"
            strokeWidth={1}
            listening={false}
            fill="transparent"
          />

          {/* Objects */}
          {sortedObjects.map((obj) => (
            <SceneObject
              key={obj.id}
              obj={obj}
              sprites={sprites}
              isSelected={selectedId === obj.id}
              onSelect={() => setSelectedId(obj.id)}
            />
          ))}
        </Layer>
      </Stage>
      <span className={styles.hint}>Scroll: zoom · Botão do meio: pan · Delete: remover selecionado · Snap via toggle na toolbar</span>
    </div>
  );
}
