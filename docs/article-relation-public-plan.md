# 文章与公开内容关联方案

## 背景

文章编辑和管理已经在 `data-admin` 中具备基础能力，文章公开读取接口也已经在 `milet-worker-ts` 中存在。下一步需要让文章可以和公开端的 timeline、release、song 建立多对多关联，并在 `echoes of milet` 的公开页面中以符合当前视觉风格的方式提示和展示多篇关联文章。

本方案只做准备设计，不包含代码落地。

## 涉及工程

- `D:\CODE\front\tailwindCSS\data-admin`
  - 管理端。
  - 负责文章内容维护和文章关联入口。
- `D:\CODE\node\worker\milet-worker-ts`
  - 共享 Worker/API。
  - 负责关联表、关联读写 API、公开接口聚合关联文章摘要。
- `D:\CODE\front\tailwindCSS\echoes of milet`
  - 公开端。
  - 负责文章详情 SSR 页面，以及 timeline / release / song 页面上的关联文章展示。

三个工程统一使用 `article-edit` 分支进行后续调整。

## 总体原则

1. 使用独立关联表维护文章和内容的关系，不向 timeline、release、song 业务表追加 article 字段。
2. 管理端把关联入口集中放在文章管理模块中，其他业务管理页最多提供只读提示或跳转入口。
3. 公开端接口由 Worker 在 timeline / release / song 原接口中聚合关联文章信息，避免公开前端按 item 逐条请求造成 N+1。
4. 公开端所有展示都要支持一个内容关联多篇文章。
5. 公开端 UI 只做轻量、内嵌式提示，延续现有玻璃感、浅色、青蓝和金色细节，不增加沉重的卡片嵌套。
6. 文章详情页落在公开端工程，并使用公开端已有 SSR 管线。

## 数据模型

新增 D1 表：

```sql
CREATE TABLE article_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  sort_no INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(target_type, target_id, article_id)
);

CREATE INDEX idx_article_relations_target
  ON article_relations (target_type, target_id, sort_no, id);

CREATE INDEX idx_article_relations_article
  ON article_relations (article_id);
```

`target_type` 初期支持：

```text
timeline
release
song
```

`target_id` 统一使用字符串：

```text
timeline: "123"
release: "release_123"
song: "work_123"
```

这样 release、song 可以沿用公开端和管理端当前的 show id 风格，避免前端在不同接口之间反复转换。

## Worker API

### 管理端 API

```text
GET  /admin/articles/relations?articleId=1
GET  /admin/articles/relations?targetType=release&targetId=release_123
POST /admin/articles/relations/save
```

保存 payload：

```ts
type SaveArticleRelationsPayload = {
  articleId?: number
  targetType?: 'timeline' | 'release' | 'song'
  targetId?: string
  items: Array<{
    articleId: number
    targetType: 'timeline' | 'release' | 'song'
    targetId: string
    sortNo: number
  }>
}
```

第一阶段建议以“文章为中心”保存：

```ts
{
  articleId: 1,
  items: [
    { articleId: 1, targetType: 'release', targetId: 'release_123', sortNo: 1 },
    { articleId: 1, targetType: 'song', targetId: 'work_456', sortNo: 2 }
  ]
}
```

### 公开端 API

文章详情接口已有：

```text
GET /api/articles/:lang/:slug
```

新增关联读取能力：

```text
GET /api/articles/relations/:targetType/:targetId/:lang
```

更重要的是提供 Worker 内部批量查询方法，用于现有公开接口聚合：

```ts
async function listPublicArticleRelations(env, input: {
  targetType: 'timeline' | 'release' | 'song'
  targetIds: string[]
  lang: 'zh' | 'ja'
  limitPerTarget?: number
}): Promise<Record<string, RelatedArticleGroup>>
```

公开返回类型：

```ts
type RelatedArticleSummary = {
  id: number
  slug: string
  title: string
  summary: string
  lang: 'zh' | 'ja'
  publishedAt: string | null
  updatedAt: string
  url: string
}

type RelatedArticleGroup = {
  count: number
  primary: RelatedArticleSummary | null
  items: RelatedArticleSummary[]
}
```

公开查询必须过滤：

```text
article_type = public_article
status = published
deleted_flag = 0
```

语言规则沿用现有文章公开读取逻辑：

- 请求 `zh` 优先中文。
- 请求 `ja` 优先日文。
- 缺失时 fallback 到文章默认语言。

## 管理端入口设计

关联入口集中在 `文章管理` 模块更合适。

建议在 `ArticleManagementPage.vue` 中新增“关联内容”能力：

1. 文章列表每行增加“关联”操作。
2. 文章编辑弹窗中增加一个“关联内容”页签或区块。
3. 关联弹窗中按 target type 选择内容：
   - timeline：按标题、日期搜索。
   - release：按标题、艺人、发布日期搜索。
   - song：按歌曲名、演唱、work id 搜索。
4. 已关联内容按类型分组显示，支持移除和排序。

其他管理页不承担主要编辑职责，只做弱提示：

```text
已关联 2 篇文章  ->  去文章管理查看
```

这样 timeline / release / song 的保存流程不会被文章关系耦合，也能减少权限和表单状态复杂度。

## 公开端接口聚合位置

### Timeline

现有接口：

```text
GET /api/milet/timelinedata/:page
```

Worker 查询当前页 timeline 后，收集每条 timeline 的 id：

```ts
targetIds = rows.map(row => String(row.timeline_id || row.id))
```

批量查询：

```ts
relations = await listPublicArticleRelations(env, {
  targetType: 'timeline',
  targetIds,
  lang,
  limitPerTarget: 5
})
```

合并到每条 timeline item：

```ts
item.articles = relations[targetId] || emptyArticleGroup()
```

### Release

现有接口：

```text
GET /api/milet/release/type/:type
```

Worker 查询 release 列表后，收集：

```ts
targetIds = releases.map(release => release.id) // release_123
```

release 列表每个卡片可以显示多篇关联文章，但为了控制 payload，建议列表页返回完整 `items` 但限制每个 release 最多 3 篇：

```ts
limitPerTarget: 3
```

如果后续有 release detail 页面，可以在 detail 接口中提高限制或返回全部。

### Song

当前公开端 song 详情主要在 `TrackModal` 中打开，数据来自：

```text
GET /api/milet/release/worker/detail/:id
```

这里的 id 是：

```text
work_123-track_456
```

关联目标按 song 归到 work：

```ts
targetType = 'song'
targetId = 'work_123'
```

Worker 在 track detail 接口中解析 work id 后查询相关文章，并返回：

```ts
data.articles = relations[`work_${workId}`]
```

这样同一首歌不同 track 版本可以共享同一组文章。

## 公开端页面展示

公开端必须考虑多篇关联文章，并保持现有设计语言。

### Timeline 页面

文件：

```text
src/views/milet/MiletTimeLineAll.vue
```

现有 timeline 卡片是轻玻璃白底、青蓝强调、金色时间线。相关文章不应该另起一个重卡片，建议放在卡片底部，作为“阅读延伸”区域。

视觉结构：

```text
标题
正文

Related reading
文章标题 A                         →
文章标题 B                         →
```

实现建议：

- 如果 1 篇文章：显示一行主入口，整行可点击。
- 如果多篇文章：默认显示最多 2 篇，底部显示 `+ N more`，点击后在卡片内展开，不使用全屏弹窗。
- 保留原 `link_url` 外链入口，但视觉优先级低于相关文章。可以把 `link_url` 表示为 `External detail`。
- 移动端不横向排布，所有文章入口纵向排列。

样式方向：

```text
border-top: 1px translucent sky/slate
small uppercase label
article title: #143d63
hover: text #317f8d, subtle translate-x
```

### Release 页面

主要文件：

```text
src/views/milet/ReleasesPage.vue
src/components/milet/music/ReleaseSection.vue
src/components/milet/music/WorkCard.vue
```

Release 卡片已有封面、版本、曲目预览，信息密度较高。相关文章展示要分 list / shelf 两种模式。

list 模式：

- 放在标题和元信息下方，曲目预览上方。
- 使用细边框浅底的内嵌区域。
- 显示最多 3 篇。
- 每篇只显示标题，第一篇可以显示一行 summary。

结构：

```text
Articles · 3
文章标题 A
一行摘要...
文章标题 B
文章标题 C
```

shelf 模式：

- 只显示一个轻量 chip，避免破坏封面网格。

```text
3 articles
```

点击 chip 可以展开一个小型 popover / drawer，或切换到卡片内展开列表。第一阶段建议卡片内展开，避免新增全局浮层复杂度。

视觉方向：

- chip 使用 `border-sky-200 bg-sky-50 text-[#317f8d]`。
- list 区域使用现有 rounded-md、白底半透明、sky 边框。
- 不使用醒目的营销式 CTA。

### Song / Track Modal

文件：

```text
src/components/milet/music/TrackModal.vue
```

歌曲相关文章适合放在 modal 主内容左侧，不放进试听链接侧栏。原因是相关文章通常是歌词解读、创作背景、发布笔记，和歌曲详情/歌词更接近。

位置：

```text
歌曲详情卡片
Articles / Notes
歌词卡片
```

多篇展示：

- 默认显示全部，预计数量不会很大。
- 每篇是紧凑列表项：
  - title
  - summary 一行
  - `Read` 小箭头
- 如果超过 4 篇，限制高度并内部滚动。

移动端：

- 跟随主内容滚动。
- 不进入 listen drawer。
- 点击文章后使用当前窗口跳转文章页，不新开窗口。

视觉方向：

- 沿用 modal 内 `rounded-[16px] border border-slate-200/80 bg-white/86`。
- label 使用小号 uppercase tracking。
- hover 使用 sky 边框和浅背景，不加入强色块。

## 文章详情页

公开端新增 SSR 路由：

```text
/:lang/milet/articles/:slug
```

路由配置：

```ts
{
  path: 'articles/:slug',
  name: 'miletArticle',
  meta: { renderMode: 'ssr' },
  component: () => import('@/views/milet/MiletArticleView.vue'),
}
```

公开端 API proxy 需要允许：

```json
"miletArticle": "/api/articles/"
```

页面 SSR 阶段请求：

```text
GET /api/articles/:lang/:slug
```

文章正文 HTML 来自 Worker 返回的 `item.html`，这个 HTML 已由文章系统生成并存储在 R2。公开端只负责外层阅读页面和样式。

样式建议从管理端文章预览样式迁移，而不是运行时依赖管理端代码：

```text
data-admin/src/styles/article-content.css
data-admin/src/tiptap-mixed-media/mixed-media.css
```

迁移到公开端后保持类名一致，例如：

```text
.article-content
.mixed-media
```

## SSR 与水合注意事项

公开端页面需要遵守当前 SSR 安全约束：

- 初始渲染不要依赖 `window`、`document`、viewport、随机数。
- 文章详情数据应在 SSR 阶段进入 shared initial state 或页面本地 SSR data。
- 客户端 hydrate 时不要重复请求导致 HTML 变化。
- 多语言路径由 URL 的 `:lang` 决定，不在首屏使用 localStorage 覆盖。
- 相关文章展开状态仅在客户端交互后变化，初始默认折叠状态必须固定。

## 缓存失效

需要清理的缓存：

- 文章详情缓存：
  - `article-detail:{slug}:{lang}`
- 关联缓存：
  - `article-relations:{targetType}:{targetId}:{lang}`
- 含关联摘要的业务列表缓存：
  - timeline page cache
  - release list cache
  - song detail cache

触发点：

- 文章发布、归档、删除。
- 文章标题、摘要、slug、语言内容变化。
- 文章关联保存。
- 目标内容删除或隐藏时。

第一阶段可以保守清理对应模块缓存：

```text
timeline relation changed -> clear timeline list cache
release relation changed -> clear release list cache
song relation changed -> clear song detail cache for related work if present
```

## 分阶段落地

### Phase 1：数据和管理入口

- Worker 新增 `article_relations` migration。
- Worker 新增 ArticleRelation ORM / Service。
- Worker 新增 admin relation API。
- 管理端文章模块增加集中式关联管理入口。

### Phase 2：公开文章 SSR 页

- 公开端新增文章详情路由。
- 公开端新增文章 API client。
- 公开端迁移文章正文样式。
- 公开端补 API proxy route。

### Phase 3：公开端关联展示

- Worker 在 timeline 接口聚合多篇关联文章。
- Worker 在 release 接口聚合多篇关联文章。
- Worker 在 song detail 接口聚合多篇关联文章。
- 公开端 timeline / release / song 页面按上述视觉方案展示。

### Phase 4：验证和优化

- Worker 跑 route/service 测试。
- 管理端跑 type-check。
- 公开端跑 build:ssr。
- 浏览器检查 desktop / mobile：
  - timeline 多文章展开。
  - release list 和 shelf 模式。
  - track modal 多文章列表。
  - 文章详情 SSR 首屏。

## 待确认问题

1. `song` 关联是否始终绑定到 work，还是允许绑定到具体 track。
   - 建议第一阶段绑定 work，减少重复维护。
2. release 列表是否返回全部相关文章。
   - 建议第一阶段每个 release 最多 3 篇，避免列表 payload 变大。
3. timeline 原 `link_url` 是否需要自动迁移为 article relation。
   - 建议不自动迁移，保留外链字段，新增文章关联独立维护。
