# ⚡ 配置速查卡

> 换域名 / 重建 Worker 时，复制这里的值就行

---

## 1. Cloudflare Worker 环境变量

直接复制粘贴到 Worker 设置里：

| 变量名 | 值 | 类型 |
|--------|-----|------|
| `GITHUB_OWNER` | `Meldanna` | 文本 |
| `GITHUB_REPO` | `The-Riparian-Gaze` | 文本 |
| `GITHUB_TOKEN` | ⚠️ 需要去 GitHub 重新生成 | 加密 |

---

## 2. Worker 代码

复制本仓库的 `worker.js` 文件内容，粘贴到 Worker 编辑器。

---

## 3. DNS 配置

在 Cloudflare DNS 记录里添加（把 `新域名` 换成你买的域名）：

### GitHub MCP
```
类型: CNAME
名称: github
目标: 不用手动添加，通过 Worker 自定义域绑定会自动创建
```

### 以后的其他服务（按需添加）
```
search.新域名    → search-mcp.xxx.workers.dev
img.新域名       → img-worker.xxx.workers.dev
docs.新域名      → docs-worker.xxx.workers.dev
```

---

## 4. MCP 客户端地址

换域名后，只需要改这一行：

```
https://github.新域名/mcp
```

---

## 5. 换域名完整流程（5分钟）

```
步骤1：腾讯云买新域名
步骤2：Cloudflare 添加站点 → 获取 NS
步骤3：腾讯云改 DNS 为 Cloudflare 的 NS
步骤4：等待生效
步骤5：Worker → 设置 → 自定义域 → 删除旧域名 → 添加 github.新域名
步骤6：MCP 客户端地址改为 https://github.新域名/mcp
完事！代码和环境变量完全不用动！
```

---

## 6. Token 生成速查

```
地址：https://github.com/settings/tokens
类型：Fine-grained token
范围：All repositories
权限：
  ✅ Contents → Read and Write
  ✅ Issues → Read and Write  
  ✅ Pull requests → Read and Write
  ✅ Administration → Read and Write
  ✅ Metadata → Read
```

---

## 📌 重点

> **换域名不需要动 Worker 代码和环境变量！**
> 
> 只需要：
> 1. 新域名指向 Cloudflare
> 2. Worker 绑定新域名
> 3. MCP 客户端改地址
> 
> 三步搞定，3分钟。
