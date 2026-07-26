# 璀璨许愿阁 · Cloudflare 免费部署

本项目使用单一 Cloudflare Worker 部署：

- `public/` 由 Worker Static Assets 托管。
- `/api/*` 由 `src/worker.js` 处理。
- 愿望数据保存在 Cloudflare D1。
- Gemini API Key 由用户在浏览器中填写，不保存在 Cloudflare。

## 本地开发

```bash
npm install
npm run db:migrate:local
npm run dev
```

Wrangler 会输出本地访问地址，通常为 `http://localhost:8787`。

## 首次部署

```bash
npx wrangler login
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

如果新增了数据库迁移，先执行：

```bash
npm run db:migrate:remote
```

## 主要文件

- `src/worker.js`: Worker API 与 Gemini 调用。
- `src/prompt.js`: 主要 Prompt 入口
- `public/`: 静态前端。
- `migrations/`: D1 数据库迁移。
- `wrangler.jsonc`: Worker、Assets 与 D1 绑定配置。
