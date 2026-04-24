import type { GameEventMap } from "src/types/events";
import type { CellPos } from "src/types/geometry";
import type { SuperTileType } from "src/types/tiles";

export type SuperSpawn = {
	cell: CellPos;
	superType: SuperTileType;
};

export type BoardUpdateResult = {
	tilesRemoved: GameEventMap["tilesRemoved"];
	superTileSpawned?: GameEventMap["superTileSpawned"];
	tilesDropped?: GameEventMap["tilesDropped"];
	tilesSpawned?: GameEventMap["tilesSpawned"];
};

export type BoardEndStateResult = {
	tilesShuffled: GameEventMap["tilesShuffled"][];
	gameWon?: true;
	gameLost?: GameEventMap["gameLost"];
};

export type BoardInitResult = {
	boardReady: GameEventMap["boardReady"];
	scoreChanged: GameEventMap["scoreChanged"];
	movesChanged: GameEventMap["movesChanged"];
};

export type BoardTapResult = BoardUpdateResult & BoardEndStateResult & {
	scoreChanged: GameEventMap["scoreChanged"];
	movesChanged: GameEventMap["movesChanged"];
};

export type BoardBombResult = BoardUpdateResult & BoardEndStateResult & {
	scoreChanged: GameEventMap["scoreChanged"];
};

export type BoardSwapResult = BoardEndStateResult & {
	tilesSwapped: GameEventMap["tilesSwapped"];
};
