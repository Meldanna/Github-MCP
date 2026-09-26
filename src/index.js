// ==================== 工具定义 ====================
// 公共的可选 owner/repo 参数，注入到需要仓库的工具中
const REPO_PARAMS = {
  owner: {
    type: "string",
    description: "仓库所有者，不填则使用默认配置",
    default: ""
  },
  repo: {
    type: "string",
    description: "仓库名称，不填则使用默认配置",
    default: ""
  }
};

export const TOOLS = [
  // === 仓库管理 ===
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
      properties: {
        ...REPO_PARAMS,
        confirm: { type: "string", description: "输入仓库名确认删除" }
      },
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
    description: "获取仓库的详细信息（Star、Fork、描述等）。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS }
    }
  },
  // === 文件操作 ===
  {
    name: "list_files",
    description: "列出仓库的文件目录结构。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        path: { type: "string", description: "目录路径，默认根目录", default: "" }
      }
    }
  },
  {
    name: "read_file",
    description: "读取仓库中指定文件的内容。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        path: { type: "string", description: "文件路径" }
      },
      required: ["path"]
    }
  },
  {
    name: "search_code",
    description: "在仓库中搜索包含关键词的代码。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        keyword: { type: "string", description: "搜索关键词" }
      },
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
      properties: {
        ...REPO_PARAMS,
        path: { type: "string", description: "文件路径" },
        message: { type: "string", description: "提交信息", default: "Delete via MCP" }
      },
      required: ["path"]
    }
  },
  // === Issue 管理 ===
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
      properties: {
        ...REPO_PARAMS,
        state: { type: "string", description: "状态：open, closed, all", default: "open" },
        per_page: { type: "number", description: "数量", default: 10 }
      }
    }
  },
  {
    name: "close_issue",
    description: "关闭一个 Issue。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        issue_number: { type: "number", description: "Issue 编号" }
      },
      required: ["issue_number"]
    }
  },
  {
    name: "comment_issue",
    description: "给 Issue 添加评论。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        issue_number: { type: "number", description: "Issue 编号" },
        body: { type: "string", description: "评论内容" }
      },
      required: ["issue_number", "body"]
    }
  },
  // === 分支管理 ===
  {
    name: "list_branches",
    description: "列出仓库的所有分支。",
    inputSchema: {
      type: "object",
      properties: { ...REPO_PARAMS }
    }
  },
  {
    name: "create_branch",
    description: "创建新分支。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        branch_name: { type: "string", description: "新分支名" },
        from_branch: { type: "string", description: "基于哪个分支", default: "main" }
      },
      required: ["branch_name"]
    }
  },
  // === PR 管理 ===
  {
    name: "create_pull_request",
    description: "创建 Pull Request。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        title: { type: "string", description: "PR 标题" },
        body: { type: "string", description: "PR 描述", default: "" },
        head: { type: "string", description: "源分支" },
        base: { type: "string", description: "目标分支", default: "main" }
      },
      required: ["title", "head"]
    }
  },
  {
    name: "list_pull_requests",
    description: "列出 Pull Request。",
    inputSchema: {
      type: "object",
      properties: {
        ...REPO_PARAMS,
        state: { type: "string", description: "状态：open, closed, all", default: "open" }
      }
    }
  }
];

// ==================== GitHub API 封装 ====================
function resolveRepo(config, args) {
  return {
    owner: args.owner || config.owner,
    repo: args.repo || config.repo
  };
}

async function githubFetch(token, method, url, body = null) {
  const headers = {
    "Authorization": `Bearer ${token}`,
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
  // DELETE 可能返回 204 无内容
  if (res.status === 204) return null;
  return res.json();
}

function repoAPI(token, owner, repo, method, endpoint, body = null) {
  return githubFetch(token, method, `https://api.github.com/repos/${owner}/${repo}${endpoint}`, body);
}

// ==================== 工具实现 ====================
export async function callTool(config, name, args) {
  const { token } = config;
  const { owner, repo } = resolveRepo(config, args);

  switch (name) {

    // ====== 仓库管理 ======
    case "create_repo": {
      const data = await githubFetch(token, "POST", "https://api.github.com/user/repos", {
        name: args.name,
        description: args.description || "",
        private: args.private || false,
        auto_init: args.auto_init !== undefined ? args.auto_init : true
      });
      return `✅ 仓库创建成功！\n📦 ${data.full_name}\n🔗 ${data.html_url}\n🔒 私有: ${data.private ? "是" : "否"}`;
    }

    case "delete_repo": {
      if (args.confirm !== args.repo) {
        return `❌ 确认失败！请输入仓库名 "${args.repo}" 来确认删除。`;
      }
      await githubFetch(token, "DELETE", `https://api.github.com/repos/${owner}/${repo}`);
      return `✅ 仓库 ${owner}/${repo} 已删除。`;
    }

    case "list_repos": {
      const sort = args.sort || "updated";
      const perPage = args.per_page || 30;
      const data = await githubFetch(token, "GET", `https://api.github.com/user/repos?sort=${sort}&per_page=${perPage}`);
      if (!data.length) return "没有找到仓库";
      const list = data.map((r, i) => {
        const icon = r.private ? "🔒" : "📦";
        const stars = r.stargazers_count ? ` ⭐${r.stargazers_count}` : "";
        return `${i + 1}. ${icon} ${r.full_name}${stars}\n   ${r.description || "(无描述)"}`;
      });
      return `共 ${data.length} 个仓库:\n\n${list.join("\n\n")}`;
    }

    case "get_repo_info": {
      const data = await repoAPI(token, owner, repo, "GET", "");
      return `📦 ${data.full_name}\n📝 ${data.description || "(无描述)"}\n⭐ Stars: ${data.stargazers_count} | 🍴 Forks: ${data.forks_count}\n🌿 默认分支: ${data.default_branch}\n🔗 ${data.html_url}\n📅 创建: ${data.created_at}\n📅 更新: ${data.updated_at}`;
    }

    // ====== 文件操作 ======
    case "list_files": {
      const path = args.path || "";
      const data = await repoAPI(token, owner, repo, "GET", `/contents/${path}`);
      if (!Array.isArray(data)) return `${path} 是一个文件，不是目录`;
      const list = data.map(item => {
        const icon = item.type === "dir" ? "📁" : "📄";
        const size = item.size ? ` (${item.size} bytes)` : "";
        return `${icon} ${item.path}${size}`;
      });
      return list.join("\n");
    }

    case "read_file": {
      const data = await repoAPI(token, owner, repo, "GET", `/contents/${args.path}`);
      if (data.encoding === "base64") {
        const text = atob(data.content.replace(/\n/g, ""));
        return `文件: ${args.path}\n大小: ${data.size} bytes\n---\n${text}`;
      }
      return `无法读取文件: ${args.path}`;
    }

    case "search_code": {
      const url = `https://api.github.com/search/code?q=${encodeURIComponent(args.keyword)}+repo:${owner}/${repo}`;
      const data = await githubFetch(token, "GET", url);
      if (!data.items || data.items.length === 0) {
        return `没有找到包含 "${args.keyword}" 的代码`;
      }
      const results = data.items.slice(0, 10).map(item => `📄 ${item.path}`);
      return `找到 ${data.total_count} 个结果:\n${results.join("\n")}`;
    }

    case "create_or_update_file": {
      let sha = undefined;
      const ref = args.branch ? `?ref=${args.branch}` : "";
      try {
        const existing = await repoAPI(token, owner, repo, "GET", `/contents/${args.path}${ref}`);
        sha = existing.sha;
      } catch (e) { /* 新文件 */ }
      const body = {
        message: args.message || "Update via MCP",
        content: btoa(unescape(encodeURIComponent(args.content)))
      };
      if (sha) body.sha = sha;
      if (args.branch) body.branch = args.branch;
      await repoAPI(token, owner, repo, "PUT", `/contents/${args.path}`, body);
      return sha ? `✅ 已更新: ${args.path}` : `✅ 已创建: ${args.path}`;
    }

    case "delete_file": {
      const existing = await repoAPI(token, owner, repo, "GET", `/contents/${args.path}`);
      await githubFetch(token, "DELETE",
        `https://api.github.com/repos/${owner}/${repo}/contents/${args.path}`,
        { message: args.message || "Delete via MCP", sha: existing.sha }
      );
      return `✅ 已删除: ${args.path}`;
    }

    // ====== Issue ======
    case "create_issue": {
      const data = await repoAPI(token, owner, repo, "POST", "/issues", {
        title: args.title,
        body: args.body || "",
        labels: args.labels || []
      });
      return `✅ Issue #${data.number}: ${data.title}\n🔗 ${data.html_url}`;
    }

    case "list_issues": {
      const state = args.state || "open";
      const perPage = args.per_page || 10;
      const data = await repoAPI(token, owner, repo, "GET", `/issues?state=${state}&per_page=${perPage}`);
      if (!data.length) return `没有 ${state} 状态的 Issue`;
      const list = data.map(i => {
        const labels = i.labels.map(l => `🏷️${l.name}`).join(" ");
        return `#${i.number} [${i.state}] ${i.title} ${labels}`;
      });
      return list.join("\n");
    }

    case "close_issue": {
      const data = await repoAPI(token, owner, repo, "PATCH", `/issues/${args.issue_number}`, { state: "closed" });
      return `✅ Issue #${data.number} 已关闭`;
    }

    case "comment_issue": {
      const data = await repoAPI(token, owner, repo, "POST", `/issues/${args.issue_number}/comments`, { body: args.body });
      return `✅ 评论已添加\n🔗 ${data.html_url}`;
    }

    // ====== 分支 ======
    case "list_branches": {
      const data = await repoAPI(token, owner, repo, "GET", "/branches");
      if (!data.length) return "没有分支";
      return `分支列表:\n${data.map(b => `🌿 ${b.name}`).join("\n")}`;
    }

    case "create_branch": {
      const from = args.from_branch || "main";
      const ref = await repoAPI(token, owner, repo, "GET", `/git/ref/heads/${from}`);
      await repoAPI(token, owner, repo, "POST", "/git/refs", {
        ref: `refs/heads/${args.branch_name}`,
        sha: ref.object.sha
      });
      return `✅ 分支 ${args.branch_name} 已创建（基于 ${from}）`;
    }

    // ====== PR ======
    case "create_pull_request": {
      const data = await repoAPI(token, owner, repo, "POST", "/pulls", {
        title: args.title,
        body: args.body || "",
        head: args.head,
        base: args.base || "main"
      });
      return `✅ PR #${data.number}: ${data.title}\n🔗 ${data.html_url}`;
    }

    case "list_pull_requests": {
      const state = args.state || "open";
      const data = await repoAPI(token, owner, repo, "GET", `/pulls?state=${state}`);
      if (!data.length) return `没有 ${state} 状态的 PR`;
      return data.map(p => `#${p.number} [${p.state}] ${p.title}\n   ${p.head.ref} → ${p.base.ref}`).join("\n\n");
    }

    default:
      return `未知工具: ${name}`;
  }
}