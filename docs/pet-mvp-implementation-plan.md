# 页面互动宠物 MVP 实现方案

日期：2026-09-08。依据：桌面《Pet 互动宠物 MVP 方案.md》、`designs/jean-motion` 动画示例及当前公开端源码。

本文件同时记录实施方案、最终代码结构与验收结果。功能已在 `feat/desktop-pet` 分支接入；素材准备规范见 [pet-asset-production-brief.md](./pet-asset-production-brief.md)。当前实际工程目录为 `echoes of milet`，与工作区说明中的 `echoes-of-milet` 同指公开端。

## 1. 结论与边界

可直接基于现有 Vue 3、TypeScript、Tailwind 实现，无需新增游戏引擎、状态管理框架、后端 API 或数据库。宠物是 App 级客户端辅助交互，使用独立工厂和 provide/inject，页面发送业务事件，不直接选择动画。

- 保留需求的六模块反应、四项导航、点击/拖拽、10–30 秒无操作随机行为，并把 Jean 的气泡说话纳入同一个无操作行为周期。
- “当前页面生命周期”解释为本次浏览器文档生命周期：SPA 路由切换保留位置，刷新恢复默认；不写入 AppState、Cookie、LocalStorage 或服务端。
- 已把动画示例中的十四组动作转为 WebP 图集、静态降级图和 manifest，并完成事件、直接交互、弹层暂停及 SSR 隔离。
- 未新增运行时依赖、后端 API、数据库或持久化配置。

## 2. 代码依据与必要调整

| 已核查位置 | 当前情况 | 实施决定 |
| --- | --- | --- |
| `src/app.ts` | 每次 createApp 创建 scroll/interaction 协调器，提供注入并统一 dispose | 以相同模式创建 PetCoordinator，禁止模块级可变单例 |
| `index.html` / `src/entry-client.ts` | 主 Vue 根负责 SSR hydration | PetHost 放入独立的客户端 Vue 根，复用同一组协调器；宠物加载失败不能影响正文 hydration |
| `src/views/LayoutApp.vue` | 桌面内容区内部滚动，右下角 fixed 返回顶部 | 宠物不能只监听 window scroll；预留返回顶部区域 |
| `src/router/routes.ts` | Live 详情、文章、周年页不在 LayoutApp 内 | 不把宿主放进 LayoutApp；用路由策略控制显示 |
| `src/composables/site-interaction/*` | 已有 motionEnabled、documentVisible、导航阶段；没有 overlay 管理接口 | 读取其状态，不重复创建媒体查询；另加宠物暂停令牌 |
| `src/composables/SideMenueData.ts` | timeline/release/live-archive/pilgrimage 已有命名路由和现有配色语义 | 四项入口复用目标；不把完整侧栏菜单复制进宠物 |
| `src/composables/useLangRoute.ts` | URL 使用 ja，内部语言存在 jp 映射 | 使用 withLangParam/toUrlLang，禁止生成 /jp 路径 |
| `src/plugins/event-bus.ts` | events 是模块级对象 | 宠物不使用该总线，避免跨请求共享状态 |
| `src/views/milet/MiletNewsCollectionView.vue` | 当前是整理新闻链接，外链新窗口打开；没有访客收藏操作 | news.favorite 仅保留契约，MVP 当前代码接入验收标记 N/A，不为宠物另做收藏业务 |
| `src/components/milet/gallery/MiletAlbumViewer.vue` | Fancybox.show 动态加载并有请求失效保护 | 在现有打开/实例销毁周期接语义事件和暂停，不延迟照片打开 |
| `src/views/milet/MiletPilgrimageView.vue` | 地点选择由 selectSpot 驱动，图片使用 Fancybox.bind | 在有效地点详情确认后发事件，区分自动初始化与用户选择 |
| `src/assets/main.css` | 海蓝、青绿、纸白、浅金 token，已有减少动画体系 | 导航延续 token，角色用低饱和暖白形成温和区别 |

### 需求中需要明确的冲突

1. **照片反应与 Lightbox 隐藏**：Lightbox 打开优先，不能为了 look 延迟打开。实例打开记录一次 photo.open 并隐藏；关闭后，同一路由且距打开不超过 30 秒时补一次 look，否则回 idle。连续翻图不发事件。实现与验收均按此规则执行，不能声称打开时已可见播放。

2. **示例映射多于 MVP**：timeline.scroll、release.open、news.open 暂不接入；location.open 为统一名称，去掉同义 pilgrimage.open。不随每次滚动反应。

3. **全屏地图**：当前地图工作区不等于浏览器全屏。普通地图页仍显示宠物；实际全屏或未来沉浸展开状态才暂停，不新增全屏地图功能。

4. **默认右下角重叠**：返回顶部已有 48px 按钮；宠物默认放在其上方并固定预留该空间，不随返回顶部显隐跳动。自由拖拽后用户可重新放置；MVP 不增加碰撞系统，不保证人为拖到任意控件上仍无重叠。

## 3. 组件与逻辑组织

最终增量目录如下：

```text
src/components/pet/
  PetHost.vue                 # 客户端挂载、显示策略、组合与资源就绪
  PetAvatar.vue               # 动画/静态渲染、语义按钮，不处理页面数据
  PetQuickMenu.vue            # 四项导航、均匀定位、键盘和关闭行为
  PetSpeechBubble.vue         # Jean 气泡文案、视觉与进出过渡
  mountPetHost.ts             # hydration 完成后创建和卸载独立客户端根
src/composables/pet/
  createPetCoordinator.ts     # 状态、优先级、去重、暂停、清理
  petTypes.ts                 # 事件、动作注册表、状态、注入 API
  petInjection.ts             # InjectionKey、usePet
  petSchedulingCore.ts        # 显式动作/说话行为池、权重、随机延时与可调度条件
  petGeometryCore.ts          # 拖拽约束、菜单和气泡边界几何
  petLookGeometryCore.ts      # 虚拟椭圆、五方向、死区和迟滞
  petFramePlayer.ts           # 图集播放、循环语义和完成回调
  usePetPointer.ts            # 单击、双击、长按与拖拽仲裁
  usePetProximity.ts          # 桌面 Hover 感应与按需预热
  usePetOverlay.ts            # 响应式弹层暂停令牌
  usePetFancybox.ts           # Fancybox 实例级暂停和照片事件
  index.ts
src/config/pet.ts             # 路由策略、菜单记录、事件映射、阈值
src/composables/lang/pet.ts   # zh/jp 稳定键文案
src/assets/pet/               # 十四组图集、静态降级图、manifest 与入口
tests/pet/                    # 协调器、调度、几何、指针、弹层和配置测试
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

1. createApp 内创建纯内存实例并 provide；SSR 不读 DOM、不建计时器、不随机选动作或文案。气泡初始状态固定为 `visible=false`、`messageKey=null`，不会产生 hydration 差异。
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

优先级：idle=0、random=1、attention=2、page=3、user=4、drag=5。暂停是可见性与调度闸门，高于上述所有动作。

- 高优先级立即中断低优先级；相同优先级采用最新有效事件替换，重复 contentId 合并。不维护无界动画队列。
- page 事件冷却建议 2 秒；冷却窗口内最多保留一条最新事件，TTL 2 秒。拖动与菜单期间的普通 page 事件直接丢弃，避免用户结束交互后突然补播。
- 触屏和键盘的单击回应立即开始；桌面鼠标先经过 240ms 双击仲裁，确认单击后菜单再延后 24ms 展开，不能等整个 happy 动画结束才可导航。
- 每次播放生成 animationGeneration；完成回调检查代数，已被中断的动作不能把 drag 或新动作改回 idle。
- pointerup 正常结束拖拽：happy 一次再 idle。pointercancel/lostpointercapture：清理并 idle，不执行点击、不假装用户完成拖动。
- 动画失败或资源缺失退回静态 idle，导航保持可用；开发环境可记录问题，生产不污染业务通知。

### 无操作行为

只在客户端 mounted、页面可见、无暂停、菜单关闭、非拖动、资源 ready 时安排单个 `window.setTimeout`，间隔随机 10–30 秒。服务端不会创建计时器，SSR 首屏也不渲染宠物宿主。点击宠物或真实拖拽会重新开始等待；普通页面点击、滚动和键盘操作不改变宠物待机计时。

待机动画候选池显式配置为 sit、happy、curious、excited、sniff、look、sleep；无操作行为池在这七项之外显式追加 `speech`。`idle` 只作为默认循环，`drag` 只由真实拖拽触发，五个方向动作只由桌面 Hover 触发。动作完成或气泡消失后重新抽取延时；不使用 setInterval 或 requestIdleCallback 堆积任务。

隐藏标签页：清除定时器并停帧；返回后从 idle 重计时，不补播离开期间事件。prefers-reduced-motion：停止随机和循环动画，用静态姿势切换，菜单仍可开关、宠物仍可拖动。复用现有 interaction.state，不能只隐藏 CSS 而继续运行计时器。

### Jean 气泡说话

自动说话与七个待机动画共用同一个 10–30 秒随机计时器和 random 优先级，不另建 interval。抽中 `speech` 时 Jean 保持默认待机画面，从稳定文案键中随机选择一句；连续两次说话会排除上次文案。气泡展示 5.2 秒后自动收起，再开始下一轮等待。点击、Hover 注视、页面反应、菜单、拖拽、弹层暂停、路由切换、标签页隐藏和卸载都会清除气泡及其计时器。

文案以 Jean 的感受描述交互线索，避免直接写成“点击打开菜单”一类操作命令。中文和日文共享稳定键：

| 文案键 | 中文 | 日文 |
| --- | --- | --- |
| `gentleTouch` | 轻轻碰一下，也许会有小路从身边展开。 | そっと触れたら、小さな道がひらくかも。 |
| `doubleWag` | 尾巴摇两下的时候，常会有新发现。 | しっぽが二度ゆれると、何か見つかるかも。 |
| `stayClose` | 多停一会儿吧，我会把耳朵借给你。 | もう少しそばにいて。耳を澄ませるから。 |
| `cozySpot` | 这里风有点大，带我换个舒服的位置吧。 | 風が強いね。居心地のいい場所へ連れていって。 |
| `nearbyPresence` | 你靠近时，我的耳朵总会先知道。 | 近づく気配は、耳が先に気づくよ。 |

视觉使用与站点海蓝、青绿、纸白、浅金一致的半透明暖纸气泡，包含轻微高光、描边、投影和指向 Jean 的尾角。默认右下角位置向左上方展开；靠近其他边缘时自动翻转，并按 visualViewport 与 safe-area 完整约束在屏幕内。气泡不接收指针事件，也不抢占键盘焦点；自动出现的装饰文字使用 `aria-hidden`，避免屏幕阅读器在用户未操作时被动播报。

## 7. 点击、拖拽、菜单与位置

### Pointer Events

- 只接受主指针与鼠标左键；pointerdown 保存 pointerId、起点与原位置并 setPointerCapture。
- 欧氏距离达到 8 CSS px 才进入 drag；低于阈值且正常抬起执行一次激活。
- touch-action:none 仅放在宠物命中区域；宿主全屏透明层 pointer-events:none，宠物和菜单 pointer-events:auto。
- 兼容键盘生成的 click；指针路径需要抑制拖后浏览器 click，避免 pointerup/click 双触发。
- 拖动用 requestAnimationFrame 合并坐标、transform 更新；不在每次 move 读取布局；开始时测量，resize 时更新。
- 菜单展开后再次开始拖动即关闭；pointercancel、丢失捕获、窗口失焦和暂停都释放捕获与监听。

### 视口与返回顶部

PC 宠物容器 160px，移动 120px；默认 right=32/16px，bottom=88px + safe-area（预留返回顶部 48px、间距和边缘）。素材同时在容器内放大 1.25 倍并按透明边距微调，提高角色主体占比；拖拽边界和菜单定位按放大后的容器计算。

坐标统一按同一个 fixed 容器计算；移动端读取 visualViewport 的尺寸和偏移，把软键盘/缩放后可见区域转换到该坐标系后 clamp。安全区、角色完整画布和边距都在计算内。屏幕旋转仅把越界位置约束到最近有效点，不吸附、不自动回默认。

保留 LayoutApp 与 MiletArticleView 原返回顶部位置。无此按钮的页面仍保留统一默认宠物位置，避免跨路由上下跳动。菜单定位可避让预留角落，但不引入全页面元素碰撞探测。

### 快捷菜单

| 文案语义 | 命名路由 | 颜色 |
| --- | --- | --- |
| Timeline / 时间线 / タイムライン | miletTimeLine | amber |
| Music Releases / 音乐作品 / 音楽作品 | miletRelease | violet |
| Live / 演出记录 / ライブ | miletLiveArchive | sky |
| Pilgrimage / 朝圣之旅 / 巡礼の旅 | miletPilgrimage | amber |

使用 RouterLink + withLangParam；入口保留完整可访问名称。胶囊入口从宠物中心向视口内侧沿四分之一椭圆展开，按宠物所在象限自动翻转方向，并逐项约束在安全区内；桌面与移动端均保持环绕关系，不再使用列表弹窗。

菜单项集中配置在 `PET_QUICK_MENU_ROUTES`，顺序、命名路由与颜色由一条记录定义；中日文文案使用相同的稳定 `key` 组成 Record，避免按数组下标错配。新增入口时添加路由记录及两种语言的同名文案，TypeScript 会检查遗漏。位置函数按菜单数量均分垂直槽位，桌面项间距 58px、移动端 52px；胶囊边缘与宠物容器的水平间距分别为 8px 和 6px。增加菜单项时无需手工补角度或坐标。

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

`designs/jean-motion` 是动画效果静态示例。实现已把 idle、sit、happy、curious、excited、sniff、look、drag、sleep 及五个方向注视动作共十四组资源转移到 `src/assets/pet`：每组包含逐帧 WebP 图集和静态降级图，`manifest.json` 保存帧数、帧宽、帧高、帧时长和循环声明。

素材在 160px/120px 容器内按 1.25 倍显示并微调透明边距，扩大角色主体但不改变拖拽命中容器。`drag` 只在真实拖拽期间循环，不进入待机随机池；其他一次性动作由播放器完成回调回到 idle，避免任何循环声明永久占用随机状态。

## 10. 扩展约定

### 新增快捷菜单

1. 在 `PET_QUICK_MENU_ROUTES` 增加稳定 `key`、命名路由和色彩；`routeName` 受 `PET_MODULE_ROUTES` 的命名路由联合类型约束。
2. 在 `src/composables/lang/pet.ts` 的 zh/jp Record 中增加同名 key。缺失任一语言会在 TypeScript 校验时报错。
3. 几何函数根据最终数量自动均匀分配位置；只有需要改变视觉密度时才调整 `horizontalGap` 或 `itemGap`。

### 新增动作

1. 在 `PET_ACTIONS` 注册动作名。`PetAction`、协调器合法动作集合和素材映射遍历由该注册表派生；动作不会自动进入待机候选。
2. 为动作补充 `.sheet.webp`、`.static.webp`、`manifest.json` 项和 `src/assets/pet/index.ts` 显式导入。素材 Record 会在类型检查时阻止遗漏。
3. 按触发来源显式加入 `PET_ACTION_POOLS`；方向动作还需加入 `PET_LOOK_ACTION_BY_DIRECTION`。播放方式通过 `PetPlayback` 的 loop、once、forwardHold、reverseOnce 声明，不能只依赖 manifest。

### 新增气泡文案或说话行为

1. 在 `PET_SPEECH_KEYS` 增加稳定文案键，并在 `src/composables/lang/pet.ts` 的 zh/jp `speech` Record 同时补齐文字；类型检查会阻止任一语言遗漏。
2. 展示时长由 `PET_SPEECH_DURATION_MS` 统一配置；布局尺寸和样式留在 `PetSpeechBubble.vue`，屏幕边界计算留在纯函数 `resolvePetSpeechBubbleLayout`。
3. `speech` 只在 `PET_RANDOM_BEHAVIORS` 注册一次。若以后需要独立频率，应把行为记录扩展为显式权重配置，不复制定时器，也不把说话加入 `PET_ACTIONS` 动画注册表。

### 新增业务反应或弹层

- 新业务反应先扩展 `PetEvent`，再在事件映射或页面成功状态中调用 `pet.react`。异步页面必须携带并校验内容 ID、路由代数和最新请求标识，迟到结果不能触发动作。
- 普通 Dialog/Drawer 用 `usePetOverlay`；Fancybox 照片用 `usePetFancyboxPhotoLifecycle`。两者都按实例持有幂等 release，并在卸载或异常路径释放。
- 路由显示策略集中在 `PET_MODULE_ROUTES`、`PET_QUIET_ROUTES` 和 `PET_HIDDEN_ROUTES`，不要在页面组件里按 URL 字符串判断。

## 11. 分阶段实施与改动范围

| 阶段 | 交付 | 完成门槛 |
| --- | --- | --- |
| P0 前期准备 | 代码映射、方案、动作与资产规格 | 已完成 |
| P1 交互骨架 | app 注入、Host、静态角色、四项导航、指针逻辑 | 已完成；PC/Mobile 可点可拖 |
| P2 调度与页面事件 | 优先级、route/content 接线、待机计时、暂停令牌 | 已完成；竞态、清理、菜单/弹层互斥有单测 |
| P3 动画制作接入 | 十四动作图集、静态图、manifest 与逐帧播放器 | 已完成；静态降级和资源错误路径可用 |
| P4 集成验收 | 桌面/移动/中文/日文/SSR 回归 | 已完成宠物范围验收；本地 SSR 页面无 hydration 警告且仅挂载一个宠物实例 |

主要改动：`index.html`、`src/app.ts`、`src/entry-client.ts`、新增 pet 目录和配置、内容事件页面、上述 overlay 组件，以及本地 SSR 验证脚本。路由判断集中在 route.name 映射，无需为没有新页面的宠物更改 SEO/render.config。

管理端 `data-admin` 不承担宠物配置或素材上传，本期不改。Worker `milet-worker-ts` 没有新增数据或接口，本期不改。两个代理白名单、权限、D1 migrations 均无需同步。

## 12. 验证与结果

最终校验运行 `npm run type-check`、`npm run test:pet`、`npm run build:ssr` 和素材检查脚本。调度纯逻辑使用 Node 内置 test runner，不额外引入测试框架。`verify-ssr-local.mjs` 已补齐 `/static/milet|blog/(img|img-preview)` 白名单代理，使本地验证与 Vite、Pages Function 的静态资源路径一致，图片请求不会再误入 Vue SSR 路由。

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
| 随机抽中说话、连续两次说话、说话中打开菜单 | idle 画面配气泡；文案不立即重复；菜单优先并清除气泡计时器 |
| 宠物位于四角、窄屏与安全区 | 气泡向屏幕内侧翻转，完整可见且不拦截页面点击 |
| 动作资源 404/慢网/加载中点击 | 静态降级，主要导航保持可用 |
| 卸载后推进计时/动画完成回调 | 没有过期状态写入、悬空监听与资源增长 |

浏览器验收直接使用工程真实路由，不保留单独的宠物浏览器临时页面。

### 2026-09-08 验收记录

- `npm run type-check` 通过；`npm run test:pet` 共 72 项通过；`npm run build:ssr` 的客户端构建、服务端构建和预渲染均通过；`scripts/test_jean_motion_assets.py` 共 7 项通过。
- SSR 返回的宠物根保持为 `<div id="pet-host-root" data-pet-client-root></div>`，服务端不输出 PetHost 内容；客户端挂载后页面只有一个 `data-pet-host` 实例。
- 1280×720 桌面视口中宠物容器为 160×160，四个菜单项垂直间距均为 58px，最外侧胶囊与宠物容器水平边缘相距 8px。移动视口中容器为 120×120，四项垂直间距均为 52px，水平边缘间距为 6px。
- 本地 SSR 真实页面捕获到 224×86 的中文气泡，默认向 Jean 左上方展开且 `pointer-events: none`；390×844 视口中 120px 宠物和四项环绕菜单均完整位于可见区域。气泡的移动端尺寸、四角翻转和 safe-area 约束另由纯几何测试覆盖。
- 真实页面完成单击开关菜单、菜单导航、拖拽移动、拖后不误点、视口约束和待机随机动作检查。待机实测从 idle 进入非默认 look；自动行为池单测覆盖七个显式待机动画和一个气泡行为，气泡文案、自动消失、打断清理及四角定位均有回归测试。
- `VM163 ... reportAllChanges ... requestIdleCallback` 无法在宠物待机切换中复现。工程源码和依赖中没有 `reportAllChanges`，宠物只使用 `window.setTimeout`；该堆栈来自匿名注入脚本或浏览器扩展，而非随机动作调度器。
- `/zh/milet` 通过本地 SSR 验证入口加载后未出现 hydration 警告，页面图片均成功解码。原始 SSR HTML 不输出 PetHost 内容，客户端只挂载一个宠物实例；图片代理失败会造成页面数据或图片请求错误，但不是当前宠物独立挂载的 hydration 来源。
- 遗留项复查发现 `MiletLiveDetailView.vue` 仅在复用 SSR/缓存 payload 时发送 `live.open`；首次客户端请求成功路径没有发送。现已在最新请求成功落盘且路由仍有效时补发，并保留 requestId、slug、lang、路由代数和 fullPath 校验。
