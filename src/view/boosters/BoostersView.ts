import { Container, Text } from "pixi.js";
import type { GameEvents } from "src/core/EventBus";
import { FONT_FAMILY } from "src/core/GameAssets";
import { BOOSTER_TYPE, type BoosterType, type GameConfig, type GameEventMap } from "src/types";
import { boosterSlotLayout, BoosterSlotView } from "src/view/boosters/BoosterSlotView";

const layout = {
	titleX: 340,
	slotY: 107,
} as const;

type BoosterSlot = {
	type: BoosterType;
	iconAlias: string;
	applyEvent: keyof GameEventMap;
};

const boosterSlotDefs: readonly BoosterSlot[] = [
	{ type: BOOSTER_TYPE.TELEPORT, iconAlias: "icon_booster_teleport", applyEvent: "tilesSwapped" },
	{ type: BOOSTER_TYPE.BOMB, iconAlias: "block_bomb", applyEvent: "tilesRemoved" },
];

export class BoostersView extends Container {
	private events: GameEvents;
	private activeType: BoosterType | undefined;
	private slots: Map<BoosterType, BoosterSlotView> = new Map();

	constructor(config: GameConfig, events: GameEvents) {
		super();

		this.events = events;

		const title = new Text({ text: "Бустеры", style: { fill: 0xffffff, fontSize: 80, fontFamily: FONT_FAMILY } });
		title.anchor.x = 0.5;
		title.x = layout.titleX;
		this.addChild(title);

		boosterSlotDefs.forEach((def, i) => {
			const slot = new BoosterSlotView(def.iconAlias, config.boosters[def.type].count, () => this.onSlotClick(def.type));
			slot.x = i * boosterSlotLayout.width;
			slot.y = layout.slotY;
			this.addChild(slot);
			this.slots.set(def.type, slot);

			this.events.on(def.applyEvent, () => this.onBoosterUsed(def.type));
		});
	}

	private onSlotClick(type: BoosterType): void {
		const slot = this.slots.get(type);
		if (!slot || slot.getCount() <= 0) return;

		if (this.activeType === type) {
			this.deactivate();
			return;
		}

		if (this.activeType) this.deactivate();

		this.activeType = type;
		slot.setSelected(true);
		this.events.emit("boosterActivated", { type });
	}

	private deactivate(): void {
		if (!this.activeType) return;

		this.slots.get(this.activeType)?.setSelected(false);
		this.activeType = undefined;
		this.events.emit("boosterDeactivated", undefined);
	}

	private onBoosterUsed(type: BoosterType): void {
		if (this.activeType !== type) return;

		const slot = this.slots.get(type);
		if (!slot) return;

		slot.setCount(slot.getCount() - 1);
		this.deactivate();
	}
}
