import { Container, Graphics, Text } from "pixi.js";
import { FONT_FAMILY } from "src/core/GameAssets";

export type ButtonOptions = {
	text: string;
	width?: number;
	height?: number;
	radius?: number;
	bgColor?: number;
	textColor?: number;
	fontSize?: number;
	onClick: () => void;
};

export class Button extends Container {
	constructor(options: ButtonOptions) {
		super();

		const { text, width = 200, height = 60, radius = 12, bgColor = 0x3498db, textColor = 0xffffff, fontSize = 28, onClick } = options;

		const bg = new Graphics();
		bg.roundRect(-width / 2, -height / 2, width, height, radius);
		bg.fill(bgColor);
		this.addChild(bg);

		const label = new Text({ text, anchor: 0.5, style: { fill: textColor, fontSize, fontFamily: FONT_FAMILY } });
		this.addChild(label);

		this.eventMode = "static";
		this.cursor = "pointer";
		this.on("pointertap", onClick);
	}
}
