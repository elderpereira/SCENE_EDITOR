# TODO — Phaser Scene Editor MVP

> Spec completa em [`specs/scene-editor-mvp.md`](specs/scene-editor-mvp.md)

---

## Setup do Projeto

- [x] Criar projeto Vite + React + TypeScript (`npm create vite@latest`)
- [x] Instalar dependências: `konva`, `react-konva`, `zustand`
- [x] Configurar estrutura de pastas (`src/components`, `src/store`, `src/types`, `src/utils`)
- [x] Criar `src/types/scene.ts` com interfaces `SpriteAsset`, `SceneObject`, `SceneConfig`
- [x] Criar `src/utils/generateId.ts` (nanoid ou crypto.randomUUID)

---

## Estado Global

- [x] Criar `src/store/useSceneStore.ts` com Zustand
  - [x] State: `sprites`, `objects`, `sceneConfig`, `selectedId`
  - [x] Actions: `addSprite`, `removeSprite`, `addObject`, `updateObject`, `removeObject`, `setSelectedId`, `updateSceneConfig`

---

## Layout Base

- [x] Montar layout em `App.tsx` com 3 colunas: SpritePanel | SceneCanvas | PropertiesPanel
- [x] Adicionar Toolbar no topo
- [x] Estilizar layout base (CSS Grid/Flexbox)

---

## Componente: Toolbar

- [x] Criar `Toolbar.tsx`
- [x] Campo de texto para nome da cena (`sceneConfig.key`)
- [x] Input para largura e altura da cena
- [x] Color picker para background
- [x] Botão "Exportar JSON" (chama `exportScene`)
- [x] Toggle de grid (estado local)

---

## Componente: SpritePanel

- [x] Criar `SpritePanel.tsx`
- [x] Botão / área de drop para upload de imagens (`input[type=file] multiple`)
- [x] Ao fazer upload: criar `objectURL`, extrair nome, carregar dimensões via `Image()`, salvar no store
- [x] Renderizar lista de `SpriteItem` com thumbnail
- [x] Criar `SpriteItem.tsx` — exibe thumbnail e key do sprite
- [x] Ao clicar em SpriteItem → `addObject(spriteKey)` no store (adiciona ao centro da cena)
- [x] Botão de remover sprite do painel (com confirmação se houver objetos usando)

---

## Componente: SceneCanvas

- [x] Criar `SceneCanvas.tsx` com `Stage` do Konva nas dimensões da `sceneConfig`
- [x] Fundo com `Rect` na cor do `sceneConfig.background`
- [x] Renderizar grid opcional (linhas com `Line` do Konva) baseado em toggle da Toolbar
- [x] Mapear `objects` do store → renderizar `SceneObject` para cada um
- [x] Clicar em área vazia → `setSelectedId(null)`
- [x] Suporte a zoom via scroll do mouse (scale do Stage)
- [x] Criar `SceneObject.tsx`:
  - [x] Renderizar `KonvaImage` carregada via `useImage` (react-konva)
  - [x] Aplicar x, y, scaleX, scaleY, angle, alpha, flipX, flipY
  - [x] Clicar → `setSelectedId(id)`
  - [x] Ao arrastar (onDragEnd) → `updateObject` com novo x, y
  - [x] Ao transformar (onTransformEnd) → `updateObject` com novos scale/angle
  - [x] Se `selectedId === id` → renderizar `Transformer` do Konva

---

## Componente: PropertiesPanel

- [x] Criar `PropertiesPanel.tsx`
- [x] Se nenhum objeto selecionado → mensagem "Selecione um objeto"
- [x] Criar `PropertyField.tsx` — label + input numérico com onChange imediato
- [x] Campos: `name`, `x`, `y`, `scaleX`, `scaleY`, `angle`, `depth`, `alpha`
- [x] Checkboxes: `flipX`, `flipY`
- [x] Campo somente leitura: `spriteKey`
- [x] Botão "Remover objeto" (chama `removeObject`)
- [x] Atalho de teclado: `Delete`/`Backspace` quando objeto selecionado → remove objeto

---

## Componente: SceneHierarchy

- [x] Criar `SceneHierarchy.tsx` (abaixo do SpritePanel)
- [x] Listar todos os objetos da cena com nome e ícone do sprite
- [x] Clicar no item → `setSelectedId(id)`
- [x] Destacar item do objeto selecionado

---

## Exportação

- [x] Criar `src/utils/exportScene.ts`
- [x] Recebe `sceneConfig` + `objects` e monta o JSON no formato Phaser 3
- [x] Cria Blob e dispara download do arquivo `.json`
- [ ] Testar JSON importando manualmente em projeto Phaser 3 de teste

---
 
## Qualidade / Finalização

- [x] Revisar tipagem TypeScript (sem `any` crítico)
- [x] Testar fluxo completo: upload → posicionar → configurar propriedades → exportar
- [ ] Testar JSON exportado em projeto Phaser 3 real
- [ ] README com instruções de instalação e uso

---

## Pós-MVP (backlog futuro)

- [ ] Salvar/carregar projeto via localStorage
- [ ] Importar JSON de cena existente para reeditar
- [x] Snap ao grid
- [ ] Undo/Redo
- [ ] Multi-seleção de objetos
- [ ] Suporte a spritesheets (frame específico)
- [ ] Preview da cena com Phaser real (iframe)
  - [ ] Garantir que hitbox seja renderizada no mesmo contêiner do sprite para compartilhar escala/rotação
- [ ] Layers / grupos de objetos
