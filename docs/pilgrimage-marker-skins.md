# milet 巡礼纪念章

五枚 SVG 皮肤沿用 `pilgrimage-marker-1` 至 `pilgrimage-marker-5`，分别为歌声、取景、足迹、来信和回声。图案是视觉变体，不是地点分类。默认显示尺寸为 64 × 80，定位尖角为 `(32, 78)`。

## 无文字的随行系列

新增四款保留相同的齿孔、纸面、白色外描边及定位尖角，图案内不出现 `milet` 文字：

| ID | 名称 | SVG | 图案特征 |
| --- | --- | --- | --- |
| `pilgrimage-marker-6` | 斑点鬣狗 | `milet-stamp-hyena.svg` | 圆耳、短鬃、斑点脸颊与宽吻部，赭棕色边框 |
| `pilgrimage-marker-7` | Bluer 虎鲸 | `milet-stamp-orca.svg` | 黑白眼斑、背鳍、胸鳍与海浪，蓝色边框 |
| `pilgrimage-marker-8` | Jean 随行 | `milet-stamp-jean.svg` | 金色犬、垂耳、青绿项圈与金色吊牌，琥珀色边框 |
| `pilgrimage-marker-9` | 星轨手记 | `milet-stamp-starlight.svg` | 原创连笔星轨与手记笔触，紫色边框；不是官方签名复刻 |

鬣狗参考 milet 在 [J-WAVE 访谈](https://www.j-wave.co.jp/original/tokiohot100/guest_past/past_20200607.htm)中提到的喜爱，虎鲸参考 [Bluer 创作访谈](https://www.j-wave.co.jp/original/tokyounited/archives/the-hidden-story/2024/06/21-110918.html)。Jean 使用本站已有宠物形象的配色与特征，四款均为 fan site 原创纪念章。

发布两端静态素材后，应用 `0035_pilgrimage_companion_marker_skins.sql`，通过已有管理端功能清理巡礼缓存并刷新皮肤列表，即可在地点编辑中选择新增皮肤。迁移只补充缺失的 ID，不改写旧皮肤、地点绑定或管理员已登记的同 ID 记录；无新增 API、权限或代理配置。

新增系列优先用于管理端指定：未指定皮肤的地点继续使用原有自动分配池，避免增加皮肤后全图默认图案发生变化。若当前可用池只有新系列，则使用这些可用皮肤。新 ID 的图片异常回退使用已有的默认位图，不请求不存在的 `pilgrimage-marker-6.webp` 等文件。

随行系列预览：`designs/pilgrimage-markers/companions.html`。

## 地图上的配色与对比

纪念章使用饱和的彩色框、浅色纸面、深色图案及白色外描边，避免与外部地图的道路、建筑和绿地混在一起。五款主色分别为青绿 `#087F76`、蓝色 `#2868C8`、琥珀 `#C66A17`、莓红 `#C84071` 和紫色 `#8153C6`。选中、悬停及路线当前位置的名称标签使用深青绿底与白字。

此次配色调整同步两端的同名 SVG，保留既有皮肤 ID、文件 URL、尺寸、锚点与后台选择功能；不需要重新运行迁移。更新后发布公开端及管理端即可。地图瓦片的现有样式保持原样，自定义皮肤不套用新的 SVG 配色。

## 管理端兼容与发布

1. 先发布公开端和管理端。两端都包含 `public/pilgrimage/markers/milet-stamp-*.svg`，通过各自的同源静态路径加载，无需上传 R2。
2. 按 Worker 现有流程应用 `0034_pilgrimage_milet_marker_skins.sql`。迁移更新旧默认图片的 URL、名称、尺寸和锚点，保留地点绑定、发布状态和排序，不覆盖已更换为自定义 URL 的皮肤。
3. 在管理端「圣地巡礼」页面点击「删除全部巡礼缓存」，再刷新皮肤列表。公开端在缓存更新前兼容旧默认 URL，先显示新版纪念章。
4. 在地点编辑的「Marker 皮肤」下拉框选择对应纪念章并保存。选择结果仍通过既有 `marker_skin_id` 字段保存。

管理端素材列表、地点选择器和锚点编辑器使用 `<img>` 展示 SVG。两端素材必须同步更新；不需要新增 API、权限或代理白名单。

## 自定义 SVG

皮肤表单可以登记已托管的 SVG URL，并设置显示尺寸、锚点与发布状态。公开端保留后台登记的 SVG 尺寸、锚点和指定 ID，包括坐标为 0 的锚点。此次没有扩展通用相册上传器的文件格式白名单；内置素材直接随站点发布，自定义 SVG 需先放到可访问的图片地址。

为兼容已有校准结果，旧位图继续使用原有横向偏移；SVG 使用管理端给出的精确锚点。不要把新 SVG 替换为旧 WebP 路径而不修改 URL。

纯设计预览位于工作区的 `designs/pilgrimage-markers/index.html`，实际运行代码以公开端组件与样式为准。
