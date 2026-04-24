import type { BoardGrid, CellPos, GameConfig, GridSize, SuperTileType } from "src/types";
import { SUPER_TILE_TYPE } from "src/types";

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

const neighbors = (size: GridSize, pos: CellPos): CellPos[] => {
	const out: CellPos[] = [];
	for (const [dr, dc] of DIRS) {
		const row = pos.row + dr;
		const col = pos.col + dc;
		if (row >= 0 && row < size.rows && col >= 0 && col < size.cols) out.push({ row, col });
	}

	return out;
};

const rowCells = (row: number, size: GridSize): CellPos[] => {
	const cells: CellPos[] = [];
	for (let c = 0; c < size.cols; c++)
		cells.push({ row, col: c });

	return cells;
};

const colCells = (col: number, size: GridSize): CellPos[] => {
	const cells: CellPos[] = [];
	for (let r = 0; r < size.rows; r++)
		cells.push({ row: r, col });

	return cells;
};

const radiusCells = (cell: CellPos, radius: number, size: GridSize): CellPos[] => {
	const cells: CellPos[] = [];
	for (let r = cell.row - radius; r <= cell.row + radius; r++) {
		for (let c = cell.col - radius; c <= cell.col + radius; c++) {
			if (r < 0 || r >= size.rows || c < 0 || c >= size.cols) continue;
			cells.push({ row: r, col: c });
		}
	}

	return cells;
};

const allCells = (size: GridSize): CellPos[] => {
	const cells: CellPos[] = [];
	for (let r = 0; r < size.rows; r++) {
		for (let c = 0; c < size.cols; c++)
			cells.push({ row: r, col: c });
	}

	return cells;
};

export const getAffectedCells = (superType: SuperTileType, cell: CellPos, config: GameConfig): CellPos[] => {
	switch (superType) {
		case SUPER_TILE_TYPE.ROCKET_ROW:
			return rowCells(cell.row, config);
		case SUPER_TILE_TYPE.ROCKET_COL:
			return colCells(cell.col, config);
		case SUPER_TILE_TYPE.BOMB:
			return radiusCells(cell, config.superTiles.bombRadius, config);
		case SUPER_TILE_TYPE.BOMB_MAX:
			return allCells(config);
	}
};

export const pickSuperTileType = (groupSize: number, config: GameConfig): SuperTileType | undefined => {
	const spawnRules = [...config.superTiles.spawnRules].sort((a, b) => b.minGroupSize - a.minGroupSize);
	for (const rule of spawnRules)
		if (groupSize >= rule.minGroupSize) return rule.types[Math.floor(Math.random() * rule.types.length)];

	return undefined;
};

export const findGroup = (grid: BoardGrid, config: GameConfig, row: number, col: number): CellPos[] => {
	const tile = grid[row][col];
	if (!tile || tile.kind !== "color") return [];

	const visited = new Set<string>([`${row},${col}`]);
	const queue: CellPos[] = [{ row, col }];

	// индекс следующей необработанной клетки в queue
	let head = 0;

	while (head < queue.length) {
		const pos = queue[head++];
		for (const n of neighbors(config, pos)) {
			const key = `${n.row},${n.col}`;
			if (visited.has(key)) continue;

			const neighbor = grid[n.row][n.col];
			if (neighbor?.kind === "color" && neighbor.type === tile.type) {
				visited.add(key);
				queue.push(n);
			}
		}
	}

	return queue;
};
