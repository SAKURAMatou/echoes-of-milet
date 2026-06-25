# Live Archive 实现方案

## 背景

当前公开端已有 timeline、release、gallery、article、pilgrimage 等内容模块，但演出相关内容仍分散在首页高亮、时间线、图集和文章中。下一步建议新增一个独立的 `Live Archive` 模块，用来承载 milet 的巡演、one man live、特别单场演出等档案内容。

本方案只描述可行实现，不包含代码落地。

## 目标

1. 公开端新增 `Live Archive` 模块。
2. 模块默认展示演出列表，列表展示主视觉图和基本信息。
3. 点击演出进入演出详情页。
4. 详情页不沿用公开端现有内容页布局，而是使用浏览器窗口整体空间，形成更沉浸的演出档案页面。
5. 详情页仍保留必要的公开端能力：
   - 公开端标题。
   - 语言切换。
   - 返回演出列表按钮。
6. 支持 one man live 和 tour 两类核心详情体验：
   - one man live：强调单场或两场演出的日期、场馆、setlist 和关联内容。
   - tour：强调巡演历程、站点切换、每站场馆时间和每站 setlist。
7. 管理端新增对应数据管理入口。
8. 演出信息和显示效果配置独立维护：
   - 先录入演出基础数据。
   - 再为已有演出配置公开端展示效果。

## 涉及工程

- `echoes-of-milet`
  - 公开端。
  - 新增 Live Archive 列表页、详情页、组件体系、SSR 数据读取。
- `data-admin`
  - 管理端。
  - 新增演出档案管理页面、演出信息弹窗、场次弹窗、setlist 关联弹窗、显示效果配置入口。
- `milet-worker-ts`
  - Worker/API。
  - 新增 D1 表、管理端 API、公开端 API、权限声明、缓存和数据聚合。

## 总体原则

1. 公开端列表页基于当前公开端整体布局，只添加新模块入口，不重做全站框架。
2. 演出详情页使用独立的全窗口档案布局，但不能脱离语言、标题和返回路径。
3. 演出数据和显示配置分离，避免内容维护被视觉配置拖复杂。
4. one man live 和 tour 使用相同的基础组件，只通过不同 blueprint 组合。
5. `theme / motif` 只作为显示配置，不作为页面可见内容字段展示。
6. 关联内容只保留关联文章和相册，默认以轻量入口展示。
7. setlist 曲目从现有歌曲库中搜索并关联，点击曲目复用公开端现有歌曲详情弹窗。
8. 巡演详情不做复杂地图组件，优先使用巡演主视觉图 + 站点历程交互，降低实现和维护成本。
9. 公开端 SSR 首屏数据必须稳定、可序列化，组件选择必须来自静态 registry。

## 公开端信息架构

### 新增入口

建议新增：

```text
/:lang/milet/live
/:lang/milet/live/:slug
```

列表页：

```text
Live Archive
  - 演出列表
  - 类型筛选：All / Tour / One Man Live / Special Live
  - 年份筛选
  - 关键词搜索
```

详情页：

```text
Live Event Detail
  - 独立全窗口布局
  - 顶部保留：
    - 公开端标题
    - 语言切换
    - 返回 Live Archive
```

### 列表页

列表页基于当前公开端布局，作为 `milet` 体系中的新模块。

每个演出卡片建议展示：

- 主视觉图。
- 演出名称。
- 演出类型。
- 年份。
- 日期范围。
- 场馆或城市数量。
- 场次数量。
- 简短描述。

示例：

```text
Ray of Water
ONE MAN LIVE / 2024
2024.03.15 - 2024.03.16
Nippon Budokan / 2 performances
```

巡演示例：

```text
milet live tour 5AM
TOUR / 2023
2023.09.10 - 2023.11.23
8 cities / 12 performances
```

列表页组件建议：

```text
LiveArchiveListPage
LiveArchiveFilterBar
LiveArchiveCard
LiveArchiveYearGroup
```

### 详情页 Shell

详情页不使用当前公开端常规页面布局，但需要保留轻量全局能力：

```text
LiveDetailShell
  - site title
  - language switch
  - back button
  - page content
```

顶部不需要完整主站导航，否则会削弱演出详情页的沉浸感。建议只保留：

```text
Echoes of milet
ZH / JA
Back to Live Archive
```

## 公开端详情页布局

### 共用组件

不同详情页布局应尽量复用同一批组件：

```text
MainVisualPanel
DateStrip
TourStopRail
SelectedPerformanceFacts
SelectedStopDrawer
ProgressStrip
ClickableSetlist
CompactRelatedLinks
```

组件职责：

- `MainVisualPanel`
  - 展示演出主视觉图。
  - 支持 one man live、tour、special live。
- `DateStrip`
  - 适合 one man live 的 Day 1 / Day 2 切换。
- `TourStopRail`
  - 适合巡演的站点列表切换。
- `SelectedPerformanceFacts`
  - 展示当前选中场次的日期、开场、开演、城市、场馆。
- `SelectedStopDrawer`
  - 巡演站点详情抽屉或侧栏。
- `ProgressStrip`
  - 巡演历程的轻量进度表达。
- `ClickableSetlist`
  - 展示当前选中场次的有效 setlist。
  - 有效 setlist 由演出级默认 setlist 和场次级调整合成。
  - 按 `Main / Encore / Double Encore` 分组展示。
  - 曲目行可点击，打开现有歌曲详情弹窗。
- `CompactRelatedLinks`
  - 轻量展示关联文章和相册。
  - 默认只展示 1-2 篇文章、1-2 个相册。

### One Man Live 布局

适用于单场或两场演出。

推荐 blueprint：

```text
one-man-magazine
```

结构：

```text
LiveDetailShell
  MainVisualHeader
  DateStrip
  ContentGrid
    SelectedPerformanceFacts
    ClickableSetlist
    CompactRelatedLinks
```

交互：

1. 用户进入详情页，默认选中第一场。
2. 如果只有一场，不显示或弱化 `DateStrip`。
3. 如果有两场，显示 Day 1 / Day 2。
4. 切换日期后：
   - 场次事实更新。
   - setlist 按该场次的差异配置更新。
   - 关联文章和相册保持 event 级。
5. 点击 setlist 中的曲目：
   - 如果已关联歌曲库 track，打开现有歌曲详情弹窗。
   - 如果只是文本曲目，显示不可点击或弱提示。

### Tour 布局

适用于多城市、多场次巡演。

推荐 blueprint：

```text
tour-visual-console
```

结构：

```text
LiveDetailShell
  TourDashboardHeader
  TourConsole
    TourStopRail
    MainVisualPanel
    SelectedStopDrawer
  ProgressStrip
  LowerGrid
    ClickableSetlist
    CompactRelatedLinks
```

交互：

1. 用户进入巡演详情页，默认选中场次由 API 返回：
   - 巡演未结束时，选中距离当前时间最近的场次。
   - 巡演已结束时，选中最后一场。
2. 左侧站点列表展示日期、城市和场馆摘要。
3. 中间展示巡演主视觉图，不做复杂地图。
4. 右侧展示当前站点详情。
5. 切换站点后：
   - 当前站点详情更新。
   - setlist 按该站点的差异配置更新。
   - 进度条高亮更新。
6. setlist 曲目同样支持点击打开歌曲详情弹窗。

## 内容模型

建议把演出拆成两层：

```text
Live Event 演出企划
Live Performance 具体场次
```

### Live Event

演出企划字段：

```text
id
slug
type: one_man | tour | special_live | festival
title
titleJa
titleZh
artist
year
dateStart
dateEnd
summaryZh
summaryJa
mainVisualImageId
status: draft | published | archived
eventState: upcoming | ongoing | ended
sortNo
createdAt
updatedAt
```

说明：

- `type` 决定管理端表单和默认 blueprint。
- `mainVisualImageId` 是演出主视觉图。
- 列表页和详情页都使用主视觉图。
- `summary` 是内容字段，不包含 theme / motif 文案。
- `status` 是内容发布状态。
- `eventState` 是演出时间状态，可由日期计算，也可在管理端手动覆盖，用于控制缓存和默认选中场次。

### Live Performance

具体场次字段：

```text
id
eventId
performanceNo
label
date
openTime
startTime
city
region
venueName
venueAddress
notesZh
notesJa
sortNo
```

one man live：

```text
Day 1
Day 2
```

tour：

```text
Tokyo
Osaka
Nagoya
...
Final Tokyo
```

### Setlist

setlist 建议采用“演出级默认配置 + 场次级差异调整”。

原因：

- 巡演中不同场次的 setlist 通常差异不大。
- 如果每个场次都完整维护一份 setlist，管理端输入量和后续修正成本都会很高。
- 公开端仍然按当前选中场次展示 setlist，但数据由服务端或前端合成得到。

演出级 setlist：

```text
id
eventId
title
notes
```

setlist items：

```text
id
setlistId
itemKey
sortNo
section: main | encore | double_encore
songWorkId
songTrackId
displayTitle
notes
```

场次级 setlist override：

```text
id
performanceId
operation: add | remove | replace | move | note
baseItemKey
overrideItemKey
sortNo
section
songWorkId
songTrackId
displayTitle
notes
```

规则：

- setlist 选择曲目时按 track 级别关联，和发布物中的曲目关系保持一致。
- 每个默认 setlist item 必须有稳定 `itemKey`，用于场次差异定位。
- 场次级 override 不依赖 `sortNo` 定位默认曲目，`remove / replace / move / note` 必须通过 `baseItemKey` 指向默认曲目。
- `add` 操作使用 `overrideItemKey` 标识新增曲目，避免同一场多次添加时无法稳定排序。
- `section` 是 setlist 的结构字段，用于区分正篇、encore、double encore，不只作为备注。
- 公开端按 `section` 分组展示；没有 encore 时不显示空分组。
- 排序先按 `section` 顺序，再按 `sortNo`。
- `songTrackId` 是公开端打开歌曲详情弹窗的优先依据。
- `songWorkId` 可作为辅助字段，用于查询 work 信息或兼容现有歌曲详情数据结构。
- 曲目选择参照发布物曲目关联的现有做法，复用相同的歌曲库搜索、track 选择和数据标识。
- 公开端需要的歌曲弹窗入参应由 API 直接返回，避免前端在 live 模块中重新拼接 track 标识。
- 如果歌曲库中没有，可以临时保存 `displayTitle`。
- 公开端点击曲目时，只有存在可映射到现有歌曲详情弹窗的数据，才打开弹窗。
- 具体场次只维护差异项，例如追加 encore、替换某首歌、调整顺序、补充备注。
- Worker 详情接口只返回演出默认 setlist 和每场差异数据，不返回所有场次完整 setlist。
- 公开端提供一个 SSR/CSR 共用的纯函数合成当前场次有效 setlist。
- SSR 首屏使用同一个合成函数生成默认选中场次的 setlist，客户端切换场次时复用该函数。
- 这样 20 场左右的巡演也只需要传输一份默认 setlist 和少量差异数据。

### 关联文章和相册

关联内容只考虑：

```text
related_articles
related_galleries
```

关联采用通用关联表设计，不为 live 单独建立文章/相册关联表。

关联目标层级：

```text
event 级
```

第一阶段建议：

- 文章：只做 event 级关联。
- 相册：从现有 gallery 模块中选择，不新增 live 专属相册类型。
- 相册只做 event 级关联。
- 单次巡演公开照片数量通常不会多到需要为每个场次单独组织相册，因此不考虑 performance 级相册。

通用关联字段建议：

```text
targetType: live_event
targetTable
targetId
relationType: article | gallery
relationTable
relationId
sortNo
```

约束：

- `relationType = gallery` 时，`targetType` 只允许 `live_event`。
- `relationType = article` 时，`targetType` 只允许 `live_event`。
- 第一阶段不支持 `live_performance` 级关联。
- `targetTable` 和 `relationTable` 用于标记实际关联表或稳定表 key，避免通用关联扩展后只靠类型推断。

公开端展示规则：

- 默认显示最多 2 篇文章。
- 默认显示最多 2 个相册。
- 无关联内容时隐藏 `CompactRelatedLinks`。
- 关联内容区域永远是辅助模块，不作为页面主视觉区。

## 显示效果配置

演出信息和显示效果配置必须独立。

### 演出信息

演出信息是内容事实：

```text
标题
类型
年份
日期
场次
场馆
setlist
关联文章
相册
```

### 显示效果

显示效果是公开端渲染策略：

```text
blueprint
themePreset
component settings
main visual treatment
```

建议配置字段：

```text
eventId
status: draft | published
blueprint
themePreset
components[]
updatedAt
```

显示效果配置需要区分草稿和发布状态：

- `draft` 用于管理端编辑和公开端 preview。
- `published` 用于正式公开页面 SSR。
- 当显示配置未发布时，公开端详情页使用系统默认 blueprint。
- 管理端可以先完成演出信息和 setlist，再逐步调整显示效果草稿，最后发布显示配置。

发布前需要进行必要校验：

- 演出标题、类型、年份、日期范围必须完整。
- 必须设置主视觉图。
- 至少存在一个场次。
- 场次必须有日期、开场/开演时间、城市和场馆。
- 必须存在演出级默认 setlist。
- setlist 至少包含一个 `main` section 曲目。
- 已关联曲目必须能映射到发布物曲目关联使用的 track 标识。
- 显示配置未发布时允许发布演出，但公开端使用默认 blueprint。
- 显示配置发布时必须校验 blueprint、themePreset 和 componentKey 均在公开端 catalog 中存在。

`blueprint` 示例：

```text
one-man-magazine
tour-visual-console
```

`components` 示例：

```text
mainVisual.default
dateStrip.default
performanceFacts.default
setlist.clickable
related.compact
tourStopRail.default
selectedStopDrawer.default
progressStrip.default
```

### componentKey

`componentKey` 是公开端组件 registry 的唯一编号，不是文件路径。

管理端保存：

```text
setlist.clickable
related.compact
mainVisual.default
```

公开端根据 registry 渲染：

```text
componentKey -> Vue component
```

这样可以保证：

- SSR 可分析。
- 管理端不用知道公开端文件路径。
- 组件重构不影响已保存配置。
- one man live 和 tour 可以复用同一个组件，只改变组合位置。

## 公开端 SSR 约束

详情页需要 SSR 友好。

要求：

1. API 返回 event、performances、eventSetlist、setlistOverrides、relations、displayConfig。
2. 首屏默认选中场次由服务端确定：
   - one man live：第一场。
   - tour 未结束：距离当前时间最近的场次。
   - tour 已结束：最后一场。
3. 初始选中状态注入 SSR initial state。
4. 组件选择来自静态 registry，不使用任意字符串动态 import。
5. 不在 SSR 阶段访问 `window`、`document`、`localStorage`、DOM 尺寸。
6. 歌曲详情弹窗只在客户端交互后打开。
7. 详情页全窗口布局仍通过当前 `src/server/render.ts` 和 Pages Function 管线渲染。

进行中的巡演需要特别处理缓存：

- 演出详情页仍采用 SSR。
- 进行中巡演的场次、setlist、关联内容可能持续调整，不建议做长期 SSG。
- Worker 公开详情接口应按演出状态控制缓存时间：
  - 已结束且稳定的演出可以使用较长缓存。
  - 进行中或草稿预览数据使用短缓存或不缓存。
- 管理端更新演出、场次、setlist、关联内容或显示配置发布后，需要清理对应 live event detail 缓存。
- 缓存只保存演出、场次、默认 setlist、场次差异和关联内容等原始数据。
- `initialPerformanceId` 不进入缓存，每次请求读取缓存数据后即时计算。
- 默认场次计算固定使用 JST，避免服务端和客户端时区差异导致结果不一致。
- SSR 默认选中场次要由稳定规则决定，不随客户端环境变化：
  - one man live：第一场。
  - tour 未结束：距离当前时间最近的场次。
  - tour 已结束：最后一场。
  - 默认选中结果必须由 API 明确返回为 `initialPerformanceId`。

## Worker API

### 公开端 API

建议新增：

```text
GET /api/milet/live/events
GET /api/milet/live/events/:slug
```

列表接口返回：

```text
id
slug
type
title
year
dateStart
dateEnd
mainVisual
performanceCount
cityCount
venueSummary
summary
```

详情接口返回：

```text
event
performances[]
eventSetlist
setlistOverridesByPerformanceId
relatedArticles
relatedGalleries
displayConfig
initialPerformanceId
```

公开端新增 API 后需要更新：

```text
echoes-of-milet/api-proxy.config.json
```

### 管理端 API

建议新增：

```text
GET  /admin/live/events
GET  /admin/live/events/:id
POST /admin/live/events/save
POST /admin/live/events/delete
POST /admin/live/events/:id/publish
POST /admin/live/events/:id/archive

GET  /admin/live/events/:id/performances
POST /admin/live/performances/save
POST /admin/live/performances/delete

GET  /admin/live/events/:id/setlist
POST /admin/live/events/:id/setlist/save

GET  /admin/live/performances/:id/setlist-overrides
POST /admin/live/performances/:id/setlist-overrides/save

GET  /admin/live/events/:id/display
POST /admin/live/events/:id/display/save
POST /admin/live/events/:id/display/publish
```

管理端新增 API 后需要更新：

```text
data-admin/public/_worker.js
```

Worker 中 `/admin` 路由需要显式配置权限。

## 管理端设计

### 页面入口

新增管理页面：

```text
Live Archive 管理
```

默认展示已有演出列表。

列表字段：

```text
主视觉缩略图
标题
类型
年份
日期范围
场次数
状态
显示效果状态
更新时间
操作
```

操作：

```text
编辑信息
场次
Setlist
关联内容
显示效果
预览
发布/下架
```

### 添加新演出

添加新演出使用弹窗。

弹窗只维护演出基础信息，不放入复杂场次和 setlist。

字段：

```text
类型
标题
年份
日期范围
主视觉图
简介
状态
```

保存后回到列表，并允许继续配置：

```text
添加场次
设置 setlist
关联文章/相册
设置显示效果
```

### 场次管理

场次信息使用弹窗维护。

one man live：

```text
添加 Day 1
添加 Day 2
```

tour：

```text
添加巡演站点
```

字段：

```text
标签
日期
开场时间
开演时间
城市
地区
场馆名称
场馆地址
备注
排序
```

巡演场地信息不需要在演出主表里堆叠，全部进入 performance 层。

### Setlist 设置

setlist 设置使用多个弹窗入口，避免单个表单过重。

建议拆分为：

```text
默认 Setlist 弹窗
场次差异弹窗
曲目选择弹窗
```

默认 Setlist 弹窗：

1. 维护演出级默认 setlist。
2. 弹窗内按 section 分组显示曲目：
   - Main
   - Encore
   - Double Encore
3. 每个 section 内独立排序。
4. 移动曲目时允许跨 section 调整。
5. 添加曲目时打开“曲目选择弹窗”。

曲目选择弹窗：

1. 参照发布物曲目关联的做法。
2. 复用现有歌曲库搜索和 track 选择逻辑。
3. 选择结果回填到默认 setlist 或场次差异。

场次差异弹窗：

1. 选择具体场次。
2. 基于默认 setlist 展示差异状态。
3. 对该场次维护差异：
   - 添加曲目。
   - 移除曲目。
   - 替换曲目。
   - 调整顺序。
   - 调整 section。
   - 添加备注。
4. 支持复制其他场次的差异配置。

这样可以降低数据输入时表单的视觉复杂度，也避免一个弹窗同时承担默认 setlist、曲目搜索和场次覆盖三类任务。

### 关联文章和相册

关联也使用弹窗。

文章：

```text
搜索文章
选择文章
排序
移除
```

相册：

```text
从现有相册中搜索
选择已有相册
排序
移除
```

相册只在演出 event 级维护，不进入具体场次弹窗。

关联内容区不需要复杂布局，因为公开端预计只展示少量入口。

### 显示效果配置

显示效果配置在演出信息完成后进行。

管理入口：

```text
设置显示效果
```

字段：

```text
blueprint
themePreset
组件启用状态
组件顺序
局部参数
```

管理端不直接渲染公开端组件。建议使用 component catalog：

```text
componentKey
名称
说明
适用类型
预览缩略图
可配置参数
```

真实预览通过公开端 preview 路由完成：

```text
/:lang/milet/live-preview/:draftId
```

管理端保存显示配置草稿后，在 iframe 或新窗口中打开公开端 preview。

## 数据库建议

第一阶段可新增以下表：

```text
live_events
live_performances
live_setlists
live_setlist_items
live_performance_setlist_overrides
content_relations
live_display_configs
```

`content_relations` 使用通用关联设计：

```text
id
target_type: live_event | live_performance
target_table
target_id
relation_type: article | gallery
relation_table
relation_id
sort_no
created_at
updated_at
```

约束建议：

```text
UNIQUE(target_type, target_id, relation_type, relation_id)
INDEX(target_type, target_id, relation_type, sort_no)
INDEX(relation_type, relation_id)
```

规则：

- 第一阶段文章关联只支持 `live_event`。
- 第一阶段相册关联只支持 `live_event`。
- 相册从现有 gallery 模块中选择。
- `target_table` / `relation_table` 使用稳定表 key，例如 `live_events`、`articles`、`gallery`，用于明确关联指向。
- `target_type` 保留扩展空间，但第一阶段只开放 live archive 的 `live_event`。
- 如果后续其他模块也需要通用关联，可以复用 `content_relations`。

setlist 表关系：

```text
live_setlists.event_id -> live_events.id
live_setlist_items.setlist_id -> live_setlists.id
live_performance_setlist_overrides.performance_id -> live_performances.id
```

`live_display_configs` 需要保存草稿和发布状态。第一阶段不考虑发布历史版本，只保留当前草稿和当前发布配置，并约束同一 event 同一 status 只有一条有效配置。

## 公开端路由和导航

公开端需要调整：

```text
src/router/routes.ts
src/composables/SideMenueData.ts
render.config.json
api-proxy.config.json
```

建议路由：

```text
/:lang/milet/live
/:lang/milet/live/:slug
```

列表页可使用现有公开端布局。

详情页 meta 中明确 SSR：

```text
renderMode: ssr
seoKey: liveEventDetail
```

详情页第一阶段统一 SSR，不做 SSG。进行中巡演数据可能变化，应依赖短缓存和管理端更新后的缓存失效保证内容及时性。

## 权限

Worker 新增管理权限：

```text
live:read
live:create
live:update
live:delete
live:publish
live:display:update
```

管理端按钮通过现有 `PermissionButton` 和权限 composable 控制。

## 分阶段落地

### Phase 1：数据模型与 Worker API

- 新增 migration。
- 新增 ORM / Repository。
- 新增 service。
- 新增管理端 API。
- 新增公开端列表和详情 API。
- 更新管理端与公开端代理白名单。

### Phase 2：管理端基础数据维护

- 新增 Live Archive 管理页。
- 演出列表。
- 添加/编辑演出弹窗。
- 场次管理弹窗。
- setlist 管理弹窗。
- 歌曲库搜索关联。
- 关联文章/相册弹窗。

### Phase 3：公开端列表页

- 新增 Live Archive 入口。
- 新增演出列表页。
- 列表卡片展示主视觉和基础信息。
- 支持类型、年份、关键词筛选。

### Phase 4：公开端详情页

- 新增 `LiveDetailShell`。
- 实现 one man live blueprint。
- 实现 tour blueprint。
- 实现场次切换。
- 实现 setlist 曲目点击打开歌曲详情弹窗。
- 实现轻量关联文章和相册入口。

### Phase 5：显示效果配置

- 新增 display config 数据维护。
- 新增 component catalog。
- 管理端显示效果配置页。
- 公开端 registry。
- 公开端 preview 路由。

### Phase 6：验证和优化

- Worker 跑 `npm run test`。
- 管理端跑 `npm run type-check` 和 `npm run build`。
- 公开端跑 `npm run type-check`、`npm run build:ssr`、`npm run verify:ssr:local`。
- 浏览器检查：
  - 列表页桌面和移动端。
  - one man live Day 1 / Day 2 切换。
  - tour 站点切换。
  - setlist 曲目弹窗。
  - 语言切换。
  - 返回列表。
  - 无关联内容时模块隐藏。

## MVP 范围建议

第一版建议控制范围：

1. 演出类型支持：
   - one man live
   - tour
2. 详情 blueprint 支持：
   - `one-man-magazine`
   - `tour-visual-console`
3. 关联内容：
   - event 级文章
   - event 级相册，从现有 gallery 中选择
4. setlist：
   - event 级默认 setlist
   - performance 级差异调整
   - 参照发布物曲目关联选择 track
   - 点击打开歌曲详情弹窗
5. 显示配置：
   - blueprint
   - themePreset
   - 组件启用/隐藏
   - 草稿 / 发布状态

暂不做：

- 真实地图。
- 复杂自定义组件在线编辑。
- performance 级文章。
- performance 级相册。
- 多套完全不同的自定义页面。
- 下载主视觉图入口。

## 已确认决策

1. 相册从现有 gallery 模块中选择，不新增 live 专属相册类型。
2. setlist 选择曲目时按 track 级别关联，和发布物曲目关系保持一致。
3. setlist 采用演出级默认配置，具体场次只维护差异调整。
4. 显示效果配置需要草稿和发布状态区分。
5. 演出详情页采用 SSR。
6. 进行中巡演的数据可能调整，因此不作为第一阶段 SSG 对象，应使用短缓存和管理端更新后的缓存失效。
7. 演出与文章、相册的关联采用通用关联表。
8. 相册只做 event 级关联。
9. 文章也只做 event 级关联。
10. 显示效果发布不保留历史版本，只保留当前草稿和当前发布配置。
11. 巡演默认选中场次由 API 返回：
    - 巡演未结束时，选中距离当前时间最近的场次。
    - 巡演已结束时，选中最后一场。
12. `initialPerformanceId` 不进入缓存；缓存只保存原始数据，默认选中结果每次请求按 JST 即时计算。
13. setlist item 使用稳定 `itemKey`，场次差异通过 `baseItemKey` / `overrideItemKey` 定位。
14. setlist 有效结果在公开端通过 SSR/CSR 共用纯函数合成，接口不返回所有场次的完整 setlist。
15. setlist 管理拆分为默认 Setlist、场次差异、曲目选择多个弹窗，降低单个表单复杂度。
