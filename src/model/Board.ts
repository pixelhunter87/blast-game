import { findGroup, getAffectedCells, pickSuperTileType } from "src/model/boardHelpers";
import { Player } from "src/model/Player.ts";
import type { BoardBombResult, BoardEndStateResult, BoardInitResult, BoardSwapResult, BoardTapResult, BoardUpdateResult, CellPos, ColorTileData, GameConfig, GameEventMap, PositionedTile, SuperSpawn, SuperTileData, SuperTileType, TileData, TileMove, TileType } from "src/types";

export type { BoardBombResult, BoardEndStateResult, BoardInitResult, BoardSwapResult, BoardTapResult } from "src/types";

export class Board {
	private grid: (TileData | undefined)[][];
	private nextTileId: number;
	private config: GameConfig;
	private player: Player;
	private shufflesUsed: number;

	constructor(config: GameConfig) {
		this.config = config;
		this.grid = [];
		this.nextTileId = 0;
		this.shufflesUsed = 0;
		this.player = new Player(config);
	}

	init(): BoardInitResult {
		this.grid = [];
		this.nextTileId = 0;
		this.shufflesUsed = 0;
		this.player = new Player(this.config);

		for (let row = 0; row < this.config.rows; row++) {
			this.grid[row] = [];

			for (let col = 0; col < this.config.cols; col++)
				this.grid[row][col] = this.createColorTile(this.randomType());
		}

		this.ensureValidGroup();

		return {
			boardReady: { tiles: this.getTilesSnapshot() },
			scoreChanged: { score: this.player.getScore(), delta: 0 },
			movesChanged: { remaining: this.player.getMovesLeft() },
		};
	}

	tapTile(row: number, col: number): BoardTapResult | undefined {
		const tile = this.grid[row]?.[col];
		if (!tile) return;
		if (tile.kind === "super") return this.activateSuperTile(row, col, tile);

		return this.tapColorTile(row, col, tile);
	}

	bombAt(row: number, col: number): BoardBombResult | undefined {
		const center = this.grid[row]?.[col];
		if (!center) return;

		const radius = this.config.boosters.bomb.radius;
		const hits: CellPos[] = [];
		for (let r = row - radius; r <= row + radius; r++) {
			for (let c = col - radius; c <= col + radius; c++) {
				if (r < 0 || r >= this.config.rows || c < 0 || c >= this.config.cols) continue;
				if (this.grid[r][c]) hits.push({ row: r, col: c });
			}
		}

		const cells = this.chainSuperBlasts(hits);
		if (cells.length === 0) return;

		const result = this.applyRemoval(cells, undefined);
		const scoreChanged = this.player.addScore(cells.length);
		const endState = this.checkEndConditions();

		return { ...result, ...endState, scoreChanged };
	}

	swapTiles(a: CellPos, b: CellPos): BoardSwapResult | undefined {
		if (a.row === b.row && a.col === b.col) return;

		const ta = this.grid[a.row]?.[a.col];
		const tb = this.grid[b.row]?.[b.col];
		if (!ta || !tb) return;

		this.grid[a.row][a.col] = tb;
		this.grid[b.row][b.col] = ta;

		return { tilesSwapped: { a, b }, ...this.checkEndConditions() };
	}

	private hasValidMoves(): boolean {
		for (let row = 0; row < this.config.rows; row++) {
			for (let col = 0; col < this.config.cols; col++)
				if (this.grid[row][col]?.kind === "super") return true;
		}

		return this.hasValidGroup();
	}

	private hasValidGroup(): boolean {
		const seen = new Set<string>();
		for (let row = 0; row < this.config.rows; row++) {
			for (let col = 0; col < this.config.cols; col++) {
				const key = `${row},${col}`;
				if (seen.has(key)) continue;

				const tile = this.grid[row][col];
				if (tile?.kind !== "color") continue;

				const group = findGroup(this.grid, this.config, row, col);
				group.forEach(({ row: r, col: c }) => seen.add(`${r},${c}`));
				if (group.length >= this.config.minGroupSize) return true;
			}
		}

		return false;
	}

	private ensureValidGroup(): void {
		if (this.hasValidGroup()) return;

		const byType = new Map<TileType, CellPos[]>();
		for (let row = 0; row < this.config.rows; row++) {
			for (let col = 0; col < this.config.cols; col++) {
				const tile = this.grid[row][col];
				if (tile?.kind !== "color") continue;

				const list = byType.get(tile.type) ?? [];
				list.push({ row, col });
				byType.set(tile.type, list);
			}
		}

		let pool: CellPos[] = [];
		byType.forEach((cells) => {
			if (cells.length > pool.length) pool = cells;
		});
		if (pool.length < this.config.minGroupSize || this.config.cols < this.config.minGroupSize) return;

		const inPool = new Set(pool.map(({ row, col }) => `${row},${col}`));
		const isTarget = (pos: CellPos): boolean => pos.row === 0 && pos.col < this.config.minGroupSize;

		for (let col = 0; col < this.config.minGroupSize; col++) {
			const targetKey = `0,${col}`;
			if (inPool.has(targetKey)) continue;

			const source = pool.find((p) => inPool.has(`${p.row},${p.col}`) && !isTarget(p));
			if (!source) return;

			const a = this.grid[0][col];
			const b = this.grid[source.row][source.col];
			this.grid[0][col] = b;
			this.grid[source.row][source.col] = a;

			inPool.delete(`${source.row},${source.col}`);
			inPool.add(targetKey);
		}
	}

	private tapColorTile(row: number, col: number, tile: ColorTileData): BoardTapResult | undefined {
		const group = findGroup(this.grid, this.config, row, col);
		if (group.length < this.config.minGroupSize) return;

		const movesChanged = this.player.spendMove();
		const superType = pickSuperTileType(group.length, this.config);
		const superSpawn = superType ? { cell: { row, col }, superType } : undefined;
		const result = this.applyRemoval(group, superSpawn, tile.type);
		const scoreChanged = this.player.addScore(group.length);
		const endState = this.checkEndConditions();

		return { ...result, ...endState, scoreChanged, movesChanged };
	}

	private activateSuperTile(row: number, col: number, tile: SuperTileData): BoardTapResult {
		const movesChanged = this.player.spendMove();
		const hits = getAffectedCells(tile.superType, { row, col }, this.config);
		const cells = this.chainSuperBlasts(hits);
		const result = this.applyRemoval(cells, undefined);
		const scoreChanged = this.player.addScore(cells.length);
		const endState = this.checkEndConditions();

		return { ...result, ...endState, scoreChanged, movesChanged };
	}

	/**
	 * Расширяет область поражения с учётом цепной реакции супер-фишек.
	 */
	private chainSuperBlasts(hits: CellPos[]): CellPos[] {
		const visited = new Set<string>();
		const cells: CellPos[] = [];
		const queue: CellPos[] = [...hits];
		let head = 0;

		while (head < queue.length) {
			const pos = queue[head++];
			if (pos.row < 0 || pos.row >= this.config.rows) continue;
			if (pos.col < 0 || pos.col >= this.config.cols) continue;

			const key = `${pos.row},${pos.col}`;
			if (visited.has(key)) continue;
			visited.add(key);

			const tile = this.grid[pos.row][pos.col];
			if (!tile) continue;

			cells.push({ row: pos.row, col: pos.col });
			if (tile.kind === "super") queue.push(...getAffectedCells(tile.superType, pos, this.config));
		}

		return cells;
	}

	private applyRemoval(cells: CellPos[], superSpawn: SuperSpawn | undefined, type?: TileType): BoardUpdateResult {
		this.removeGroup(cells);

		const result: BoardUpdateResult = { tilesRemoved: type === undefined ? { cells } : { cells, type } };
		if (superSpawn) {
			// Суперфишка появляется в исходной клетке после удаления всей группы.
			const superTile = this.createSuperTile(superSpawn.superType);
			this.grid[superSpawn.cell.row][superSpawn.cell.col] = superTile;
			result.superTileSpawned = { pos: superSpawn.cell, tile: superTile };
		}

		const dropped = this.applyGravity();
		if (dropped.length > 0) result.tilesDropped = { moves: dropped };

		const spawned = this.fillEmpty();
		if (spawned.length > 0) result.tilesSpawned = { tiles: spawned };

		return result;
	}

	private getTilesSnapshot(): PositionedTile[] {
		const tiles: PositionedTile[] = [];
		for (let row = 0; row < this.config.rows; row++) {
			for (let col = 0; col < this.config.cols; col++) {
				const tile = this.grid[row][col];
				if (tile) tiles.push({ pos: { row, col }, tile });
			}
		}

		return tiles;
	}

	private removeGroup(cells: CellPos[]): void {
		cells.forEach(({ row, col }) => this.grid[row][col] = undefined);
	}

	/**
	 * Роняет фишки под действием гравитации.
	 *
	 * Если супер-фишки по конфигу неподвижны, они работают как «якоря» и делят
	 * колонку на независимые сегменты — в каждом упаковка идёт отдельно, и
	 * супер-фишка остаётся на своём ряду. Если падают как обычные, якорей нет
	 * и сегмент один (вся колонка целиком).
	 */
	private applyGravity(): TileMove[] {
		const moves: TileMove[] = [];
		const superTilesCanDrop = this.config.superTiles.canDrop === true;

		for (let col = 0; col < this.config.cols; col++) {
			// Ряды, на которых стоят супер-якоря (если они не падают).
			const anchors: number[] = [];
			if (!superTilesCanDrop) {
				for (let r = 0; r < this.config.rows; r++)
					if (this.grid[r][col]?.kind === "super") anchors.push(r);
			}

			// Границы сегментов: -1 и rows — «виртуальные» края колонки,
			// между ними — якоря. Если якорей нет, сегмент один: вся колонка.
			const boundaries = [-1, ...anchors, this.config.rows];
			for (let i = 0; i < boundaries.length - 1; i++) {
				const segTop = boundaries[i] + 1;
				const segBottom = boundaries[i + 1] - 1;
				if (segTop > segBottom) continue;

				// Упаковка сегмента: идём снизу вверх, каждая встреченная фишка
				// сдвигается к позиции writeRow (нижней свободной в сегменте).
				let writeRow = segBottom;
				for (let row = segBottom; row >= segTop; row--) {
					const tile = this.grid[row][col];
					if (!tile) continue;

					if (row !== writeRow) {
						this.grid[writeRow][col] = tile;
						this.grid[row][col] = undefined;
						moves.push({ from: { row, col }, to: { row: writeRow, col }, tile });
					}
					writeRow--;
				}
			}
		}

		return moves;
	}

	private fillEmpty(): PositionedTile[] {
		const spawned: PositionedTile[] = [];

		for (let col = 0; col < this.config.cols; col++) {
			for (let row = 0; row < this.config.rows; row++) {
				if (!this.grid[row][col]) {
					const tile = this.createColorTile(this.randomType());
					this.grid[row][col] = tile;
					spawned.push({ pos: { row, col }, tile });
				}
			}
		}

		return spawned;
	}

	private createColorTile(type: TileType): ColorTileData {
		return { kind: "color", type, id: this.nextTileId++ };
	}

	private createSuperTile(superType: SuperTileType): SuperTileData {
		return { kind: "super", superType, id: this.nextTileId++ };
	}

	private randomType(): TileType {
		const types = Object.keys(this.config.tiles) as TileType[];
		return types[Math.floor(Math.random() * types.length)];
	}

	private checkEndConditions(): BoardEndStateResult {
		if (this.player.hasWon()) return { tilesShuffled: [], gameWon: true };

		if (!this.hasValidMoves()) {
			if (this.shufflesUsed < this.config.maxShuffles) {
				this.shufflesUsed++;

				// После перемешивания состояние проверяется ещё раз (поле всё ещё может оказаться без ходов).
				const tilesShuffled = [this.shuffle()];
				const nextState = this.checkEndConditions();
				return { ...nextState, tilesShuffled: [...tilesShuffled, ...nextState.tilesShuffled] };
			}

			return { tilesShuffled: [], gameLost: { reason: "noMoves" } };
		}

		if (!this.player.hasMovesLeft()) return { tilesShuffled: [], gameLost: { reason: "outOfMoves" } };

		return { tilesShuffled: [] };
	}

	private shuffle(): GameEventMap["tilesShuffled"] {
		const tiles: TileData[] = [];
		const positions: CellPos[] = [];
		for (let row = 0; row < this.config.rows; row++) {
			for (let col = 0; col < this.config.cols; col++) {
				const t = this.grid[row][col];
				if (t) {
					tiles.push(t);
					positions.push({ row, col });
				}
			}
		}

		for (let i = tiles.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[tiles[i], tiles[j]] = [tiles[j], tiles[i]];
		}

		positions.forEach((pos, i) => {
			this.grid[pos.row][pos.col] = tiles[i];
		});
		this.ensureValidGroup();

		const mappings: PositionedTile[] = positions.map((pos) => {
			const tile = this.grid[pos.row][pos.col];
			if (!tile) throw new Error(`shuffle: empty cell at ${pos.row},${pos.col}`);
			return { pos, tile };
		});
		return { tiles: mappings };
	}
}
