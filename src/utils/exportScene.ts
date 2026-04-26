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
			(obj) =>
				`    // ${obj.description || obj.name}` +
				'\n' +
				`    this.add.image(${Math.round(obj.x)}, ${Math.round(obj.y)}, '${obj.spriteKey}')` +
				`.setScale(${obj.scaleX}, ${obj.scaleY})` +
				`.setAngle(${obj.angle})` +
				`.setDepth(${obj.depth})` +
				`.setAlpha(${obj.alpha})` +
				(obj.flipX || obj.flipY ? `.setFlipX(${obj.flipX}).setFlipY(${obj.flipY})` : '') +
				';'
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
