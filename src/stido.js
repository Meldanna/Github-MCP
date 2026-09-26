import { TOOLS, callTool } from "./core.js";
import { createInterface } from "readline";

// 从环境变量读取配置
const config = {
  token: process.env.GITHUB_TOKEN,
  owner: process.env.GITHUB_OWNER || "",
  repo: process.env.GITHUB_REPO || ""
};

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function jsonRpcResponse(id, result) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

async function handleMessage(msg) {
  const { id, method, params } = msg;

  switch (method) {
    case "initialize":
      return send(jsonRpcResponse(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "GitHub MCP Server", version: "2.0.0" }
      }));

    case "notifications/initialized":
      return; // 不响应

    case "tools/list":
      return send(jsonRpcResponse(id, { tools: TOOLS }));

    case "tools/call": {
      try {
        const result = await callTool(config, params.name, params.arguments || {});
        return send(jsonRpcResponse(id, {
          content: [{ type: "text", text: result }]
        }));
      } catch (e) {
        return send(jsonRpcResponse(id, {
          content: [{ type: "text", text: `❌ 错误: ${e.message}` }],
          isError: true
        }));
      }
    }

    case "ping":
      return send(jsonRpcResponse(id, {}));

    default:
      return send(jsonRpcError(id, -32601, `Method not found: ${method}`));
  }
}

// stdio 读取
const rl = createInterface({ input: process.stdin });
rl.on("line", async (line) => {
  try {
    const msg = JSON.parse(line);
    await handleMessage(msg);
  } catch (e) {
    send(jsonRpcError(null, -32700, `Parse error: ${e.message}`));
  }
});

process.stderr.write("GitHub MCP Server (stdio) started\n");