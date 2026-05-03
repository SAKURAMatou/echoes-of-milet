# Echoes of milet

Echoes of milet 是一个围绕 milet 内容整理、作品记录和粉丝互动体验构建的非官方 fan site 公开端。项目面向中文与日文用户，使用 Vue 3 + Vite 构建，并通过 Cloudflare Pages Functions 提供 SSR、SSG 页面交付和 API 代理能力。

> 本站不是 milet 官方网站。milet 官方信息请以 [milet.jp](https://milet.jp/) 与官方 fan site [miles](https://fc.milet.jp/) 为准。

## 功能概览

- 多语言路由：支持 `zh`、`ja` 两套路径前缀与语言偏好跳转。
- 混合渲染：按路由使用 SSG、SSR、CSR，兼顾首屏 SEO 与互动页面体验。
- milet 内容页：首页、作品、时间线、图集、新闻合集、周年记录、圣地巡礼地图等。
- 互动模块：包含歌曲猜测游戏及结果页分享相关能力。
- SEO：SSR 阶段注入 title、description、Open Graph、Twitter Card、结构化数据和 canonical/alternate 链接。
- Cloudflare Pages Functions：统一处理 SSR、静态资源、短链跳转、语言重定向、`/api/*` 和 `/other/*` 代理。

## 技术栈

- Vue 3
- Vue Router 4
- Vite 6
- TypeScript
- Tailwind CSS 4
- Axios
- Leaflet
- Fancyapps UI
- Cloudflare Pages Functions

## 目录结构

```text
.
|-- functions/              # Cloudflare Pages Functions 入口
|-- public/                 # 静态资源、站点验证、robots、sitemap
|-- scripts/                # SSG 预渲染与本地 SSR 验证脚本
|-- src/
|   |-- assets/             # 全局样式与本地资源
|   |-- components/         # 通用组件与 milet 业务组件
|   |-- composables/        # 数据、语言、交互与业务 composables
|   |-- config/             # API、短链等配置
|   |-- router/             # 路由配置
|   |-- server/             # SSR 渲染、SEO、运行时配置
|   `-- views/              # 页面视图
|-- api-proxy.config.json   # API 代理和前后端 origin 配置
|-- render.config.json      # SSG/SSR 路由渲染模式配置
`-- vite.config.js
```

## 本地开发

建议使用 Node.js LTS 版本。

```sh
npm install
npm run dev
```

开发服务器默认由 Vite 启动，通常访问：

```text
http://127.0.0.1:5173
```

本地开发时，`vite.config.js` 会根据 `api-proxy.config.json` 将 `/api/*` 请求代理到开发后端：

```json
{
  "development": {
    "backend": "http://localhost:8787",
    "site": "http://localhost:5173"
  }
}
```

## 环境变量

本地可使用 `.env.development`，Cloudflare Pages 生产环境请在项目设置中配置对应变量。

```env
MILET_SOURCE_GUARD_TOKEN=your-source-guard-token
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
```

变量说明：

- `MILET_SOURCE_GUARD_TOKEN`：请求后端时附加的来源保护 token。Cloudflare Pages Function 缺少该变量时会返回 500。
- `VITE_TURNSTILE_SITE_KEY`：前端 Turnstile 站点 key，用于留言/反馈等需要人机验证的交互。

## 常用脚本

```sh
npm run dev
```

启动 Vite 本地开发服务器。

```sh
npm run build
```

构建普通客户端产物。

```sh
npm run build:ssr
```

依次构建客户端、SSR 服务端 bundle，并执行 SSG 预渲染。Cloudflare Pages 部署使用该命令。

```sh
npm run verify:ssr:local
```

构建 SSR/SSG 产物后启动本地预览服务，用于部署前验证。

```sh
npm run verify:ssr:local:watch
```

启动长运行本地 SSR 验证服务，源码变更后重新构建并切换到最新 bundle。

```sh
npm run type-check
```

执行 Vue/TypeScript 类型检查。

```sh
npm run format
```

使用 Prettier 格式化 `src/`。

## 渲染策略

渲染模式集中配置在 [render.config.json](./render.config.json)。

| 路由                            | 模式 | 说明                      |
| ------------------------------- | ---- | ------------------------- |
| `/`                             | SSG  | 会按语言生成 `/zh`、`/ja` |
| `/milet/about`                  | SSG  | 关于页面                  |
| `/milet`                        | SSR  | milet 首页                |
| `/milet/anniversary`            | SSR  | 周年记录                  |
| `/milet/timeline`               | CSR  | 时间线                    |
| `/milet/galleryList`            | CSR  | 图集列表                  |
| `/milet/release`                | CSR  | 作品页                    |
| `/milet/news`                   | CSR  | 新闻合集                  |
| `/milet/pilgrimage`             | CSR  | 圣地巡礼地图              |
| `/milet/interactive/song-guess` | CSR  | 歌曲猜测互动              |

SSG 路由会在 `scripts/prerender.mjs` 中按语言生成静态 HTML。SSR 请求由 `functions/[[path]].ts` 在 Cloudflare Pages Functions 中加载 `dist/server/entry-server.js` 完成渲染。

## Cloudflare Pages 部署

Cloudflare Pages 推荐配置：

```text
Build command: npm run build:ssr
Build output directory: dist/client
Functions directory: functions
```

生产后端与站点 origin 配置在 [api-proxy.config.json](./api-proxy.config.json)：

```json
{
  "production": {
    "backend": "服务端地址",
    "site": "页面地址"
  }
}
```

部署产物说明：

- `dist/client`：客户端静态资源、SSG HTML、`ssr-template.html`。
- `dist/server`：SSR server entry。
- `functions/[[path]].ts`：Cloudflare Pages runtime 入口，负责 SSR、代理、跳转和静态资源兜底。

## API 代理

前端 API 与静态资源路径统一维护在 [api-proxy.config.json](./api-proxy.config.json)：

- `origins`：开发/生产环境的后端与站点 origin。
- `routes`：允许代理的 API 路径白名单。
- `staticRoutes`：后端静态资源路径前缀。
- `otherRquests`：特殊代理路径，例如歌曲猜测二维码。

Cloudflare Pages Functions 只允许代理配置中的路径，未在白名单内的 `/api/*` 或 `/other/*` 请求会返回 `403`。

## 相关文档

- [milet 周年模块数据契约](./docs/milet-anniversary-data-contract.md)
- [圣地巡礼地图实现计划](./docs/pilgrimage-map-implementation-plan.md)

## 版权说明

本项目为个人维护的非官方、非商业 fan site。页面设计、整理文案与前端实现由站点维护者维护；引用内容、图片、音乐与相关素材版权归对应权利方所有。如有不妥，请联系站点维护者处理。
