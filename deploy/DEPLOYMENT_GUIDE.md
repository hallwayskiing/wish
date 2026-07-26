# 璀璨许愿阁 · Cloudflare 免费部署

本项目使用单一 Cloudflare Worker 部署：

- Vite 构建前端页面、样式与脚本，Cloudflare Static Assets 托管构建产物。
- `/api/*` 由 `src/worker.js` 处理。
- 愿望数据保存在 Cloudflare D1。
- Gemini API Key 由用户在浏览器中填写，不保存在 Cloudflare。
- 管理密码保存在加密的 Worker Secret `ADMIN_PASSWORD` 中。

## 本地开发

```bash
npm install
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars，填写仅用于本地开发的 ADMIN_PASSWORD
npm run db:migrate:local
npm run dev
```

Vite 会输出本地访问地址，通常为 `http://localhost:5173`。前端和 Worker API
都由 Cloudflare Vite 插件运行。

## 首次部署

```bash
npx wrangler login
npx wrangler secret put ADMIN_PASSWORD
npm run deploy
npm run db:migrate:remote
```

首次 `wrangler deploy` 会根据 `wrangler.jsonc` 自动创建并绑定 D1 数据库。
数据库迁移完成后，再次打开部署命令输出的 `workers.dev` 地址即可使用。

## 后续部署

```bash
npm run check
npm run deploy
```

如果需要修改管理密码，先执行：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

如果新增了数据库迁移，先执行：

```bash
npm run db:migrate:remote
```

## 主要文件

- `src/worker.js`: Worker API 路由入口。
- `src/routes.js`: API 路由匹配、鉴权与请求分发。
- `src/wishes.js`: 愿望生成、保存、查询与助愿逻辑。
- `src/model.js`: Gemini 模型请求与响应解析。
- `src/prompt.js`: 模型 Prompt。
- `src/client/`: 前端脚本与样式源码。
- `index.html`、`admin/index.html`: Vite 多页面入口。
- `public/`: 不需要构建的静态资源。
- `migrations/`: D1 数据库迁移。
- `vite.config.js`: Vite 与 Cloudflare 插件配置。
- `wrangler.jsonc`: Worker、Secret 与 D1 绑定配置。
