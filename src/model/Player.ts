import { calcScore } from "src/const";
import type { GameConfig, GameEventMap } from "src/types";

export class Player {
	private score: number;
	private movesLeft: number;
	private targetScore: number;

	constructor(config: GameConfig) {
		this.score = 0;
		this.movesLeft = config.maxMoves;
		this.targetScore = config.targetScore;
	}

	getScore(): number {
		return this.score;
	}

	getMovesLeft(): number {
		return this.movesLeft;
	}

	addScore(groupSize: number): GameEventMap["scoreChanged"] {
		const delta = calcScore(groupSize);
		this.score += delta;

		return { score: this.score, delta };
	}

	spendMove(): GameEventMap["movesChanged"] {
		this.movesLeft--;

		return { remaining: this.movesLeft };
	}

	hasWon(): boolean {
		return this.score >= this.targetScore;
	}

	hasMovesLeft(): boolean {
		return this.movesLeft > 0;
	}
}
