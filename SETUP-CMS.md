# SPORTEX 后台管理系统 — 部署配置指南

## 架构一览

```
客户访问: sportexproduction.com        → 正常网站（公开）
管理员访问: sportexproduction.com/admin/ → Cloudflare Access 拦截 → 验证邮箱 → Decap CMS
OAuth 回调: sportexproduction.com/api/   → Cloudflare Pages Functions（公开）
```

---

## 第一步：注册 GitHub OAuth App

用于 Decap CMS 的 GitHub 登录授权。

1. 打开 https://github.com/settings/developers
2. 点击 **New OAuth App**
3. 填写信息：
   - **Application name**: `SPORTEX CMS`
   - **Homepage URL**: `https://sportexproduction.com`
   - **Authorization callback URL**: `https://sportexproduction.com/api/callback`
4. 点击 **Register application**
5. 点击 **Generate a new client secret**
6. 记录以下两个值（后续需要）：
   - 🔑 **Client ID**
   - 🔐 **Client Secret**

---

## 第二步：配置 Cloudflare Pages 环境变量

将 OAuth 凭证注入 Functions。

```bash
wrangler pages secret put GITHUB_CLIENT_ID
# 输入第一步的 Client ID

wrangler pages secret put GITHUB_CLIENT_SECRET
# 输入第一步的 Client Secret
```

> 备注：如果还没装 wrangler CLI，先在终端执行 `npx wrangler login` 进行登录

---

## 第三步：配置 Cloudflare Access（Zero Trust）

保护 `/admin/` 路径，只允许你的邮箱访问。

1. 打开 https://one.dash.cloudflare.com/
2. 选择 sportexproduction.com 站点
3. 进入 **Access** → **Applications**
4. 点击 **Add an application** → 选择 **Self-hosted**
5. 配置应用：
   - **Application name**: `SPORTEX Admin`
   - **Session Duration**: `24 hours`
   - **Subdomain / Domain**: `sportexproduction.com`
   - **Path**: `/admin/*`
6. 点击 **Next** → 添加 Policy：
   - **Policy name**: `Allow company email`
   - **Action**: `Allow`
   - **Configure rules**:
     - Selector: `Emails`
     - Value: 输入你的邮箱，例如 `info@sportex.com`
7. 点击 **Next** → **Add application**

> ✅ 现在访问 `https://sportexproduction.com/admin/` 会先要求邮箱验证

---

## 第四步：推送到 GitHub 触发部署

```bash
git add -A
git commit -m "feat: add CMS admin panel with Cloudflare Access protection"
git push origin main
```

Cloudflare Pages 会自动检测 `/functions/` 目录并部署 Functions。

---

## 第五步：测试后台

1. 打开 `https://sportexproduction.com/admin/`
2. 输入邮箱 → 接收验证码 → 验证通过
3. Decap CMS 加载 → 点击「Login with GitHub」
4. 授权 GitHub OAuth App
5. 进入后台，可以编辑：
   - 📦 **Products** — 产品目录
   - 🏢 **Company Info** — 公司信息
   - 📄 **Pages** — 页面 Banner 图

---

## 文件结构（部署后）

```
/
├── admin/
│   ├── index.html          # Decap CMS 入口
│   └── config.yml          # CMS 配置
├── data/
│   ├── products.json       # 🔧 可编辑 - 产品数据
│   ├── company.json        # 🔧 可编辑 - 公司信息
│   └── pages/
│       └── home.json       # 🔧 可编辑 - 页面 Banner
├── functions/
│   └── api/
│       ├── auth.js         # OAuth 发起
│       └── callback.js     # OAuth 回调
├── images/
│   └── uploads/            # 📸 CMS 上传的图片存放处
├── *.html                  # 静态页面（不变）
├── *.js                    # JS 文件（改为 fetch 加载数据）
└── SETUP-CMS.md            # 本文件
```

---

## 日常使用流程

```
打开 sportexproduction.com/admin
→ 邮箱验证（Cloudflare Access）
→ 登录 GitHub
→ 在后台编辑产品/公司信息/上传图片
→ 点击「Publish」
→ CMS 自动 commit + push 到 GitHub
→ Cloudflare Pages 自动部署
→ 网站更新完成 🎉
```
