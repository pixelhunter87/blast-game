export const FIGMA_LAYOUT_SIZE = { width: 1080, height: 1920 } as const;
export const TILE_SIZE = { width: 100, height: 112 } as const;
export const BOARD_SIZE = { width: 980, height: 1092 } as const;

/** Формула очков: `n * (n - 1)`, где `n` — размер собранной группы. */
export const calcScore = (groupSize: number): number => groupSize * (groupSize - 1);
