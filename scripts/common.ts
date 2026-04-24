import { exec, spawn } from "child_process";
import { config as configDotenv } from "dotenv";
import * as fs from "fs/promises";
import * as Path from "path";

export const PROJECT_ROOT = Path.resolve("./").replaceAll("\\", "/");
configDotenv({ path: `${PROJECT_ROOT}/.env`, quiet: true });

export const TEXTURES_SRC = `${PROJECT_ROOT}/media/images`;

export const getFigmaAPIHeaders = (): Record<string, string> => {
	if (!process.env.FIGMA_API_TOKEN) throw new Error("FIGMA_API_TOKEN not found in .env file");

	return {
		"accept": "*/*",
		"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
		"content-type": "application/json",
		"X-Figma-Token": process.env.FIGMA_API_TOKEN,
	};
};

export const getTexturePackerPath = (): string => {
	let path = process.env.TEXTURE_PACKER_PATH;
	if (!path) throw new Error("TEXTURE_PACKER_PATH not found in .env file");
	if (process.platform == "win32") path = `"${path}"`;
	return path;
};

export const ensureCleanDir = async (path: string): Promise<void> => {
	await fs.rm(path, { recursive: true, force: true });
	await fs.mkdir(path);
};

export const asyncExec = async (cmd: string, options?: { streamOutput?: boolean; print?: boolean }): Promise<string> => {
	const res = await new Promise<string>((resolve, reject) => {
		if (options?.streamOutput) {
			const ps = spawn(cmd, { shell: true, windowsHide: true, env: process.env });

			let stdout = "";
			let stderr = "";

			ps.stdout.on("data", (d) => {
				const s = d.toString();
				stdout += s;
				process.stdout.write(s);
			});

			ps.stderr.on("data", (d) => {
				const s = d.toString();
				stderr += s;
				process.stderr.write(s);
			});

			ps.on("error", (e) => {
				reject(String(e));
			});

			ps.on("close", (code) => {
				if (code && code !== 0) {
					reject(`Command failed (${code}): ${cmd}\n\n${stdout}\n${stderr}`);
					return;
				}

				resolve(stdout);
			});

			return;
		}

		exec(cmd, { windowsHide: true, env: process.env }, (err, stdout, stderr) => {
			if (err) {
				reject(`Command failed: ${cmd}\n\n${stdout}\n${stderr}`);
				return;
			}

			resolve(stdout);
		});
	}).catch((err) => {
		throw new Error(String(err));
	});

	return res;
};

/** Разбивает массив на фрагменты фиксированного размера. */
export const chunkBy = <T>(arr: T[], chunkLength: number): T[][] => {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += chunkLength) {
		const chunk = arr.slice(i, i + chunkLength);
		out.push(chunk);
	}

	return out;
};
