# 🚀 快速迁移指南

## 架构总览

```
GitHub（代码） → Cloudflare Worker（运行） → 域名（访问） → MCP 客户端（使用）
```

**原则：所有代码和配置都存在 GitHub，其他都可以 5 分钟重建。**

---

## 一、Cloudflare Worker 重建（5分钟）

### 步骤

1. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)
2. Workers 和 Pages → 创建 → 名称：`github-mcp`
3. 编辑代码 → 粘贴 `worker.js` 的内容（见本仓库）
4. 设置 → 变量和机密 → 添加：

| 变量名 | 值 | 类型 |
|--------|-----|------|
| `GITHUB_OWNER` | `Meldanna` | 文本 |
| `GITHUB_REPO` | `The-Riparian-Gaze` | 文本 |
| `GITHUB_TOKEN` | `ghp_xxxxxxxx` | **加密** |

5. 保存并部署

### Token 生成方法

1. [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate new token → Fine-grained token
3. 权限：Contents, Issues, Pull requests, Administration → Read and Write
4. 生成并复制

---

## 二、域名配置（2分钟）

### 买新域名
1. [腾讯云域名注册](https://dnspod.cloud.tencent.com/) 买个便宜的
2. 推荐后缀：`.top`（¥1）、`.xyz`（¥5）、`.site`（¥5）

### 绑定 Cloudflare
1. Cloudflare → 添加站点 → 输入域名 → 选 Free
2. 记下 Cloudflare 给的 2 个 NS 地址
3. 去腾讯云 → 域名管理 → DNS 服务器 → 改成 Cloudflare 的 NS
4. 等待生效（几分钟到几小时）

### 绑定 Worker
1. Workers 和 Pages → github-mcp → 设置 → 自定义域
2. 添加：`github.你的域名`

---

## 三、MCP 客户端配置（1分钟）

### 手机端

MCP 地址：
```
https://github.你的域名/mcp
```

或无域名时：
```
https://github-mcp.你的CF账号.workers.dev/mcp
```

### VS Code Claude Code

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": ["path/to/stdio.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxx",
        "GITHUB_OWNER": "Meldanna",
        "GITHUB_REPO": "The-Riparian-Gaze"
      }
    }
  }
}
```

---

## 四、当前配置记录

| 项目 | 值 |
|------|----|
| GitHub 用户 | Meldanna |
| Worker 名称 | github-mcp |
| 域名 | windlife.site |
| MCP 子域名 | github.windlife.site |
| MCP 地址 | https://github.windlife.site/mcp |
| 仓库列表 | The-Riparian-Gaze, my-MCP, keeper, SillyTavern-Plugin-Knowledge-Base |

---

## 五、备忘

- GitHub 账号是一切的根基，保管好
- Token 过期了随时重新生成
- 域名年抛，过期了买新的，5分钟重新配置
- Worker 代码存在本仓库，随时可以重新部署
- **不需要备份 Cloudflare 上的任何东西**，因为代码都在 GitHub
