import { Easing, Group, Tween } from "@tweenjs/tween.js";
import { Container, type DestroyOptions, Graphics, Ticker } from "pixi.js";
import { BOARD_SIZE, TILE_SIZE } from "src/const";
import type { GameEvents } from "src/core/EventBus";
import type { CellPos, GameConfig, Point, PositionedTile, TileData, TileMove } from "src/types";
import { createNineSlice, createRectMask } from "src/ui/primitives";
import { textureAliasFor, TileView } from "src/view/board/TileView.ts";

const layout = {
	backgroundSlice: {
		leftWidth: 100,
		topHeight: 100,
		rightWidth: 100,
		bottomHeight: 100,
	},
	tilesOffset: { x: 0, y: 58 },
} as const;

const animConfig = {
	removeDuration: 200,
	dropBaseDuration: 220,
	dropPerRowDuration: 40,
	swapDuration: 220,
	shuffleDuration: 380,
	superSpawnDuration: 320,
	bombWaveStepDuration: 60,
	bombPulseDuration: 90,
	bombPulseScale: 1.2,
	bombCollapseDuration: 210,
	bombPushDistance: 55,
	bombRotationMax: Math.PI * 0.9,
	bombShockwaveDuration: 280,
	bombShockwaveMaxScale: 5,
	bombShockwaveRadius: 60,
} as const;

type BoardViewHandlers = {
	onTapTile: (row: number, col: number) => boolean;
	onBombAt: (row: number, col: number) => boolean;
	onSwapTiles: (a: CellPos, b: CellPos) => boolean;
};

export class BoardView extends Container {
	private config: GameConfig;
	private handlers: BoardViewHandlers;
	private tiles = new Map<number, TileView>();
	private tilesLayer: Container;
	private animating = false;
	private teleportActive = false;
	private teleportFirst: TileView | undefined;
	private bombActive = false;
	private pendingExplosion: CellPos | undefined;
	private tweens = new Group();
	private pendingAnims = 0;
	private idleCallbacks: (() => void)[] = [];
	private tickerFn: () => void;

	constructor(config: GameConfig, events: GameEvents, handlers: BoardViewHandlers) {
		super();

		this.config = config;
		this.handlers = handlers;

		const bg = createNineSlice("bg_frame_play", { ...layout.backgroundSlice, width: BOARD_SIZE.width, height: BOARD_SIZE.height });
		this.addChild(bg);

		const gridWidth = config.cols * TILE_SIZE.width;
		const gridHeight = config.rows * TILE_SIZE.height;

		this.tilesLayer = new Container();
		this.tilesLayer.x = layout.tilesOffset.x + (BOARD_SIZE.width - gridWidth) / 2;
		this.tilesLayer.y = layout.tilesOffset.y;
		this.addChild(this.tilesLayer);

		const tilesMask = createRectMask({ x: this.tilesLayer.x, y: this.tilesLayer.y, width: gridWidth, height: gridHeight });
		this.addChild(tilesMask);
		this.tilesLayer.mask = tilesMask;

		this.tickerFn = () => this.tweens.update(performance.now());
		Ticker.shared.add(this.tickerFn);

		events.on("boardReady", (data) => this.buildInitialView(data.tiles));
		events.on("tilesRemoved", (data) => this.onTilesRemoved(data.cells));
		events.on("superTileSpawned", (data) => this.onSuperTileSpawned(data));
		events.on("tilesDropped", (data) => this.runAfterSuperEffect(() => this.onTilesDropped(data.moves)));
		events.on("tilesSpawned", (data) => this.runAfterSuperEffect(() => this.onTilesSpawned(data.tiles)));
		events.on("tilesSwapped", (data) => this.onTilesSwapped(data.a, data.b));
		events.on("tilesShuffled", (data) => this.onTilesShuffled(data.tiles));
		events.on("boosterActivated", (data) => {
			if (data.type === "teleport") this.teleportActive = true;
			if (data.type === "bomb") this.bombActive = true;
		});
		events.on("boosterDeactivated", () => this.cancelBoosters());
	}

	runAfterAnimations(callback: () => void): void {
		if (this.pendingAnims === 0) {
			callback();
			return;
		}

		this.idleCallbacks.push(callback);
	}

	override destroy(options?: DestroyOptions): void {
		Ticker.shared.remove(this.tickerFn);
		this.tweens.removeAll();
		this.idleCallbacks = [];
		this.pendingAnims = 0;
		super.destroy(options);
	}

	private runAfterSuperEffect(fn: () => void): void {
		if (this.pendingExplosion) this.runAfterAnimations(fn);
		else fn();
	}

	private trackAnim(tween: Tween, onDone?: () => void): void {
		this.pendingAnims++;
		tween.onComplete(() => {
			onDone?.();
			this.pendingAnims--;

			if (this.pendingAnims === 0) {
				this.animating = false;

				const cbs = this.idleCallbacks;
				this.idleCallbacks = [];
				cbs.forEach((cb) => cb());
			}
		});
	}

	private cancelBoosters(): void {
		this.teleportActive = false;
		this.bombActive = false;

		if (this.teleportFirst) this.teleportFirst.alpha = 1;

		this.teleportFirst = undefined;
	}

	private buildInitialView(tiles: PositionedTile[]): void {
		this.tilesLayer.removeChildren().forEach((child) => child.destroy());
		this.tiles.clear();
		tiles.forEach(({ pos, tile }) => this.createTileView(pos.row, pos.col, tile));
	}

	private createTileView(row: number, col: number, tile: TileData): TileView {
		const alias = textureAliasFor(tile, this.config);
		const view = new TileView(tile, row, col, alias);
		this.placeTile(view, row, col);
		view.on("pointertap", () => this.onTileClick(view));
		this.tilesLayer.addChild(view);
		this.tiles.set(tile.id, view);
		return view;
	}

	private findTileAt(cell: CellPos): TileView | undefined {
		let found: TileView | undefined;
		this.tiles.forEach((view) => {
			if (!found && view.row === cell.row && view.col === cell.col) found = view;
		});

		return found;
	}

	private onSuperTileSpawned(data: PositionedTile): void {
		const view = this.createTileView(data.pos.row, data.pos.col, data.tile);
		const finalScaleX = view.scale.x;
		const finalScaleY = view.scale.y;
		view.scale.set(0);

		const tween = new Tween(view.scale, this.tweens)
			.to({ x: finalScaleX, y: finalScaleY }, animConfig.superSpawnDuration)
			.easing(Easing.Back.Out);
		this.trackAnim(tween);
		tween.start();
	}

	private placeTile(view: TileView, row: number, col: number): void {
		const { x, y } = tileCenter(row, col);
		view.x = x;
		view.y = y;

		view.row = row;
		view.col = col;
	}

	private onTileClick(view: TileView): void {
		if (this.animating) return;

		const { row, col } = view;
		if (this.teleportActive) {
			this.onTeleportTileClick(view);
			return;
		}

		if (this.bombActive) {
			this.animating = true;
			this.pendingExplosion = { row, col };

			const success = this.handlers.onBombAt(row, col);
			this.pendingExplosion = undefined;

			if (!success) this.animating = false;
			return;
		}

		this.animating = true;

		if (view.tile.kind === "super") this.pendingExplosion = { row, col };

		const success = this.handlers.onTapTile(row, col);
		this.pendingExplosion = undefined;

		if (!success) this.animating = false;
	}

	private onTeleportTileClick(view: TileView): void {
		if (!this.teleportFirst) {
			this.teleportFirst = view;
			view.alpha = 0.5;
			return;
		}

		if (this.teleportFirst === view) {
			view.alpha = 1;
			this.teleportFirst = undefined;
			return;
		}

		if (sameTileType(this.teleportFirst.tile, view.tile)) return;

		const first = this.teleportFirst;
		first.alpha = 1;

		this.teleportFirst = undefined;
		this.animating = true;

		const success = this.handlers.onSwapTiles({ row: first.row, col: first.col }, { row: view.row, col: view.col });
		if (!success) this.animating = false;
	}

	private onTilesShuffled(tiles: PositionedTile[]): void {
		tiles.forEach(({ pos, tile }) => {
			const view = this.tiles.get(tile.id);
			if (!view) return;

			view.row = pos.row;
			view.col = pos.col;

			const target = tileCenter(pos.row, pos.col);
			const tween = new Tween(view, this.tweens)
				.to(target, animConfig.shuffleDuration)
				.easing(Easing.Quadratic.InOut);
			this.trackAnim(tween);
			tween.start();
		});
	}

	private onTilesSwapped(a: CellPos, b: CellPos): void {
		const va = this.findTileAt(a);
		const vb = this.findTileAt(b);
		if (!va || !vb) return;

		va.row = b.row;
		va.col = b.col;
		vb.row = a.row;
		vb.col = a.col;

		const t1 = new Tween(va, this.tweens).to(tileCenter(b.row, b.col), animConfig.swapDuration).easing(Easing.Quadratic.InOut);
		const t2 = new Tween(vb, this.tweens).to(tileCenter(a.row, a.col), animConfig.swapDuration).easing(Easing.Quadratic.InOut);
		this.trackAnim(t1);
		this.trackAnim(t2);

		t1.start();
		t2.start();
	}

	private onTilesRemoved(cells: CellPos[]): void {
		const keys = new Set(cells.map((c) => `${c.row},${c.col}`));
		const dead: TileView[] = [];
		this.tiles.forEach((view) => {
			if (keys.has(`${view.row},${view.col}`)) dead.push(view);
		});

		// Центр взрыва сохраняется заранее, потому что к этому моменту исходная фишка уже может быть удалена из модели поля.
		if (this.pendingExplosion) this.explodeBombWave(this.pendingExplosion, dead);
		else this.collapseTiles(dead);
	}

	private collapseTiles(dead: TileView[]): void {
		dead.forEach((view) => {
			this.tiles.delete(view.tile.id);
			let remainingTweens = 2;
			const destroyWhenDone = (): void => {
				remainingTweens--;
				if (remainingTweens === 0) view.destroy();
			};

			const scaleTween = new Tween(view.scale, this.tweens).to({ x: 0, y: 0 }, animConfig.removeDuration).easing(Easing.Back.In);
			const alphaTween = new Tween(view, this.tweens).to({ alpha: 0 }, animConfig.removeDuration);
			this.trackAnim(scaleTween, destroyWhenDone);
			this.trackAnim(alphaTween, destroyWhenDone);

			scaleTween.start();
			alphaTween.start();
		});
	}

	private explodeBombWave(center: CellPos, dead: TileView[]): void {
		const pos = tileCenter(center.row, center.col);
		this.spawnShockwave(pos);

		dead.forEach((view) => {
			this.tiles.delete(view.tile.id);
			let remainingTweens = 2;
			const destroyWhenDone = (): void => {
				remainingTweens--;
				if (remainingTweens === 0) view.destroy();
			};

			const dist = Math.max(Math.abs(view.row - center.row), Math.abs(view.col - center.col));
			const delay = dist * animConfig.bombWaveStepDuration;
			const dx = view.x - pos.x;
			const dy = view.y - pos.y;
			const len = Math.hypot(dx, dy) || 1;
			const pushX = view.x + (dx / len) * animConfig.bombPushDistance * (dist === 0 ? 0 : 1);
			const pushY = view.y + (dy / len) * animConfig.bombPushDistance * (dist === 0 ? 0 : 1);
			const rotTarget = (Math.random() * 2 - 1) * animConfig.bombRotationMax;

			const pulse = new Tween(view.scale, this.tweens)
				.delay(delay)
				.to({ x: animConfig.bombPulseScale, y: animConfig.bombPulseScale }, animConfig.bombPulseDuration)
				.easing(Easing.Sinusoidal.Out);

			const collapse = new Tween(view.scale, this.tweens)
				.to({ x: 0, y: 0 }, animConfig.bombCollapseDuration)
				.easing(Easing.Sinusoidal.In);

			pulse.chain(collapse);

			const scatter = new Tween(view, this.tweens)
				.delay(delay + animConfig.bombPulseDuration)
				.to({ x: pushX, y: pushY, rotation: rotTarget, alpha: 0 }, animConfig.bombCollapseDuration)
				.easing(Easing.Sinusoidal.InOut);

			this.trackAnim(collapse, destroyWhenDone);
			this.trackAnim(scatter, destroyWhenDone);

			pulse.start();
			scatter.start();
		});
	}

	private spawnShockwave(pos: Point): void {
		const wave = new Graphics();
		let remainingTweens = 2;
		const destroyWhenDone = (): void => {
			remainingTweens--;
			if (remainingTweens === 0) wave.destroy();
		};
		wave.circle(0, 0, animConfig.bombShockwaveRadius);
		wave.stroke({ color: 0xffffff, width: 8, alpha: 0.9 });
		wave.x = pos.x;
		wave.y = pos.y;
		wave.scale.set(0.3);
		this.tilesLayer.addChild(wave);

		const scaleTween = new Tween(wave.scale, this.tweens)
			.to({ x: animConfig.bombShockwaveMaxScale, y: animConfig.bombShockwaveMaxScale }, animConfig.bombShockwaveDuration)
			.easing(Easing.Sinusoidal.Out)
			.onComplete(destroyWhenDone);

		const alphaTween = new Tween(wave, this.tweens)
			.to({ alpha: 0 }, animConfig.bombShockwaveDuration)
			.easing(Easing.Sinusoidal.Out)
			.onComplete(destroyWhenDone);

		scaleTween.start();
		alphaTween.start();
	}

	private tweenDrop(view: TileView, target: Point, rowsDropped: number): void {
		const tween = new Tween(view, this.tweens)
			.to({ y: target.y }, animConfig.dropBaseDuration + rowsDropped * animConfig.dropPerRowDuration)
			.easing(Easing.Quadratic.In);
		this.trackAnim(tween);
		tween.start();
	}

	private onTilesDropped(moves: TileMove[]): void {
		moves.forEach(({ from, to, tile }) => {
			const view = this.tiles.get(tile.id);
			if (!view) return;

			view.row = to.row;
			view.col = to.col;

			const rowsDropped = Math.max(1, to.row - from.row);
			this.tweenDrop(view, tileCenter(to.row, to.col), rowsDropped);
		});
	}

	private onTilesSpawned(tiles: PositionedTile[]): void {
		tiles.forEach(({ pos, tile }) => {
			const view = this.createTileView(pos.row, pos.col, tile);
			const target = tileCenter(pos.row, pos.col);
			view.y = target.y - TILE_SIZE.height - pos.row * TILE_SIZE.height;

			this.tweenDrop(view, target, pos.row + 1);
		});
	}
}

const tileCenter = (row: number, col: number): Point => ({ x: col * TILE_SIZE.width + TILE_SIZE.width / 2, y: row * TILE_SIZE.height + TILE_SIZE.height / 2 });

const sameTileType = (a: TileData, b: TileData): boolean => {
	if (a.kind === "color" && b.kind === "color") return a.type === b.type;
	if (a.kind === "super" && b.kind === "super") return a.superType === b.superType;

	return false;
};
