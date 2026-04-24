import { Application } from "pixi.js";
import { FIGMA_LAYOUT_SIZE } from "src/const.ts";
import { GameAssets } from "src/core/GameAssets";
import { ScreenManager } from "src/core/screens/ScreenManager";
import { MenuScreen } from "src/screens/MenuScreen.ts";
import { TableScreen } from "src/screens/TableScreen.ts";
import type { GameConfig } from "src/types";
import { calcResolutionScale, clamp, roundTo } from "src/utils/math";

export class Game {
	private app: Application;
	private config: GameConfig | undefined = undefined;

	constructor() {
		this.app = new Application();
	}

	async start(container: HTMLElement): Promise<void> {
		await this.app.init({
			width: FIGMA_LAYOUT_SIZE.width,
			height: FIGMA_LAYOUT_SIZE.height,
			resolution: clamp(window.devicePixelRatio, 1, 2),
			preference: "webgl",
			antialias: false,
		});
		container.appendChild(this.app.canvas);

		this.config = await this.loadConfig();
		await GameAssets.init();
		ScreenManager.init(this.app.stage);

		this.showMenu();

		this.resize();
		window.addEventListener("resize", this.resize);
	}

	private async loadConfig(): Promise<GameConfig> {
		const response = await fetch("assets/config.json");
		const json = await response.json() as GameConfig;
		return json;
	}

	private resize = (): void => {
		const scale = roundTo(calcResolutionScale(FIGMA_LAYOUT_SIZE, { width: window.innerWidth, height: window.innerHeight }));
		this.app.canvas.style.width = `${FIGMA_LAYOUT_SIZE.width * scale}px`;
		this.app.canvas.style.height = `${FIGMA_LAYOUT_SIZE.height * scale}px`;
	};

	private showMenu(): void {
		ScreenManager.show(new MenuScreen(() => this.showTable()));
	}

	private showTable(): void {
		ScreenManager.show(new TableScreen(this.config!, () => this.showMenu()));
	}
}
