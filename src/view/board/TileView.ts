import { Sprite } from "pixi.js";
import { TILE_SIZE } from "src/const";
import { GameAssets } from "src/core/GameAssets";
import type { GameConfig, TileData } from "src/types";

export class TileView extends Sprite {
	readonly tile: TileData;
	row: number;
	col: number;

	constructor(tile: TileData, row: number, col: number, textureAlias: string) {
		super(GameAssets.getTexture(textureAlias));

		this.tile = tile;
		this.row = row;
		this.col = col;
		this.anchor.set(0.5);
		this.width = TILE_SIZE.width;
		this.height = TILE_SIZE.height;
		this.eventMode = "static";
		this.cursor = "pointer";
	}
}

export const textureAliasFor = (tile: TileData, config: GameConfig): string => {
	if (tile.kind === "color") return config.tiles[tile.type];
	return config.superTiles.textures[tile.superType];
};
