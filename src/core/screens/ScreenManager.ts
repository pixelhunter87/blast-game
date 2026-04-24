import type { Container } from "pixi.js";
import type { Screen } from "src/core/screens/Screen";

export class ScreenManager {
	private static stage: Container;
	private static currentScreen: Screen | undefined = undefined;

	static init(stage: Container): void {
		this.stage = stage;
	}

	static show(screen: Screen): void {
		if (this.currentScreen) {
			this.currentScreen.onHide();
			this.stage.removeChild(this.currentScreen);
			this.currentScreen.destroy({ children: true });
		}

		this.currentScreen = screen;
		this.stage.addChild(screen);
		screen.onShow();
	}
}
