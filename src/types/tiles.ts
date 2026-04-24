import type { CellPos } from "src/types/geometry";

export const TILE_TYPE = {
	RED: "red",
	BLUE: "blue",
	GREEN: "green",
	YELLOW: "yellow",
	PURPLE: "purple",
} as const;

export type TileType = typeof TILE_TYPE[keyof typeof TILE_TYPE];

export const SUPER_TILE_TYPE = {
	ROCKET_ROW: "rocket_row",
	ROCKET_COL: "rocket_col",
	BOMB: "bomb",
	BOMB_MAX: "bomb_max",
} as const;

export type SuperTileType = typeof SUPER_TILE_TYPE[keyof typeof SUPER_TILE_TYPE];

export type ColorTileData = {
	kind: "color";
	type: TileType;
	id: number;
};

export type SuperTileData = {
	kind: "super";
	superType: SuperTileType;
	id: number;
};

export type TileData = ColorTileData | SuperTileData;

export type BoardGrid = (TileData | undefined)[][];

export type PositionedTile = {
	pos: CellPos;
	tile: TileData;
};

export type TileMove = {
	from: CellPos;
	to: CellPos;
	tile: TileData;
};
