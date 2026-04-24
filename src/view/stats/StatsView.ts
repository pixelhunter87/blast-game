import { Container, Sprite, Text } from "pixi.js";
import type { GameEvents } from "src/core/EventBus";
import { FONT_FAMILY, GameAssets } from "src/core/GameAssets";
import { createNineSlice } from "src/ui/primitives";

const layout = {
	background: {
		width: 872,
		height: 321,
		slice: { leftWidth: 100, topHeight: 100, rightWidth: 100, bottomHeight: 100 },
	},
	movesBackground: { x: 66, y: 33 },
	movesTextY: 140,
	scoreBackground: {
		x: 281,
		y: 43,
		width: 523,
		height: 209,
		slice: { leftWidth: 60, rightWidth: 60, topHeight: 80, bottomHeight: 80 },
	},
	scoreTitleY: 70,
	scoreValueY: 129,
} as const;

export class StatsView extends Container {
	constructor(targetScore: number, events: GameEvents) {
		super();

		const bg = createNineSlice("bg_frame_moves", { ...layout.background.slice, width: layout.background.width, height: layout.background.height });
		this.addChild(bg);

		const movesBg = new Sprite({ texture: GameAssets.getTexture("bg_moves"), position: layout.movesBackground });
		this.addChild(movesBg);

		const movesText = new Text({ text: "--", style: { fill: 0xffffff, fontSize: 80, fontFamily: FONT_FAMILY }, anchor: 0.5 });
		movesText.position.set(movesBg.x + movesBg.width / 2, layout.movesTextY);
		this.addChild(movesText);

		const scoreBg = createNineSlice("slot_frame_moves", { ...layout.scoreBackground.slice, width: layout.scoreBackground.width, height: layout.scoreBackground.height });
		scoreBg.position.set(layout.scoreBackground.x, layout.scoreBackground.y);
		this.addChild(scoreBg);

		const scoreTextTitle = new Text({ text: "очки:", style: { fill: 0xffffff, fontSize: 50, fontFamily: FONT_FAMILY } });
		scoreTextTitle.anchor.x = 0.5;
		scoreTextTitle.position.set(scoreBg.x + scoreBg.width / 2, layout.scoreTitleY);
		this.addChild(scoreTextTitle);

		const scoreText = new Text({ text: `0/${targetScore}`, style: { fill: 0xffffff, fontSize: 70, fontFamily: FONT_FAMILY } });
		scoreText.anchor.x = 0.5;
		scoreText.position.set(scoreBg.x + scoreBg.width / 2, layout.scoreValueY);
		this.addChild(scoreText);

		events.on("scoreChanged", ({ score }) => scoreText.text = `${score}/${targetScore}`);
		events.on("movesChanged", ({ remaining }) => movesText.text = `${remaining}`);
	}
}
