# Skill: Phaser Scene Editor

Versão: 1.0

Descrição
---------
Esta skill descreve de forma completa o formato de exportação do Scene Editor, as transformações que afetam hitboxes (retângulos e polígonos), e fornece exemplos e funções utilitárias que uma IA ou gerador de código pode usar para recriar a cena no Phaser (tanto para debug/pointer como para física). O arquivo acompanha o ZIP gerado pelo editor para que seja sempre distribuído junto com `scene.json` e os assets.

Objetivo
--------
- Permitir que um agente/skill leia `scene.json` exportado pelo editor e:
  - normalize os dados;
  - converta hitboxes locais → coordenadas do mundo (world);
  - gere shapes para `setInteractive` (Phaser.Geom) e/ou corpos MatterJS;
  - desenhe overlays de debug com hover para visualização das hitboxes.

Formato do arquivo exportado
----------------------------
O export (arquivo `scene.json`) tem a estrutura principal:

```json
{
  "scene": { "key": "MinhaScene", "width": 1280, "height": 720, "background": "#..." },
  "assets": [{ "key": "player", "path": "assets/player.png" }, ...],
  "gameObjects": [
    {
      "id": "obj-1",
      "name": "player",
      "type": "image",
      "spriteKey": "player",
      "x": 200,
      "y": 150,
      "scaleX": 1.2,
      "scaleY": 1.0,
      "angle": 30,
      "depth": 0,
      "alpha": 1,
      "flipX": false,
      "flipY": false,
      "hitbox": {
        "enabled": true,
        "mode": "polygon",
        "offsetX": -32,
        "offsetY": -16,
        "width": 64,
        "height": 48,
        "points": [{"x": -32, "y": -16}, {"x": 32, "y": -16}, {"x": 0, "y": 40}]
      }
    }
  ]
}
```

Unidades e convenções
----------------------
- Unidade: pixels.
- Origem local do objeto: centro do sprite (coordenadas locais são relativas ao centro).
- `angle`: graus, rotação aplicada em torno do centro.
- `scaleX/scaleY`: fatores multiplicativos; `flipX/flipY` invertem o sinal do respectivo scale ao aplicar.
- Campos do `hitbox`:
  - `enabled` (boolean)
  - `mode`: `rect` ou `polygon`
  - `offsetX`, `offsetY` (para `rect`): canto superior-esquerdo do retângulo em coordenadas locais (px), relativos ao centro do sprite
  - `width`, `height` (para `rect`): tamanho do retângulo em px
  - `points` (para `polygon`): array de pontos `{x,y}` em coordenadas locais (px)

Transformações (fórmulas)
-----------------------
Para converter um ponto local `p = {x, y}` para coordenadas do mundo (world) considerando escala, flip e rotação:

```js
function localToWorld(obj, p) {
  // aplicar flip como sinal na escala
  const sX = obj.flipX ? -obj.scaleX : obj.scaleX;
  const sY = obj.flipY ? -obj.scaleY : obj.scaleY;

  // converter graus para radianos
  const rad = (obj.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // aplicar escala (inclui flip)
  const sx = p.x * sX;
  const sy = p.y * sY;

  // aplicar rotação
  const rx = sx * cos - sy * sin;
  const ry = sx * sin + sy * cos;

  // transladar para a posição do objeto (centro)
  return { x: obj.x + rx, y: obj.y + ry };
}
```

Retângulos → vértices locais
---------------------------
Um retângulo definido por `offsetX`,`offsetY`,`width`,`height` tem 4 cantos locais (relativos ao centro):

- TL = (offsetX, offsetY)
- TR = (offsetX + width, offsetY)
- BR = (offsetX + width, offsetY + height)
- BL = (offsetX, offsetY + height)

Converta cada canto com `localToWorld` para obter vértices world.

Polígonos
---------
- Cada ponto em `hitbox.points` está em coordenada local; aplique `localToWorld` para gerar os vértices world.
- Valide:
  - mínimo 3 pontos para formar área;
  - preferência por winding consistente (CW ou CCW);
  - detectar auto-interseções e, se necessário, decompor em sub‑polígonos convexos (ex.: earcut / poly-decomp).

Flip (espelhamento)
-------------------
- `flipX` e `flipY` são tratados multiplicando a escala por -1 quando verdadeiros (`sX = flipX ? -scaleX : scaleX`).
- Offsets devem refletir esse flip: aplicar a mesma regra de `localToWorld` cuida disso automaticamente.

Uso no Phaser — sugestões
-------------------------
1) Debug / Pointer (sem física):

```js
// criar imagem
const g = data.gameObjects[i];
const img = this.add.image(g.x, g.y, g.spriteKey)
  .setScale(g.scaleX, g.scaleY)
  .setAngle(g.angle)
  .setDepth(g.depth)
  .setAlpha(g.alpha);
if (g.flipX) img.setFlipX(true);
if (g.flipY) img.setFlipY(true);

if (g.hitbox.enabled) {
  if (g.hitbox.mode === 'rect') {
    img.setInteractive(
      new Phaser.Geom.Rectangle(g.hitbox.offsetX, g.hitbox.offsetY, g.hitbox.width, g.hitbox.height),
      Phaser.Geom.Rectangle.Contains
    );
  } else {
    const pts = g.hitbox.points.flatMap(p => [p.x, p.y]);
    img.setInteractive(new Phaser.Geom.Polygon(pts), Phaser.Geom.Polygon.Contains);
  }
}
```

2) Física — Arcade vs Matter

- **Arcade**: só recomendado para AABBs sem rotação. Calcule `body.setSize(width*|scaleX|, height*|scaleY|)` e `body.setOffset(...)` adequadamente; rotações não são suportadas corretamente.
- **MatterJS** (recomendado para rotação e polígonos):

```js
// construir vértices locais escalados (inclui flip)
const sX = g.flipX ? -g.scaleX : g.scaleX;
const sY = g.flipY ? -g.scaleY : g.scaleY;
const verts = g.hitbox.points.map(p => ({ x: p.x * sX, y: p.y * sY }));

const body = Phaser.Physics.Matter.Matter.Bodies.fromVertices(g.x, g.y, [verts], { /*options*/ }, true);
const mSprite = this.matter.add.sprite(g.x, g.y, g.spriteKey);
mSprite.setExistingBody(body);
mSprite.setAngle(g.angle);
mSprite.setScale(g.scaleX, g.scaleY);
```

Funções utilitárias recomendadas (interface da skill)
--------------------------------------------------
Abaixo a lista mínima de funções que a skill deve expor para facilitar integração com IA/geradores de código.

- `normalizeProject(project) -> normalizedProject`
  - garante defaults (`hitboxPoints = [], hitboxEnabled = false`, etc.).

- `getWorldPoints(obj) -> Array<{x,y}>`
  - converte todos os pontos do hitbox (rect → 4 pontos, polygon → pontos) para coordenadas world.

- `getAABB(obj) -> {minX,minY,maxX,maxY}`
  - calcula o bound axis-aligned dos vértices world.

- `pointInside(obj, px, py) -> boolean`
  - testa se o ponto world está dentro do hitbox (usar point-in-polygon para polígonos).

- `toPhaserInteractiveShape(obj) -> { type: 'rect'|'polygon', data }`
  - retorna os parâmetros prontos para `setInteractive` (Phaser.Geom).

Exemplo numérico (passo a passo)
--------------------------------
Objeto: `x=200`, `y=150`, `scaleX=1.2`, `scaleY=1`, `angle=30`, `flipX=false`.
Ponto local: `{-32,-16}`.

Escalado: `sx = -32 * 1.2 = -38.4`, `sy = -16 * 1 = -16`.
Rotacionado: (rad = 30° ≈ 0.5236)
- rx ≈ -38.4 * cos(30°) - (-16) * sin(30°) ≈ -25.255
- ry ≈ -38.4 * sin(30°) + (-16) * cos(30°) ≈ -33.056
World: `x ≈ 200 + rx ≈ 174.745`, `y ≈ 150 + ry ≈ 116.944`.

Boas práticas e recomendações
---------------------------
- Sempre normalizar/validar o JSON (campo `hitbox` pode estar ausente).
- Adicionar um cache opcional `hitbox.worldPoints` e `hitbox.aabb` no export para acelerar consumidores.
- Para polígonos complexos, decompor em convexos se a engine de física exigir.
- Quando usar Matter, prefira `Bodies.fromVertices` e verifique escala/ângulo pós-criação.

Inclusão no ZIP
--------------
Este arquivo (`PHASER_SCENE_EDITOR_SKILL.md`) é colocado automaticamente na raiz do ZIP gerado pelo editor (ao lado de `scene.json` e `phaser_snippet.js`). Ele deve acompanhar a cena para documentar o formato e permitir que agentes/coletores entendam como trabalhar com as hitboxes.

Changelog
---------
- 1.0 — Versão inicial: formato, transformações, exemplos Phaser, APIs recomendadas.

---
Se desejar, posso gerar também um arquivo TypeScript com as funções utilitárias (`getWorldPoints`, `getAABB`, etc.) pronto para colar no projeto.
