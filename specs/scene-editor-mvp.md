# Spec: Phaser Scene Editor — MVP

**Data:** Abril 2026  
**Status:** Planejamento  
**Objetivo:** Editor visual de cenas para Phaser 3, substituindo o editor pago com uma ferramenta própria e leve.

---

## 1. Visão Geral

Aplicação web (Vite + React + TypeScript) que permite:

1. Fazer upload de imagens para usar como sprites
2. Posicionar e manipular sprites em um canvas que representa a cena
3. Configurar propriedades básicas de cada objeto
4. Exportar um arquivo JSON compatível com Phaser 3

---

## 2. Tech Stack

| Camada       | Tecnologia                          | Motivo                                         |
|--------------|--------------------------------------|------------------------------------------------|
| Bundler      | Vite                                 | Rápido, zero config                           |
| UI           | React + TypeScript                   | Componentização + tipagem                     |
| Canvas       | Konva.js + react-konva               | Canvas 2D interativo, drag nativo, seleção    |
| Estado       | Zustand                              | Simples, sem boilerplate                      |
| Estilo       | CSS Modules ou Tailwind (à escolha)  | Sem overhead                                  |
| Export       | Nativo (Blob + download)             | Sem dependência externa                       |

---

## 3. Layout da Interface

```
┌─────────────────────────────────────────────────────────────┐
│  TOOLBAR  [ Config Cena ]  [ Exportar JSON ]                │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│  SPRITE      │       CANVAS             │   PROPRIEDADES    │
│  PANEL       │       (Stage)            │   PANEL           │
│              │                          │                   │
│  [ Upload ]  │   área de posicionamento │  x, y             │
│  lista de    │   com grid opcional      │  scaleX, scaleY   │
│  sprites     │                          │  angle            │
│  carregados  │                          │  depth            │
│              │                          │  key/nome         │
└──────────────┴──────────────────────────┴───────────────────┘
```

---

## 4. Funcionalidades do MVP

### 4.1 Upload de Sprites
- Aceitar PNG, JPG, WebP
- Armazenar em memória (URL.createObjectURL)
- Exibir thumbnails no painel lateral
- Suportar múltiplos uploads (input multiple ou drag & drop na área do painel)
- Cada sprite recebe uma **chave única** (nome do arquivo sem extensão)

### 4.2 Canvas da Cena
- Dimensões configuráveis (default: 800×600)
- Background com cor sólida configurável (default: #1a1a2e)
- Grid opcional (toggle)
- Scroll/pan quando a cena for maior que a viewport
- Zoom básico (scroll do mouse)

### 4.3 Adicionar Objetos à Cena
- Clicar em um sprite do painel → adiciona ao centro da cena
- Ou drag do painel para o canvas
- Cada objeto na cena tem um **ID único** gerado automaticamente

### 4.4 Seleção e Manipulação
- Clicar em objeto → seleciona (mostra transformer do Konva)
- Arrastar → mover objeto
- Handles de resize → alterar scaleX/scaleY
- Handle de rotação → alterar angle
- Delete/Backspace → remover objeto selecionado
- Selecionar múltiplos (shift+clique) — **pós-MVP**

### 4.5 Painel de Propriedades
Exibe e permite editar, para o objeto selecionado:

| Propriedade | Tipo    | Descrição                          |
|-------------|---------|-------------------------------------|
| name        | string  | nome/label do objeto na cena       |
| x           | number  | posição X (origem Phaser)          |
| y           | number  | posição Y (origem Phaser)          |
| scaleX      | number  | escala horizontal                  |
| scaleY      | number  | escala vertical                    |
| angle       | number  | rotação em graus                   |
| depth       | number  | z-index / camada                   |
| alpha       | number  | opacidade (0 a 1)                  |
| flipX       | boolean | espelhar horizontalmente           |
| flipY       | boolean | espelhar verticalmente             |
| spriteKey   | string  | chave do sprite (somente leitura)  |

### 4.6 Lista de Objetos (Scene Hierarchy)
- Lista simples abaixo do painel de sprites
- Mostra todos os objetos na cena
- Clicar seleciona o objeto no canvas
- Ícone de olho para toggle de visibilidade — **pós-MVP**
- Reordenar por drag — **pós-MVP**

### 4.7 Exportação JSON (Phaser 3)
Formato de saída compatível com carregamento em cena Phaser:

```json
{
  "scene": {
    "key": "MinhaScene",
    "width": 800,
    "height": 600,
    "background": "#1a1a2e"
  },
  "gameObjects": [
    {
      "id": "sprite_001",
      "name": "player",
      "type": "image",
      "spriteKey": "player",
      "x": 400,
      "y": 300,
      "scaleX": 1,
      "scaleY": 1,
      "angle": 0,
      "depth": 0,
      "alpha": 1,
      "flipX": false,
      "flipY": false
    }
  ]
}
```

- Botão "Exportar JSON" na toolbar
- Faz download de `scene.json`
- Nome do arquivo = nome da cena configurado

---

## 5. Estrutura de Pastas

```
src/
├── components/
│   ├── Toolbar/
│   │   ├── Toolbar.tsx
│   │   └── Toolbar.module.css
│   ├── SpritePanel/
│   │   ├── SpritePanel.tsx        ← lista + upload
│   │   ├── SpriteItem.tsx         ← thumbnail individual
│   │   └── SpritePanel.module.css
│   ├── SceneCanvas/
│   │   ├── SceneCanvas.tsx        ← Stage Konva
│   │   ├── SceneObject.tsx        ← Image + Transformer
│   │   └── SceneCanvas.module.css
│   ├── PropertiesPanel/
│   │   ├── PropertiesPanel.tsx
│   │   ├── PropertyField.tsx      ← input numérico reutilizável
│   │   └── PropertiesPanel.module.css
│   └── SceneHierarchy/
│       ├── SceneHierarchy.tsx
│       └── SceneHierarchy.module.css
├── store/
│   └── useSceneStore.ts           ← Zustand: estado global
├── types/
│   └── scene.ts                   ← interfaces TypeScript
├── utils/
│   ├── exportScene.ts             ← gera JSON para Phaser
│   └── generateId.ts              ← uuid simples
├── App.tsx
├── App.module.css
└── main.tsx
```

---

## 6. Tipos TypeScript Principais

```ts
// types/scene.ts

export interface SpriteAsset {
  key: string;          // nome único (filename sem ext)
  url: string;          // objectURL
  width: number;        // dimensões originais
  height: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: 'image';
  spriteKey: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  depth: number;
  alpha: number;
  flipX: boolean;
  flipY: boolean;
}

export interface SceneConfig {
  key: string;
  width: number;
  height: number;
  background: string;
}
```

---

## 7. Estado Global (Zustand)

```ts
interface SceneStore {
  // Assets
  sprites: SpriteAsset[];
  addSprite: (sprite: SpriteAsset) => void;
  removeSprite: (key: string) => void;

  // Cena
  sceneConfig: SceneConfig;
  updateSceneConfig: (config: Partial<SceneConfig>) => void;

  // Objetos na cena
  objects: SceneObject[];
  addObject: (spriteKey: string) => void;
  updateObject: (id: string, changes: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;

  // Seleção
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}
```

---

## 8. Fora do Escopo (MVP)

- Animações / spritesheets
- Tilemaps
- Physics bodies / hitboxes
- Câmera / parallax
- Grupos de objetos
- Texto / BitmapText
- Áudio
- Salvar projeto localmente (localStorage) — pode entrar como pós-MVP rápido
- Importar JSON existente

---

## 9. Possíveis Evoluções Pós-MVP

1. **Persistência local** — salvar/carregar projeto via localStorage ou arquivo `.json`
2. **Import de JSON** — reabrir cena já exportada para edição
3. **Layers/grupos** — organizar objetos em camadas
4. **Spritesheet support** — selecionar frame específico
5. **Snap ao grid** — alinhar automaticamente
6. **Undo/Redo** — histórico de ações
7. **Multi-seleção** — mover vários objetos juntos
8. **Preview Phaser** — iframe com cena rodando em Phaser real
