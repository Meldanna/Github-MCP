# ⚡ 配置速查卡 v2.1

---

## 1. Cloudflare Worker 环境变量

| 变量名 | 值 | 类型 | 说明 |
|--------|-----|------|------|
| `GITHUB_OWNER` | `Meldanna` | 文本 | 默认仓库所有者 |
| `GITHUB_REPO` | `The-Riparian-Gaze` | 文本 | 默认仓库 |
| `GITHUB_TOKEN` | `ghp_xxxxxxxx` | **加密** | 你的 GitHub Token |
| `MCP_SECRET` | `自己设一个密码` | **加密** | MCP 访问密钥 🆕 |

> ⚠️ `MCP_SECRET` 是新增的！设一个你记得住的密码，比如 `myMcp2024!`

---

## 2. MCP 地址格式

### 你自己用（带密钥）
```
https://github.windlife.site/mcp?key=你设置的MCP_SECRET
```

### 别人用（带自己的 GitHub Token）
```
https://github.windlife.site/mcp?token=ghp_他的token
```

### 裸访问
```
https://github.windlife.site/mcp  → ❌ 401 拒绝
```

---

## 3. 安全机制

```
请求进来
  ↓
有 ?key=密钥 且密钥正确？ → ✅ 用你的 Token（管理员模式）
  ↓ 否
有 ?token=ghp_xxx？       → ✅ 用他的 Token（公共模式）
  ↓ 否
有 Authorization 头？      → ✅ 用他的 Token（公共模式）
  ↓ 否
                           → ❌ 401 拒绝
```

---

## 4. 换域名流程（3分钟）

```
步骤1：买新域名
步骤2：Cloudflare 添加站点 → 获取 NS → 改 DNS
步骤3：Worker 自定义域 → 删旧的 → 加新的
步骤4：MCP 客户端地址改为 https://github.新域名/mcp?key=你的密钥
代码和环境变量不用动！
```

---

## 5. Token 生成

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

## 6. 分享给别人用

告诉他们：

> MCP 地址：`https://github.windlife.site/mcp?token=你自己的GitHub_Token`
>
> 去 github.com/settings/tokens 生成一个 Token 就能用了！

你的密钥不会泄露，别人只能操作他们自己的仓库 ✅
