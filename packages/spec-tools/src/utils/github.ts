/**
 * GitHub 連携のユーティリティ。
 *
 * - 環境変数 GITHUB_TOKEN / GITHUB_REPOSITORY (owner/repo) を読む
 * - octokit クライアントを返す
 */

import { Octokit } from "@octokit/rest";

export interface RepoContext {
  owner: string;
  repo: string;
  octokit: Octokit;
}

export function createRepoContext(): RepoContext {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token) {
    throw new Error(
      "環境変数 GITHUB_TOKEN が設定されていません。GitHub Actions の `secrets.GITHUB_TOKEN` を渡してください。",
    );
  }
  if (!repository || !repository.includes("/")) {
    throw new Error(
      "環境変数 GITHUB_REPOSITORY が設定されていません（owner/repo の形式）。",
    );
  }

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    throw new Error(`GITHUB_REPOSITORY の形式が不正です: ${repository}`);
  }

  const octokit = new Octokit({ auth: token });
  return { owner, repo, octokit };
}
