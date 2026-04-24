import { Container, Sprite, Text } from "pixi.js";
import { FONT_FAMILY, GameAssets } from "src/core/GameAssets";
import { createNineSlice } from "src/ui/primitives";

export const boosterSlotLayout = {
	width: 340,
	height: 346,
	backgroundSlice: { leftWidth: 80, rightWidth: 80, topHeight: 100, bottomHeight: 100 },
	countBackground: {
		width: 230,
		height: 113,
		y: 186,
		slice: { leftWidth: 55, rightWidth: 55, topHeight: 50, bottomHeight: 50 },
	},
	iconPosition: { x: 170, y: 110 },
	countTextY: 196,
} as const;

export class BoosterSlotView extends Container {
	private countText: Text;
	private count: number;

	constructor(iconAlias: string, count: number, onClick: () => void) {
		super();

		this.count = count;

		const bg = createNineSlice("bg_booster", { ...boosterSlotLayout.backgroundSlice, width: boosterSlotLayout.width, height: boosterSlotLayout.height });
		this.addChild(bg);

		this.eventMode = "static";
		this.cursor = "pointer";
		this.on("pointertap", onClick);

		const countBg = createNineSlice("slot_booster", { ...boosterSlotLayout.countBackground.slice, width: boosterSlotLayout.countBackground.width, height: boosterSlotLayout.countBackground.height });
		countBg.position.set((boosterSlotLayout.width - countBg.width) / 2, boosterSlotLayout.countBackground.y);
		this.addChild(countBg);

		const icon = new Sprite(GameAssets.getTexture(iconAlias));
		icon.anchor.set(0.5);
		icon.position.set(boosterSlotLayout.iconPosition.x, boosterSlotLayout.iconPosition.y);
		this.addChild(icon);

		this.countText = new Text({ text: `${count}`, style: { fill: 0xffffff, fontSize: 65, fontFamily: FONT_FAMILY } });
		this.countText.anchor.x = 0.5;
		this.countText.position.set(countBg.x + countBg.width / 2, boosterSlotLayout.countTextY);
		this.addChild(this.countText);
	}

	setCount(count: number): void {
		this.count = count;
		this.countText.text = `${count}`;
	}

	getCount(): number {
		return this.count;
	}

	setSelected(selected: boolean): void {
		this.alpha = selected ? 0.6 : 1;
	}
}
