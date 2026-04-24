import { Container } from "pixi.js";

export abstract class Screen extends Container {
	abstract onShow(): void;
	abstract onHide(): void;
}
