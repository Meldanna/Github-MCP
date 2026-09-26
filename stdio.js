#!/usr/bin/env node
// ==================== GitHub MCP Server v2.0 - stdio 版 ====================
// 适用于 Claude Code / VS Code
// 用法：node stdio.js

import { createInterface } from "readline";

// ==================== 配置 ====================
const config = {
  token: process.env.GITHUB_TOKEN,
  owner: process.env.GITHUB_OWNER || "",
  repo: process.env.GITHUB_REPO || ""
};

if (!config.token) {
  process.stderr.write("❌ 错误: 请设置 GITHUB_TOKEN 环境变量\n");
  process.exit(1);
}

// ==================== 工具定义 ====================
const REPO_PARAMS = {
  owner: { type: "string", description: "仓库所有者，不填则使用默认配置", default: "" },
  repo: { type: "string", description: "仓库名称，不填则使用默认配置", default: "" }
};

const TOOLS = [
  {
    name: "create_repo",
    description: "创建一个新的 GitHub 仓库。",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "仓库名称" },
        description: { type: "string", description: "仓库描述", default: "" },
        private: { type: "boolean", description: "是否为私有仓库", default: false },
        auto_init: { type: "boolean", description: "是否自动创建 README", default: true }
      },
      required: ["name"]
    }
  },
  {
    name: "delete_repo",
    description: "删除一个 GitHub 仓库（危险操作！）。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, confirm: { type: "string", description: "输入仓库名确认删除" } },
      required: ["repo", "confirm"]
    }
  },
  {
    name: "list_repos",
    description: "列出用户的所有 GitHub 仓库。",
    inputSchema: {
      type: "object",
      properties: {
        sort: { type: "string", description: "排序：created, updated, pushed, full_name", default: "updated" },
        per_page: { type: "number", description: "数量，最大100", default: 30 }
      }
    }
  },
  {
    name: "get_repo_info",
    description: "获取仓库的详细信息。",
    inputSchema: { type: "object", properties: { ...REPO_PARAMS } }
  },
  {
    name: "list_files",
    description: "列出仓库的文件目录结构。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, path: { type: "string", description: "目录路径，默认根目录", default: "" } }
    }
  },
  {
    name: "read_file",
    description: "读取仓库中指定文件的内容。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, path: { type: "string", description: "文件路径" } },
      required: ["path"]
    }
  },
  {
    name: "search_code",
    description: "在仓库中搜索包含关键词的代码。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, keyword: { type: "string", description: "搜索关键词" } },
      required: ["keyword"]
    }
  },
  {
    name: "create_or_update_file",
    description: "创建或更新仓库中的文件，自动提交。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        path: { type: "string", description: "文件路径" },
        content: { type: "string", description: "文件内容" },
        message: { type: "string", description: "提交信息", default: "Update via MCP" },
        branch: { type: "string", description: "目标分支，默认主分支", default: "" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "delete_file",
    description: "删除仓库中的文件。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, path: { type: "string", description: "文件路径" }, message: { type: "string", description: "提交信息", default: "Delete via MCP" } },
      required: ["path"]
    }
  },
  {
    name: "create_issue",
    description: "创建一个新 Issue。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        title: { type: "string", description: "标题" },
        body: { type: "string", description: "内容（Markdown）", default: "" },
        labels: { type: "array", items: { type: "string" }, description: "标签", default: [] }
      },
      required: ["title"]
    }
  },
  {
    name: "list_issues",
    description: "列出仓库的 Issue。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, state: { type: "string", description: "状态：open, closed, all", default: "open" }, per_page: { type: "number", description: "数量", default: 10 } }
    }
  },
  {
    name: "close_issue",
    description: "关闭一个 Issue。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, issue_number: { type: "number", description: "Issue 编号" } },
      required: ["issue_number"]
    }
  },
  {
    name: "comment_issue",
    description: "给 Issue 添加评论。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, issue_number: { type: "number", description: "Issue 编号" }, body: { type: "string", description: "评论内容" } },
      required: ["issue_number", "body"]
    }
  },
  {
    name: "list_branches",
    description: "列出仓库的所有分支。",
    inputSchema: { type: "object", properties: { ...REPO_PARAMS } }
  },
  {
    name: "create_branch",
    description: "创建新分支。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, branch_name: { type: "string", description: "新分支名" }, from_branch: { type: "string", description: "基于哪个分支", default: "main" } },
      required: ["branch_name"]
    }
  },
  {
    name: "create_pull_request",
    description: "创建 Pull Request。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, title: { type: "string", description: "PR 标题" }, body: { type: "string", description: "PR 描述", default: "" }, head: { type: "string", description: "源分支" }, base: { type: "string", description: "目标分支", default: "main" } },
      required: ["title", "head"]
    }
  },
  {
    name: "list_pull_requests",
    description: "列出 Pull Request。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS, state: { type: "string", description: "状态：open, closed, all", default: "open" } }
    }
  }
];

// ==================== GitHub API ====================
function resolveRepo(args) {
  return {
    owner: (args && args.owner) || config.owner,
    repo: (args && args.repo) || config.repo
  };
}

async function githubFetch(method, url, body = null) {
  const headers = {
    "Authorization": `Bearer ${config.token}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "MCP-GitHub-Server"
  };
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API ${res.status}: ${err}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function repoAPI(owner, repo, method, endpoint, body = null) {
  return githubFetch(method, `https://api.github.com/repos/${owner}/${repo}${endpoint}`, body);
}

// ==================== 工具实现 ====================
async function callTool(name, args) {
  const { owner, repo } = resolveRepo(args);

  switch (name) {
    case "create_repo": {
      const data = await githubFetch("POST", "https://api.github.com/user/repos", {
        name: args.name, description: args.description || "", private: args.private || false,
        auto_init: args.auto_init !== undefined ? args.auto_init : true
      });
      return `✅ 仓库创建成功！\n📦 ${data.full_name}\n🔗 ${data.html_url}`;
    }
    case "delete_repo": {
      if (args.confirm !== args.repo) return `❌ 确认失败！`;
      await githubFetch("DELETE", `https://api.github.com/repos/${owner}/${repo}`);
      return `✅ 仓库 ${owner}/${repo} 已删除。`;
    }
    case "list_repos": {
      const data = await githubFetch("GET", `https://api.github.com/user/repos?sort=${args.sort || "updated"}&per_page=${args.per_page || 30}`);
      if (!data.length) return "没有找到仓库";
      return data.map((r, i) => `${i + 1}. ${r.private ? "🔒" : "📦"} ${r.full_name}${r.stargazers_count ? ` ⭐${r.stargazers_count}` : ""}\n   ${r.description || "(无描述)"}`).join("\n\n");
    }
    case "get_repo_info": {
      const data = await repoAPI(owner, repo, "GET", "");
      return `📦 ${data.full_name}\n📝 ${data.description || "(无描述)"}\n⭐ ${data.stargazers_count} | 🍴 ${data.forks_count}\n🌿 ${data.default_branch}\n🔗 ${data.html_url}`;
    }
    case "list_files": {
      const data = await repoAPI(owner, repo, "GET", `/contents/${args.path || ""}`);
      if (!Array.isArray(data)) return `${args.path} 是文件不是目录`;
      return data.map(i => `${i.type === "dir" ? "📁" : "📄"} ${i.path}${i.size ? ` (${i.size}B)` : ""}`).join("\n");
    }
    case "read_file": {
      const data = await repoAPI(owner, repo, "GET", `/contents/${args.path}`);
      if (data.encoding === "base64") return `文件: ${args.path}\n---\n${Buffer.from(data.content, "base64").toString("utf-8")}`;
      return `无法读取: ${args.path}`;
    }
    case "search_code": {
      const data = await githubFetch("GET", `https://api.github.com/search/code?q=${encodeURIComponent(args.keyword)}+repo:${owner}/${repo}`);
      if (!data.items?.length) return `没有找到 "${args.keyword}"`;
      return `找到 ${data.total_count} 个结果:\n${data.items.slice(0, 10).map(i => `📄 ${i.path}`).join("\n")}`;
    }
    case "create_or_update_file": {
      let sha;
      try { sha = (await repoAPI(owner, repo, "GET", `/contents/${args.path}${args.branch ? `?ref=${args.branch}` : ""}`)).sha; } catch (e) {}
      const body = { message: args.message || "Update via MCP", content: Buffer.from(args.content, "utf-8").toString("base64") };
      if (sha) body.sha = sha;
      if (args.branch) body.branch = args.branch;
      await repoAPI(owner, repo, "PUT", `/contents/${args.path}`, body);
      return sha ? `✅ 已更新: ${args.path}` : `✅ 已创建: ${args.path}`;
    }
    case "delete_file": {
      const existing = await repoAPI(owner, repo, "GET", `/contents/${args.path}`);
      await githubFetch("DELETE", `https://api.github.com/repos/${owner}/${repo}/contents/${args.path}`, { message: args.message || "Delete via MCP", sha: existing.sha });
      return `✅ 已删除: ${args.path}`;
    }
    case "create_issue": {
      const data = await repoAPI(owner, repo, "POST", "/issues", { title: args.title, body: args.body || "", labels: args.labels || [] });
      return `✅ Issue #${data.number}: ${data.title}\n🔗 ${data.html_url}`;
    }
    case "list_issues": {
      const data = await repoAPI(owner, repo, "GET", `/issues?state=${args.state || "open"}&per_page=${args.per_page || 10}`);
      if (!data.length) return "没有 Issue";
      return data.map(i => `#${i.number} [${i.state}] ${i.title}`).join("\n");
    }
    case "close_issue": {
      const data = await repoAPI(owner, repo, "PATCH", `/issues/${args.issue_number}`, { state: "closed" });
      return `✅ Issue #${data.number} 已关闭`;
    }
    case "comment_issue": {
      const data = await repoAPI(owner, repo, "POST", `/issues/${args.issue_number}/comments`, { body: args.body });
      return `✅ 评论已添加 ${data.html_url}`;
    }
    case "list_branches": {
      const data = await repoAPI(owner, repo, "GET", "/branches");
      return data.map(b => `🌿 ${b.name}`).join("\n");
    }
    case "create_branch": {
      const ref = await repoAPI(owner, repo, "GET", `/git/ref/heads/${args.from_branch || "main"}`);
      await repoAPI(owner, repo, "POST", "/git/refs", { ref: `refs/heads/${args.branch_name}`, sha: ref.object.sha });
      return `✅ 分支 ${args.branch_name} 已创建`;
    }
    case "create_pull_request": {
      const data = await repoAPI(owner, repo, "POST", "/pulls", { title: args.title, body: args.body || "", head: args.head, base: args.base || "main" });
      return `✅ PR #${data.number}: ${data.title}\n🔗 ${data.html_url}`;
    }
    case "list_pull_requests": {
      const data = await repoAPI(owner, repo, "GET", `/pulls?state=${args.state || "open"}`);
      if (!data.length) return "没有 PR";
      return data.map(p => `#${p.number} [${p.state}] ${p.title}`).join("\n");
    }
    default: return `未知工具: ${name}`;
  }
}

// ==================== MCP 协议 ====================
function send(obj) { process.stdout.write(JSON.stringify(obj) + "\n"); }

async function handleMessage(msg) {
  const { id, method, params } = msg;
  switch (method) {
    case "initialize":
      return send({ jsonrpc: "2.0", id, result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "GitHub MCP Server", version: "2.0.0" }
      }});
    case "notifications/initialized": return;
    case "tools/list":
      return send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
    case "tools/call": {
      try {
        const result = await callTool(params.name, params.arguments || {});
        return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: result }] } });
      } catch (e) {
        return send({ jsonrpc: "2.0", id, result: { content: [{ type: "text", text: `❌ ${e.message}` }], isError: true } });
      }
    }
    case "ping": return send({ jsonrpc: "2.0", id, result: {} });
    default: return send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
  }
}

const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  try { await handleMessage(JSON.parse(line)); } catch (e) {
    send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: `Parse error: ${e.message}` } });
  }
});

process.stderr.write("GitHub MCP Server (stdio) v2.0 started\n");