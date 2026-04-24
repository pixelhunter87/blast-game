import type { Size } from "src/types";

/** Возвращает масштаб, при котором макет целиком помещается в целевое разрешение. */
export const calcResolutionScale = (originalRes: Size, targetRes: Size): number => {
	let scale = roundTo(targetRes.height / originalRes.height);
	if ((originalRes.width * scale) > targetRes.width) scale = roundTo(targetRes.width / originalRes.width);
	if (scale > 1) scale = 1;

	return scale;
};

/** Округляет число до указанной точности. */
export const roundTo = (n: number, precision = 2): number => {
	const mul = Math.pow(10, precision);
	return Math.round(n * mul) / mul;
};

/** Ограничивает число диапазоном от `min` до `max` включительно. */
export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
