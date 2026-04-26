import { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { SceneObject as SceneObjectType, SpriteAsset } from '../../types/scene';
import { useSceneStore } from '../../store/useSceneStore';

const GRID_SIZE = 32;

interface Props {
  obj: SceneObjectType;
  sprites: SpriteAsset[];
  isSelected: boolean;
  onSelect: () => void;
}

export function SceneObject({ obj, sprites, isSelected, onSelect }: Props) {
  const updateObject = useSceneStore((s) => s.updateObject);
  const snapToGrid = useSceneStore((s) => s.snapToGrid);
  const asset = sprites.find((s) => s.key === obj.spriteKey);
  const [image] = useImage(asset?.url ?? '', 'anonymous');

  const imageRef = useRef<Konva.Image>(null);
  const trRef = useRef<Konva.Transformer>(null);

  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={obj.x}
        y={obj.y}
        offsetX={(image?.width ?? 0) / 2}
        offsetY={(image?.height ?? 0) / 2}
        scaleX={obj.flipX ? -obj.scaleX : obj.scaleX}
        scaleY={obj.flipY ? -obj.scaleY : obj.scaleY}
        rotation={obj.angle}
        opacity={obj.alpha}
        draggable
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
      {isSelected && (
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
