const TOOLS = [
  {
    name: "list_files",
    description: "列出 GitHub 仓库的文件目录结构。可指定子目录路径。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "目录路径，默认为根目录。例如：src 或 public/scripts",
          default: ""
        }
      }
    }
  },
  {
    name: "read_file",
    description: "读取 GitHub 仓库中指定文件的内容。",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "文件路径，例如：src/index.js"
        }
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
        keyword: {
          type: "string",
          description: "要搜索的关键词"
        }
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
        path: {
          type: "string",
          description: "文件路径，例如：src/new-file.js"
        },
        content: {
          type: "string",
          description: "文件内容"
        },
        message: {
          type: "string",
          description: "提交信息",
          default: "Update via MCP"
        }
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
        path: {
          type: "string",
          description: "要删除的文件路径"
        },
        message: {
          type: "string",
          description: "提交信息",
          default: "Delete via MCP"
        }
      },
      required: ["path"]
    }
  }
];

// GitHub API 请求封装
async function githubAPI(env, method, endpoint, body = null) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}${endpoint}`;
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

// 工具实现
async function callTool(env, name, args) {
  switch (name) {
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
      const url = `https://api.github.com/search/code?q=${encodeURIComponent(args.keyword)}+repo:${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "MCP-Server"
        }
      });
      const data = await res.json();
      if (!data.items || data.items.length === 0) {
        return `没有找到包含 "${args.keyword}" 的代码`;
      }
      const results = data.items.slice(0, 10).map(item =>
        `📄 ${item.path}`
      );
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
      await githubAPI(env, "PUT", `/contents/${args.path}`, {
        message: args.message || "Delete via MCP",
        sha: existing.sha
      });
      // 实际上 DELETE 方法
      await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${args.path}`,
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

    default:
      return `未知工具: ${name}`;
  }
}

// MCP 协议处理
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
        serverInfo: { name: "GitHub MCP Server", version: "1.0.0" }
      });

    case "notifications/initialized":
      return null; // 通知不需要响应

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

// Cloudflare Worker 入口
export default {
  async fetch(request, env) {
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
        server: "GitHub MCP Server",
        repo: `${env.GITHUB_OWNER}/${env.GITHUB_REPO}`
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
