# 巡礼地图个性化实现方案

本文档是巡礼地图个性化功能的实际实现依据。后续代码调整以本文档为准。

## 当前范围

第一版包含：

1. 个性化 spot marker：使用透明背景 WebP 素材作为 marker 外观，地点名称统一由 marker 上方的 HTML label 显示。
2. 地图底部两角装饰贴图：固定在地图容器底部，不绑定经纬度。
3. 路线人物动画：选择路线后沿当前直线折线自动播放，到达终点 3 秒后自动重播。

第一版路线仍使用 spot 坐标连接出的直线折线，不使用真实道路。

## 相关文件

- `src/components/milet/pilgrimage/pilgrimageMapConfig.ts`
- `src/components/milet/pilgrimage/pilgrimageMapStyles.css`
- `src/components/milet/pilgrimage/PilgrimageMapPane.vue`
- `src/composables/usePilgrimageMapRendering.ts`
- `src/views/milet/MiletPilgrimageView.vue`
- `public/pilgrimage/markers/`
- `public/pilgrimage/decorations/`
- `public/pilgrimage/route/`
- `scripts/generate_pilgrimage_marker_assets.py`
- `scripts/generate_pilgrimage_route_spritesheet.py`

## Marker 素材规范

当前未正式上线，不再使用 `v2` 子目录。正式 marker 素材直接输出到 `public/pilgrimage/markers/`。

```txt
源素材目录：public/pilgrimage/markers/input/
输出目录：public/pilgrimage/markers/
输出格式：WebP
输出画布：256x256
背景：透明
前端 marker 图片显示尺寸：96x96
前端 marker 图片锚点：[48, 94]
文件名：pilgrimage-marker-1.webp 到 pilgrimage-marker-5.webp
```

设计要求：

- 所有 marker 使用统一画布尺寸，避免不同 skin 切换时视觉尺寸跳变。
- 生成后的 marker 必须是透明背景，不能保留棋盘格或纯色背景。
- 地点名称不再写入 marker 素材内部，素材不需要为文字位置单独配置 `labelBox`。
- marker 图案可以保留装饰性空白牌面，但前端不会把地点名称写入这些牌面。

## Marker 处理脚本

marker 脚本默认使用交互式命令循环。启动脚本时不需要在启动命令里写素材路径：

```powershell
python scripts/generate_pilgrimage_marker_assets.py
```

启动后按行输入命令：

```txt
inputs public/pilgrimage/markers/input/*.png
set output-dir public/pilgrimage/markers
set name pilgrimage-marker
set box 256 256
set remove-edge-bg on
set bg-threshold 232
set bg-tolerance 18
set lossless on
set overwrite on
run
quit
```

常用命令：

- `inputs <path/glob> [...]`：替换当前输入列表。
- `add <path/glob> [...]`：追加输入。
- `clear`：清空输入。
- `set <option> <value>`：修改参数。
- `status`：查看当前参数。
- `run`：按当前参数生成素材。
- `help`：查看命令帮助。
- `quit`：退出。

当前输入图的棋盘格是烘焙背景，应使用 `remove-edge-bg` 清理边缘连通背景。只有确认不会误伤内部白色区域时，才使用 `remove-light-bg`。

如果生成后的 WebP 仍然出现灰白棋盘格，说明棋盘格已经作为不透明像素写入图片。此时继续使用 `remove-edge-bg`，并降低阈值，例如：

```txt
set bg-threshold 180
set bg-tolerance 36
run
```

生成脚本会输出 alpha 统计；如果 `transparent=0` 且 `partial=0`，说明结果仍是完全不透明，需要继续调整背景透明化参数。

脚本仍保留一次性命令行模式，主要用于 CI 或临时批处理。

## Marker 配置策略

marker skin 集中配置在 `pilgrimageMapConfig.personalizedMarkers.skins`。

每个 skin 包含：

- `id`：稳定 skin id。
- `imageUrl`：透明 WebP 路径。
- `size`：前端 marker 图片显示尺寸。
- `anchor`：marker 图片中对齐地图经纬度的像素锚点。

`anchor` 是当前个性化 marker 的主要微调入口，格式为 `[x, y]`，坐标基于 `size` 所定义的前端显示尺寸。例如 `size: [96, 96]` 时：

- `anchor[0]` 控制图片内“箭头尖端”的水平位置。箭头尖端在图片里偏左时，减小 x；偏右时，增大 x。
- `anchor[1]` 控制图片内“箭头尖端”的垂直位置。尖端越接近图片底部，y 越大。
- 运行时 `L.divIcon.iconAnchor` 会把气泡、HTML label、marker 图片的堆叠高度一起算进去，因此只需要维护每张 marker 图片自身的箭头尖端坐标。
- 换素材后如果视觉上 marker 偏离实际 spot，优先逐张调整对应 skin 的 `anchor`，不需要改 CSS。

spot 的 marker skin 当前由前端自动选择：

```txt
stableHash(spot.id || spot.title) % skinCount
```

这样同一个 spot 在不同渲染中会稳定使用同一个 marker，不引入随机 SSR/客户端差异。后续如果要后台指定 skin，再扩展 Worker/API/data-admin。

## Marker 避让与隐藏

个性化 marker 比默认 marker 更大，因此点位避让策略集中放在 `pilgrimageMapConfig.markerDeclutter` 中配置。

```ts
markerDeclutter: {
  selectedRoute: {
    outsideRouteMode: 'dot',
    routeSpotCrowdedMode: 'dot',
    routeSpotShowAllMinZoom: 18,
    keepCurrentFull: true,
    keepTerminalFull: true,
  },
  desktop: {
    showAllMinZoom: 16,
    collisionGap: { x: 124, y: 86 },
  },
  mobile: {
    showAllMinZoom: 16,
    collisionGap: { x: 110, y: 78 },
  },
}
```

- `outsideRouteMode`：选中线路后，线路外 spot 的显示方式；`dot` 表示压缩为小圆点，`hidden` 表示不渲染 marker。
- `routeSpotCrowdedMode`：线路上的 spot 在发生拥挤时的降级方式；同样支持 `dot` / `hidden`。
- `routeSpotShowAllMinZoom`：选中线路后，线路 spot 全量显示的最小 zoom。
- `keepCurrentFull`：路线动画当前所在 spot 始终完整显示。
- `keepTerminalFull`：线路起点和终点始终完整显示，保留 START / END 识别。
- `collisionGap`：拥挤判断的屏幕像素间距；由于当前 marker 尺寸较大，数值应比默认 marker 更大。

## Label 与气泡布局

个性化 marker 当前统一使用三层垂直布局：

```txt
封面气泡（仅 zoom 达到条件时显示）
HTML 名称 label
marker 图片
```

布局规则：

- 名称 label 是统一 HTML 样式，不再依赖每张 marker 素材的内部留白。
- 无封面气泡时，label 直接位于 marker 图片上方。
- 有封面气泡时，气泡位于 label 上方。
- `L.divIcon` 的 `iconAnchor` 会按气泡、label、marker 图片的总高度重新计算，地图坐标仍对齐 marker 图片底部锚点。
- 气泡水平位置使用 `--marker-pointer-x` 对齐 marker 实际锚点中心线。

文字显示规则：

- 根据地点名称长度和统一 label 宽度动态计算字号。
- label 最多显示 2 行。
- 使用 `overflow-wrap: anywhere` 允许长名称必要时断行。

## 高 Zoom 封面气泡

规则：

- `photoBubble.desktop.minZoom` 和 `photoBubble.mobile.minZoom` 控制气泡出现的最小 zoom，当前为 `17`。
- 气泡只在非 compact marker 上显示。
- 气泡内封面图使用独立 frame 和 `background-position: center` / `background-size: cover` 渲染。
- 气泡内只显示封面图片；地点名称统一由气泡下方的 HTML label 显示，避免重复。
- active spot 优先显示气泡。
- 非 active spot 会做屏幕坐标碰撞检测，避免气泡互相覆盖。

## 地图底部装饰贴图

底部两角装饰图固定在 `PilgrimageMapPane.vue` 的地图容器层：

- 始终显示。
- 移动端先保留，但尺寸缩小。
- 使用 `pointer-events: none`，不影响地图拖拽、缩放或 marker 点击。
- 不绑定经纬度，因此切换地区或地图中心点变化不会导致贴图位置漂移。

尺寸和位置统一在 `pilgrimageMapConfig.mapDecorations` 中配置，每个装饰图分别配置 PC 和手机布局：

```ts
layout: {
  desktop: {
    size: [72, 138],
    offset: [18, 18],
  },
  mobile: {
    size: [48, 92],
    offset: [10, 12],
  },
}
```

- `layout.desktop.size`：PC 端显示尺寸 `[width, height]`。
- `layout.mobile.size`：手机端显示尺寸 `[width, height]`。
- `offset`：距离对应底角的偏移 `[x, y]`，左下图表示距离左边和底边，右下图表示距离右边和底边。

## 地图选择控制区

城市、区划、线路选择由 `PilgrimageAreaControls.vue` 渲染，移动端和 PC 端都使用折叠面板。

- 默认折叠，只显示当前城市/区划和已选线路摘要，减少对地图内容的遮挡。
- 点击摘要条展开后显示城市、区划、线路三组横向选择。
- 选择线路后自动折叠，让用户直接查看路线与点位。
- PC 端面板限制最大宽度，避免横向覆盖整张地图。

## 路线动画

路线动画配置在 `pilgrimageMapConfig.routeAnimation`：

```ts
routeAnimation: {
  movementSpeed: {
    metersPerSecond: 45,
  },
  replayDelayMs: 3000,
  actor: {
    imageUrl: '/pilgrimage/route/walker-dog-sprite.png',
    frameSize: [128, 72],
    frameCount: 8,
    fps: 8,
    syncFrameRateWithMovement: true,
    walkCycleDistanceMeters: 10,
    minCycleDurationMs: 450,
    maxCycleDurationMs: 1200,
    anchor: [64, 36],
    rotateWithRoute: true,
  },
}
```

已确认规则：

- 选择路线后自动播放。
- 到达终点后等待 `3000ms`。
- 如果没有切换路线或地区，则自动从起点重播。
- 移动速度按经纬度地理距离计算，使用 `metersPerSecond` 配置，不受地图缩放影响。
- 人物脚步 sprite 默认和 `metersPerSecond` 联动：`walkCycleDistanceMeters / metersPerSecond` 得到一次完整走路循环的时长，并通过 `minCycleDurationMs` / `maxCycleDurationMs` 限制极端速度。
- 如果需要固定脚步速度，可把 `syncFrameRateWithMovement` 设为 `false`，此时使用 `frameCount / fps` 作为 sprite 循环时长。
- spot 序号 `1` 是开始点，最后一个是结束点。
- START / END 标签固定使用英文，暂不做多语言。
- 人物按路线方向旋转，并通过水平翻转避免头朝下。
- 路线人物素材由 `scripts/generate_pilgrimage_route_spritesheet.py` 生成；当前使用图片生成的 8 帧横向 sheet，通过 `--sheet-split-mode components` 去绿幕并按人物+狗组件切帧，避免相邻帧残片进入输出。
- 为了让腿部交叉走动在地图上直观可见，当前 sprite 保留人物和狗，显示尺寸使用 `128x72`，源素材按同等比例保留更高分辨率。

## 验证要求

实现或素材更新后至少验证：

1. `npm run build:ssr`
2. `npm run type-check`
3. 桌面端巡礼地图 marker、气泡、路线动画显示正常。
4. 移动端 marker 和底部装饰不遮挡核心操作。
5. 放大到 zoom 17 后，封面气泡出现且不会大面积重叠。
6. 切换地区、切换路线、组件卸载时，旧路线动画被清理。
7. SSR 构建不因 Leaflet、window、document 或计时器报错。

## R2 Marker Skin Registry

个性化 marker 第一版改为“R2 存图 + D1 skin 注册表 + spot 指定 skin”。公开端保留当前 `public/pilgrimage/markers/` 下的本地素材作为兜底，避免 R2 文件未上传、API 异常或图片 404 时出现空白 marker。

### 数据模型

Worker 侧新增 `pilgrimage_marker_skins` 表：

```sql
id TEXT PRIMARY KEY
label TEXT NOT NULL DEFAULT ''
image_url TEXT NOT NULL DEFAULT ''
width INTEGER NOT NULL DEFAULT 96
height INTEGER NOT NULL DEFAULT 96
anchor_x INTEGER NOT NULL DEFAULT 48
anchor_y INTEGER NOT NULL DEFAULT 94
status TEXT NOT NULL DEFAULT 'published'
sort_order INTEGER NOT NULL DEFAULT 0
created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

`pilgrimage_spots` 新增 `marker_skin_id TEXT NOT NULL DEFAULT ''`。spot 没有指定 skin 时，公开端继续使用 `spot.id || spot.title` 的稳定 hash 自动选择，保证旧数据不需要一次性补齐。

### R2 路径约定

marker 图片建议上传到 milet 图片 bucket，访问路径使用现有静态图片入口：

```txt
R2 key: pilgrimage/markers/pilgrimage-marker-1.webp
Public URL: /static/milet/img/pilgrimage/markers/pilgrimage-marker-1.webp
```

`image_url` 可以存 `/static/milet/img/...` 或完整 HTTPS URL。公开端会继续通过现有静态资源 URL 处理逻辑解析。不要只在 R2 中存图片而丢失 `width / height / anchor_x / anchor_y`，这些值是 Leaflet marker 锚点计算的必要元数据。

### API 约定

公开端：

- `/api/milet/pilgrimage/region-tree` 返回 `markerSkins`，只包含 `published` skin。
- spot summary/detail 返回 `markerSkinId`。
- `/api/milet/pilgrimage/districts/:districtId/spots` 同样返回 spot 的 `markerSkinId`。

管理端：

- `/api/admin/pilgrimage/state` 返回所有 `markerSkins`，包括 draft / archived，便于维护历史配置。
- spot 保存 payload 接收 `marker_skin_id`。
- 清理 marker skin 或 spot marker 相关配置后，需要清理巡礼缓存。当前第一版只做选择，不做后台上传和 skin CRUD，因此 seed/migration 更新后应手动清理缓存。

### 公开端兜底策略

公开端的渲染优先级：

1. `spot.markerSkinId` 指定的 API skin。
2. 未指定时，在 API 返回的 published skin 中按稳定 hash 自动选择。
3. API 没有可用 skin 时，使用 `pilgrimageMapConfig.personalizedMarkers.skins` 中的本地素材。
4. API skin 图片加载失败时，`img` 回退到同 id 的本地素材；如果没有同 id，则回退到本地默认 skin。

因此正式上线前可以先把 D1 注册表接好，R2 文件逐步上传；未上传完成时公开端不会出现空白 marker。

### 管理端选择器

spot 表单中新增 marker 选择：

- 默认选项为“自动选择”，保存为空字符串。
- 其它选项来自 `markerSkins`，显示图片预览、名称和 `id`。
- archived skin 可以在编辑旧 spot 时显示，但新选择建议优先使用 published skin。
- 选择器只负责给 spot 保存 `marker_skin_id`；第一版不做 marker 图片上传、裁剪、透明化处理或锚点可视化编辑。

### Marker Skin 管理

管理端在圣地巡礼页顶部“管理操作”按钮组中提供 `Marker 管理` 入口。当前阶段支持维护 marker skin 注册表元数据：

- `id`：稳定 skin id，创建后不建议修改。
- `label`：管理端显示名。
- `image_url`：R2 / 静态图片访问 URL。
- `width / height`：公开端 marker 图片显示尺寸。
- `anchor_x / anchor_y`：marker 图片自身的锚点坐标。
- `status`：`draft` / `published` / `archived`。
- `sort_order`：公开端未指定 skin 时稳定 hash 候选列表的排序。

当前阶段不做锚点可视化编辑，也不做 marker 图片上传、裁剪、透明化处理。素材仍通过现有 R2 上传流程或脚本处理后手动填写 `image_url`。删除操作暂不提供，避免误删仍被 spot 引用的 skin；不再使用时把状态改为 `archived`。
