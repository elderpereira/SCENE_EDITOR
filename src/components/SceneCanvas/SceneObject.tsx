import { useRef, useEffect, useState } from 'react';
import { Circle, Group, Image as KonvaImage, Line, Rect, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { SceneObject as SceneObjectType, SpriteAsset } from '../../types/scene';
import { useSceneStore } from '../../store/useSceneStore';

const GRID_SIZE = 32;

interface Props {
  obj: SceneObjectType;
  sprites: SpriteAsset[];
  isSelected: boolean;
  hitboxEditMode: boolean;
  previewMode: boolean;
  onSelect: () => void;
}

export function SceneObject({ obj, sprites, isSelected, hitboxEditMode, previewMode, onSelect }: Props) {
  const updateObject = useSceneStore((s) => s.updateObject);
  const updateHitboxPoint = useSceneStore((s) => s.updateHitboxPoint);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const asset = sprites.find((s) => s.key === obj.spriteKey);
  const [image] = useImage(asset?.url ?? '', 'anonymous');

  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const hitboxPoints = obj.hitboxPoints ?? [];
  const isEditingPolygon = hitboxEditMode && obj.hitboxEnabled && obj.hitboxMode === 'polygon';
  const canManipulateObject = !obj.locked && !hitboxEditMode && !previewMode;
  const [isHovered, setIsHovered] = useState(false);
  const HOVER_SCALE = 1.06;

  useEffect(() => {
    if (!previewMode) {
      setIsHovered(false);
    }
  }, [previewMode, obj.id]);

  const hoverScale = previewMode && isHovered ? HOVER_SCALE : 1;
  const renderScaleX = (obj.flipX ? -obj.scaleX : obj.scaleX) * hoverScale;
  const renderScaleY = (obj.flipY ? -obj.scaleY : obj.scaleY) * hoverScale;

  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const polygonPointsFlat = hitboxPoints.flatMap((point) => [point.x, point.y]);

  useEffect(() => {
    if (isSelected && !hitboxEditMode && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [hitboxEditMode, isSelected]);

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={obj.x}
        y={obj.y}
        offsetX={(image?.width ?? 0) / 2}
        offsetY={(image?.height ?? 0) / 2}
        scaleX={renderScaleX}
        scaleY={renderScaleY}
        rotation={obj.angle}
        opacity={obj.alpha}
        draggable={canManipulateObject}
        listening={!obj.locked && !hitboxEditMode && !previewMode}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const nextX = snap(e.target.x());
          const nextY = snap(e.target.y());
          e.target.position({ x: nextX, y: nextY });
          updateObject(obj.id, {
            x: nextX,
            y: nextY,
          });
        }}
        onTransformEnd={(e) => {
          const node = e.target as Konva.Image;
          const scaleX = Math.abs(node.scaleX());
          const scaleY = Math.abs(node.scaleY());
          const nextX = snap(node.x());
          const nextY = snap(node.y());

          node.position({ x: nextX, y: nextY });
          updateObject(obj.id, {
            x: nextX,
            y: nextY,
            scaleX,
            scaleY,
            angle: node.rotation(),
          });
          node.scaleX(obj.flipX ? -scaleX : scaleX);
          node.scaleY(obj.flipY ? -scaleY : scaleY);
        }}
      />
      {(obj.hitboxEnabled && (isSelected || previewMode) && obj.hitboxMode === 'rect') && (() => {
        const stroke = previewMode ? '#ffcc00' : '#00d1ff';
        const fill = previewMode ? 'rgba(255,204,0,0.12)' : 'rgba(0, 209, 255, 0.12)';
        const strokeWidth = previewMode ? 2 : 1;

        if (previewMode) {
          const centerX = obj.hitboxOffsetX + obj.hitboxWidth / 2;
          const centerY = obj.hitboxOffsetY + obj.hitboxHeight / 2;
          return (
            <Group
              x={obj.x}
              y={obj.y}
              rotation={obj.angle}
              scaleX={obj.flipX ? -obj.scaleX : obj.scaleX}
              scaleY={obj.flipY ? -obj.scaleY : obj.scaleY}
              listening={false}
            >
              <Group
                x={centerX}
                y={centerY}
                listening={true}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Rect
                  x={-obj.hitboxWidth / 2}
                  y={-obj.hitboxHeight / 2}
                  width={obj.hitboxWidth}
                  height={obj.hitboxHeight}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  fill={fill}
                />
              </Group>
            </Group>
          );
        }

        return (
          <Group
            x={obj.x}
            y={obj.y}
            rotation={obj.angle}
            scaleX={obj.flipX ? -obj.scaleX : obj.scaleX}
            scaleY={obj.flipY ? -obj.scaleY : obj.scaleY}
            listening={false}
          >
            <Rect
              x={obj.hitboxOffsetX}
              y={obj.hitboxOffsetY}
              width={obj.hitboxWidth}
              height={obj.hitboxHeight}
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={[6, 4]}
              fill={fill}
            />
          </Group>
        );
      })()}

      {(obj.hitboxEnabled && (isSelected || previewMode) && obj.hitboxMode === 'polygon' && hitboxPoints.length > 0) && (() => {
        const stroke = previewMode ? '#ffcc00' : '#00d1ff';
        const fill = previewMode ? 'rgba(255,204,0,0.12)' : (hitboxPoints.length >= 3 ? 'rgba(0, 209, 255, 0.12)' : undefined);
        const strokeWidth = previewMode ? 2 : 2;

        if (previewMode) {
          const cx = hitboxPoints.reduce((acc, p) => acc + p.x, 0) / hitboxPoints.length;
          const cy = hitboxPoints.reduce((acc, p) => acc + p.y, 0) / hitboxPoints.length;
          const relPoints = hitboxPoints.flatMap((p) => [p.x - cx, p.y - cy]);

          return (
            <Group
              x={obj.x}
              y={obj.y}
              rotation={obj.angle}
              scaleX={obj.flipX ? -obj.scaleX : obj.scaleX}
              scaleY={obj.flipY ? -obj.scaleY : obj.scaleY}
              listening={false}
            >
              <Group
                x={cx}
                y={cy}
                listening={true}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <Line
                  points={relPoints}
                  closed={hitboxPoints.length >= 3}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  dash={[6, 4]}
                  fill={fill}
                />
              </Group>
            </Group>
          );
        }

        return (
          <Group
            x={obj.x}
            y={obj.y}
            rotation={obj.angle}
            scaleX={obj.flipX ? -obj.scaleX : obj.scaleX}
            scaleY={obj.flipY ? -obj.scaleY : obj.scaleY}
            listening={false}
          >
            <Line
              points={polygonPointsFlat}
              closed={hitboxPoints.length >= 3}
              stroke={stroke}
              strokeWidth={2}
              dash={[6, 4]}
              fill={fill}
            />
          </Group>
        );
      })()}

      {isSelected && isEditingPolygon && (
        <Group
          x={obj.x}
          y={obj.y}
          rotation={obj.angle}
          scaleX={obj.flipX ? -obj.scaleX : obj.scaleX}
          scaleY={obj.flipY ? -obj.scaleY : obj.scaleY}
        >
          {hitboxPoints.map((point, index) => (
            <Group key={`${obj.id}-hitbox-point-${index}`}>
              <Circle
                x={point.x}
                y={point.y}
                radius={6}
                fill="#00d1ff"
                stroke="#ffffff"
                strokeWidth={1}
                draggable
                onDragMove={(e) => {
                  updateHitboxPoint(obj.id, index, {
                    x: e.target.x(),
                    y: e.target.y(),
                  });
                }}
              />
              <Text
                x={point.x + 8}
                y={point.y - 8}
                text={String(index + 1)}
                fontSize={10}
                fill="#ffffff"
                listening={false}
              />
            </Group>
          ))}
        </Group>
      )}

      {isSelected && !obj.locked && !hitboxEditMode && (
        <Transformer
          ref={trRef}
          rotateEnabled
          borderStroke="#7c4dff"
          anchorFill="#7c4dff"
          anchorStroke="#fff"
          anchorSize={8}
          keepRatio={false}
        />
      )}
    </>
  );

}
