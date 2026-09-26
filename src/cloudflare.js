import { TOOLS, callTool } from "./core.js";

function jsonRpcResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function getConfig(env) {
  return {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO
  };
}

async function handleMCP(request, env) {
  const body = await request.json();
  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return jsonRpcResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "GitHub MCP Server", version: "2.0.0" }
      });

    case "notifications/initialized":
      return null;

    case "tools/list":
      return jsonRpcResponse(id, { tools: TOOLS });

    case "tools/call": {
      try {
        const result = await callTool(getConfig(env), params.name, params.arguments || {});
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

export default {
  async fetch(request, env) {
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

    if (url.pathname === "/" && request.method === "GET") {
      return new Response(JSON.stringify({
        status: "ok",
        server: "GitHub MCP Server",
        version: "2.0.0",
        tools: TOOLS.map(t => t.name)
      }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/mcp" && request.method === "POST") {
      const result = await handleMCP(request, env);
      if (!result) return new Response(null, { status: 204 });
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