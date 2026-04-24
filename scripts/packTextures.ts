import * as fs from "fs/promises";
import { asyncExec, ensureCleanDir, getTexturePackerPath, PROJECT_ROOT, TEXTURES_SRC } from "./common";

const OUT_DIR = `${PROJECT_ROOT}/public/assets/textures`;

const packTextures = async (): Promise<void> => {
	console.log("-- Pack textures --");

	await ensureCleanDir(OUT_DIR);
	await createAtlas(TEXTURES_SRC, OUT_DIR, "assets");
};

const COMMON_ARGS = [
	"--trim-sprite-names",
	"--max-size 2048",
	"--pack-mode Best",
	"--algorithm MaxRects",
	"--enable-rotation",
	"--alpha-handling ReduceBorderArtifacts",
	"--dither-type FloydSteinbergAlpha",
	"--trim-mode None",
];

export const createAtlas = async (src: string, out: string, name: string, options?: { scale?: number; quality?: number }): Promise<void> => {
	const format = "webp";
	const isMultipack = (await fs.stat(src)).isDirectory();

	let outPath = `${out}/${name}`;
	if (isMultipack) outPath += "_{n}";
	if (options?.scale) outPath += `@${options.scale}x`;

	const args = [
		...COMMON_ARGS,
		"--format pixijs4",
		`--texture-format ${format} --webp-quality ${options?.quality ?? 80}`,
		`--scale ${options?.scale ?? 1}`,
	];

	if (isMultipack) {
		args.push("--multipack");
		args.push("--shape-padding 4 --border-padding 4");
		args.push("--size-constraints POT");
	}

	await asyncExec(`${getTexturePackerPath()} ${args.join(" ")} --sheet ${outPath}.${format} --data ${outPath}.json ${src}`);
	if (!isMultipack) await fs.rm(`${outPath}.json`, { recursive: true, force: true });
};

await packTextures();
