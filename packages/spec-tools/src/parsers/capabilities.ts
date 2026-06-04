/**
 * _capabilities.md パーサー
 *
 * 形式（最小）：
 *   ## <capability-name>
 *   <説明（任意）>
 *
 * ## のすぐ次の見出し名を capability 名として抽出する。
 */

import { promises as fs } from "node:fs";
import type { Capability } from "../types.js";

export async function parseCapabilitiesFile(
  filePath: string,
): Promise<Capability[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
  return parseCapabilitiesContent(raw);
}

export function parseCapabilitiesContent(raw: string): Capability[] {
  const lines = raw.split(/\r?\n/);
  const items: Capability[] = [];
  let current: Capability | null = null;
  const descBuffer: string[] = [];

  const flush = () => {
    if (current) {
      const desc = descBuffer.join(" ").trim();
      if (desc.length > 0) current.description = desc;
      items.push(current);
    }
  };

  for (const line of lines) {
    const headerMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headerMatch) {
      flush();
      const name = (headerMatch[1] ?? "").trim();
      current = { name };
      descBuffer.length = 0;
      continue;
    }

    if (current && line.trim().length > 0) {
      descBuffer.push(line.trim());
    }
  }
  flush();

  return items.filter((c) => c.name.length > 0);
}
