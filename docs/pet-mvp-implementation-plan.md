# 页面互动宠物 MVP 实现方案

日期：2026-09-06。依据：桌面《Pet 互动宠物 MVP 方案.md》及当前公开端源码。

本文件是实施设计，不代表功能已经接入。素材准备见 [pet-asset-production-brief.md](./pet-asset-production-brief.md)。当前实际工程目录为 `echoes of milet`，与工作区说明中的 `echoes-of-milet` 同指公开端。

## 1. 结论与边界

可直接基于现有 Vue 3、TypeScript、Tailwind 实现，无需新增游戏引擎、状态管理框架、后端 API 或数据库。宠物是 App 级客户端辅助交互，使用独立工厂和 provide/inject，页面发送业务事件，不直接选择动画。

- 保留需求的六模块反应、三项导航、点击/拖拽、10–30 秒无操作随机行为。
- “当前页面生命周期”解释为本次浏览器文档生命周期：SPA 路由切换保留位置，刷新恢复默认；不写入 AppState、Cookie、LocalStorage 或服务端。
- 先实现完整事件和交互闭环，再替换最终动画。占位图只用于开发，不作为九个动作的验收交付。
- 本轮仅新增方案与素材制作规范，不修改产品代码、不安装依赖、不制作不确定的角色成品。

## 2. 代码依据与必要调整

| 已核查位置 | 当前情况 | 实施决定 |
| --- | --- | --- |
| `src/app.ts` | 每次 createApp 创建 scroll/interaction 协调器，提供注入并统一 dispose | 以相同模式创建 PetCoordinator，禁止模块级可变单例 |
| `index.html` / `src/entry-client.ts` | 主 Vue 根负责 SSR hydration | PetHost 放入独立的客户端 Vue 根，复用同一组协调器；宠物加载失败不能影响正文 hydration |
| `src/views/LayoutApp.vue` | 桌面内容区内部滚动，右下角 fixed 返回顶部 | 宠物不能只监听 window scroll；预留返回顶部区域 |
| `src/router/routes.ts` | Live 详情、文章、周年页不在 LayoutApp 内 | 不把宿主放进 LayoutApp；用路由策略控制显示 |
| `src/composables/site-interaction/*` | 已有 motionEnabled、documentVisible、导航阶段；没有 overlay 管理接口 | 读取其状态，不重复创建媒体查询；另加宠物暂停令牌 |
| `src/composables/SideMenueData.ts` | timeline/release/live-archive 已有 routeName 和 amber/violet/sky 配色 | 三项入口复用目标与配色；不把完整菜单复制进宠物 |
| `src/composables/useLangRoute.ts` | URL 使用 ja，内部语言存在 jp 映射 | 使用 withLangParam/toUrlLang，禁止生成 /jp 路径 |
| `src/plugins/event-bus.ts` | events 是模块级对象 | 宠物不使用该总线，避免跨请求共享状态 |
| `src/views/milet/MiletNewsCollectionView.vue` | 当前是整理新闻链接，外链新窗口打开；没有访客收藏操作 | news.favorite 仅保留契约，MVP 当前代码接入验收标记 N/A，不为宠物另做收藏业务 |
| `src/components/milet/gallery/MiletAlbumViewer.vue` | Fancybox.show 动态加载并有请求失效保护 | 在现有打开/实例销毁周期接语义事件和暂停，不延迟照片打开 |
| `src/views/milet/MiletPilgrimageView.vue` | 地点选择由 selectSpot 驱动，图片使用 Fancybox.bind | 在有效地点详情确认后发事件，区分自动初始化与用户选择 |
| `src/assets/main.css` | 海蓝、青绿、纸白、浅金 token，已有减少动画体系 | 导航延续 token，角色用低饱和暖白形成温和区别 |

### 需求中需要明确的冲突

1. **照片反应与 Lightbox 隐藏**：Lightbox 打开优先，不能为了 look 延迟打开。实例打开记录一次 photo.open 并隐藏；关闭后，同一路由且距打开不超过 30 秒时补一次 look，否则回 idle。连续翻图不发事件。此为建议对原验收语义的调整，需按该规则确认结果，不能声称打开时已可见播放。

   

2. **示例映射多于 MVP**：timeline.scroll、release.open、news.open 暂不接入；location.open 为统一名称，去掉同义 pilgrimage.open。不随每次滚动反应。

3. **全屏地图**：当前地图工作区不等于浏览器全屏。普通地图页仍显示宠物；实际全屏或未来沉浸展开状态才暂停，不新增全屏地图功能。

4. **默认右下角重叠**：返回顶部已有 48px 按钮；宠物默认放在其上方并固定预留该空间，不随返回顶部显隐跳动。自由拖拽后用户可重新放置；MVP 不增加碰撞系统，不保证人为拖到任意控件上仍无重叠。

## 3. 组件与逻辑组织

建议增量目录（不是必须逐一拆成极小文件）：

```text
src/components/pet/
  PetHost.vue                 # 客户端挂载、显示策略、组合与资源就绪
  PetAvatar.vue               # 动画/静态渲染、语义按钮，不处理页面数据
  PetQuickMenu.vue            # 三项导航、定位、键盘和关闭行为
src/composables/pet/
  createPetCoordinator.ts    # 状态、优先级、去重、暂停、清理
  petTypes.ts                # 事件、动画、状态、注入 API
  petInjection.ts            # InjectionKey、usePet
  usePetPointer.ts           # 指针与边界约束
  usePetRoute.ts             # 模块映射、导航关闭与失效代数
  usePetOverlay.ts           # 组件持有暂停令牌，卸载自动释放
  index.ts
src/config/pet.ts            # 路由策略、映射、阈值、功能开关
src/composables/lang/pet.ts  # 遵循现有 zh/jp 文案结构
src/assets/pet/              # 静态降级图、动作图集、manifest
```

不要为了文件名机械搬用需求中的 PetEngine/PetInteraction 类层次。纯决策逻辑在协调器，DOM 与 Vue 生命周期在 composable，动画表现留在组件。空间与配色优先 Tailwind，图集逐帧、坐标变量和 reduced-motion 等用局部 CSS。

### API 草案

```ts
type PetEvent =
  | 'timeline.enter' | 'release.enter' | 'live.enter'
  | 'pilgrimage.enter' | 'news.enter' | 'album.enter'
  | 'photo.open' | 'live.open' | 'location.open' | 'news.favorite'

interface PetEventContext {
  contentId?: string
  routeGeneration?: number
}

interface PetCoordinator {
  readonly state: DeepReadonly<PetState>
  react(event: PetEvent, context?: PetEventContext): void
  suspend(reason: string): () => void
  connect(): () => void
  dispose(): void
}
```

用户点击、拖动、位置更新等控制放在宿主专用接口，不作为业务页面 API 暴露。suspend 返回幂等 release；每次调用创建独立 Symbol/token，不能只按 reason 去重，否则两个相同类型弹层会互相误释放。

实例只保存在 createApp 作用域。PetState 分开表达 position、menuOpen、animation、priority、generation、资源就绪和暂停状态；不要把菜单打开也编码成一个动画名。

## 4. SSR、初始化和加载

1. createApp 内创建纯内存实例并 provide；SSR 不读 DOM、不建计时器、不随机选动作。
2. HTML 模板保留空的 `#pet-host-root`；主应用 hydration 完成后再异步启动独立 PetHost，SSR 不导入宠物视图与动画资源。
3. onMounted 连接协调器，读取视口、现有 interaction 状态，准备静态图后显示。动画资源不作为正文或首屏 SSR 前置依赖。
4. 独立异步加载宠物 UI；静态降级图先到，idle/drag/happy 按需预热，其余延后。预热未完成也不能阻止点击导航。
5. 应用子组件可能先于根组件 mounted 上报事件：协调器未 ready 时只保留当前路由最新一条有效页面事件，ready 后播放，不漏掉有 SSR 数据的首次 Live 详情。
6. SSR 的 PetState 不加入可序列化业务初始状态，不改变 SEO、renderMode、SSR 入口、render.config 或代理配置。
7. dispose 清除所有定时器、动画回调、监听器、watch、捕获指针和待处理事件；路由离开使旧异步结果失效。

## 5. 路由与内容事件接线

### 模块反应

| 模块 | 当前 route.name | 事件 → 动作 |
| --- | --- | --- |
| Timeline | miletTimeLine | timeline.enter → curious |
| Music Releases | miletRelease | release.enter → sniff |
| Live | miletLiveArchive | live.enter → excited |
| 聖地巡礼 | miletPilgrimage | pilgrimage.enter → sniff |
| News | miletNews | news.enter → sit |
| Album | miletPicAlbum、galleryDetail | album.enter → curious |

按归一化 moduleKey 去重，不按 fullPath 每次变化触发。切换 query/hash/语言不重复 enter；gallery 列表到详情同属 album。不从 URL 字符串模糊猜模块。

默认六模块、公开 Live 详情和文章页启用；欢迎页、关于页、周年沉浸页可只显示安静 idle 与导航；猜歌实际答题页和 Live 预览页默认隐藏。上述非六模块策略集中配置，属于本方案建议，不是现有需求强制。答题结束页可恢复。移动与桌面采用相同功能覆盖。

Live 详情是内容事件：在 `MiletLiveDetailView.vue` 的有效 payload 对应当前 slug、且完成客户端挂载后发送 live.open → happy。直接 URL 打开也触发；加载失败不触发。详情不同时补 live.enter，避免连续 excited/happy。相同 event ID 本路由只发一次；语言切换不重复。

### 内容事件

| 场景 | 具体接入 | 成功与去重边界 |
| --- | --- | --- |
| 相册照片 | MiletAlbumViewer.vue | 实例打开成功发 photo.open；翻页无事件 |
| 搜图照片 | MiletImageSearchPanel.vue | 同相册，异步请求失效不发 |
| 文章图片 | useArticleImageEnhancements.ts | 合并进原 Fancybox options；不覆盖原回调 |
| 圣地照片 | MiletPilgrimageView.vue/setupFancybox | 同一 Lightbox 规则 |
| 打开演出 | MiletLiveDetailView.vue | 有效 payload，当前路由代数与 ID 一致 |
| 打开地点 | MiletPilgrimageView.vue/selectSpot | 用户主动选择、详情成功且 ID 仍匹配；自动选择不发 |
| 收藏新闻 | 预留 news.favorite | 当前无实现，不新增收藏按钮或接口 |

地点详情加载函数内部可能消化错误，因此不能把 await 返回直接等同成功；应检查 selectedSpotDetail 与最新请求/选择 ID。地图与列表共同使用业务选择入口；自动选择路径显式传 origin 或由用户入口包装，避免 watch 的初始化触发伪互动。

## 6. 动作调度

优先级：idle=0、random=1、page=2、user=3、drag=4。暂停是可见性与调度闸门，高于上述所有动作。

- 高优先级立即中断低优先级；相同优先级采用最新有效事件替换，重复 contentId 合并。不维护无界动画队列。
- page 事件冷却建议 2 秒；冷却窗口内最多保留一条最新事件，TTL 2 秒。拖动与菜单期间的普通 page 事件直接丢弃，避免用户结束交互后突然补播。
- 用户点击回应立即开始，菜单延后约 80ms 开始展开、280ms 完成；不能等整个 happy 动画结束才可导航。
- 每次播放生成 animationGeneration；完成回调检查代数，已被中断的动作不能把 drag 或新动作改回 idle。
- pointerup 正常结束拖拽：happy 一次再 idle。pointercancel/lostpointercapture：清理并 idle，不执行点击、不假装用户完成拖动。
- 动画失败或资源缺失退回静态 idle，导航保持可用；开发环境可记录问题，生产不污染业务通知。

### 无操作行为

只在客户端 mounted、页面可见、无暂停、菜单关闭、非拖动、资源 ready 时安排单个 `window.setTimeout`，间隔随机 10–30 秒。服务端不会创建计时器，SSR 首屏也不渲染宠物宿主。点击宠物或真实拖拽会重新开始等待；普通页面点击、滚动和键盘操作不改变宠物待机计时。

待机候选池包含现有全部非默认动作：sit、happy、curious、excited、sniff、look、drag、sleep；`idle` 只作为默认循环，不参与随机。随机播放 `drag` 只改变视觉动作，不进入拖拽交互状态。动作完成后重新抽取延时；不使用 setInterval 或 requestIdleCallback 堆积任务。

隐藏标签页：清除定时器并停帧；返回后从 idle 重计时，不补播离开期间事件。prefers-reduced-motion：停止随机和循环动画，用静态姿势切换，菜单仍可开关、宠物仍可拖动。复用现有 interaction.state，不能只隐藏 CSS 而继续运行计时器。

## 7. 点击、拖拽、菜单与位置

### Pointer Events

- 只接受主指针与鼠标左键；pointerdown 保存 pointerId、起点与原位置并 setPointerCapture。
- 欧氏距离达到 8 CSS px 才进入 drag；低于阈值且正常抬起执行一次激活。
- touch-action:none 仅放在宠物命中区域；宿主全屏透明层 pointer-events:none，宠物和菜单 pointer-events:auto。
- 兼容键盘生成的 click；指针路径需要抑制拖后浏览器 click，避免 pointerup/click 双触发。
- 拖动用 requestAnimationFrame 合并坐标、transform 更新；不在每次 move 读取布局；开始时测量，resize 时更新。
- 菜单展开后再次开始拖动即关闭；pointercancel、丢失捕获、窗口失焦和暂停都释放捕获与监听。

### 视口与返回顶部

PC 宠物容器 160px，移动 120px；默认 right=32/16px，bottom=88px + safe-area（预留返回顶部 48px、间距和边缘）。素材同时在容器内放大 1.25 倍并按透明边距微调，提高角色主体占比；拖拽边界和菜单半径按放大后的容器计算。

坐标统一按同一个 fixed 容器计算；移动端读取 visualViewport 的尺寸和偏移，把软键盘/缩放后可见区域转换到该坐标系后 clamp。安全区、角色完整画布和边距都在计算内。屏幕旋转仅把越界位置约束到最近有效点，不吸附、不自动回默认。

保留 LayoutApp 与 MiletArticleView 原返回顶部位置。无此按钮的页面仍保留统一默认宠物位置，避免跨路由上下跳动。菜单定位可避让预留角落，但不引入全页面元素碰撞探测。

### 快捷菜单

| 文案语义 | 命名路由 | 颜色 |
| --- | --- | --- |
| Timeline / 时间线 / タイムライン | miletTimeLine | amber |
| Music Releases / 音乐作品 / 音楽作品 | miletRelease | violet |
| Live / 演出记录 / ライブ | miletLiveArchive | sky |

使用 RouterLink + withLangParam；入口保留完整可访问名称。胶囊入口从宠物中心向视口内侧呈扇形展开，按宠物所在象限自动翻转方向，并逐项约束在安全区内；桌面与移动端均保持环绕关系，不再使用列表弹窗。

菜单项集中配置在 `PET_QUICK_MENU_ROUTES`，顺序、命名路由与颜色由一条记录定义；中日文文案使用相同的稳定 `key` 组成 Record，避免按数组下标错配。新增入口时添加路由记录及两种语言的同名文案，TypeScript 会检查遗漏；半径和扇形角度会随超过三项的数量递增。

再次点宠物、点外部、Escape、离开焦点区域、成功导航、开启其他 overlay 均关闭。菜单外点击采用非阻断监听，不吞掉页面原操作。选择导航即时收起，不等待新页面接口。

导航面板使用 nav + 普通链接，不滥用 role=menu。按钮 aria-expanded/aria-controls，有清晰 focus-visible。Enter/Space 激活，Tab 顺序自然；Escape 返回宠物焦点，点击其他控件不抢回焦点；导航成功沿用页面焦点逻辑。

## 8. 弹层暂停与层级

新增 usePetOverlay(open, reason) 或等价小工具，打开获取 token，关闭/卸载释放。隐藏时关闭菜单、取消动画和拖拽、移出 tab 顺序；全部 token 释放才恢复，不恢复旧菜单。

首轮接入清单：

- `components/menu/SideMenuLeft.vue` 移动主菜单（当前已有背景 inert）；宠物也须暂停，不能在焦点锁外可点击。
- `components/milet/music/TrackModal.vue`、`StackMapDrawer.vue`。
- `views/milet/MiletGalleryView.vue` 相册 Dialog。
- `views/AboutMeView.vue` 确认 Dialog。
- 上述四类 Fancybox 调用点；在真实实例开始显示前暂停，结束销毁/异常/组件卸载兜底释放。
- 原生 fullscreenchange：document.fullscreenElement 非空时暂停；未来 CSS 全屏状态显式接同一 API。

Fancybox 具体生命周期事件名称在实施时查当前 node_modules 类型/源码，按实际版本接入，不能把 Carousel.ready 当作整个弹层已经关闭的信号。保留原有配置，按实例管理 token；现有圣地代码调用全局 destroy，必须保证这种关闭也释放令牌。

Pet 层级建议 40，低于 Header/TrackModal 等 50 层；它位于 App 根级，不受 LayoutApp overflow 裁切。低 z-index 只是兜底，不能替代暂停，因为地图和独立堆叠上下文不能只比数字。

## 9. 动画资源

\designs\jean-motion目录下是事先准备好的动画效果静态演示页面，把这个静态页面的动画资源，实现转移到工程内即可。

## 10. 分阶段实施与改动范围

| 阶段 | 交付 | 完成门槛 |
| --- | --- | --- |
| P0 前期准备（本轮） | 代码映射、方案、动作与资产规格 | 差异和默认决策可供审阅 |
| P1 交互骨架 | app 注入、Host、静态角色、三项导航、指针逻辑 | PC/Mobile 可点可拖、无 hydration mismatch |
| P2 调度与页面事件 | 优先级、route/content 接线、活动计时、暂停令牌 | 竞态、清理、菜单/弹层互斥正确 |
| P3 动画制作接入 | 定稿角色、三动作小样、九动作图集与静态图 | 小尺寸清晰、锚点稳定、切换无闪烁 |
| P4 集成验收 | 桌面/移动/中文/日文/SSR 回归 | 验收矩阵通过且预算实测有记录 |

主要改动：App.vue、app.ts、新 pet 目录和配置、内容事件页面、上述 overlay 组件。路由判断优先集中 route.name 映射，无需为没有新页面的宠物更改 SEO/render.config。

管理端 `data-admin` 不承担宠物配置或素材上传，本期不改。Worker `milet-worker-ts` 没有新增数据或接口，本期不改。两个代理白名单、权限、D1 migrations 均无需同步。

## 11. 验证计划

实施时运行 `npm run type-check`、`npm run test:pet`、`npm run build:ssr`、`npm run verify:ssr:local`（最后一个会重复 build，可正式验收只运行 type-check + test:pet + verify:ssr:local）。调度纯逻辑使用 Node 内置 test runner 验证，不额外引入测试框架。

| 场景 | 预期 |
| --- | --- |
| SSR 首次访问、CSR 页面、浏览器前进后退 | 正文和 SEO 保持；初始 hydration 一致；只有一只宠物 |
| 两个 createApp 实例 | 状态、暂停 token、位置互不影响 |
| 轻微移动 <8px / 超阈值 / 拖后 click | 一次激活 / 一次拖动 / 不误开菜单 |
| 多指、pointercancel、丢失捕获、窗口失焦 | 不留下 drag 或页面滚动锁 |
| 四角拖动、320px 宽、手机横屏、键盘、缩放 | 角色和菜单保持在可见区域，安全区有效 |
| 宠物点击、真实拖拽；普通页面滚动与点击 | 前者重置待机等待；后者不影响宠物自己的待机计时 |
| 中文、日文 | 导航保留 lang，标签不溢出，焦点说明可读 |
| 快速打开 Live A→B，地点 A→B | 迟到的 A 请求不改变当前宠物 |
| 菜单/拖动中收到页面反应 | 用户动作优先，结束后不补播过期事件 |
| 两个弹层嵌套、路由中途离开、Fancybox 加载失败 | 不提前出现、不永久消失、不残留计时器 |
| 打开照片→多次翻图→关闭 | 仅一次 photo.open，关闭后的 look 遵循 TTL/路由规则 |
| 标签页隐藏后返回、减少动画 | 不积压；静态导航与拖动可用 |
| 动作资源 404/慢网/加载中点击 | 静态降级，主要导航保持可用 |
| 卸载后推进计时/动画完成回调 | 没有过期状态写入、悬空监听与资源增长 |

浏览器验收直接使用工程真实路由，不保留单独的宠物浏览器临时页面。
