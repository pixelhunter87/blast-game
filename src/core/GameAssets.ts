import { Assets, type Spritesheet, type Texture } from "pixi.js";

export const FONT_FAMILY = "Marvin";

const ATLAS_URLS = [
	"assets/textures/assets_0.json",
];

export class GameAssets {
	private static sheets: Spritesheet[] = [];

	static async init(): Promise<void> {
		this.sheets = await Promise.all(ATLAS_URLS.map((url) => Assets.load(url)));
		await Assets.load({ alias: FONT_FAMILY, src: "assets/fonts/Marvin.otf", data: { family: FONT_FAMILY } });
	}

	static getTexture(alias: string): Texture {
		for (const sheet of this.sheets) {
			const texture = sheet.textures[alias];
			if (texture) return texture;
		}

		throw new Error(`Texture "${alias}" not found in loaded atlases`);
	}
}
