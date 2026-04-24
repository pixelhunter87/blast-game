# blast-proto

Прототип blast-игры на `PixiJS` и `TypeScript`.

## Запуск

1. Установить зависимости:

```bash
npm install
```

2. Запустить проект в режиме разработки:

```bash
npm run dev
```

3. Собрать production-версию:

```bash
npm run build
```

## Структура кода

- `src/main.ts`, `src/Game.ts` — вход в приложение, инициализация Pixi и запуск экранов.
- `src/model` — игровая логика поля, игрока и helper-функции для работы с доской.
- `src/screens` — экраны приложения.
- `src/view` — визуальные блоки игрового интерфейса: поле, бустеры, ui.
- `src/core` — базовая инфраструктура: assets, event bus, screen manager.
- `src/ui` — переиспользуемые UI-примитивы.

## Переменные окружения

Скрипты из папки `scripts` читают переменные из файла `.env` в корне проекта.

Пример:

```env
FIGMA_API_TOKEN=your_figma_token
TEXTURE_PACKER_PATH=/Applications/TexturePacker.app/Contents/MacOS/TexturePacker
```

### `FIGMA_API_TOKEN`

Токен Figma API. Нужен для команды `npm run download-images`, которая скачивает исходные изображения из макета Figma.

### `TEXTURE_PACKER_PATH`

Путь к исполняемому файлу `TexturePacker`. Нужен для команды `npm run pack-textures`, которая собирает атлас текстур из файлов в `media/images`.

## Скрипты

### `npm run dev`

Запускает локальный dev-сервер Vite для разработки.

### `npm run build`

Проверяет типы через `tsc` и собирает production-версию проекта через Vite.

### `npm run preview`

Запускает локальный preview собранной production-версии.

### `npm run lint`

Запускает ESLint для файлов в `src`.

### `npm run lint:fix`

Запускает ESLint с автоисправлением для файлов в `src`.

### `npm run format`

Форматирует проект через `dprint`.

### `npm run download-images`

Скачивает изображения из Figma в папку `media/images`.
Использовать, когда нужно обновить исходные PNG из макета.

Требует:
- `FIGMA_API_TOKEN` в `.env`

### `npm run pack-textures`

Собирает атлас текстур в `public/assets/textures` из файлов в `media/images`.
Использовать после обновления исходных изображений, если нужно пересобрать игровой атлас.

Требует:
- `TEXTURE_PACKER_PATH` в `.env`

## Папки с ассетами

### `media/images`

Исходные PNG-файлы, из которых собирается атлас.

### `public/assets/textures`

Готовый атлас текстур, который загружается приложением во время работы.

### `public/assets/config.json`

Игровой конфиг: размеры поля, количество ходов, бустеры, текстуры тайлов и правила появления суперфишек.
