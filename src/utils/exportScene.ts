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

	const data = buildSceneData(config, objects, sprites);
	root.file('scene.json', JSON.stringify(data, null, 2));

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
