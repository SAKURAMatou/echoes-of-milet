# Live Archive Venue Line Art Workflow

用于给 Live Archive 的场馆生成可主题换色的线稿素材。正式素材为透明 `WebP`，前端通过 CSS `mask-image` 控制线条颜色。

## 输入

每个场馆至少需要：

```text
venueName
prefecture
city
officialUrl
outputSlug
```

如果同一场馆对应多个场次，只生成一张素材并复用同一个图片资源。

## 1. 提取建筑特征

先打开场馆官网或可信公开资料，提取 3-6 个可以被线稿表达的识别点：

- 建筑整体体量：低矮大厅、高塔复合设施、圆形大厅、剧场裙房等。
- 屋顶和轮廓：弧形屋顶、长屋檐、层叠屋顶、塔楼顶部等。
- 立面结构：玻璃幕墙、竖向格栅、重复窗格、混凝土墙面等。
- 入口区域：大台阶、入口雨棚、玻璃大厅、广场平台等。
- 特殊形态：圆形/椭圆大厅、传统风屋顶、安藤忠雄式混凝土体块等。

不要把 logo、招牌、文字、人物、车辆、树木、临时布景作为生成目标。

## 2. 生成源图提示词

复制下面模板，把 `{...}` 替换为场馆信息和建筑特征：

```text
Use case: background-extraction
Asset type: venue architectural line-art mask asset for a live archive detail page
Primary request: Create a mask-friendly architectural line drawing of {venueName}, {city}, {prefecture}, Japan.
Reference traits to capture: {从官网或公开资料提取的建筑识别点，例如 broad low civic hall, glass entrance lobby, curved roof, tower volume, vertical fins, wide plaza steps}.
Style/medium: precise architectural technical line art, single-color dark navy strokes only, no filled surfaces, no solid silhouettes, sparse hatching only for facade depth.
Composition/framing: landscape 16:9, front three-quarter view, building centered with generous padding, clean venue profile usable as CSS mask.
Color palette: dark navy/black linework only; no green in the subject.
Text: no text, no signage, no labels, no watermark.
Transparent prep: Draw on a perfectly flat solid #00ff00 chroma-key background. Uniform #00ff00 only, no shadows, no gradients, no texture, no floor plane. Crisp separated edges.
```

注意：

- 如果场馆位于复合设施内，`venueName` 写清楚大ホール所在设施，例如 `Aichi Prefectural Art Theater Large Hall inside Aichi Arts Center`。
- 如果模型生成白底而不是绿底，只要线条清楚，也可以继续进入后处理。
- 生成图保持横向 16:9，同一批素材尽量保持相同尺寸。

## 3. 后处理为 Mask WebP

使用项目脚本把源图转换为透明 WebP mask：

```powershell
C:\Users\dai.lin\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe `
  C:\Users\dai.lin\Documents\my-app\echoes-of-milet\scripts\create_venue_lineart_mask.py `
  --input C:\path\to\generated-source.png `
  --out C:\Users\dai.lin\Documents\my-app\echoes-of-milet\docs\assets\live-archive\venue-lineart\venue-lineart-{year}-{performanceNo}-{slug}.webp `
  --preview
```

脚本会：

- 去除绿色背景。
- 去除白色建筑填充面。
- 抽取深色线条为 alpha。
- 输出 lossless 透明 WebP。
- 使用 `--preview` 时生成浅色/深色背景预览 PNG。

如果白色填充残留较多，提高阈值：

```powershell
--threshold 52
```

如果线条过淡，降低阈值：

```powershell
--threshold 36
```

## 4. 验收标准

正式素材需要满足：

- 文件格式为透明 `WebP`。
- 图片模式可读为 `RGBA`。
- alpha 最小值为 `0`，说明背景可透明。
- 建筑轮廓、入口、主要立面结构可辨认。
- 没有文字、logo、水印、人物和车辆。
- 放在浅色背景和深色背景时都能通过 CSS mask 换色清楚显示。

预览确认后删除 `*-preview-light.png` 和 `*-preview-dark.png`，只保留正式 `.webp`。

## 5. 命名规则

```text
venue-lineart-{year}-{performanceNo}-{slug}.webp
```

示例：

```text
venue-lineart-2024-03-act-city-hamamatsu.webp
venue-lineart-2026-13-festival-hall-osaka.webp
venue-lineart-budokan.webp
```

同一场馆多场复用时，沿用第一场或最稳定的场馆文件名，不重复生成。

