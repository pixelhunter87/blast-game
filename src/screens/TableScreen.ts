import { Graphics, Sprite, Text } from "pixi.js";
import { FIGMA_LAYOUT_SIZE } from "src/const";
import { EventBus, type GameEvents } from "src/core/EventBus";
import { FONT_FAMILY, GameAssets } from "src/core/GameAssets";
import { Screen } from "src/core/screens/Screen";
import { Board, type BoardBombResult, type BoardEndStateResult, type BoardInitResult, type BoardSwapResult, type BoardTapResult } from "src/model/Board.ts";
import type { CellPos, GameConfig, GameEventMap } from "src/types";
import { Button } from "src/ui/Button.ts";
import { BoardView } from "src/view/board/BoardView";
import { BoostersView } from "src/view/boosters/BoostersView";
import { StatsView } from "src/view/stats/StatsView";

const layout = {
	statsY: 30,
	boardY: 351,
	boostersY: 1455,
	endMessage: {
		textOffsetY: -80,
		buttonOffsetY: 140,
	},
} as const;

export class TableScreen extends Screen {
	private config: GameConfig;
	private onBack: () => void;
	private events: GameEvents;
	private board: Board;

	constructor(config: GameConfig, onBack: () => void) {
		super();

		this.config = config;
		this.onBack = onBack;
		this.events = new EventBus<GameEventMap>();
		this.board = new Board(config);
	}

	onShow(): void {
		const bgTexture = GameAssets.getTexture("img_bg_game");
		const background = new Sprite(bgTexture);
		background.anchor.set(0.5);
		background.x = FIGMA_LAYOUT_SIZE.width / 2;
		background.y = FIGMA_LAYOUT_SIZE.height / 2;

		const bgScale = Math.max(FIGMA_LAYOUT_SIZE.width / bgTexture.width, FIGMA_LAYOUT_SIZE.height / bgTexture.height);
		background.scale.set(bgScale);
		this.addChild(background);

		const boardView = new BoardView(this.config, this.events, {
			onTapTile: (row, col) => this.onBoardTap(row, col),
			onBombAt: (row, col) => this.onBoardBomb(row, col),
			onSwapTiles: (a, b) => this.onBoardSwap(a, b),
		});
		boardView.x = (FIGMA_LAYOUT_SIZE.width - boardView.width) / 2;
		boardView.y = layout.boardY;
		this.addChild(boardView);

		const statsView = new StatsView(this.config.targetScore, this.events);
		statsView.x = (FIGMA_LAYOUT_SIZE.width - statsView.width) / 2;
		statsView.y = layout.statsY;
		this.addChild(statsView);

		const boostersView = new BoostersView(this.config, this.events);
		boostersView.x = (FIGMA_LAYOUT_SIZE.width - boostersView.width) / 2;
		boostersView.y = layout.boostersY;
		this.addChild(boostersView);

		this.events.on("gameWon", () => {
			boardView.runAfterAnimations(() => this.showEndMessage("Победа!", 0x2ecc71));
		});
		this.events.on("gameLost", ({ reason }) => {
			boardView.runAfterAnimations(() => this.showEndMessage(reason === "noMoves" ? "Нет доступных ходов!" : "Ходы закончились!", 0xe74c3c));
		});

		this.emitBoardInit(this.board.init());
	}

	onHide(): void {
		this.events.clear();
	}

	private emitBoardInit(result: BoardInitResult): void {
		this.events.emit("boardReady", result.boardReady);
		this.events.emit("scoreChanged", result.scoreChanged);
		this.events.emit("movesChanged", result.movesChanged);
	}

	private emitBoardUpdate(result: BoardBombResult | BoardTapResult): void {
		this.events.emit("tilesRemoved", result.tilesRemoved);

		if (result.superTileSpawned) this.events.emit("superTileSpawned", result.superTileSpawned);
		if (result.tilesDropped) this.events.emit("tilesDropped", result.tilesDropped);
		if (result.tilesSpawned) this.events.emit("tilesSpawned", result.tilesSpawned);
	}

	private emitBoardResult(result: BoardBombResult | BoardTapResult): void {
		this.emitBoardUpdate(result);

		this.events.emit("scoreChanged", result.scoreChanged);
		if ("movesChanged" in result) this.events.emit("movesChanged", result.movesChanged);

		this.emitEndState(result);
	}

	private emitEndState(result: BoardEndStateResult): void {
		result.tilesShuffled.forEach((tilesShuffled) => this.events.emit("tilesShuffled", tilesShuffled));

		if (result.gameWon) this.events.emit("gameWon", undefined);
		if (result.gameLost) this.events.emit("gameLost", result.gameLost);
	}

	private onBoardTap(row: number, col: number): boolean {
		const result = this.board.tapTile(row, col);
		if (!result) return false;

		this.emitBoardResult(result);

		return true;
	}

	private onBoardBomb(row: number, col: number): boolean {
		const result = this.board.bombAt(row, col);
		if (!result) return false;

		this.emitBoardResult(result);

		return true;
	}

	private onBoardSwap(a: CellPos, b: CellPos): boolean {
		const result: BoardSwapResult | undefined = this.board.swapTiles(a, b);
		if (!result) return false;

		this.events.emit("tilesSwapped", result.tilesSwapped);
		this.emitEndState(result);

		return true;
	}

	private showEndMessage(message: string, color: number): void {
		const centerX = FIGMA_LAYOUT_SIZE.width / 2;
		const centerY = FIGMA_LAYOUT_SIZE.height / 2;

		const overlay = new Graphics();
		overlay.rect(0, 0, FIGMA_LAYOUT_SIZE.width, FIGMA_LAYOUT_SIZE.height);
		overlay.fill({ color: 0x000000, alpha: 0.6 });
		overlay.eventMode = "static";
		this.addChild(overlay);

		const text = new Text({ text: message, anchor: 0.5, style: { fill: color, fontSize: 90, fontWeight: "bold", fontFamily: FONT_FAMILY, align: "center", wordWrap: true, wordWrapWidth: FIGMA_LAYOUT_SIZE.width - 80 } });
		text.x = centerX;
		text.y = centerY + layout.endMessage.textOffsetY;
		this.addChild(text);

		const menuBtn = new Button({ text: "Меню", width: 320, height: 100, radius: 20, fontSize: 48, onClick: () => this.onBack() });
		menuBtn.x = centerX;
		menuBtn.y = centerY + layout.endMessage.buttonOffsetY;
		this.addChild(menuBtn);
	}
}
