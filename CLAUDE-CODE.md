# 🖥️ Claude Code / VS Code 配置指南

## 前置条件

- 安装了 [Node.js](https://nodejs.org/)（v18+）
- 安装了 VS Code + Claude Code 扩展
- 有 GitHub Token（[生成方法见 CONFIG.md](./CONFIG.md)）

---

## 方式一：使用 stdio 本地模式（推荐）

### 1. 克隆仓库

```bash
git clone https://github.com/Meldanna/my-MCP.git
cd my-MCP
```

### 2. 配置 Claude Code

打开 VS Code，按 `Ctrl+Shift+P`，搜索 `Claude: Edit MCP Settings`，添加：

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["/你的路径/my-MCP/stdio.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_你的token",
        "GITHUB_OWNER": "Meldanna",
        "GITHUB_REPO": "The-Riparian-Gaze"
      }
    }
  }
}
```

> ⚠️ 把 `/你的路径/` 替换为实际路径
> 
> ⚠️ `GITHUB_REPO` 是默认仓库，实际使用时可以指定任意仓库

### 3. 重启 Claude Code

重启后就能看到 17 个 GitHub 工具了！

---

## 方式二：使用远程 HTTP 模式

如果你不想本地运行，也可以直接连 Cloudflare Worker：

```json
{
  "mcpServers": {
    "github": {
      "type": "streamable-http",
      "url": "https://github.windlife.site/mcp"
    }
  }
}
```

> ⚠️ 注意：如果域名过期了，换成新域名或 workers.dev 地址：
> `https://github-mcp.你的CF账号.workers.dev/mcp`

---

## 方式三：快捷配置（命令行）

```bash
# 方法 A：stdio 模式
claude mcp add github -- node /你的路径/my-MCP/stdio.js \
  -e GITHUB_TOKEN=ghp_xxx \
  -e GITHUB_OWNER=Meldanna \
  -e GITHUB_REPO=The-Riparian-Gaze

# 方法 B：远程模式
claude mcp add github --type streamable-http https://github.windlife.site/mcp
```

---

## 可用工具（17个）

| 类别 | 工具 | 说明 |
|------|------|------|
| 仓库 | `create_repo` | 创建仓库 |
| | `delete_repo` | 删除仓库 |
| | `list_repos` | 列出所有仓库 |
| | `get_repo_info` | 仓库详情 |
| 文件 | `list_files` | 目录结构 |
| | `read_file` | 读文件 |
| | `search_code` | 搜索代码 |
| | `create_or_update_file` | 创建/更新文件 |
| | `delete_file` | 删除文件 |
| Issue | `create_issue` | 创建 Issue |
| | `list_issues` | 列出 Issue |
| | `close_issue` | 关闭 Issue |
| | `comment_issue` | 评论 Issue |
| 分支 | `list_branches` | 列出分支 |
| | `create_branch` | 创建分支 |
| PR | `create_pull_request` | 创建 PR |
| | `list_pull_requests` | 列出 PR |

所有仓库相关工具都支持可选的 `owner` 和 `repo` 参数，可以操作任意仓库！

---

## 常见问题

### Q: 报错 Bad credentials
A: Token 过期或错误，重新生成一个。

### Q: 报错 Not Found
A: 仓库名或 owner 写错了，检查一下。

### Q: 想操作其他仓库怎么办？
A: 不用改配置！直接在对话中说「在 xxx 仓库创建文件」，工具会自动传入 `repo` 参数。

### Q: stdio 和 HTTP 模式选哪个？
A: 本地开发选 **stdio**（更快、不依赖网络）；手机/远程选 **HTTP**。
