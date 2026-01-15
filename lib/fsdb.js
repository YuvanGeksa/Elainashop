import fs from "fs/promises";
import path from "path";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson(filePath, fallback) {
  try {
    const txt = await fs.readFile(filePath, "utf-8");
    return JSON.parse(txt);
  } catch {
    return fallback;
  }
}

export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, filePath);
}

export async function listFiles(dir) {
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    return items.filter(d => d.isFile()).map(d => d.name);
  } catch {
    return [];
  }
}
