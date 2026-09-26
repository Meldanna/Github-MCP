// ==================== 工具定义 ====================
const TOOLS = [
  // === 仓库管理 ===
  {
    name: "create_repo",
    description: "创建一个新的 GitHub 仓库。",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "仓库名称" },
        description: { type: "string", description: "仓库描述", default: "" },
        private: { type: "boolean", description: "是否为私有仓库，默认 false", default: false },
        auto_init: { type: "boolean", description: "是否自动创建 README，默认 true", default: true }
      },
      required: ["name"]
    }
  },
  {
    name: "list_repos",
    description: "列出用户的所有 GitHub 仓库。",
    inputSchema: {
      type: "object",
      properties: {
        sort: { type: "string", description: "排序方式：created, updated, pushed, full_name", default: "updated" },
        per_page: { type: "number", description: "每页数量，最大100", default: 30 }
      }
    }
  },
  {
    name: "get_repo_info",
    description: "获取指定仓库的详细信息。",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "仓库所有者，默认为当前用户", default: "" },
        repo: { type: "string", description: "仓库名称，默认为当前仓库", default: "" }
      }
    }
  },
  {
    name: "switch_repo",
    description: "切换当前操作的目标仓库。切换后，文件操作将作用于新仓库。",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "仓库所有者" },
        repo: { type: "string", description: "仓库名称" }
      },
      required: ["repo"]
    }
  },
  // === 文件操作 ===
  {
    name: "list_files",
    description: "列出 GitHub 仓库的文件目录结构。可指定子目录路径。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "目录路径，默认为根目录。例如：src 或 public/scripts", default: "" }
      }
    }
  },
  {
    name: "read_file",
    description: "读取 GitHub 仓库中指定文件的内容。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径，例如：src/index.js" }
      },
      required: ["path"]
    }
  },
  {
    name: "search_code",
    description: "在 GitHub 仓库中搜索包含关键词的代码。",
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "要搜索的关键词" }
      },
      required: ["keyword"]
    }
  },
  {
    name: "create_or_update_file",
    description: "在 GitHub 仓库中创建或更新文件。会自动提交。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "文件路径，例如：src/new-file.js" },
        content: { type: "string", description: "文件内容" },
        message: { type: "string", description: "提交信息", default: "Update via MCP" }
      },
      required: ["path", "content"]
    }
  },
  {
    name: "delete_file",
    description: "删除 GitHub 仓库中的指定文件。",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "要删除的文件路径" },
        message: { type: "string", description: "提交信息", default: "Delete via MCP" }
      },
      required: ["path"]
    }
  },
  // === Issue 管理 ===
  {
    name: "create_issue",
    description: "在 GitHub 仓库中创建一个新的 Issue。",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Issue 标题" },
        body: { type: "string", description: "Issue 内容（支持 Markdown）", default: "" },
        labels: { type: "array", items: { type: "string" }, description: "标签列表", default: [] }
      },
      required: ["title"]
    }
  },
  {
    name: "list_issues",
    description: "列出 GitHub 仓库的 Issue。",
    inputSchema: {
      type: "object",
      properties: {
        state: { type: "string", description: "状态过滤：open, closed, all", default: "open" },
        per_page: { type: "number", description: "每页数量", default: 10 }
      }
    }
  },
  {
    name: "close_issue",
    description: "关闭一个 Issue。",
    inputSchema: {
      type: "object",
      properties: {
        issue_number: { type: "number", description: "Issue 编号" }
      },
      required: ["issue_number"]
    }
  },
  // === 分支管理 ===
  {
    name: "list_branches",
    description: "列出仓库的所有分支。",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "create_branch",
    description: "基于指定分支创建新分支。",
    inputSchema: {
      type: "object",
      properties: {
        branch_name: { type: "string", description: "新分支名称" },
        from_branch: { type: "string", description: "基于哪个分支创建，默认 main", default: "main" }
      },
      required: ["branch_name"]
    }
  }
];

// ==================== 运行时仓库状态 ====================
let runtimeOwner = null;
let runtimeRepo = null;

function getOwner(env) {
  return runtimeOwner || env.GITHUB_OWNER;
}
function getRepo(env) {
  return runtimeRepo || env.GITHUB_REPO;
}

// ==================== GitHub API 封装 ====================
async function githubAPI(env, method, endpoint, body = null) {
  const url = `https://api.github.com/repos/${getOwner(env)}/${getRepo(env)}${endpoint}`;
  const headers = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "MCP-Server"
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
  return res.json();
}

// 通用 GitHub API（不绑定仓库）
async function githubRawAPI(env, method, url, body = null) {
  const headers = {
    "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "MCP-Server"
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
  return res.json();
}

// ==================== 工具实现 ====================
async function callTool(env, name, args) {
  switch (name) {

    // === 仓库管理 ===
    case "create_repo": {
      const data = await githubRawAPI(env, "POST", "https://api.github.com/user/repos", {
        name: args.name,
        description: args.description || "",
        private: args.private || false,
        auto_init: args.auto_init !== undefined ? args.auto_init : true
      });
      return `✅ 仓库创建成功！\n📦 名称: ${data.full_name}\n🔗 地址: ${data.html_url}\n🔒 私有: ${data.private ? "是" : "否"}`;
    }

    case "list_repos": {
      const sort = args.sort || "updated";
      const perPage = args.per_page || 30;
      const data = await githubRawAPI(env, "GET", `https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}`);
      if (!data.length) return "没有找到仓库";
      const list = data.map((r, i) => {
        const icon = r.private ? "🔒" : "📦";
        const stars = r.stargazers_count ? ` ⭐${r.stargazers_count}` : "";
        return `${i + 1}. ${icon} ${r.full_name}${stars}\n   ${r.description || "(无描述)"}\n   🔗 ${r.html_url}`;
      });
      return `共 ${data.length} 个仓库:\n\n${list.join("\n\n")}`;
    }

    case "get_repo_info": {
      const owner = args.owner || getOwner(env);
      const repo = args.repo || getRepo(env);
      const data = await githubRawAPI(env, "GET", `https://api.github.com/repos/${owner}/${repo}`);
      return `📦 ${data.full_name}\n📝 ${data.description || "(无描述)"}\n⭐ Stars: ${data.stargazers_count}\n🍴 Forks: ${data.forks_count}\n👁️ Watchers: ${data.watchers_count}\n🌿 默认分支: ${data.default_branch}\n🔗 ${data.html_url}\n📅 创建: ${data.created_at}\n📅 更新: ${data.updated_at}`;
    }

    case "switch_repo": {
      runtimeOwner = args.owner || env.GITHUB_OWNER;
      runtimeRepo = args.repo;
      return `✅ 已切换到仓库: ${runtimeOwner}/${runtimeRepo}\n后续文件操作将作用于此仓库。`;
    }

    // === 文件操作 ===
    case "list_files": {
      const path = args.path || "";
      const data = await githubAPI(env, "GET", `/contents/${path}`);
      if (!Array.isArray(data)) {
        return `${path} 是一个文件，不是目录`;
      }
      const list = data.map(item => {
        const icon = item.type === "dir" ? "📁" : "📄";
        const size = item.size ? ` (${item.size} bytes)` : "";
        return `${icon} ${item.path}${size}`;
      });
      return list.join("\n");
    }

    case "read_file": {
      const data = await githubAPI(env, "GET", `/contents/${args.path}`);
      if (data.encoding === "base64") {
        const text = atob(data.content.replace(/\n/g, ""));
        return `文件: ${args.path}\n大小: ${data.size} bytes\n---\n${text}`;
      }
      return `无法读取文件: ${args.path}`;
    }

    case "search_code": {
      const url = `https://api.github.com/search/code?q=${encodeURIComponent(args.keyword)}+repo:${getOwner(env)}/${getRepo(env)}`;
      const data = await githubRawAPI(env, "GET", url);
      if (!data.items || data.items.length === 0) {
        return `没有找到包含 "${args.keyword}" 的代码`;
      }
      const results = data.items.slice(0, 10).map(item => `📄 ${item.path}`);
      return `找到 ${data.total_count} 个结果:\n${results.join("\n")}`;
    }

    case "create_or_update_file": {
      let sha = undefined;
      try {
        const existing = await githubAPI(env, "GET", `/contents/${args.path}`);
        sha = existing.sha;
      } catch (e) {
        // 文件不存在，新建
      }
      const body = {
        message: args.message || "Update via MCP",
        content: btoa(unescape(encodeURIComponent(args.content)))
      };
      if (sha) body.sha = sha;
      await githubAPI(env, "PUT", `/contents/${args.path}`, body);
      return sha
        ? `✅ 已更新文件: ${args.path}`
        : `✅ 已创建文件: ${args.path}`;
    }

    case "delete_file": {
      const existing = await githubAPI(env, "GET", `/contents/${args.path}`);
      await fetch(
        `https://api.github.com/repos/${getOwner(env)}/${getRepo(env)}/contents/${args.path}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "MCP-Server",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: args.message || "Delete via MCP",
            sha: existing.sha
          })
        }
      );
      return `✅ 已删除文件: ${args.path}`;
    }

    // === Issue 管理 ===
    case "create_issue": {
      const body = {
        title: args.title,
        body: args.body || "",
        labels: args.labels || []
      };
      const data = await githubAPI(env, "POST", "/issues", body);
      return `✅ Issue 创建成功！\n📋 #${data.number}: ${data.title}\n🔗 ${data.html_url}`;
    }

    case "list_issues": {
      const state = args.state || "open";
      const perPage = args.per_page || 10;
      const data = await githubAPI(env, "GET", `/issues?state=${state}&per_page=${perPage}`);
      if (!data.length) return `没有 ${state} 状态的 Issue`;
      const list = data.map(issue => {
        const labels = issue.labels.map(l => `🏷️${l.name}`).join(" ");
        return `#${issue.number} [${issue.state}] ${issue.title} ${labels}\n   🔗 ${issue.html_url}`;
      });
      return `${state} 状态的 Issue (${data.length} 个):\n\n${list.join("\n\n")}`;
    }

    case "close_issue": {
      const data = await githubAPI(env, "PATCH", `/issues/${args.issue_number}`, {
        state: "closed"
      });
      return `✅ Issue #${data.number} 已关闭: ${data.title}`;
    }

    // === 分支管理 ===
    case "list_branches": {
      const data = await githubAPI(env, "GET", "/branches");
      if (!data.length) return "没有找到分支";
      const list = data.map(b => `🌿 ${b.name}`);
      return `分支列表:\n${list.join("\n")}`;
    }

    case "create_branch": {
      const fromBranch = args.from_branch || "main";
      const refData = await githubAPI(env, "GET", `/git/ref/heads/${fromBranch}`);
      const sha = refData.object.sha;
      await githubAPI(env, "POST", "/git/refs", {
        ref: `refs/heads/${args.branch_name}`,
        sha: sha
      });
      return `✅ 分支创建成功！\n🌿 ${args.branch_name} (基于 ${fromBranch})`;
    }

    default:
      return `未知工具: ${name}`;
  }
}

// ==================== MCP 协议处理 ====================
function jsonRpcResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMCPRequest(request, env) {
  const body = await request.json();
  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return jsonRpcResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "GitHub MCP Server (Enhanced)", version: "2.0.0" }
      });

    case "notifications/initialized":
      return null;

    case "tools/list":
      return jsonRpcResponse(id, { tools: TOOLS });

    case "tools/call": {
      try {
        const result = await callTool(env, params.name, params.arguments || {});
        return jsonRpcResponse(id, {
          content: [{ type: "text", text: result }]
        });
      } catch (e) {
        return jsonRpcResponse(id, {
          content: [{ type: "text", text: `❌ 错误: ${e.message}` }],
          isError: true
        });
      }
    }

    case "ping":
      return jsonRpcResponse(id, {});

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ==================== Cloudflare Worker 入口 ====================
export default {
  async fetch(request, env) {
    // 重置运行时仓库状态
    runtimeOwner = null;
    runtimeRepo = null;

    // CORS 处理
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    const url = new URL(request.url);

    // 健康检查
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(JSON.stringify({
        status: "ok",
        server: "GitHub MCP Server (Enhanced)",
        version: "2.0.0",
        repo: `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`,
        features: ["repos", "files", "issues", "branches", "switch_repo"]
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // MCP 端点
    if (url.pathname === "/mcp" && request.method === "POST") {
      const result = await handleMCPRequest(request, env);
      if (result === null) {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(result), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};