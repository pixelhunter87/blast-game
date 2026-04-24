import type { SuperTileType } from "src/types/tiles";

export type SuperTileSpawnRule = {
	minGroupSize: number;
	types: SuperTileType[];
};

export type SuperTileConfig = {
	bombRadius: number;
	canDrop?: boolean;
	textures: Record<SuperTileType, string>;
	spawnRules: SuperTileSpawnRule[];
};

export type BoosterConfig = {
	bomb: { radius: number; count: number };
	teleport: { count: number };
};

export type GameConfig = {
	rows: number;
	cols: number;
	numColors: number;
	targetScore: number;
	maxMoves: number;
	minGroupSize: number;
	maxShuffles: number;
	boosters: BoosterConfig;
	tiles: Record<string, string>;
	superTiles: SuperTileConfig;
};

export const BOOSTER_TYPE = {
	BOMB: "bomb",
	TELEPORT: "teleport",
} as const;

export type BoosterType = typeof BOOSTER_TYPE[keyof typeof BOOSTER_TYPE];
