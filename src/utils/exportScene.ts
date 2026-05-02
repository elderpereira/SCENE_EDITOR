import JSZip from 'jszip';
import type { SceneConfig, SceneObject, SpriteAsset } from '../types/scene';

function buildSceneData(config: SceneConfig, objects: SceneObject[], sprites: SpriteAsset[]) {
	return {
		scene: {
			key: config.key,
			width: config.width,
			height: config.height,
			background: config.background,
		},
		assets: sprites.map((s) => ({
			key: s.key,
			path: `assets/${s.key}.${s.ext}`,
		})),
		gameObjects: objects
			.slice()
			.sort((a, b) => a.depth - b.depth)
			.map((obj) => ({
				id: obj.id,
				name: obj.name,
				description: obj.description,
				type: obj.type,
				spriteKey: obj.spriteKey,
				x: Math.round(obj.x),
				y: Math.round(obj.y),
				scaleX: obj.scaleX,
				scaleY: obj.scaleY,
				angle: obj.angle,
				depth: obj.depth,
				alpha: obj.alpha,
				flipX: obj.flipX,
				flipY: obj.flipY,
				hitbox: {
					enabled: obj.hitboxEnabled,
					mode: obj.hitboxMode,
					offsetX: Math.round(obj.hitboxOffsetX),
					offsetY: Math.round(obj.hitboxOffsetY),
					width: Math.round(obj.hitboxWidth),
					height: Math.round(obj.hitboxHeight),
					points: obj.hitboxPoints.map((point) => ({
						x: Math.round(point.x),
						y: Math.round(point.y),
					})),
				},
			})),
	};
}

function triggerDownload(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function buildPhaserPreviewHtml() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0" />
	<title>Phaser Scene Preview</title>
	<style>
		html, body { margin: 0; width: 100vw; height: 100vh; background: #13131a; color: #fff; }
		body { display: flex; align-items: center; justify-content: center; overflow: hidden; }
		#game { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
	</style>
</head>
<body>
	<div id="game"></div>
	<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"></script>
	<script src="preview.js"></script>
</body>
</html>`;
}

function buildPhaserPreviewScript(data: unknown) {
	return `const sceneData = ${JSON.stringify(data, null, 2)};

class PreviewScene extends Phaser.Scene {
	constructor() {
		super('preview-scene');
	}

	preload() {
		sceneData.assets.forEach((asset) => {
			this.load.image(asset.key, asset.path);
		});
	}

	create() {
		this.cameras.main.setBackgroundColor(
			Phaser.Display.Color.HexStringToColor(sceneData.scene.background).color
		);

		const sortedObjects = [...sceneData.gameObjects].sort((a, b) => a.depth - b.depth);

		sortedObjects.forEach((obj) => {
			const objectContainer = this.add.container(obj.x, obj.y);
			objectContainer.rotation = Phaser.Math.DegToRad(obj.angle);

			const baseScaleX = obj.flipX ? -obj.scaleX : obj.scaleX;
			const baseScaleY = obj.flipY ? -obj.scaleY : obj.scaleY;
			objectContainer.setScale(baseScaleX, baseScaleY);

			const sprite = this.add.image(0, 0, obj.spriteKey).setOrigin(0.5, 0.5);
			sprite.setScale(1, 1);
			sprite.setAlpha(obj.alpha);
			objectContainer.add(sprite);

			if (obj.hitbox?.enabled) {
				const hitboxGraphics = this.add.graphics();
				hitboxGraphics.lineStyle(2, 0xffcc00, 1);
				hitboxGraphics.fillStyle(0xffcc00, 0.12);

				if (obj.hitbox.mode === 'polygon' && obj.hitbox.points?.length >= 3) {
					const points = obj.hitbox.points.map((point) => new Phaser.Math.Vector2(point.x, point.y));
					hitboxGraphics.fillPoints(points, true);
					hitboxGraphics.strokePoints(points, true);
					const polygon = new Phaser.Geom.Polygon(obj.hitbox.points.flatMap((point) => [point.x, point.y]));
					hitboxGraphics.setInteractive(polygon, Phaser.Geom.Polygon.Contains);
				} else {
					hitboxGraphics.fillRect(
					obj.hitbox.offsetX,
					obj.hitbox.offsetY,
					obj.hitbox.width,
					obj.hitbox.height
				);
					hitboxGraphics.strokeRect(
					obj.hitbox.offsetX,
					obj.hitbox.offsetY,
					obj.hitbox.width,
					obj.hitbox.height
				);
					const rect = new Phaser.Geom.Rectangle(
					obj.hitbox.offsetX,
					obj.hitbox.offsetY,
					obj.hitbox.width,
					obj.hitbox.height
					);
					hitboxGraphics.setInteractive(rect, Phaser.Geom.Rectangle.Contains);
				}

				hitboxGraphics.on('pointerover', () => {
					objectContainer.setScale(baseScaleX * 1.05, baseScaleY * 1.05);
				});

				hitboxGraphics.on('pointerout', () => {
					objectContainer.setScale(baseScaleX, baseScaleY);
				});

				objectContainer.add(hitboxGraphics);
			}
		});
	}
}

const config = {
	type: Phaser.AUTO,
	parent: 'game',
	scale: {
		mode: Phaser.Scale.NONE,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: sceneData.scene.width,
		height: sceneData.scene.height,
	},
	backgroundColor: Phaser.Display.Color.HexStringToColor(sceneData.scene.background).color,
	scene: PreviewScene,
};

new Phaser.Game(config);
`;
}

export function exportScene(config: SceneConfig, objects: SceneObject[], sprites: SpriteAsset[]): void {
	const data = buildSceneData(config, objects, sprites);
	const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
	triggerDownload(blob, `${config.key || 'scene'}.json`);
}

export async function exportSceneZip(
	config: SceneConfig,
	objects: SceneObject[],
	sprites: SpriteAsset[]
): Promise<void> {
	const zip = new JSZip();
	const root = zip.folder(config.key || 'scene')!;
	const assetsFolder = root.folder('assets')!;

	for (const sprite of sprites) {
		const response = await fetch(sprite.url);
		const blob = await response.blob();
		assetsFolder.file(`${sprite.key}.${sprite.ext}`, blob);
	}

	// incluir o arquivo de skill Markdown (se presente no repositório) na raiz do ZIP
	try {
		const skillUrl = new URL('../../skills/PHASER_SCENE_EDITOR_SKILL.md', import.meta.url);
		const skillResp = await fetch(skillUrl.href);
		if (skillResp && skillResp.ok) {
			const skillText = await skillResp.text();
			root.file('PHASER_SCENE_EDITOR_SKILL.md', skillText);
		}
	} catch {
		// ignorar falhas — não é crítico
	}

	const data = buildSceneData(config, objects, sprites);
	root.file('scene.json', JSON.stringify(data, null, 2));
	root.file('index.html', buildPhaserPreviewHtml());
	root.file('preview.js', buildPhaserPreviewScript(data));

	const preloadLines = sprites
		.map((s) => `    this.load.image('${s.key}', 'assets/${s.key}.${s.ext}');`)
		.join('\n');
	const createLines = objects
		.slice()
		.sort((a, b) => a.depth - b.depth)
		.map(
			(obj, index) => {
				const varName = `obj${index + 1}`;
				let hitboxLine = '';
				if (obj.hitboxEnabled && obj.hitboxMode === 'rect') {
					hitboxLine = `\n    ${varName}.setInteractive(new Phaser.Geom.Rectangle(${Math.round(obj.hitboxOffsetX)}, ${Math.round(obj.hitboxOffsetY)}, ${Math.round(obj.hitboxWidth)}, ${Math.round(obj.hitboxHeight)}), Phaser.Geom.Rectangle.Contains);`;
				}

				if (obj.hitboxEnabled && obj.hitboxMode === 'polygon' && obj.hitboxPoints.length >= 3) {
					const points = obj.hitboxPoints
						.map((point) => `${Math.round(point.x)}, ${Math.round(point.y)}`)
						.join(', ');
					hitboxLine = `\n    ${varName}.setInteractive(new Phaser.Geom.Polygon([${points}]), Phaser.Geom.Polygon.Contains);`;
				}

				return (
					`    // ${obj.description || obj.name}` +
					'\n' +
					`    const ${varName} = this.add.image(${Math.round(obj.x)}, ${Math.round(obj.y)}, '${obj.spriteKey}')` +
					`.setScale(${obj.scaleX}, ${obj.scaleY})` +
					`.setAngle(${obj.angle})` +
					`.setDepth(${obj.depth})` +
					`.setAlpha(${obj.alpha})` +
					(obj.flipX || obj.flipY ? `.setFlipX(${obj.flipX}).setFlipY(${obj.flipY})` : '') +
					';' +
					hitboxLine
				);
			}
		)
		.join('\n');

	const snippet = `// Phaser 3 - Cena: ${config.key}
// Cole este codigo na sua Scene

preload() {
${preloadLines || '    // nenhum asset'}
}

create() {
${createLines || '    // nenhum objeto'}
}
`;

	root.file('phaser_snippet.js', snippet);

	const zipBlob = await zip.generateAsync({ type: 'blob' });
	triggerDownload(zipBlob, `${config.key || 'scene'}.zip`);
}
