import { useEffect, useRef, useState } from 'react';
import { loadPreviewScene, savePreviewScene } from '../../utils/previewScene';
import styles from './PhaserPreview.module.css';

export function PhaserPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let game: any = null;
    let destroyed = false;
    let fallbackTimer: number | null = null;
    let messageListener: EventListener | null = null;

    const clearFallback = () => {
      if (fallbackTimer !== null) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const removeMessageListener = () => {
      if (messageListener) {
        window.removeEventListener('message', messageListener);
        messageListener = null;
      }
    };

    const createGame = async (sceneData: any) => {
      const Phaser = await import('phaser');
      if (destroyed) return;

      class PreviewScene extends Phaser.Scene {
        constructor() {
          super('preview-scene');
        }

        preload() {
          sceneData.sprites.forEach((sprite: any) => {
            this.load.image(sprite.key, sprite.url);
          });
        }

        create() {
          const { sceneConfig, objects } = sceneData;
          this.cameras.main.setBackgroundColor(
            Phaser.Display.Color.HexStringToColor(sceneConfig.background).color
          );

          const sortedObjects = [...objects].sort((a, b) => a.depth - b.depth);

          sortedObjects.forEach((obj: any) => {
            // As hitboxes são definidas em coordenadas locais do objeto.
            // Por isso é importante agrupar o sprite e o hitbox no mesmo container,
            // aplicando escala/rotação/flip ao container e não apenas ao sprite.
            // Caso contrário, o sprite pode ser escalado corretamente enquanto a
            // hitbox permanece no tamanho original da área local e aparece maior.
            const objectContainer = this.add.container(obj.x, obj.y);
            objectContainer.rotation = Phaser.Math.DegToRad(obj.angle);
            const baseScaleX = obj.flipX ? -obj.scaleX : obj.scaleX;
            const baseScaleY = obj.flipY ? -obj.scaleY : obj.scaleY;
            objectContainer.setScale(baseScaleX, baseScaleY);

            const sprite = this.add.image(0, 0, obj.spriteKey).setOrigin(0.5, 0.5);
            sprite.setScale(1, 1);
            sprite.setAlpha(obj.alpha);
            objectContainer.add(sprite);

            if (obj.hitboxEnabled) {
              const hitboxGraphics = this.add.graphics();
              hitboxGraphics.lineStyle(2, 0xffcc00, 1);
              hitboxGraphics.fillStyle(0xffcc00, 0.12);

              if (obj.hitboxMode === 'polygon' && obj.hitboxPoints?.length >= 3) {
                const points = obj.hitboxPoints.map((point: any) => new Phaser.Math.Vector2(point.x, point.y));
                hitboxGraphics.fillPoints(points, true);
                hitboxGraphics.strokePoints(points, true);
                const polygon = new Phaser.Geom.Polygon(
                  obj.hitboxPoints.flatMap((point: any) => [point.x, point.y])
                );
                hitboxGraphics.setInteractive(polygon, Phaser.Geom.Polygon.Contains);
              } else {
                hitboxGraphics.fillRect(
                  obj.hitboxOffsetX,
                  obj.hitboxOffsetY,
                  obj.hitboxWidth,
                  obj.hitboxHeight
                );
                hitboxGraphics.strokeRect(
                  obj.hitboxOffsetX,
                  obj.hitboxOffsetY,
                  obj.hitboxWidth,
                  obj.hitboxHeight
                );
                const rect = new Phaser.Geom.Rectangle(
                  obj.hitboxOffsetX,
                  obj.hitboxOffsetY,
                  obj.hitboxWidth,
                  obj.hitboxHeight
                );
                hitboxGraphics.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
              }

              const HOVER_SCALE = 1.05;
              hitboxGraphics.on('pointerover', () => {
                objectContainer.setScale(baseScaleX * HOVER_SCALE, baseScaleY * HOVER_SCALE);
              });

              hitboxGraphics.on('pointerout', () => {
                objectContainer.setScale(baseScaleX, baseScaleY);
              });

              objectContainer.add(hitboxGraphics);
            }
          });
        }
      }

      const gameConfig = {
        type: Phaser.AUTO,
        parent: containerRef.current ?? undefined,
        width: sceneData.sceneConfig.width,
        height: sceneData.sceneConfig.height,
        backgroundColor: Phaser.Display.Color.HexStringToColor(sceneData.sceneConfig.background).color,
        scene: PreviewScene,
      };

      game = new Phaser.Game(gameConfig);
    };

    const initialize = async () => {
      const cachedData = loadPreviewScene();
      if (cachedData) {
        await createGame(cachedData);
        return;
      }

      setError(null);

      messageListener = async (event: Event) => {
        const messageEvent = event as MessageEvent;
        if (messageEvent.origin !== window.location.origin) return;
        if (!messageEvent.data || messageEvent.data.type !== 'phaser-preview') return;

        removeMessageListener();
        clearFallback();
        savePreviewScene(messageEvent.data.data);
        await createGame(messageEvent.data.data);
      };

      window.addEventListener('message', messageListener);

      fallbackTimer = window.setTimeout(() => {
        removeMessageListener();
        setError(
          'Nenhum projeto encontrado para visualização Phaser. Volte ao editor e clique em Teste novamente.'
        );
      }, 1000);
    };

    void initialize();

    return () => {
      destroyed = true;
      if (game) {
        game.destroy(true);
      }
      clearFallback();
      removeMessageListener();
    };
  }, []);

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.title}>Phaser Preview</div>
        <div className={styles.info}>Passe o mouse sobre a hitbox para ampliar o objeto em 5%.</div>
      </div>
      {error ? (
        <div className={styles.message}>{error}</div>
      ) : (
        <div className={styles.canvasWrapper}>
          <div ref={containerRef} className={styles.previewContainer} />
        </div>
      )}
    </div>
  );
}
