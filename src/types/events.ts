import type { BoosterType } from "src/types/config";
import type { CellPos } from "src/types/geometry";
import type { PositionedTile, TileMove, TileType } from "src/types/tiles";

export type GameEventMap = {
	tilesRemoved: { cells: CellPos[]; type?: TileType };
	tilesDropped: { moves: TileMove[] };
	tilesSpawned: { tiles: PositionedTile[] };
	tilesSwapped: { a: CellPos; b: CellPos };
	tilesShuffled: { tiles: PositionedTile[] };
	superTileSpawned: PositionedTile;
	scoreChanged: { score: number; delta: number };
	movesChanged: { remaining: number };
	gameWon: undefined;
	gameLost: { reason: "noMoves" | "outOfMoves" };
	boardReady: { tiles: PositionedTile[] };
	boosterActivated: { type: BoosterType };
	boosterDeactivated: undefined;
};
