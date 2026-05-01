import { useRef, useCallback, useEffect } from 'react';
import type Konva from 'konva';
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
  const hitboxEditMode = useSceneStore((s) => s.hitboxEditMode);
  const addHitboxPoint = useSceneStore((s) => s.addHitboxPoint);
  const selectedObject = objects.find((obj) => obj.id === selectedId) ?? null;

  const stageRef = useRef<Konva.Stage>(null);
  const scaleRef = useRef(1);
  // isPanning tracks middle-mouse / space+drag pan state
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const resetInteractions = useCallback(() => {
    isPanningRef.current = false;

    const stage = stageRef.current;
    if (!stage) return;

    stage.container().style.cursor = '';

    stage.find('Image').forEach((node) => {
      const draggableNode = node as Konva.Node & {
        isDragging?: () => boolean;
        stopDrag?: () => void;
      };

      if (draggableNode.isDragging?.()) {
        draggableNode.stopDrag?.();
      }
    });

    stage.find('Transformer').forEach((node) => {
      const transformerNode = node as Konva.Node & {
        isTransforming?: () => boolean;
        stopTransform?: () => void;
      };

      if (transformerNode.isTransforming?.()) {
        transformerNode.stopTransform?.();
      }
    });

    stage.batchDraw();
  }, []);

  // Delete key handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        resetInteractions();
        return;
      }

      if (!hitboxEditMode && (e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        removeObject(selectedId);
      }
    }

    function onPointerRelease() {
      resetInteractions();
    }

    function onWindowBlur() {
      resetInteractions();
    }

    function onVisibilityChange() {
      if (document.hidden) {
        resetInteractions();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mouseup', onPointerRelease);
    window.addEventListener('touchend', onPointerRelease);
    window.addEventListener('touchcancel', onPointerRelease);
    window.addEventListener('blur', onWindowBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mouseup', onPointerRelease);
      window.removeEventListener('touchend', onPointerRelease);
      window.removeEventListener('touchcancel', onPointerRelease);
      window.removeEventListener('blur', onWindowBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [hitboxEditMode, selectedId, removeObject, resetInteractions]);

  const handleWheel = useCallback((e: any) => {
    if (hitboxEditMode) return;
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
  }, [hitboxEditMode]);

  // Middle-mouse pan
  function handleMouseDown(e: any) {
    if (hitboxEditMode) return;
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      isPanningRef.current = true;
      lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = 'grabbing';
      }
    }
  }

  function handleMouseMove(e: any) {
    if (hitboxEditMode) return;
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
      resetInteractions();
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

  function stageToObjectLocal(point: { x: number; y: number }) {
    if (!selectedObject) return null;

    const sx = selectedObject.flipX ? -selectedObject.scaleX : selectedObject.scaleX;
    const sy = selectedObject.flipY ? -selectedObject.scaleY : selectedObject.scaleY;
    if (Math.abs(sx) < 0.0001 || Math.abs(sy) < 0.0001) return null;

    const dx = point.x - selectedObject.x;
    const dy = point.y - selectedObject.y;

    const angle = (-selectedObject.angle * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    return {
      x: rotatedX / sx,
      y: rotatedY / sy,
    };
  }

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
        onMouseLeave={resetInteractions}
        onTouchEnd={resetInteractions}
        onTouchCancel={resetInteractions}
        onClick={(e) => {
          if (hitboxEditMode && selectedObject?.hitboxMode === 'polygon') {
            const isCanvasClick = e.target === e.target.getStage() || e.target.name() === 'bg';
            if (isCanvasClick) {
              const stage = stageRef.current;
              const pointer = stage?.getPointerPosition();
              if (pointer) {
                const local = stageToObjectLocal(pointer);
                if (local) {
                  addHitboxPoint(selectedObject.id, local);
                }
              }
            }
            return;
          }

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
              hitboxEditMode={hitboxEditMode}
              onSelect={() => setSelectedId(obj.id)}
            />
          ))}
        </Layer>
      </Stage>
      <span className={styles.hint}>
        {hitboxEditMode
          ? 'Modo hitbox: clique no canvas para criar pontos, arraste os pontos e use Esc para sair.'
          : 'Scroll: zoom · Botão do meio: pan · Esc: cancelar interacao presa · Delete: remover selecionado · Snap via toggle na toolbar'}
      </span>
    </div>
  );
}
