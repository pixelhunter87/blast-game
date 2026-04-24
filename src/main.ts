import { Game } from "src/Game.ts";

const game = new Game();
await game.start(document.getElementById("app")!);
