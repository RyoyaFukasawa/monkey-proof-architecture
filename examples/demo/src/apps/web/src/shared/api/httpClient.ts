/**
 * shared/api — 技術的土台。ドメイン知識ゼロ。
 *
 * MPA: shared は最下位レイヤー。features/entities を一切知らない。
 * ここに「post」「like」などのドメイン語彙が出てきたら SR-4 違反（語彙汚染）。
 */

const BASE_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
