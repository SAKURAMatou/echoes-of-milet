# 文章相册嵌入与图片增强方案

## 背景

文章系统当前以 Tiptap JSON 作为主数据，发布时由 Worker 渲染出 HTML，公开端文章详情页再通过 `v-html` 展示发布后的正文 HTML。

相册系统当前已有公开相册列表和相册详情页，详情页包含图片列表、懒加载、Fancybox 预览、下载和无限滚动等交互。新的需求不是让文章和相册建立类似 timeline 的关联关系，而是让相册成为文章正文内容的一部分：

- 管理端编辑文章时可以插入一个相册块。
- 公开端文章页面在对应位置展示该相册。
- 相册中的照片仍跟随相册后台维护结果动态变化。
- 相册详情页已有的动作尽量复用。
- 没有插入相册的普通文章不改变整体渲染模型。
- 文章中普通图片也需要统一支持 Fancybox 点击预览和懒加载。

本方案只做落地设计，不包含代码实现。

## 现状基础

- 公开端文章详情页：`echoes-of-milet/src/views/milet/MiletArticleView.vue`
  - 当前通过 `article.html` 和 `v-html` 渲染正文。
  - 已引入文章内容样式和 mixed-media 样式。
- 公开端相册详情页：`echoes-of-milet/src/views/milet/MiletPicList.vue`
  - 通过路由参数 `galleryId` 拉取图片。
  - 使用 `Fancybox` 提供预览和下载动作。
  - 使用 `IntersectionObserver` 实现自动加载下一页。
- 管理端文章编辑器：`data-admin/src/components/article/ArticleRichTextEditor.vue`
  - 当前已有 Tiptap 扩展体系。
  - 已有 `ImageGallery` 节点，但它保存的是图片数组，语义是文章内组图，不适合表达动态相册引用。
- Worker 文章 HTML 渲染器：`milet-worker-ts/src/component/article/TiptapHtmlRenderer.ts`
  - 当前负责把 Tiptap JSON 转成可发布 HTML。
  - 已处理 `mixedMedia`、`imageGallery`、`contentColumns` 等节点。
- 公开 API 代理：`echoes-of-milet/api-proxy.config.json`
  - 已包含 `miletPiclist` 和 `miletGallery`，第一期可不新增公开端 API。
- 管理端代理：`data-admin/public/_worker.js`
  - 已放行 `/admin/gallery/` 和 `/admin/articles/`，插入相册选择可复用现有管理端相册接口。

## 总体原则

1. 不使用 `article_relations`。本需求是“正文内容块”，不是“文章关联公开内容”。
2. 普通文章继续使用现有 HTML 渲染路径，不改成整篇 JSON block renderer。
3. 相册块只保存 `galleryId` 等配置，不复制相册照片列表。
4. 公开端使用客户端增强方式挂载相册组件，保证 Fancybox 可以覆盖整个文章页面。
5. 相册详情页和文章内相册共享同一个相册查看组件。
6. 文章普通图片的 Fancybox 和相册 Fancybox 分组隔离，避免互相串组和互相销毁。
7. SSR 阶段不直接访问 `window`、`document`、`IntersectionObserver`、`Fancybox` 等浏览器对象。

## 推荐架构

### 管理端生成占位节点

新增 Tiptap 节点 `miletAlbumEmbed`，用于在文章正文中表示一个动态相册引用。

节点建议属性：

```ts
type MiletAlbumEmbedAttrs = {
  galleryId: string
  layout: 'detail' | 'compact'
  showTip?: boolean
  showTitle?: boolean
}
```

第一期建议只落地：

```ts
type MiletAlbumEmbedAttrsV1 = {
  galleryId: string
  layout: 'detail'
  showTip: false
}
```

管理端编辑器中的节点视图显示为一个工作台式占位卡片，包含：

- 相册标题。
- 照片数量。
- 封面图。
- `galleryId`。
- 替换相册按钮。
- 删除节点按钮。

不要复用现有 `ImageGallery` 节点，因为 `ImageGallery` 保存图片数组，后续相册维护不会自动同步到文章中。

### Worker 渲染 HTML 占位

Worker 发布文章时，`miletAlbumEmbed` 节点不渲染照片列表，只输出安全占位 HTML：

```html
<div
  class="milet-album-embed-host"
  data-type="milet-album-embed"
  data-gallery-id="gallery_123"
  data-layout="detail"
  data-show-tip="false"
></div>
```

为了改善 SSR、SEO 和无脚本环境体验，Worker 可以在占位内部额外输出静态 fallback。fallback 只包含相册 metadata，不包含完整照片分页列表：

```html
<div
  class="milet-album-embed-host"
  data-type="milet-album-embed"
  data-gallery-id="gallery_123"
  data-layout="detail"
  data-show-tip="false"
>
  <a class="milet-album-embed-fallback" href="/zh/milet/galleryDetail/gallery_123">
    <img src="/static/milet/img/example-preview.webp" alt="相册标题" loading="lazy" decoding="async" />
    <span class="milet-album-embed-fallback__body">
      <strong>相册标题</strong>
      <span>相册描述</span>
      <small>24 photos</small>
    </span>
  </a>
  <noscript>
    <a href="/zh/milet/galleryDetail/gallery_123">查看相册：相册标题</a>
  </noscript>
</div>
```

客户端挂载相册组件时，先清空或替换 host 内的 fallback，再渲染动态相册。这样：

- SSR HTML 中有可读的相册标题、描述和封面。
- JS 禁用时仍可跳转到相册详情页。
- 客户端正常加载时最终体验仍由 `MiletAlbumViewer` 接管。

metadata 建议包含：

```ts
type MiletAlbumEmbedFallback = {
  galleryId: string
  title: string
  description: string
  coverUrl: string
  imgCount: number
}
```

封面 URL 由 Worker 在 metadata 组装阶段统一输出为 `/static/milet/img/...` 同源路径，由公开端已有的 `/static/*` 代理访问图片资源；页面逻辑不拼接 Worker origin。

Worker 查询 metadata 时不要在渲染每个节点时逐个查库。推荐流程：

1. 保存或发布文章前，从 Tiptap JSON 中收集所有 `miletAlbumEmbed.galleryId`。
2. 去重后批量查询相册标题、描述、封面和照片数。
3. 将结果作为 render context 传给 `TiptapHtmlRenderer`。
4. renderer 只负责根据 context 输出占位和 fallback，不直接承担数据库访问。

如果第一期不想改 renderer 调用签名，也可以先只输出无 metadata 的轻量链接 fallback；但最终方案建议使用批量 metadata context，避免 N+1 查询和 renderer 职责膨胀。

渲染前必须校验：

- `galleryId` 只允许 `gallery_ALL` 或 `gallery_\d+`。
- `layout` 只允许 `detail`、`compact`。
- `showTip`、`showTitle` 统一转成字符串布尔值。
- 所有输出属性都必须经过 attribute escape。
- fallback 中的标题、描述、封面 URL、链接 URL 都必须经过 HTML escape 或 attribute escape。

普通文章不包含 `miletAlbumEmbed` 时，发布 HTML 不变化。

### 公开端客户端挂载相册组件

公开端文章详情页仍然先通过 `v-html` 输出 `article.html`。

客户端 `nextTick` 后扫描：

```css
.milet-album-embed-host[data-type="milet-album-embed"]
```

如果没有占位节点，则不加载相册组件。

如果存在占位节点，则动态导入相册组件，并把每个占位节点挂载成独立 Vue 子应用：

```ts
const { default: MiletAlbumViewer } = await import('@/components/milet/gallery/MiletAlbumViewer.vue')
```

挂载参数来自占位属性：

- `galleryId`
- `embedded`
- `layout`
- `showTip`

路由切换、文章重新加载、文章页卸载时，必须 unmount 已挂载的子应用，并清理该相册组件注册的监听、observer 和 Fancybox 绑定。

### 抽取相册查看组件

从 `MiletPicList.vue` 抽出核心组件：

```text
echoes-of-milet/src/components/milet/gallery/MiletAlbumViewer.vue
```

建议 props：

```ts
type MiletAlbumViewerProps = {
  galleryId: string
  embedded?: boolean
  layout?: 'detail' | 'compact'
  showTip?: boolean
}
```

`MiletPicList.vue` 调整为页面壳：

- 读取路由参数 `galleryId`。
- 设置页面标题。
- 渲染 `MiletAlbumViewer`。

文章内相册使用同一个组件：

- `embedded=true`。
- 默认隐藏页面级黄色提示。
- 外层 padding 更小。
- 宽度贴合 `.article-content` 阅读区域。

## 文章普通图片增强

除了相册块，文章正文中的普通图片也需要统一增强。

### 增强目标

在 `MiletArticleView.vue` 中，文章 HTML 渲染完成后扫描：

```css
.article-content img
```

对图片执行：

- 补 `loading="lazy"`。
- 补 `decoding="async"`。
- 添加 Fancybox 点击预览。

### 排除范围

文章图片增强层不处理相册组件内部图片。建议排除：

```css
.milet-album-embed-host img
[data-type="milet-album-embed"] img
[data-fancybox] img
```

如果图片已经由其他组件明确设置 `data-fancybox`，不要重复包裹。

### 包裹规则

如果图片没有外层链接，客户端包一层：

```html
<a
  href="图片地址"
  data-fancybox="article-images-{articleId}"
  data-caption="图片 alt 或 title"
>
  <img loading="lazy" decoding="async" />
</a>
```

如果图片已经在 `<a>` 内：

- `href` 是图片资源时，给该 `<a>` 增加 Fancybox 属性。
- `href` 是普通页面外链时，不劫持原行为。

图片资源判断建议使用扩展名和路径特征白名单：

```text
.jpg
.jpeg
.png
.webp
.gif
.avif
/static/milet/img/
/static/blog/img/
```

### Fancybox 分组

文章普通图片使用独立分组：

```text
article-images-{articleId}
```

如果没有 `articleId`，使用 slug：

```text
article-images-{slug}
```

相册组件使用自己的分组：

```text
album-gallery-{galleryId}-{instanceId}
```

不建议复用固定的 `gallery` 分组名，否则多相册、多文章图片会混在同一个灯箱中。

### 清理规则

文章图片增强层需要记录自己创建的 wrapper 和自己修改过的 anchor。

路由切换、文章重新加载、组件卸载时：

- 解绑文章图片 Fancybox。
- 移除增强层创建的 wrapper，恢复原始图片位置。
- 不调用全局 `Fancybox.destroy()` 清空所有实例，避免影响文章内相册组件。

## 实施步骤

### Phase 1：公开端相册组件抽取

1. 新增 `MiletAlbumViewer.vue`。
2. 把 `MiletPicList.vue` 中的数据加载、无限滚动、Fancybox 绑定和图片列表 UI 迁移到组件。
3. `MiletPicList.vue` 保留为路由页面壳。
4. 调整 Fancybox 分组名，不再使用固定 `gallery`。
5. 验证原相册详情页行为不变。

### Phase 2：公开端文章客户端增强

1. 在 `MiletArticleView.vue` 中新增文章增强生命周期管理。
2. 增加相册占位扫描和动态挂载。
3. 增加普通图片懒加载和 Fancybox 增强。
4. 切换文章或语言时，先清理旧增强，再渲染和挂载新增强。
5. SSR 阶段不执行任何 DOM 和 Fancybox 逻辑。

### Phase 3：Worker 支持相册占位 HTML

1. 在 `TiptapHtmlRenderer.ts` 中新增 `miletAlbumEmbed` 分支。
2. 增加 `galleryId`、`layout`、布尔属性的规范化。
3. 发布文章前收集正文中的相册 ID，批量查询相册标题、描述、封面和照片数。
4. 将相册 metadata map 传给渲染器，输出安全占位 HTML 和静态 fallback。
5. fallback 链接指向当前语言下的相册详情页。
6. 为普通图片、`mixedMedia`、`imageGallery` 输出补充 `decoding="async"`。
7. 必要时补充渲染器单元测试。

### Phase 4：管理端编辑器支持插入相册

1. 新增 Tiptap 扩展 `MiletAlbumEmbed.ts`。
2. 新增节点视图 `MiletAlbumEmbedNodeView.vue`。
3. 在 `ArticleRichTextEditor.vue` 工具栏增加“插入相册”入口。
4. 复用 `listImgseries` 检索公开相册。
5. 插入节点时只保存 `galleryId` 和布局配置。
6. 文章预览中展示相册占位卡片，避免管理端尝试完整加载公开端相册交互。

### Phase 5：验证

公开端：

```text
npm run type-check
npm run build:ssr
npm run verify:ssr:local
```

管理端：

```text
npm run type-check
npm run build
```

Worker：

```text
npm run test
```

浏览器验证：

- 普通文章不包含相册时，正文渲染正常。
- 普通文章图片可点击打开 Fancybox。
- 普通文章图片具有 `loading="lazy"` 和 `decoding="async"`。
- 插入一个相册块后，文章对应位置加载相册。
- 插入相册块的 SSR HTML 中包含相册标题、描述、封面 fallback 和 noscript 链接。
- JS 禁用或组件加载失败时，相册 fallback 可跳转到相册详情页。
- 文章内相册的灯箱覆盖整个文章页面。
- 文章图片灯箱和相册灯箱不串组。
- 同一篇文章插入多个相册时，各相册互不串组。
- PC 下文章布局不抖动。
- 手机下没有 iframe 式嵌套滚动问题。
- 切换文章、切换语言、返回上一页后没有重复绑定和残留监听。

## Review 审查与优化建议

### P1：避免直接使用全局 `Fancybox.destroy()`

当前相册详情页中存在直接销毁 Fancybox 的做法。迁移为共享组件后，如果继续调用全局 `Fancybox.destroy()`，文章普通图片增强和多个相册实例会互相影响。

建议：

- 每个相册实例使用唯一 group 名。
- 组件只绑定自己 root 内的 selector。
- 清理时只清理自己 root 内的增强状态。
- 文章图片增强层也只处理文章正文容器内自己创建或修改的节点。

### P1：动态挂载子应用必须有集中注册和卸载

文章页通过 `v-html` 输出后再挂载相册组件，会创建独立 Vue 子应用。如果不统一记录 app 实例，路由切换后容易残留 observer、事件监听和 Fancybox 绑定。

建议：

- 在 `MiletArticleView.vue` 中维护 `mountedAlbumApps`。
- 每次文章重新 fetch 前先执行 `cleanupArticleEnhancements()`。
- `onBeforeUnmount` 必须调用同一个 cleanup。

### P1：相册组件实例不能共享全局状态

文章中可能插入多个相册。如果相册组件内部使用固定的 `galleryId` ref、固定 Fancybox group 或固定 selector，多个实例会互相污染。

建议：

- 组件内所有 selector 以 root ref 为作用域。
- Fancybox group 使用 `album-gallery-${galleryId}-${instanceId}`。
- IntersectionObserver 保存为组件实例级变量。

### P2：fallback 只输出 metadata，不输出完整照片列表

客户端挂载方案不会让完整相册照片列表参与文章 SSR HTML。Worker 输出标题、描述、封面和 noscript 链接后，SEO 和无脚本体验会明显改善，但搜索引擎仍不会稳定拿到分页照片内容。

建议：

- 第一期只输出相册 metadata fallback，不输出完整照片列表。
- fallback 必须指向相册详情页，保证内容有可访问路径。
- 如果某类文章以相册为主体且 SEO 很重要，再单独评估 SSR 输出前几张照片的方案。

### P2：相册 metadata 查询要避免 N+1

文章可能插入多个相册。如果 renderer 在渲染每个 `miletAlbumEmbed` 节点时直接查库，会造成 N+1 查询，也会让渲染器混入数据访问职责。

建议：

- 在发布流程中先遍历 Tiptap JSON，收集并去重相册 ID。
- 通过 service/repository 批量查询相册 metadata。
- 将 metadata map 传入 `TiptapHtmlRenderer`。
- renderer 保持纯渲染职责，只根据已有 context 输出 HTML。

### P2：图片增强需要避免劫持外链图片说明

文章中可能存在带链接的图片，例如点击图片跳转外部页面。若增强层无条件把外层链接改成 Fancybox，会改变作者意图。

建议：

- 只有 `href` 明确是图片资源时才增强已有 `<a>`。
- 普通页面链接保留原行为。
- 对没有外层 `<a>` 的图片再自动包裹 Fancybox 链接。

### P2：管理端预览不要加载完整公开端相册

管理端文章编辑器中直接加载公开端相册组件会引入 Fancybox、IntersectionObserver、图片分页等复杂交互，容易影响编辑性能和权限边界。

建议：

- 管理端节点视图只显示相册摘要卡片。
- 需要预览时最多展示封面和照片数量。
- 完整交互只在公开端文章页启用。

### P3：普通图片增强可以拆成 composable

文章页后续还会承载相册挂载、图片增强、分享、目录等逻辑。如果全部写在 `MiletArticleView.vue` 中，文件会继续膨胀。

建议：

- 把文章图片增强提取到 `useArticleImageEnhancements.ts`。
- 把相册占位挂载提取到 `useArticleAlbumEmbeds.ts`。
- 页面组件只负责在文章 HTML 更新后调用 setup 和 cleanup。

## 结论

相比 iframe 嵌入方案，本方案的优势是：

- 不需要处理 iframe 高度自适应。
- Fancybox 可以自然覆盖整个页面。
- 手机端没有嵌套滚动和焦点问题。
- 普通文章不改变现有渲染模型。
- 相册详情页和文章内相册可以共享组件。

主要代价是：

- 需要管理客户端动态挂载和卸载。
- SSR 只输出相册占位，不输出完整照片内容。
- Fancybox 绑定需要实例隔离，不能继续依赖全局销毁。

综合 PC、手机最终效果、维护难度和对普通文章的影响，推荐采用“管理端相册占位节点 + 公开端客户端挂载相册组件 + 文章图片客户端增强”的方案。
