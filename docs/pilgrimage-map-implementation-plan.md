# 圣地巡礼地图模块实现方案

## 1. 背景与目标

本方案目标是新增一个“圣地巡礼指南/记录”模块：

- 公开端按照地区层级展示巡礼地点。
- 地区层级为：城市名称 -> 城市区划 -> 地图标记。
- 地图平台使用 Leaflet + OpenMapTiles/Stadia `osm_bright` 兼容瓦片服务。
- 点击地图标记后，展示系统内照片、地点描述、作品信息等内容。
- 点击导航按钮后，根据地点所属地区跳转到不同导航平台：
  - 中国地区：高德地图。
  - 非中国地区：Google Maps。
- 管理端支持通过解析地图地址链接录入坐标。
- 管理端支持批量导入。
- 对固定巡礼地点数据引入缓存，提高公开端访问性能。

## 2. 总体架构

整体采用“业务数据自有化、底图服务外部化、导航跳转平台化”的设计。

```txt
公开端 Vue 页面
  -> Leaflet 地图展示
  -> 请求 Worker API
  -> Worker 优先读取缓存
  -> 缓存未命中时读取 D1
  -> 图片 URL/元数据来自现有图片系统与 R2

管理端 Vue 页面
  -> 录入地点信息
  -> 粘贴地图链接 / 批量导入
  -> Worker 解析坐标和来源
  -> 管理员确认城市、区划、坐标
  -> 保存到 D1
  -> 清理或刷新相关缓存
```

底图由 Leaflet 加载 OpenMapTiles/Stadia `osm_bright` 兼容瓦片服务；圣地巡礼的地点、照片、说明、导航信息全部来自系统自己的数据。

## 3. 公开端展示方案

公开端建议拆为三个层级：

```txt
城市列表
  -> 城市区划列表
    -> 区划地图点位
```

考虑巡礼地区总量最大约几千条，城市和区划数据可以合并为一个地区树接口一次性加载。页面初始化时先获取全部城市/区划元数据；用户点击具体区划后，再加载该区划下的 spots 点位信息。

示例：

```txt
上海
  - 黄浦区
  - 静安区
  - 徐汇区

东京
  - 涩谷区
  - 新宿区
  - 千代田区
```

用户选择城市区划后：

1. 前端从已加载的地区树中读取城市和区划元数据。
2. 前端请求该区划下的地点数据。
3. 地图移动到该区划中心点或边界范围。
4. 地图渲染该区划下的 marker。
5. 用户点击 marker。
6. 打开详情弹窗、右侧抽屉或移动端底部面板。
7. 展示地点照片、描述、地址、作品信息、标签、导航按钮。
8. 详情照片列表中的照片可以点击查看大图。

桌面端推荐使用右侧详情抽屉：

```txt
地图区域 + 右侧地点详情
```

移动端推荐使用底部面板：

```txt
地图全屏 + 底部弹出地点详情
```

Leaflet 原生 popup 可以只展示轻量信息，例如地点名称和缩略图；完整照片和描述建议用 Vue 自己的详情组件展示，便于维护和扩展。

详情面板中的照片展示应复用公开端现有图片能力：

- 缩略图渲染使用现有 `LazyImage.vue` 懒加载组件。
- 点击照片后使用现有 Fancybox 大图查看方式，不单独实现新的 lightbox。
- 照片数据建议同时返回缩略图 URL、大图 URL、宽高、alt 和 caption，便于懒加载、预览、下载和无障碍文本复用。

## 4. 地图标记与交互

地图标记建议至少支持以下信息：

- 地点名称。
- 作品名称。
- 封面缩略图。
- 地点类型，例如车站、神社、街景、学校、商店、桥梁等。

点击 marker 后建议执行：

```txt
高亮当前 marker
  -> 地图轻微移动或缩放到目标点
  -> 打开详情面板
  -> 加载地点详情
  -> 展示照片和描述
```

地图上标记较少时，可以直接渲染 marker。后续如果某个城市或区划点位数量较多，可以增加 marker clustering，但第一版不建议过度复杂化。

## 5. 导航平台分流

导航分流规则建议统一放在服务端或公共导航工具层，不要分散在多个页面组件内。

基础规则：

```txt
country_code = CN
  -> 高德地图

country_code != CN
  -> Google Maps
```

地点数据中建议保留可覆盖字段：

```txt
navigation_provider: auto / amap / google
navigation_mode: walking / driving / transit
```

这样默认按国家/地区自动判断，也允许管理端对特殊地点手动调整。

### 5.1 中国地区导航

中国地区跳转高德地图。

需要注意：

- 高德地图常用坐标体系是 GCJ-02。
- 高德 URI 参数通常使用“经度,纬度”的顺序。
- 站内 Leaflet 展示通常使用 WGS84 坐标。

因此中国地点建议保存：

```txt
display_lat / display_lng：站内展示坐标，面向 Leaflet。
nav_lat / nav_lng：导航坐标，面向高德。
nav_coord_system：GCJ-02 或来源坐标体系。
```

### 5.2 非中国地区导航

非中国地区跳转 Google Maps。

Google Maps URLs 可以直接打开搜索或路线导航，不需要在站内加载 Google Maps JavaScript API。

海外地点通常可以使用 WGS84 坐标作为展示和导航坐标。

## 6. 坐标体系设计

坐标体系是本模块的重点风险之一。

建议地点表不要只保存一组坐标，而是保存展示坐标和导航坐标：

```txt
display_lat
display_lng
display_coord_system

nav_lat
nav_lng
nav_coord_system
```

推荐规则：

```txt
海外地点：
  display 坐标 = WGS84
  nav 坐标 = WGS84

中国地点：
  display 坐标 = Leaflet 展示使用坐标
  nav 坐标 = 高德导航使用坐标
```

同时保存坐标来源：

```txt
source_map_provider: google / amap / osm / manual / import
source_map_url
source_place_id
source_poi_id
coordinate_quality: exact / approximate / unchecked
coordinate_note
```

圣地巡礼地点很多时候不是普通 POI 中心点，而是拍摄点、路口、桥边、楼梯、站台视角，因此最终坐标应以管理员确认后的点位为准。

## 7. 管理端录入方案

管理端录入建议支持两种方式：

1. 单条录入：粘贴地图链接解析。
2. 批量导入：CSV / Excel 模板导入。

### 7.1 单条录入

单条录入流程：

```txt
填写地点名称、作品、描述
  -> 粘贴 Google Maps / 高德地图 / 其他地图链接
  -> Worker 解析链接
  -> 提取坐标、地点名、来源平台
  -> 地图上展示候选点
  -> 管理员选择城市和区划
  -> 管理员确认或微调坐标
  -> 关联系统内已有图片
  -> 保存草稿或发布
  -> 清理对应地区缓存
```

支持的输入类型建议包括：

- Google Maps 分享链接。
- Google Maps 坐标链接。
- 高德地图分享链接。
- 高德 URI 链接。
- 纯经纬度文本。

如果是短链接，Worker 可以跟随重定向获取最终 URL 后再解析。

解析后的数据不要直接发布，必须进入确认环节。

### 7.2 批量导入

批量导入模板建议包含：

```txt
城市
区划
国家/地区代码
地点名称
作品名称
地图链接
纬度
经度
坐标体系
地址
描述
标签
图片ID
发布状态
```

导入流程：

```txt
上传 CSV / Excel
  -> 逐行解析地图链接或经纬度
  -> 校验城市和区划是否存在
  -> 校验经纬度格式
  -> 检查重复地点
  -> 生成导入预览
  -> 标记可导入 / 需确认 / 失败
  -> 管理员确认
  -> 写入 D1
  -> 清理相关缓存
```

导入结果建议分为：

- 可直接导入。
- 需要人工确认。
- 解析失败。
- 疑似重复。

## 8. 数据模型建议

### 8.1 地区表

```txt
regions
  id
  parent_id
  name
  level: country / city / district
  country_code
  city_code
  district_code
  center_lat
  center_lng
  default_zoom
  bbox
  sort_order
  status
```

### 8.2 地点表

```txt
pilgrimage_spots
  id
  title
  work_title
  description
  address
  country_code
  city_id
  district_id

  display_lat
  display_lng
  display_coord_system

  nav_lat
  nav_lng
  nav_coord_system
  navigation_provider
  navigation_mode

  source_map_provider
  source_map_url
  source_place_id
  source_poi_id

  coordinate_quality
  coordinate_note

  status
  sort_order
  created_at
  updated_at
```

### 8.3 地点图片关联表

图片本身沿用现有图片系统，巡礼模块只需要维护地点和图片的关系。

```txt
pilgrimage_spot_images
  spot_id
  image_id
  caption
  sort_order
```

## 9. API 设计建议

公开端 API：

```txt
GET /api/milet/pilgrimage/region-tree
GET /api/milet/pilgrimage/districts/:districtId/spots
GET /api/milet/pilgrimage/spots/:spotId
```

管理端 API：

```txt
POST /api/admin/pilgrimage/map-links/parse
POST /api/admin/pilgrimage/spots
PUT /api/admin/pilgrimage/spots/:spotId
POST /api/admin/pilgrimage/imports
GET /api/admin/pilgrimage/imports/:importId/preview
POST /api/admin/pilgrimage/imports/:importId/confirm
```

公开端点位接口建议返回轻量数据：

```txt
id
title
work_title
display_lat
display_lng
cover_image_url
category
tags
```

详情接口再返回完整数据：

```txt
id
title
work_title
description
address
photos
navigation_provider
navigation_mode
navigation_url
```

其中 `photos` 建议返回：

```txt
id
thumb_url
full_url
width
height
alt
caption
download_url
sort_order
```

## 10. 多语言适配

公开端现有语言体系以路由前缀和语言状态为主：

- URL 使用 `/zh/...` 和 `/ja/...`。
- 站内语言状态使用 `zh` / `jp`，对外 URL 中日文使用 `ja`。
- 业务数据沿用现有系统做法：接口统一返回 `{ "jp": {}, "zh": {} }` 的整体结构，前端按当前语言从对应分支取数据。

### 10.1 需要多语言的内容

地区和地点数据中，面向用户展示的字段都需要支持多语言：

```txt
{
  "jp": {
    "regions": [],
    "spots": [],
    "spot": {}
  },
  "zh": {
    "regions": [],
    "spots": [],
    "spot": {}
  }
}
```

每个语言分支内使用当前系统已经习惯的展示字段名，例如：

```txt
id
title
work_title
description
address
category
photos.caption
```

经纬度、国家/地区代码、坐标体系、导航平台、图片 ID、图片 URL 等结构化字段在 `jp` 和 `zh` 分支中可以保持同值，方便前端直接消费同一种数据结构。

### 10.2 API 语言策略

公开端 API 不需要通过 `lang` 参数返回单语言数据，直接返回双语整体结构：

```txt
GET /api/milet/pilgrimage/region-tree
GET /api/milet/pilgrimage/districts/:districtId/spots
GET /api/milet/pilgrimage/spots/:spotId
```

响应结构示例：

```json
{
  "jp": {
    "regions": [],
    "spots": [],
    "spot": {}
  },
  "zh": {
    "regions": [],
    "spots": [],
    "spot": {}
  }
}
```

前端根据当前 `$lang.lang` 选择 `jp` 或 `zh` 分支。缺少当前语言内容时，回退顺序建议为：

```txt
当前语言分支 -> zh 分支 -> jp 分支 -> 空字符串
```

### 10.3 前端文案与 SEO

页面静态文案需要提供中文和日文两套内容，包括：

- 城市、区划筛选文案。
- 地图加载、空状态、错误状态。
- 详情面板按钮，例如“导航”“查看照片”“返回地图”。
- 地图无点位提示。
- SEO 标题、描述和 Open Graph 文案。

语言切换复用站点现有语言功能和路由前缀，不在巡礼地图模块内新增独立语言切换控件。效果图中的语言切换只作为语言状态提示参考，不进入第一版功能范围。

路由建议新增：

```txt
/:lang/milet/pilgrimage
/:lang/milet/pilgrimage/:cityId?
/:lang/milet/pilgrimage/:cityId/:districtId?
```

第一版可以先使用单页内状态管理城市和区划选择；如果后续需要分享某个区划视图，再把城市和区划选择同步到路由参数。

### 10.4 管理端录入要求

管理端单条录入和批量导入都需要覆盖多语言字段：

- 单条录入表单至少包含中文和日文标题、描述、地址、图片说明。
- 批量导入模板应增加 `地点名称_zh`、`地点名称_jp`、`描述_zh`、`描述_jp`、`地址_zh`、`地址_jp`、`图片说明_zh`、`图片说明_jp`。
- 管理端保存前提示缺失语言字段，但第一版不强制所有语言完整，允许按回退规则展示。

## 11. 缓存策略

圣地巡礼地点通常比较固定，第一版只缓存公开端业务数据，不缓存第三方底图瓦片。

推荐缓存对象控制在三个层级：

- 地区树：城市和区划合并返回。
- 区划下的点位列表。
- 地点详情。

不建议缓存对象：

- OpenMapTiles/Stadia 等第三方底图瓦片。

原因：

- 第三方瓦片服务允许正常交互式使用，但不适合被批量抓取、长期离线缓存或做代理规避限制。
- D1 不适合存地图瓦片。
- KV/R2 技术上可以存瓦片，但第三方瓦片服务的使用政策和运维边界不适合作为项目默认方案。

因此建议缓存系统自己的巡礼数据，而不是缓存外部底图瓦片。

### 11.1 缓存层选择

建议采用：

```txt
D1：主数据源
KV 或 Cloudflare Cache API：缓存公开端 JSON 响应，二选一即可
R2：存图片文件和缩略图
浏览器缓存：缓存瓦片服务返回的底图资源
```

缓存优先级：

```txt
Worker 收到请求
  -> 先查 KV 或 Cache API
  -> 命中则返回
  -> 未命中则查 D1
  -> 组装响应
  -> 写入缓存
  -> 返回前端
```

### 11.2 推荐缓存 Key

缓存 key 保持少量、稳定、可按发布动作定向删除：

```txt
pilgrimage:region-tree
pilgrimage:spots:{district_id}
pilgrimage:spot:{spot_id}
```

每个缓存值直接保存 `{ "jp": {}, "zh": {} }` 的完整双语响应结构，不按语言拆分缓存。第一版不引入版本号 key、GeoJSON 单独 key、图片元数据单独 key，也不把筛选条件提前纳入 key。后续如果增加作品筛选、标签筛选或点位数量明显变大，再按实际查询参数扩展 key。

### 11.3 缓存时间建议

缓存失效采用主动删除，不依赖 TTL 自动过期来保证业务一致性。

建议仍设置较长 TTL 作为兜底，避免异常缓存永久残留，但 TTL 不参与正常发布流程：

- 地区树：7 天。
- 区划点位列表：7 天。
- 地点详情：7 天。

正常情况下，管理端发布、下架、删除、修改地区结构后立即调用 Worker 删除相关缓存 key，下一次公开端请求重新从 D1 读取并写入缓存。

### 11.4 缓存失效策略

管理端发布、下架、删除地点或修改地区结构时，由 Worker 定向删除相关 key。

清理范围：

```txt
编辑地点详情：
  删除 pilgrimage:spot:{spot_id}
  删除 pilgrimage:spots:{district_id}

新增或删除地点：
  删除 pilgrimage:spots:{district_id}

修改区划结构：
  删除 pilgrimage:region-tree
```

管理端需要提供独立的“删除巡礼缓存”按钮，用于人工修复缓存异常。按钮只允许删除 `pilgrimage:` 前缀下的缓存，不影响其他业务缓存。

按钮建议支持三个范围：

```txt
删除全部巡礼缓存：
  删除 pilgrimage:region-tree
  删除全部 pilgrimage:spots:*、pilgrimage:spot:*

删除某城市缓存：
  删除 pilgrimage:region-tree
  删除该城市下所有 district 的 pilgrimage:spots:{district_id}

删除某地点缓存：
  删除 pilgrimage:spot:{spot_id}
  删除地点所属 district 的 pilgrimage:spots:{district_id}
```

如果当前缓存后端不支持按前缀扫描删除，管理端按钮应通过 D1 查询城市、区划、地点 ID 后批量拼出固定 key 删除。

## 12. 地图底图与交互策略

第一版采用 Leaflet + OpenMapTiles/Stadia `osm_bright` 兼容瓦片服务。底图选择以当前实现为准：视觉上弱化路网和文字干扰，让巡礼路线、marker、名称标签和详情内容成为主要信息。

需要注意：

- 页面必须显示地图数据署名，当前署名包含 Stadia Maps、OpenMapTiles 和 OpenStreetMap contributors。
- 不要批量下载或长期缓存第三方底图瓦片。
- 不要用 Worker 代理第三方瓦片并绕过瓦片服务限制。
- 如果访问量变大，优先评估商业瓦片服务配额、授权和 SLA，再考虑自建瓦片服务。

当前瓦片配置建议保持集中声明，避免散落在组件内部：

```txt
tile_url = https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png
attribution = Stadia Maps / OpenMapTiles / OpenStreetMap contributors
min_zoom = 11
max_native_zoom = 19
max_zoom = 20
update_when_idle = true
update_when_zooming = false
keep_buffer = 2
detect_retina = false
```

地图交互规则：

- 城市默认 zoom 建议 11-12，地区默认 zoom 建议 14-15。
- 切换地区时复用同一个 Leaflet 实例：先清除旧 `maxBounds`，加载新区划 spots，地图 `flyTo` 到区划中心和默认 zoom，再应用新的浏览范围限制。
- 切换路线时，地图回到当前区划默认 zoom，避免停留在上一个 spot 的放大级别。
- 点击 spot 时，地图移动到目标点，zoom 至少为 15，最高不超过 20。
- 当前区划的可浏览范围根据该区划全部 spots 的 bounds 计算，并在四周扩大 100%，减少点击 spot 放大时被边界限制影响。
- 区划切换和 spot layer 更新期间使用 Skeleton/淡入过渡：地图维持旧视图，加载新区划数据，完成 `flyTo` 后再让 marker、路线和名称标签淡入。
- 每个 spot marker 显示地点名称，名称使用详情标题；选中路线时显示路线内顺序数字。
- 路线使用 polyline 连接配置的 spot 顺序，并在两点之间显示方向箭头；箭头角度按当前地图投影后的屏幕坐标计算，保证方向和路线方向一致。
- 手机布局下，区域选择和地图占满视图高度；点击 spot 后详情从底部弹出并覆盖地图上方，关闭按钮固定在弹窗右上角。

## 13. 权限与发布流程

管理端建议区分：

- 草稿。
- 待确认。
- 已发布。
- 已下架。

地图链接解析和批量导入的数据建议默认进入“待确认”或“草稿”，由管理员确认后再发布。

公开端只展示：

```txt
status = published
```

发布成功后清理缓存。

## 14. 风险点与处理建议

### 14.1 坐标偏移

中国地区涉及坐标体系差异，可能出现 Leaflet 展示点位和高德导航点位不一致。

处理建议：

- 保存展示坐标和导航坐标。
- 记录坐标体系。
- 管理端保存前必须预览确认。

### 14.2 地图链接格式变化

Google Maps、高德地图分享链接格式可能变化，短链接也可能需要重定向。

处理建议：

- 解析失败时允许人工填写经纬度。
- 保存原始链接，便于后续排查。
- 导入预览中标出解析置信度。

### 14.3 第三方瓦片服务访问限制

公开端访问量上来后，当前 OpenMapTiles/Stadia 兼容瓦片服务需要确认配额、授权、SLA 和生产访问策略。

处理建议：

- 第一版使用当前 `osm_bright` 瓦片服务验证公开端体验。
- 瓦片源和署名集中配置，切换服务时不改业务逻辑。
- 后期根据访问量评估商业瓦片服务或自建瓦片服务。

### 14.4 缓存不一致

地点更新后，公开端可能短时间看到旧数据。

处理建议：

- 管理端发布后主动清理或刷新相关缓存。
- 第一版按 `spot_id`、`district_id` 和 `region-tree` 定向删除少量固定 key。
- 管理端提供单独的“删除巡礼缓存”按钮，用于人工修复缓存异常。
- TTL 只作为兜底，不作为正常数据更新后的失效方式。

## 15. 推荐实施顺序

1. 建立城市、区划、地点、地点图片关联的数据结构。
2. 完成 `{ "jp": {}, "zh": {} }` 双语响应结构、静态文案和 SEO 文案设计。
3. 实现公开端地区树一次性加载和城市/区划选择。
4. 实现 Leaflet + OpenMapTiles/Stadia `osm_bright` 地图和区划 marker 展示。
5. 实现点击 marker 后的照片和描述详情面板。
6. 实现导航按钮分流：中国跳高德，其他地区跳 Google Maps。
7. 实现公开端 API 缓存：地区树、区划点位、地点详情。
8. 实现详情照片列表：复用 `LazyImage.vue` 懒加载和现有 Fancybox 大图查看能力。
9. 实现管理端单条录入：地图链接解析、坐标确认、图片关联、多语言内容维护。
10. 实现发布/下架时缓存失效。
11. 实现批量导入和导入预览。
12. 后续根据访问量评估当前瓦片服务配额，必要时切换商业瓦片服务或自建瓦片。

## 16. 第一版范围建议

第一版建议控制范围：

- 支持城市 -> 区划 -> 点位浏览。
- 城市和区划数据通过地区树一次性加载；点击区划后再加载该区划 spots。
- Leaflet + OpenMapTiles/Stadia `osm_bright` 展示 marker、地点名称、路线顺序和方向箭头。
- 点击 marker 显示照片、说明、导航按钮。
- 详情照片使用现有懒加载图片组件，点击后使用现有大图查看组件查看原图。
- 导航按 country_code 自动分流。
- 管理端支持单条地图链接解析录入。
- 公开端和管理端支持中文/日文内容，接口统一返回 `{ "jp": {}, "zh": {} }` 整体结构，缺失语言按回退规则展示。
- 语言切换复用站点现有功能，不新增巡礼模块专属语言切换。
- D1 作为主数据源。
- KV 或 Cache API 缓存公开端地区、点位和详情数据，缓存值保存完整 `{ "jp": {}, "zh": {} }` 结构，缓存 key 控制在地区树、点位列表和地点详情三类。
- 发布后定向删除相关缓存，并提供管理端独立删除巡礼缓存按钮。

坐标质量评分、重复检测、marker 聚合、商业瓦片服务可以作为第二阶段。

## 17. 已确认的照片管理方案

本节覆盖前文 8.3 中“新建 pilgrimage_spot_images 关联表”的早期设想，第一版不再为圣地巡礼单独维护地点-照片关联表。

### 17.1 复用现有图库结构

圣地巡礼地点照片复用现有图片系统：

- 图片文件继续存储在现有 R2 / img_info 体系中。
- `img_info.img_type` 增加业务类型 `spot`，用于区分圣地巡礼照片。
- 现有 milet 相关公开图库照片继续使用 `img_type = M`。
- spot 详情不直接关联照片 ID，而是关联一个现有图片系列 / 相册。

相册表 `img_series` 新增公开标识：

```txt
img_series.is_public INTEGER NOT NULL DEFAULT 1
```

规则：

- 普通公开图库相册：`is_public = 1`。
- 圣地巡礼 spot 关联相册：建议 `is_public = 0`，不进入公开图库列表。
- 相册自身仍通过现有图片系列管理维护名称、描述、封面、照片排序。

### 17.2 Spot 与相册关联

`pilgrimage_spots` 新增字段：

```txt
image_series_id INTEGER
```

公开端数据组装规则：

- spot 详情顶部封面图：读取 `image_series_id` 对应相册的 `cover_img`。
- spot 详情下方照片列表：读取 `img_series_items` 中该相册的照片。
- 照片 URL、缩略图、宽高继续来自 `img_info`。
- 照片说明第一版复用 `img_info.comment`，不在巡礼模块单独维护每张照片的多语言说明。

### 17.3 管理端照片流程

照片上传：

- 批量上传组件需要允许选择图片类型。
- 默认类型仍为 `M`。
- 上传圣地巡礼相关照片时选择 `spot`。

图片选择：

- 管理端图片选择器改用管理端图片列表 API，不再复用公开端图片分页 API。
- 图片选择器支持按 `img_type` 筛选，例如 `M` / `spot`。

相册维护：

- 图片系列管理页支持设置相册是否公开。
- 图片系列管理页支持设置相册类型，圣地巡礼相册建议使用 `series_type = spot`。
- 圣地巡礼管理页只选择一个关联相册，不直接选择单张照片。

### 17.4 公开端与缓存

公开端 API 返回结构保持 `{ "jp": {}, "zh": {} }` 整体结构不变。

缓存 key 不因照片方案变化而增加：

```txt
pilgrimage:region-tree
pilgrimage:spots:{district_id}
pilgrimage:spot:{spot_id}
```

当 spot 关联相册、相册封面或相册内照片变化时，需要主动删除对应 spot 详情缓存和该地区 spots 列表缓存。管理端保留独立的“删除巡礼缓存”按钮用于人工修复缓存异常。

## 18. 巡礼路线方案

一个地区可以配置多条巡礼路线。路线作为独立数据管理，不直接修改 spot 本身：

- `pilgrimage_routes` 保存路线主数据：`id`、`district_id`、`color`、`status`、`sort_order`。
- `pilgrimage_route_i18n` 保存路线多语言标题和说明。
- `pilgrimage_route_spots` 保存路线内 spot 的顺序。
- 公开端地区 spots 接口在返回 spots 的同时返回 routes，数据仍保持 `{ "jp": {}, "zh": {} }` 整体结构。
- 管理端在圣地巡礼模块中维护路线：选择地区，填写路线多语言名称，按顺序追加该地区下的 spot。
- 公开端在地图上选择路线后，按配置顺序绘制 polyline，并高亮路线内 spot。
- 保存或删除路线时主动删除对应 district 的 spots/routes 缓存。

## 19. 已确认的批量导入方案

本节覆盖前文 7.2 中“CSV / Excel 模板导入”的早期设想。第一版批量导入采用“管理端按钮 + 弹窗 + 分段 TSV 粘贴”的方式，而不是直接使用 JSON。

选择 TSV 的原因：

- 首次录入时 spot 数量可能较多，直接维护 JSON 成本高，括号、引号和嵌套结构容易出错。
- TSV 可以直接从 Excel / WPS / Google Sheets 复制粘贴，适合批量整理城市、地区、地点和路线。
- 管理端将 TSV 转换为现有 API payload，服务端仍接收结构化 JSON，避免 Worker 直接解析表格文本。

### 19.1 管理端入口

圣地巡礼管理模块顶部操作区增加“批量导入”按钮。

点击后打开导入弹窗，弹窗包含：

- TSV 粘贴输入区。
- “填入模板”按钮。
- “清空”按钮。
- “校验预览”按钮。
- “确认导入”按钮。
- 校验结果区域：展示新增 / 更新数量、错误、警告、自动生成的 spot ID。

弹窗不替代单条维护表单。批量导入用于首次录入或大批量更新；单条表单用于后续精修、坐标微调、相册关联和发布状态调整。

### 19.2 TSV 分段格式

导入文本使用三个分段：

```txt
[regions]
id	level	parent_id	country_code	center_lat	center_lng	default_zoom	sort_order	status	name_zh	name_jp

[spots]
import_key	id	city_id	district_id	country_code	category	display_lat	display_lng	nav_lat	nav_lng	source_map_provider	source_map_url	image_series_id	coordinate_quality	status	sort_order	title_zh	title_jp	work_title_zh	work_title_jp	address_zh	address_jp	description_zh	description_jp	tags_zh	tags_jp

[routes]
import_key	id	district_id	color	status	sort_order	title_zh	title_jp	description_zh	description_jp	spot_refs
```

规则：

- 每个分段第一行为列名。
- 列使用 Tab 分隔；管理端也可兼容简单逗号分隔，但推荐从表格软件复制 Tab 分隔文本。
- 空行和以 `#` 开头的行忽略。
- 分段顺序建议为 `regions` -> `spots` -> `routes`，便于人工阅读。
- `regions`、`spots`、`routes` 都可以为空；只导入其中一类数据也允许。

### 19.3 Regions 字段

`regions` 用于导入城市和地区。

必填字段：

- `id`
- `level`
- `name_zh`
- `name_jp`

字段说明：

- `level` 取值：`city` / `district`。
- `parent_id`：地区必填，城市为空。
- `country_code`：默认 `JP`。
- `center_lat` / `center_lng`：地图默认中心点。
- `default_zoom`：城市建议 11-12，地区建议 14-15。
- `status`：`published` / `draft` / `archived`，默认 `published`。

示例：

```txt
[regions]
id	level	parent_id	country_code	center_lat	center_lng	default_zoom	sort_order	status	name_zh	name_jp
tokyo	city		JP	35.6762	139.6503	12	0	published	东京	東京
shibuya	district	tokyo	JP	35.6618	139.7041	15	0	published	涩谷区	渋谷区
```

### 19.4 Spots 字段

`spots` 用于导入巡礼地点。

必填字段：

- `city_id`
- `district_id`
- `display_lat`
- `display_lng`
- `title_zh`
- `title_jp`

字段说明：

- `import_key`：导入文本内部使用的临时引用，可用于路线 `spot_refs`。建议填写易读短名，例如 `shibuya-crossing`。
- `id`：可留空。留空时服务端按 `city_id-district_id-数字` 自动生成。
- `category`：地点类别，例如街景、车站、路口。
- `nav_lat` / `nav_lng`：可留空，留空时服务端默认使用显示坐标。
- `source_map_provider`：默认 `manual`，也可为 `google` / `amap` / `osm` / `import`。
- `source_map_url`：原始地图链接，便于后续排查。
- `image_series_id`：关联现有相册 ID。建议关联 `series_type = spot` 且非公开的相册。
- `coordinate_quality`：`exact` / `approximate` / `unchecked`，默认 `unchecked`。
- `status`：默认 `draft`。批量导入默认不直接发布，由管理员确认后再发布。
- `tags_zh` / `tags_jp`：用逗号、顿号或竖线分隔。

示例：

```txt
[spots]
import_key	id	city_id	district_id	country_code	category	display_lat	display_lng	nav_lat	nav_lng	source_map_provider	source_map_url	image_series_id	coordinate_quality	status	sort_order	title_zh	title_jp	work_title_zh	work_title_jp	address_zh	address_jp	description_zh	description_jp	tags_zh	tags_jp
shibuya-crossing		tokyo	shibuya	JP	街景	35.6595	139.7005			manual			exact	draft	0	涩谷路口	渋谷の交差点	us	us					城市,街景	街,交差点
omotesando-street		tokyo	shibuya	JP	街景	35.6652	139.7124			manual			exact	draft	1	表参道街景	表参道の街角	inside you	inside you					MV,街角	MV,街
```

### 19.5 Routes 字段

`routes` 用于导入巡礼路线。

必填字段：

- `district_id`
- `title_zh`
- `title_jp`
- `spot_refs`

字段说明：

- `import_key`：路线导入临时引用。
- `id`：可留空。留空时服务端按 `district_id-route-数字` 自动生成。
- `color`：路线颜色，默认 `#2f8f83`。
- `status`：默认 `draft`。
- `spot_refs`：路线内 spot 顺序，使用逗号或竖线分隔。可填写 spot 的正式 `id`，也可填写本次导入 `spots.import_key`。
- 一条路线至少需要 2 个 spot。
- route 内所有 spot 必须属于同一个 `district_id`。

示例：

```txt
[routes]
import_key	id	district_id	color	status	sort_order	title_zh	title_jp	description_zh	description_jp	spot_refs
shibuya-route		shibuya	#2f8f83	draft	0	涩谷巡礼路线	渋谷巡礼ルート			shibuya-crossing,omotesando-street
```

### 19.6 校验预览

管理端点击“校验预览”后：

```txt
管理端解析 TSV
  -> 转换为结构化 JSON payload
  -> POST /admin/pilgrimage/import，dryRun = true
  -> Worker 校验数据
  -> 返回 summary / generatedIds / errors / warnings
  -> 管理端展示预览结果
```

校验内容：

- region ID 格式。
- district 是否填写 `parent_id`。
- region 双语名称是否完整。
- spot 所属 city / district 是否存在，或是否在本次导入中创建。
- spot 显示坐标是否完整。
- spot 双语 title 是否完整。
- `image_series_id` 是否存在；若不是 `spot` 类型或不是非公开相册，给出 warning。
- route 双语 title 是否完整。
- route 至少包含 2 个 spot。
- route 的 `spot_refs` 是否能解析到已有 spot 或本次导入 spot。
- route 内 spot 是否全部属于同一个 district。

预览结果包含：

```ts
{
  summary: {
    regionsCreate: number
    regionsUpdate: number
    spotsCreate: number
    spotsUpdate: number
    routesCreate: number
    routesUpdate: number
  }
  generatedIds: {
    spots: Record<string, string>
    routes: Record<string, string>
  }
  errors: Array<{ path: string; message: string }>
  warnings: Array<{ path: string; message: string }>
}
```

有 `errors` 时禁止正式导入；只有 `warnings` 时允许导入，但管理端需要展示给管理员确认。

### 19.7 正式导入

正式导入流程：

```txt
管理员确认预览无误
  -> POST /admin/pilgrimage/import，dryRun = false
  -> Worker 按 regions -> spots -> routes 顺序 upsert
  -> 自动生成缺失的 spot id 和 route id
  -> 写入 D1
  -> 主动删除全部巡礼缓存
  -> 返回最新管理端 state
  -> 管理端刷新页面数据
```

采用 upsert 策略：

- ID 已存在：更新。
- ID 不存在：新增。
- spot ID 留空：按 `city_id-district_id-数字` 自动生成。
- route ID 留空：按 `district_id-route-数字` 自动生成。

缓存策略：

- 批量导入可能同时影响地区树、多个 district spots、多个 spot detail 和路线。
- 为避免逐条计算缓存范围过于复杂，正式导入成功后统一调用 `deletePilgrimageCache({ type: "all" })`。
- 缓存仍采用主动删除方式失效，不依赖自动过期。

### 19.8 API

管理端批量导入使用单个接口：

```txt
POST /admin/pilgrimage/import
```

请求结构：

```ts
{
  dryRun?: boolean
  regions?: PilgrimageRegionPayload[]
  spots?: Array<PilgrimageSpotPayload & { import_key?: string }>
  routes?: Array<PilgrimageRoutePayload & { import_key?: string }>
}
```

响应结构：

```ts
{
  dryRun: boolean
  summary: {
    regionsCreate: number
    regionsUpdate: number
    spotsCreate: number
    spotsUpdate: number
    routesCreate: number
    routesUpdate: number
  }
  generatedIds: {
    spots: Record<string, string>
    routes: Record<string, string>
  }
  errors: Array<{ path: string; message: string }>
  warnings: Array<{ path: string; message: string }>
  state?: PilgrimageAdminState
}
```

## 20. 公开端地图显示配置

公开端地图的 marker、封面气泡和拥挤避让参数集中放在：

```txt
src/components/milet/pilgrimage/pilgrimageMapConfig.ts
```

### 20.1 `photoBubble`

`photoBubble` 控制地图放大后 spot 封面图片气泡的显示规则，分为 `desktop` 和 `mobile` 两套配置。

```ts
photoBubble: {
  desktop: {
    minZoom: 17,
    collisionGap: { x: 138, y: 118 },
    iconSize: [168, 176],
    iconAnchor: {
      active: [84, 141],
      inactive: [84, 137],
    },
  },
  mobile: {
    minZoom: 18,
    collisionGap: { x: 112, y: 96 },
    iconSize: [136, 156],
    iconAnchor: {
      active: [68, 129],
      inactive: [68, 124],
    },
  },
}
```

参数含义：

- `minZoom`：开始显示封面图片气泡的最小 Leaflet zoom 等级。数值越小，气泡越早出现；数值越大，需要更放大地图才会出现。调试封面出现时机时优先改这个值。
- `collisionGap.x` / `collisionGap.y`：气泡拥挤避让的屏幕像素距离。两个 spot 在屏幕上的距离小于该范围时，后渲染的非选中 spot 不显示封面气泡，只保留普通 marker。数值越大，显示的气泡越少、更疏；数值越小，气泡越多、更密。
- `iconSize`：Leaflet `divIcon` 的占位尺寸，格式为 `[width, height]`。气泡样式尺寸变大或变小时，需要同步调整这个值，避免点击区域和视觉位置不一致。
- `iconAnchor.active`：选中 spot 显示封面气泡时的锚点。锚点表示 icon 内哪个像素点对准地图坐标，格式为 `[x, y]`。
- `iconAnchor.inactive`：未选中 spot 显示封面气泡时的锚点。

调参建议：

- 如果封面出现太早、地图显得拥挤，先提高 `minZoom`，例如 desktop 从 `17` 调到 `18`。
- 如果 spot 很密集时气泡仍然重叠，增大 `collisionGap.x` 和 `collisionGap.y`。
- 如果气泡箭头没有准确指向 spot，微调 `iconAnchor` 的 `y` 值；`y` 变大时，视觉气泡整体会相对地图坐标上移。
- mobile 通常应比 desktop 更晚显示气泡，因此 `mobile.minZoom` 建议大于或等于 `desktop.minZoom`。

### 20.2 `defaultMarker`

`defaultMarker` 控制没有显示封面气泡时的普通 spot marker 尺寸和锚点。

```ts
defaultMarker: {
  iconSize: [160, 72],
  iconAnchor: {
    active: [80, 43],
    inactive: [80, 35],
  },
}
```

参数含义：

- `iconSize`：普通 marker 的 Leaflet `divIcon` 占位尺寸。
- `iconAnchor.active`：选中普通 marker 时，icon 内对准地图坐标的点。
- `iconAnchor.inactive`：未选中普通 marker 时，icon 内对准地图坐标的点。

普通 marker 的 CSS 如果调整了 pin、标题标签或 active 状态高度，需要同步检查这里的 `iconAnchor`，否则 marker 视觉位置可能会偏离实际 spot 坐标。
