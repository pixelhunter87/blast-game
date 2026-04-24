import { Graphics, NineSliceSprite, type NineSliceSpriteOptions } from "pixi.js";
import { GameAssets } from "src/core/GameAssets";

export const createNineSlice = (alias: string, options: Omit<NineSliceSpriteOptions, "texture">): NineSliceSprite => new NineSliceSprite({ ...options, texture: GameAssets.getTexture(alias) });

export type RectMaskOptions = {
	x?: number;
	y?: number;
	width: number;
	height: number;
};

export const createRectMask = ({ x = 0, y = 0, width, height }: RectMaskOptions): Graphics => {
	const mask = new Graphics();
	mask.rect(x, y, width, height);
	mask.fill(0xffffff);
	return mask;
};
