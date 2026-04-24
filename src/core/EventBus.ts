import type { GameEventMap } from "src/types";

type Handler<T> = (data: T) => void;

export class EventBus<TEvents extends object> {
	private listeners = new Map<keyof TEvents, Set<Handler<never>>>();

	on<K extends keyof TEvents>(event: K, handler: Handler<TEvents[K]>): void {
		if (!this.listeners.has(event)) this.listeners.set(event, new Set());

		this.listeners.get(event)!.add(handler as Handler<never>);
	}

	emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
		const handlers = this.listeners.get(event);
		if (!handlers) return;

		handlers.forEach((handler) => (handler as Handler<TEvents[K]>)(data));
	}

	clear(): void {
		this.listeners.clear();
	}
}

export type GameEvents = EventBus<GameEventMap>;
