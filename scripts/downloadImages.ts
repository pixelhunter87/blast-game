import * as fs from "fs/promises";
import { chunkBy, getFigmaAPIHeaders, TEXTURES_SRC } from "./common";

const downloadImages = async (): Promise<void> => {
	console.log("-- Download images from Figma --");

	await downloadImagesFromFigma("https://www.figma.com/design/UJxE6kqvNCWeAqsFjNugHh/Test-task-Match-3?node-id=35-29");
};

const downloadImagesFromFigma = async (url: string): Promise<void> => {
	const { fileId, layerId } = parseFigmaLayoutUrl(url);

	// Загружаем узел из Figma и берём только видимые дочерние слои.
	const resRaw = await fetch(`https://api.figma.com/v1/files/${fileId}/nodes?ids=${layerId}`, { headers: getFigmaAPIHeaders() });
	const res = await resRaw.json();
	if (res.err) throw Error(res.err);

	let layers: any[] = res.nodes[layerId].document.children;
	layers = layers.filter((layer) => !Object.hasOwn(layer, "visible") || layer.visible);

	// Figma ограничивает количество id в одном запросе, поэтому экспорт идёт пачками.
	const downloadUrls: Record<string, string> = {};
	for (const ids of chunkBy(layers.map((layer) => layer.id), 100)) {
		await fetch(`https://api.figma.com/v1/images/${fileId}?format=png&scale=1&use_absolute_bounds=true&ids=${ids.join(",")}`, { headers: getFigmaAPIHeaders() })
			.then((res) => res.json())
			.then((res) => Object.assign(downloadUrls, res.images));
	}

	// По полученным ссылкам сохраняем PNG в локальную папку текстур.
	await Promise.all(layers.map(async (layer) => {
		await fetch(downloadUrls[layer.id], { headers: getFigmaAPIHeaders() })
			.then((res) => res.arrayBuffer())
			.then((bytes) => fs.writeFile(`${TEXTURES_SRC}/${layer.name}.png`, new Uint8Array(bytes)));
	}));
};

const parseFigmaLayoutUrl = (link: string): { fileId: string; fileName: string; layerId: string } => {
	const fileId = link.split("/").at(4);
	const fileName = link.split("/").at(-1)?.split("?").at(0);
	const layerId = link.split("?").at(-1)?.split("&").find((s) => s.includes("node-id"))?.split("=").at(-1)?.replace("-", ":");
	if (!fileId || !layerId || !fileName) throw new Error("failed to parse link to figma layer (it is probably incorrect)");
	return { fileId, fileName, layerId };
};

await downloadImages();
