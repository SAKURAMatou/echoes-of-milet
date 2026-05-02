# 圣地巡礼地图模块实现方案

## 1. 背景与目标

本方案目标是新增一个“圣地巡礼指南/记录”模块：

- 公开端按照地区层级展示巡礼地点。
- 地区层级为：城市名称 -> 城市区划 -> 地图标记。
- 地图平台使用 Leaflet + OpenStreetMap。
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

底图由 Leaflet 加载 OpenStreetMap 或兼容瓦片服务；圣地巡礼的地点、照片、说明、导航信息全部来自系统自己的数据。

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

圣地巡礼地点通常比较固定，第一版只缓存公开端业务数据，不缓存 OpenStreetMap 官方底图瓦片。

推荐缓存对象控制在三个层级：

- 地区树：城市和区划合并返回。
- 区划下的点位列表。
- 地点详情。

不建议缓存对象：

- OpenStreetMap 官方底图瓦片。

原因：

- OSM 官方瓦片服务允许正常交互式使用，但不适合被批量抓取、长期离线缓存或做代理规避限制。
- D1 不适合存地图瓦片。
- KV/R2 技术上可以存瓦片，但官方瓦片的使用政策和运维边界不适合作为项目默认方案。

因此建议缓存系统自己的巡礼数据，而不是缓存 OSM 官方底图。

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

## 12. OpenStreetMap 底图使用策略

第一版可以使用 Leaflet + OpenStreetMap 兼容瓦片服务。

需要注意：

- 页面必须显示地图数据署名。
- 不要批量下载或长期缓存官方 OSM 瓦片。
- 不要用 Worker 代理官方瓦片并绕过瓦片服务限制。
- 如果访问量变大，建议切换商业 OSM 瓦片服务或自建瓦片服务。

建议将瓦片源配置化：

```txt
map_tile_url
map_tile_attribution
map_default_zoom
map_max_zoom
```

这样后续从官方 OSM 瓦片切换到商业瓦片服务时，不需要改动业务逻辑。

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

### 14.3 OSM 官方瓦片访问限制

公开端访问量上来后，官方 OSM 瓦片可能不适合长期生产使用。

处理建议：

- 第一版可用 OSM 官方或兼容瓦片服务验证功能。
- 瓦片源配置化。
- 后期切换商业瓦片服务。

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
4. 实现 Leaflet 地图和区划 marker 展示。
5. 实现点击 marker 后的照片和描述详情面板。
6. 实现导航按钮分流：中国跳高德，其他地区跳 Google Maps。
7. 实现公开端 API 缓存：地区树、区划点位、地点详情。
8. 实现详情照片列表：复用 `LazyImage.vue` 懒加载和现有 Fancybox 大图查看能力。
9. 实现管理端单条录入：地图链接解析、坐标确认、图片关联、多语言内容维护。
10. 实现发布/下架时缓存失效。
11. 实现批量导入和导入预览。
12. 后续根据访问量评估是否切换商业瓦片服务或自建瓦片。

## 16. 第一版范围建议

第一版建议控制范围：

- 支持城市 -> 区划 -> 点位浏览。
- 城市和区划数据通过地区树一次性加载；点击区划后再加载该区划 spots。
- Leaflet + OpenStreetMap 展示 marker。
- 点击 marker 显示照片、说明、导航按钮。
- 详情照片使用现有懒加载图片组件，点击后使用现有大图查看组件查看原图。
- 导航按 country_code 自动分流。
- 管理端支持单条地图链接解析录入。
- 公开端和管理端支持中文/日文内容，接口统一返回 `{ "jp": {}, "zh": {} }` 整体结构，缺失语言按回退规则展示。
- 语言切换复用站点现有功能，不新增巡礼模块专属语言切换。
- D1 作为主数据源。
- KV 或 Cache API 缓存公开端地区、点位和详情数据，缓存值保存完整 `{ "jp": {}, "zh": {} }` 结构，缓存 key 控制在地区树、点位列表和地点详情三类。
- 发布后定向删除相关缓存，并提供管理端独立删除巡礼缓存按钮。

批量导入、坐标质量评分、重复检测、marker 聚合、商业瓦片服务可以作为第二阶段。
