import { Text } from "pixi.js";
import { FIGMA_LAYOUT_SIZE } from "src/const";
import { FONT_FAMILY } from "src/core/GameAssets";
import { Screen } from "src/core/screens/Screen";
import { Button } from "src/ui/Button.ts";

const layout = {
	titleOffsetY: -300,
	playButtonOffsetY: 100,
} as const;

export class MenuScreen extends Screen {
	private onPlay: () => void;

	constructor(onPlay: () => void) {
		super();

		this.onPlay = onPlay;
	}

	onShow(): void {
		const centerX = FIGMA_LAYOUT_SIZE.width / 2;
		const centerY = FIGMA_LAYOUT_SIZE.height / 2;

		const title = new Text({ text: "Blast Game", anchor: 0.5, style: { fill: 0xffffff, fontSize: 100, fontWeight: "bold", fontFamily: FONT_FAMILY } });
		title.x = centerX;
		title.y = centerY + layout.titleOffsetY;
		this.addChild(title);

		const playBtn = new Button({ text: "Играть", width: 400, height: 120, radius: 20, fontSize: 56, onClick: () => this.onPlay() });
		playBtn.x = centerX;
		playBtn.y = centerY + layout.playButtonOffsetY;
		this.addChild(playBtn);
	}

	onHide(): void {}
}
