# 公开端原生滚动治理方案

## 1. 文档目的

本文定义 `echoes-of-milet` 公开端的原生滚动治理方案。

本方案不引入 Lenis 等虚拟滚动库，不拦截滚轮或触摸输入，不改变浏览器原生滚动物理。目标是在保留浏览器原生滚动、键盘操作、触摸惯性和可访问性的基础上，统一管理公开端的滚动目标、路由恢复、锚点跳转、滚动订阅、异步内容稳定以及嵌套滚动边界。

本文是设计与实施依据，不代表所有阶段必须一次完成。后续页面级滚动交互应复用本方案提供的基础层，避免在页面内重复实现滚动容器判断和事件管理。

## 2. 当前结构与主要问题

### 2.1 两种主滚动目标

公开端 `LayoutApp` 当前存在两套主滚动方式：

- 移动端：页面通过 `window` / document 滚动。
- 桌面端：`LayoutApp` 固定在视口中，右侧 `[data-page-scroll-container]` 作为主垂直滚动容器。

这套布局能够保证桌面端滚动条位于页面最右侧，但也意味着不能直接依赖只面向 `window` 的浏览器或 Vue Router 默认滚动处理。

### 2.2 滚动目标判断分散

当前锚点滚动、回到顶部以及部分业务页面分别实现了滚动目标判断。主要风险包括：

- 桌面和移动端的判断规则可能逐渐不一致。
- 相同页面绑定多个 scroll listener。
- 路由、锚点和业务组件使用不同的顶部偏移。
- 组件销毁、断点切换时容易遗漏事件解绑。
- 页面级逻辑可能只监听 `window`，无法感知桌面内部容器滚动。

### 2.3 Vue Router 默认恢复无法完整覆盖桌面端

Vue Router 的 `savedPosition` 主要面向浏览器页面滚动。桌面端实际变化的是内部容器的 `scrollTop`，因此浏览器返回、前进时，不能只返回 `savedPosition`。

### 2.4 动态内容会改变页面几何结构

公开端包含：

- SSR hydration；
- 延迟组件；
- 图片和第三方嵌入；
- Timeline、Gallery、News、Release 等分页追加内容；
- 可展开卡片；
- 异步关联文章和详情数据。

如果只记录绝对像素位置，返回页面时可能因为内容高度变化而恢复到错误位置。

### 2.5 存在多个嵌套滚动区域

典型区域包括：

- 左侧菜单；
- TrackModal；
- 文章目录或浮层；
- 圣地巡礼详情面板；
- 下拉选择器；
- WorkCard 内部曲目或版本列表。

这些区域需要与主页面滚动明确隔离，并统一处理页面锁定和滚动传递。

## 3. 设计目标

### 3.1 功能目标

1. 统一识别 `window` 与桌面内部滚动容器。
2. 统一执行回到顶部、锚点跳转和指定位置跳转。
3. 正确处理首次进入、普通跳转、浏览器返回/前进、语言切换和 query 更新。
4. 为页面组件提供共享的滚动位置、进度、方向和视口信息。
5. 全局主滚动目标最多绑定一个被 `requestAnimationFrame` 合并的 scroll listener。
6. 在异步内容完成后恢复位置，同时避免和用户主动滚动争夺控制权。
7. 为动态列表提供“业务锚点 + 视口偏移”的恢复能力。
8. 统一弹窗、菜单和内部面板的滚动锁定及滚动边界。
9. 尊重 `prefers-reduced-motion`。
10. 保持 SSR 初始输出稳定，不在服务端访问浏览器对象。

### 3.2 非目标

本方案不负责：

- 模拟滚轮惯性或阻尼；
- 对滚轮 delta 进行插值；
- 全站滚动叙事动画；
- 替代页面自身的数据分页；
- 替代业务页面中的地图、轮播和弹窗状态。

## 4. 基本原则

### 4.1 浏览器仍是滚动执行者

所有滚动最终通过原生能力执行：

- `window.scrollTo()`；
- `HTMLElement.scrollTo()`；
- 浏览器键盘滚动；
- 触摸和触控板惯性。

治理层只负责选择正确目标、计算位置、保存状态和协调生命周期。

### 4.2 一个页面只有一个主垂直滚动目标

普通页面的主内容只能由以下一个目标承担：

- 移动端 `window`；
- 桌面端 `[data-page-scroll-container]`。

业务组件中的独立滚动区域必须明确标记为嵌套区域，不能成为新的页面级滚动根。

### 4.3 公共能力不自行查询 DOM

回到顶部、页面进度、章节导航等公共组件不应分别执行 `querySelector('[data-page-scroll-container]')`。滚动目标由应用级 `PageScrollCoordinator` 统一解析并注入；`LayoutApp` 只注册可用的 element target 和内容尺寸 wrapper。

### 4.4 自动滚动不得覆盖用户输入

路由位置恢复或异步修正等待期间，一旦出现以下用户输入，应取消待执行的恢复：

- wheel；
- touchstart / touchmove；
- PageUp / PageDown；
- Home / End；
- ArrowUp / ArrowDown；
- Space。

## 5. 目标架构

建议新增以下目录：

```text
src/composables/page-scroll/
├─ pageScrollTypes.ts
├─ pageScrollTarget.ts
├─ browserScrollHistoryManager.ts
├─ createPageScrollCoordinator.ts
├─ usePageScrollController.ts
├─ usePageScrollRestoration.ts
├─ usePageScrollPage.ts
└─ pageScrollInjection.ts
```

整体调用关系：

```text
浏览器原生 window / HTMLElement 滚动
                    ↓
            pageScrollTarget
                    ↓
       PageScrollCoordinator
          ↓         ↓          ↓
     路由恢复     公共操作     每帧订阅
          ↓         ↓          ↓
   动态列表页面   锚点/顶部   Timeline/导航
```

`PageScrollCoordinator` 必须是每个 `createApp()` 实例独立创建的对象。禁止使用模块级全局单例，避免 SSR 请求之间、文章嵌入创建的子应用之间或测试实例之间共享滚动状态。

## 6. 滚动目标适配层

### 6.1 类型

```ts
export type PageScrollTarget =
  | { kind: 'window'; target: Window }
  | { kind: 'element'; target: HTMLElement }
```

### 6.2 统一能力

`pageScrollTarget.ts` 应提供：

```ts
resolvePageScrollTarget(): PageScrollTarget
readPageScrollTop(target): number
readPageScrollMax(target): number
readPageViewport(target): PageScrollViewport
scrollPageTo(target, options): void
bindPageScroll(target, listener): () => void
```

### 6.3 判断规则

1. SSR 阶段不解析滚动目标。
2. 小于 `md` 断点时使用 `window`。
3. `md` 及以上只要 `[data-page-scroll-container]` 已注册并仍连接到 DOM，就固定使用该 element。
4. 桌面端只有在容器不存在或已注销时才回退到 `window`。
5. 断点切换时重新绑定目标，并使用当前可见业务锚点维持阅读位置。

`scrollHeight > clientHeight` 只能用于计算 `max` 和是否已经到达边界，不能用于选择滚动目标。异步页面在 mounted 时可能尚未溢出，但数据加载后仍必须继续由同一个 element 承担滚动。

## 7. 页面滚动控制器

### 7.1 状态

```ts
export interface PageScrollState {
  top: number
  max: number
  progress: number
  direction: 'up' | 'down' | 'idle'
  isScrolling: boolean
  targetKind: 'window' | 'element'
  viewportTop: number
  viewportHeight: number
  isLocked: boolean
  lockCount: number
}
```

### 7.2 命令

```ts
scrollToTop(options?)
scrollToPosition(top, options?)
scrollToAnchor(anchor, options?)
captureSnapshot(options?)
restoreSnapshot(snapshot, options?)
registerElementTarget(element): () => void
registerContentMetricsElement(element): () => void
invalidateMetrics(): void
lockPageScroll(owner): () => void
subscribeScrollFrame(callback): () => void
dispose(): void
```

`lockPageScroll()` 每次调用返回一个唯一、幂等的 release 函数。同一 owner 可以重入多次，每个 token 必须分别释放；不再公开依赖字符串匹配的 `unlockPageScroll(owner)`。

`viewportTop` 使用浏览器视口坐标：window target 固定为 `0`；element target 为该元素 scrollport 顶边的 `getBoundingClientRect().top`。业务组件比较 sentinel、anchor 和 sticky line 时都使用这个坐标系，不把 element 的 `scrollTop` 混入视口坐标。

`subscribeScrollFrame()` 必须返回幂等的 unsubscribe；`dispose()` 必须取消 passive listener、`requestAnimationFrame`、`scrollend`/延时器、`matchMedia` 监听、ResizeObserver（如果由协调器持有）和全部内部订阅。调用 `dispose()` 后，外部遗留的 release/unsubscribe 再次调用只能安全 no-op。

### 7.3 事件模型

控制器只对当前主滚动目标绑定一个 passive scroll listener。listener 本身不读取大量布局信息，只调度一次 `requestAnimationFrame`。

每帧统一更新：

- `top`；
- `max`；
- `progress`；
- `direction`；
- `isScrolling`。

页面消费者通过订阅控制器获得状态，避免重复监听同一滚动目标。

协调器自身持有 `matchMedia('(min-width: 768px)')` 监听。断点跨越、element 注册/注销或 element 失去 DOM 连接时统一执行 target resolve 和监听器重绑；`LayoutApp` 不额外实现第二套媒体查询通知协议。

`top/max/viewportHeight` 的几何刷新来源必须覆盖：

- 每次共享 scroll frame 和 target 切换；
- `window.resize` 与 `window.visualViewport?.resize`；
- element scrollport 的 ResizeObserver；
- 已注册内容 wrapper 的 ResizeObserver，用于接口追加、图片尺寸确定、展开/收起导致 `scrollHeight` 改变但没有 scroll 事件的情况；
- 页面在无法由 ResizeObserver 表达的布局事务完成后主动调用 `invalidateMetrics()`。

所有来源只调度同一个 rAF measurement，不在 ResizeObserver callback 内同步循环读写。ResizeObserver 不可用时，保留 resize/scroll/target-change 刷新，并由动态页面在 `nextTick()` 后调用 `invalidateMetrics()`。

`isScrolling` 可以在最后一个 scroll 事件后通过短延时或浏览器 `scrollend`（可用时）恢复为 `false`，但不应参与业务正确性判断。

## 8. 应用级协调器与 LayoutApp 集成

### 8.1 创建位置

在 `src/app.ts` 的 `createApp()` 内为每个应用实例创建一个 `PageScrollCoordinator`：

```ts
export function createApp(options: CreateAppOptions = {}) {
  const app = shouldHydrate ? createSSRApp(App) : createClientApp(App)
  const scrollCoordinator = createPageScrollCoordinator()
  const router = createAppRouter(
    import.meta.env.SSR,
    scrollCoordinator,
    options.browserHistoryManager,
  )

  app.provide(PageScrollCoordinatorKey, scrollCoordinator)
  app.use(router)

  return { app, router, state, scrollCoordinator }
}
```

创建顺序必须保证 Router hooks 和 Vue 组件使用同一个协调器实例。`src/router/index.ts` 不应再创建用于滚动治理的模块级实例；如果默认导出的 router 不再被使用，应移除该额外创建路径。客户端进入阶段三后，`options.browserHistoryManager` 必须由 entry-client 在调用 `createApp()` 之前取得；SSR 和阶段一、二可以不传。

公开端根入口负责在应用卸载或测试 teardown 时调用 `scrollCoordinator.dispose()`。文章内嵌等独立 Vue 子应用即使创建自己的协调器，也不得自动接管全局 browser history；history 所有权见 9.6。

### 8.2 LayoutApp 职责

`LayoutApp` 不创建控制器，只负责桌面 element target 与内容尺寸 wrapper 的注册生命周期：

1. 给 `[data-page-scroll-container]` 增加 template ref；
2. 给其稳定的内层 `<main>`/内容 wrapper 增加 metrics ref；
3. mounted 后分别调用 `registerElementTarget(element)` 和 `registerContentMetricsElement(content)`；
4. element/content 被替换或 LayoutApp 卸载时调用各自返回的 unregister；
5. 协调器自己的媒体查询跨越 `md` 断点时自动重新选择 target；
6. 不直接实现路由恢复、history key 或页面 ready。

普通页面通过 `usePageScroll()` 使用应用级协调器，不直接依赖 Layout DOM 结构。

周年、文章详情、Live Detail 等不经过 `LayoutApp` 的页面不再创建自己的控制器。由于没有注册 element，它们自动使用同一协调器的 window target。

## 9. 路由滚动策略

### 9.1 RouteMeta

建议扩展：

```ts
interface RouteMeta {
  scrollPolicy?: 'top' | 'restore' | 'preserve' | 'manual'
}
```

未声明 `scrollPolicy` 时按 `top` 处理。第一、二阶段不批量改变现有 route meta；第三阶段逐页接入时才把表中目标页面显式设为 `restore`、`preserve` 或 `manual`。这样未完成 ready/restorer 接入的页面不会被误判为可恢复页面。

### 9.2 策略定义

| 策略 | 行为 |
|---|---|
| `top` | 正向进入时回顶部；不读取旧页面位置 |
| `restore` | 正向进入回顶部；浏览器返回/前进恢复历史快照 |
| `preserve` | 路由参数、语言或 query 变化时保持当前阅读位置 |
| `manual` | 页面自行管理，公共层不自动滚动 |

### 9.3 推荐页面策略

| 页面 | 推荐策略 |
|---|---|
| milet 首页 | `restore` |
| Release | `restore` |
| Timeline | `restore`，后续增加业务锚点 |
| Gallery List | `restore`，后续增加相册锚点 |
| News | `restore`，后续增加新闻锚点 |
| About | `restore` |
| 列表进入详情 | 详情 `top`；返回列表由列表 `restore` |
| 同页面语言切换 | `preserve` |
| 筛选、排序、query 更新 | 默认 `preserve`，业务可主动回到结果顶部 |
| Pilgrimage | `manual` |
| Anniversary | `manual` |
| Song Guess | `manual` 或 `top` |

### 9.4 路由协调时序

```text
离开当前路由
    ↓
捕获当前 ScrollSnapshot
    ↓
路由导航和组件挂载
    ↓
页面报告首屏内容 ready
    ↓
根据导航类型选择 top / restore / preserve / manual
    ↓
执行原生 scrollTo
```

Vue Router 的 `savedPosition` 可以作为“这是浏览器历史导航”的信号，但桌面内部容器不能直接使用其坐标。内部容器位置应读取项目自己的快照。

### 9.5 Router 契约

`createAppRouter()` 接收当前应用实例的 `PageScrollCoordinator`。对于 `scrollPolicy !== 'manual'` 的受管路由：

- `scrollBehavior` 只把 `to`、`from` 和 `savedPosition` 提交为恢复意图，不直接等待页面数据，也不直接执行滚动；
- 返回 `false`，禁止 Vue Router 同时恢复 window 坐标；
- 协调器在目标页面 ready 后执行 top / restore / preserve；
- hash 路由同样通过协调器的 `scrollToAnchor()`，不再额外安排第二次 window 滚动。

`manual` 页面可以明确返回页面自己的行为，但不得与协调器同时写同一滚动目标。

客户端启用治理时，由根应用唯一的 browser-history owner 设置：

```ts
window.history.scrollRestoration = 'manual'
```

该值只在浏览器环境设置。普通 `PageScrollCoordinator` 不得在创建和销毁时自行修改这个全局值，否则多个应用实例的保存/恢复顺序会互相覆盖。

### 9.6 browser history 所有权

`history.scrollRestoration` 和 history entry key 由公开端根应用的 `BrowserScrollHistoryManager` 独占管理：

1. `src/entry-client.ts` 必须先执行 `acquireBrowserScrollHistoryLease()`，此时 Vue Router 尚未创建，manager 才能保存浏览器真正的原始 `scrollRestoration`；
2. entry-client 再把 `lease.manager` 传给 `createApp()` / `createAppRouter()`，随后等待 router ready 并 mount；
3. Vue Router 创建时即使因为 `scrollBehavior` 把值设为 `manual`，manager 已经保存原值；根 app/router teardown 后最后调用 `lease.release()` 恢复；
4. `createApp()`、Router 创建或 mount 抛错时也在 `finally`/失败清理中 release；
5. 内嵌文章组件、独立挂载的小应用和普通 coordinator 实例不 acquire lease，也不读写该全局开关；
6. 开发 HMR 或测试重复安装时使用进程内 lease/ref-count，最后一个 lease 释放时才恢复旧值；
7. SSR 不创建 manager，也不读取 `window.history`。

```ts
const historyLease = acquireBrowserScrollHistoryLease()

try {
  const application = createApp({
    browserHistoryManager: historyLease.manager,
  })
  await application.router.isReady()
  application.app.mount('#app')
  registerRootTeardown(() => {
    application.scrollCoordinator.dispose()
    historyLease.release()
  })
} catch (error) {
  historyLease.release()
  throw error
}
```

禁止先调用 `createApp()` 再 acquire lease；Vue Router 4.5 在 `createRouter()` 阶段就可能改写 `history.scrollRestoration`。

manager 必须持有独立的 `activeEntryKey`，表示当前已经成功渲染的路由 entry。它不能在 `beforeEach` 中临时从 `window.history.state` 推导：浏览器触发 popstate 后，history state 已先切换到目标 entry，但屏幕上仍是离开页面。

```ts
interface BrowserScrollHistoryManager {
  readonly activeEntryKey: string
  readPendingTargetEntryKey(): string | null
  ensureCurrentTargetEntryKey(options: { replace: boolean }): string
  commitActiveEntryKey(key: string): void
}
```

- manager acquire 时确保当前 entry 有 key，并初始化 `activeEntryKey`；
- `beforeEach` 永远用缓存的 `activeEntryKey` 保存离开页面快照；
- popstate 目标 key 从已经切换后的 `window.history.state` 读取，但只作为 pending target；
- push/replace 成功后，在 Router 完成 state 写入后读取或补写目标 key；
- 只有无 failure 的 `afterEach` 才调用 `commitActiveEntryKey(targetKey)`；
- guard 取消、导航错误或 Router 回滚 popstate 时不切换 active key；回滚完成后的 history state 必须仍与缓存 key 一致；
- redirect 沿用同一 generation 的 `fromEntryKey`，只替换最终 pending target，不重复捕获离开快照。

### 9.7 明确的导航 generation 生命周期

每次导航必须使用独立的 `NavigationScrollGeneration`：

```ts
interface NavigationScrollGeneration {
  id: number
  signal: AbortSignal
  fromEntryKey: string | null
  toEntryKey: string | null
  intent: ScrollNavigationIntent | null
}
```

具体 hook 顺序：

1. `router.beforeEach`：使用 manager 缓存的 `activeEntryKey` 同步捕获离开 entry 的快照；abort 上一 generation；创建新 generation，并开启“页面 token 注册窗口”；
2. 导航重定向：如果 Router 仍在同一条导航链内，把 generation 转交给最终目标；如果导航被取消或失败，abort generation，并保留当前页面及 entry 的滚动状态；
3. `scrollBehavior`：仅提交 `top / restore / preserve / anchor / manual` 意图并返回 `false`；即使此刻 pending token 为 0，也不得立即恢复；
4. `router.afterEach(to, from, failure)`：存在 failure 时 abort 且不改变 active key；成功时在 Router 已写入目标 history state 后确认 `miletScrollEntryKey`，把目标 key 绑定到 generation，再提交为 manager 的新 `activeEntryKey`。`router.onError` 同样 abort 当前 generation；
5. 初始导航由根组件 `onMounted` 触发 `closeTokenRegistrationWindow(generationId)`；后续导航由 `afterEach` 调度 `nextTick`，待新 RouterView setup/mount 完成后关闭注册窗口。这道 app-mounted barrier 保证 `LayoutApp` 注册 element target、页面 composable 注册 pending token 之前不会抢先恢复；
6. 注册窗口已经关闭，且当前 generation 的 pending token 全部释放后，才进入布局稳定检测和最终滚动；
7. 任意 `await`、`nextTick`、尺寸稳定等待、restorer prepare 前后都检查 `generation.id` 和 `signal.aborted`；过期 generation 不得写 scroll、history 或 ready 状态；
8. 成功执行一次意图后标记 consumed。同一 generation 中 hash 导航、Router hook 和 anchor composable 只能有一个滚动写入者。

初始导航同样经过 mounted barrier。不能以“当前没有 pending token”为页面已经 ready 的证据。

### 9.8 动态策略优先级

静态 `to.meta.scrollPolicy` 只是基线，最终 intent 按以下顺序解析，先匹配者优先：

1. `manual`：公共层不写滚动，页面自行处理；
2. 已登记的显式 anchor intent：导航成功后滚到锚点；
3. 浏览器 back/forward 且目标策略为 `restore`：恢复目标 entry 快照；
4. 同 route name 的语言、params 或 query 变化，且调用方声明保持阅读上下文：按 `preserve`；
5. `restore` 页面普通 push 正向进入：按 `top`，不读取同路径旧 entry；
6. 显式 `preserve`：保持业务锚点或当前 top；
7. 未声明及普通 `top`：回顶部。

业务筛选如果要求“更新 query 后回结果顶部”，必须随导航提交显式 top intent，它高于第 4 条的默认 preserve。用户输入取消尚未执行的恢复时，取消优先于以上所有自动 intent。

## 10. 滚动快照

### 10.1 基础快照

```ts
export interface ScrollSnapshot {
  top: number
  max: number
  capturedAt: number
  anchor?: ScrollAnchorSnapshot
  pageState?: unknown
}

export interface ScrollAnchorSnapshot {
  id: string
  offset: number
}
```

### 10.2 恢复优先级

1. 如果存在业务锚点且能恢复，使用 `anchor.id + offset`。
2. 如果锚点不存在，使用绝对 `top`。
3. 如果页面高度不足，将 top 限制到当前最大滚动距离。
4. 如果无快照，回到顶部。

### 10.3 存储策略

初期可以使用内存 Map，并限制最近 30～50 条记录，防止无限增长。

浏览器没有可直接依赖的标准业务 entry ID。项目必须在 history state 中维护自己的 key：

```ts
interface MiletHistoryState {
  miletScrollEntryKey: string
}
```

规则：

1. 客户端首次接管当前 entry 时，如果 key 不存在，使用 `crypto.randomUUID()` 或等价函数生成并通过 `replaceState` 写回；
2. 所有新 entry（包括页内 hash push）都必须由 `router.push()` 创建，禁止业务 composable 直接调用原生 `history.pushState()`；
3. replace 导航和同 entry 的 hash replace 保留原 key；
4. hash push 在 `router.push()` 完成后生成新 key；hash replace 使用 `router.replace()` 并保留当前 key；
5. 项目只允许在 Router 完成导航后使用合并式 `replaceState` 补写 `miletScrollEntryKey`；写入必须保留 Vue Router 的 `back`、`current`、`forward`、`position`、`replaced` 和 `scroll` 等字段；
6. 快照 Map 直接以 `miletScrollEntryKey` 为 key；
7. route name + params + query + language 只用于诊断和找不到 entry key 时的最后降级，不能作为正常主键。

BrowserScrollHistoryManager 在客户端记录 `activeEntryKey`、最近一次 Vue Router history `position` 和导航来源；协调器消费这些导航信号但不自行猜测 entry：

- `popstate` 导航把新 history state 中的 key作为 pending target；离开快照仍写入 manager 缓存的旧 active key；
- 非 pop 导航提交后，如果 history `position` 发生变化，视为新 entry，并通过合并式 `replaceState` 写入新 key；
- replace 导航保持同一个 `position` 和 key；
- 页内 anchor push/replace 分别委托 `router.push()` / `router.replace()`；业务层不复制 Router state，也不自行构造 entry；
- 写入前始终重新读取最新 `window.history.state`，避免使用导航开始前的旧副本覆盖 Router 字段。

只有导航成功后 manager 才把 pending target 提交为 active；取消、错误和 Router history 回滚保持原 active key。

现有 `usePageAnchorScroll.ts` 的 `pushState(null, '', url)` 必须在接入治理时替换为 Router 导航，避免清空或伪造 Vue Router history state。anchor composable 只提交 `AnchorNavigationIntent`；如果 hash Router 导航已经登记该 intent，`scrollBehavior` 只能复用它并返回 `false`，不得安排第二次滚动。intent 在一次成功滚动、导航失败或 generation abort 后立即清除。

重复点击当前相同 hash 时，`router.push()` 会产生 duplicated navigation，可能不会进入 `scrollBehavior`。composable 必须先比较当前规范化 location：如果 path/query/hash 完全相同，则不创建 history entry，直接调用协调器 `scrollToAnchor()`，并在完成或失败后清理一次性 intent；如果 location 不同，才走 `router.push/replace()`。

同一路径重复访问时，通过不同 entry key 区分“浏览器返回旧 entry”和“重新正向进入同一路径”。

## 11. 动态列表的业务锚点恢复

Timeline、Gallery、News 和 Release 不应长期只依赖绝对像素。

页面可以注册恢复适配器：

```ts
registerPageScrollRestorer({
  capture(): ScrollSnapshot,
  prepare(snapshot, signal: AbortSignal): Promise<void>,
  restore(snapshot): boolean,
})
```

示例：Gallery 页面离开时记录：

```text
gallery-128 距主视口顶部 84px
```

恢复时：

1. `prepare(snapshot, signal)` 加载包含 gallery-128 的分页数据，并把 signal 传给可取消请求；无法中止的旧请求也必须在提交数据前检查 signal。
2. 等待 Vue DOM 更新。
3. 找到 gallery-128。
4. 将其恢复到距视口顶部 84px。
5. 找不到时回退到绝对 top。

每个步骤前后都验证当前 generation。prepare 被 abort、路由重定向或组件卸载时返回，不执行 restore，也不把旧请求结果写回新页面。

Release 页面可以使用 release ID，Timeline 可以使用 timeline ID，News 可以使用 news ID。

## 12. 页面 ready 与布局稳定

### 12.1 页面主动报告

页面通过 `usePageScrollPage()` 获取本次导航 generation 下的 pending token：

```ts
const releasePending = markScrollContentPending('release-initial-data')

try {
  await loadInitialData()
  await nextTick()
} finally {
  releasePending()
}
```

每次 `markScrollContentPending(owner)` 返回唯一、幂等的 release 函数。协调器只有在当前 generation 的 token 全部释放后才进入 ready；任一组件释放自己的 token 都不能提前结束其他组件的等待。

推荐 ready 条件：

- 首屏必要接口完成；
- DOM 已 `nextTick`；
- 恢复目标对应的数据已存在；
- 关键占位高度已经确定。

### 12.2 通用稳定检测

公共层可以在 ready 后再等待连续两帧主滚动高度不变，但必须设置最大等待时间，例如 500～800ms。

不应等待所有第三方图片、iframe 或非首屏数据完成。

### 12.3 用户输入优先

恢复等待期间检测到主动输入后：

- 取消待恢复任务；
- 不再执行二次位置修正；
- 保留用户当前位置。

每次路由导航创建新的 generation 和 `AbortController`。旧 generation 的接口、nextTick、稳定检测或 observer 回调完成后不得修改新页面滚动位置。

需要区分两类任务：

- 路由历史恢复：等待期间检测到滚轮、触摸、键盘滚动或滚动条拖动后取消；
- 用户点击“加载下一页”触发的业务锚点补偿：同一次点击不是取消信号，只有用户随后产生新的独立滚动输入才取消。

## 13. 锚点滚动

所有页内锚点统一使用控制器：

```ts
scrollToAnchor(anchor, {
  behavior: 'smooth',
  history: 'push' | 'replace' | 'none',
  focus: true | false,
})
```

规则：

1. 自动识别主滚动目标。
2. 优先读取目标元素的 `scroll-margin-top`。
3. window 模式额外考虑固定 Header 高度。
4. `prefers-reduced-motion: reduce` 时将 smooth 降级为 auto。
5. URL hash 更新与滚动动作解耦，避免重复导航。
6. 对正文标题等可聚焦目标，在需要时同步焦点，但避免二次滚动。

## 14. 页面滚动锁定

### 14.1 锁定 token

控制器维护唯一锁定 token，而不是字符串 owner Set：

```ts
const releaseTrackModalLock = lockPageScroll('track-modal')
const releaseMenuLock = lockPageScroll('mobile-menu')

releaseTrackModalLock()
releaseMenuLock()
```

每次调用返回独立、幂等的 release 函数。同一 owner 连续锁定两次必须产生两个 token，只有全部 token 都释放后才恢复主页面滚动，避免重入或多个弹层同时存在时提前解锁。

### 14.2 锁定目标

- window 模式锁定 body/document，并保持当前位置。
- element 模式锁定 `[data-page-scroll-container]`。
- 记录并恢复原有 inline style，而不是统一清空。
- 解锁后恢复此前位置。
- window 模式需要补偿滚动条消失造成的页面宽度变化；
- 锁定期间跨越 `md` 断点时，先恢复旧 target 原样式，再把锁迁移到新 target；
- 路由卸载、组件异常销毁和应用卸载时强制释放归属于该作用域的遗留 token；
- release 可以重复调用，但只有第一次生效。

## 15. 嵌套滚动区域约定

建议使用显式数据属性：

```html
<div data-scroll-region="modal" data-scroll-contain>
<div data-scroll-region="menu" data-scroll-contain>
<div data-scroll-region="map" data-scroll-manual>
```

约定：

- `data-scroll-contain`：使用 `overscroll-behavior: contain`，防止滚到底后带动页面。
- `data-scroll-manual`：由业务组件自行处理手势，例如 Leaflet 地图。
- 页面滚动控制器不读取这些区域内部的 scrollTop。
- 弹窗打开时，根据交互需求决定是否同时锁定主页面。

## 16. CSS 约定

1. 页面外层横向裁剪优先使用 `overflow-x: clip`。
2. 避免仅为了横向裁剪使用 `overflow: hidden`，防止意外创建 sticky 滚动祖先。
3. 主滚动容器使用 `scrollbar-gutter: stable`。
4. 桌面主滚动容器使用 `overscroll-behavior-y: contain`。
5. 内部弹层使用 `overscroll-behavior: contain`。
6. 锚点元素使用统一 `scroll-margin-top`。
7. 图片必须提供 width/height、aspect-ratio 或稳定占位。
8. 不设置全站 `scroll-behavior: smooth`。
9. 程序化滚动按具体动作选择 `smooth` 或 `auto`。
10. 大面积 `backdrop-filter`、filter、固定背景和阴影必须经过滚动性能评估。

## 17. reduced-motion 与可访问性

检测：

```ts
window.matchMedia('(prefers-reduced-motion: reduce)')
```

启用 reduced-motion 时：

- 程序化 smooth 改为 auto；
- 不添加额外滚动过渡；
- 保留位置恢复；
- 保留滚动进度和导航状态；
- 保留浏览器键盘、触摸及辅助技术行为。

页面不能通过 `wheel.preventDefault()` 实现普通内容切换。需要章节型体验时，应优先使用真实文档滚动距离、sticky 和原生 scrollTop。

## 18. 业务组件迁移建议

### 18.1 TWUpToTop

改为直接消费：

```ts
const { state, scrollToTop } = usePageScroll()
```

组件不再自行监听断点和查询滚动容器。

### 18.2 usePageAnchorScroll

现有 API 可以暂时保留为兼容层，内部逐步委托给控制器。调用页面不需要一次性全部重写。

### 18.3 Timeline

使用 `subscribeScrollFrame()`，不自行绑定主滚动目标。

滚动时不应每帧测量所有 Timeline 项。后续应缓存项目中心点，在 resize、数据追加和展开状态变化时刷新缓存，并在滚动帧中通过二分或相邻查找确定 active item。

### 18.4 Pilgrimage

地图和详情面板保留业务内部滚动。区域固定、主视口高度和页面位置从控制器获取，避免只监听 window。

### 18.5 Release / Gallery / News

初期使用像素恢复，后续使用业务 ID + offset。分页数据 composable 应提供恢复目标所需的 `ensureItemLoaded(id)` 或等价能力。

## 19. 实施阶段

### 阶段一：基础控制器

- 新增滚动目标适配层。
- `createApp()` 为每个应用实例创建并 provide `PageScrollCoordinator`。
- 移除 `src/router/index.ts` 中多余的默认 Router/滚动协调器创建路径，Router 只接收当前 app 的 coordinator。
- `LayoutApp` 只注册和注销桌面 element target 与内容尺寸 wrapper。
- coordinator 自身负责断点监听和 target 重选；桌面 element 尚未 overflow 时仍选择 element。
- 建立单一 passive + rAF 监听，所有订阅返回幂等 unbind。
- 接入 window/visualViewport resize、scrollport/content ResizeObserver 和 `invalidateMetrics()`，异步内容变高后刷新 max。
- 实现 `dispose()` 并在测试 teardown/根应用卸载时验证监听器全部释放。
- 不改变任何页面可见行为。
- 本阶段不新增 `miletScrollEntryKey`、BrowserScrollHistoryManager、页面 ready 恢复或 Release observer；Vue Router 现有 `scrollBehavior` 及其浏览器默认副作用保持不变。

### 阶段二：公共操作迁移

- 回到顶部。
- 页内锚点统一改用 `router.push/replace`，移除业务层原生 `pushState`。
- 左侧菜单页内导航。
- 路由普通进入回顶部。
- 暂不启用历史快照；hash intent 必须保证一次导航只有一次滚动写入。

### 阶段三：路由历史恢复

- 保存内部容器位置。
- 区分正向导航和浏览器历史导航。
- 支持 top / restore / preserve / manual。
- 支持语言和 query 保持位置。
- entry-client 在 `createApp/createRouter` 前 acquire 根应用唯一的 BrowserScrollHistoryManager lease，teardown 最后释放。
- manager 用独立 `activeEntryKey` 保存离开 entry 身份，popstate 成功后才提交目标 key。
- 按 9.7 实现 beforeEach、scrollBehavior、afterEach、mounted barrier、abort/redirect generation 生命周期。
- 在上述 hook、barrier 和 history entry 测试完成前，不开始动态列表业务恢复。

### 阶段四：动态列表恢复

- Timeline 业务锚点。
- Gallery 相册锚点。
- News 条目锚点。
- Release 发布物锚点。

### 阶段五：嵌套滚动与锁定

- SideMenu。
- TrackModal。
- 文章浮层。
- Pilgrimage 详情面板。

### 阶段六：页面级增强

在治理层稳定后，页面可以增加 sticky、章节进度、滚动驱动视觉变化等体验，但必须继续使用原生主滚动目标，不得绕开控制器重复绑定全局事件。

## 20. 验收标准

### 20.1 基础滚动

- 桌面鼠标滚轮、触控板正常。
- 移动端触摸惯性正常。
- PageUp、PageDown、Home、End、方向键和 Space 正常。
- 页面不存在无意的双滚动条。

### 20.2 路由

- 正向进入普通页面回到顶部。
- 返回列表恢复原阅读位置。
- 前进后再次恢复。
- 同页面语言切换保持位置。
- hash URL 直接进入正确锚点。
- hash push/replace 后 Vue Router 的 back/current/forward/position 状态有效，返回与前进不产生重复滚动。
- 重复点击当前相同 hash 仍滚到锚点，但不新增 entry，也不遗留未消费 intent。
- SSR hydration 后不会先滚到错误位置再跳回。
- 初始导航 pending token 为 0 时仍等待 mounted barrier；重定向和取消导航不会执行过期 generation。
- history lease 在 `createRouter()` 前保存原始 scrollRestoration，最终 teardown 恢复原值；内嵌 app 不影响 lease。
- popstate 进入 guard 后离开快照仍写到旧 activeEntryKey；成功才切换 target key，取消/回滚保持旧 key。

### 20.3 动态内容

- 图片加载不会明显推移当前阅读位置。
- 列表追加数据保持已有内容位置。
- 动态列表返回时优先恢复到相同业务条目。
- 等待恢复期间用户主动滚动不会被系统覆盖。
- restorer prepare 被 abort 或组件卸载后不提交旧数据、不执行 restore。

### 20.4 嵌套区域

- 弹窗滚动时底层页面保持不动。
- 内部面板滚到底后不意外带动主页面。
- 地图滚轮缩放和拖动不被页面治理层拦截。
- 多弹层锁定不会提前解除。

### 20.5 精度与性能

- 静态页面恢复误差不超过 2～4px。
- 业务锚点恢复后，目标元素相对主视口的偏移基本一致。
- 主滚动目标只存在一个公共 scroll listener。
- 公共滚动状态每动画帧最多更新一次。
- 没有由治理层引入的持续 forced reflow。

## 21. 验证命令

涉及公开端滚动治理后至少运行：

```sh
npm run type-check
npm run build:ssr
npm run verify:ssr:local
```

并在桌面和移动端人工验证：

- 首页；
- Release；
- Timeline；
- Gallery；
- News；
- Pilgrimage；
- 文章详情；
- 周年页面；
- 含 TrackModal 的页面。

## 22. 决策结论

公开端应先完成全站原生滚动治理，再评估是否需要页面级虚拟平滑滚动。

治理完成后的预期结果是：浏览器原生滚动物理保持不变，但桌面和移动端的滚动目标、路由恢复、锚点、动态内容和嵌套滚动行为统一且可预测。页面级 sticky 或滚动叙事效果应作为治理层之上的独立增强，而不是替代治理层。

## 23. Release 页面滚动叙事布局

### 23.1 设计取舍

Release 卡片需要同时容纳封面、发布类型、发行日期、版本、曲目数量、版本切换、关联文章和曲目预览。桌面端当前卡片在宽屏时已经使用三列信息结构，因此不适合再把章节舞台长期放在左侧并压缩内容区，也不适合横向滚动旅程。

Release 页面采用以下折中：

- 保留单一原生纵向页面滚动；
- 每个发布物类型仍是一个连续章节；
- 固定的是紧凑的横向章节栏，而不是占据大面积的左侧舞台；
- 发布物卡片继续使用当前全宽信息结构；
- 下一页只由按钮触发，不跟随滚动自动加载；
- 用户可以不浏览完当前类型，通过明确按钮直接进入下个类型；
- 关键词搜索结果退出章节叙事模式，使用普通文档流列表。

该方案保留章节接管的方向感，但把主要宽度让给内容，避免滚动效果反向损害信息可读性。

### 23.2 普通档案浏览模式

页面结构保持：

1. Top 信息区域；
2. 筛选区域；
3. Album 章节；
4. EP / Single 章节；
5. Live 章节；
6. 页面结尾。

每个类型章节由五部分组成：

```text
[紧凑 sticky 章节栏]
[最多三条的 sticky 卡脊层]
[正常阅读的全宽 WorkCard 列表]
[本页最后一张保留卡片]
[分页与章节跳转操作区]
```

章节栏在本章节范围内使用 `position: sticky`。下一章节到达时，新章节栏自然把上一章节栏推出，不使用 `wheel.preventDefault()`、内部滚动容器或滚轮方向判断。

章节内部采用以下已确认的阅读过程：

```text
完整卡片阅读
  → 已读卡片折叠为顶部卡脊
  → 卡脊最多显示三条，较早内容合并为 +N
  → 当前已加载数据的最后一张卡片保持完整
  → 分页与下一类型操作出现在完整末卡之后
  → 章节结束时，章节栏、卡脊、末卡和操作区整体释放
```

章节栏只显示维持方向感所需的信息：

- 类型编号与类型名称；
- 已加载数量 / 总数；
- 当前页码；
- 当前类型的细进度；
- 下个类型名称和跳转入口。

章节栏不再放大封面、当前卡片摘要或重复卡片内容，避免产生第二套信息层级。

卡脊仅是已读状态的视觉摘要，不复制卡片交互。每条卡脊只显示封面缩略图、标题和年份；卡脊层整体 `aria-hidden="true"` 且不接收指针或键盘操作。

### 23.3 卡片布局

`WorkCard` 继续占据章节内容区的完整宽度，当前信息布局作为基础保留：

- 桌面宽屏：封面、作品元信息、曲目预览三列；
- 中等宽度：封面与元信息两列，曲目预览进入下一行；
- 移动端：单列卡片，次要详情按现有展开逻辑显示；
- Shelf 模式仍使用网格，不在网格内加入新的滚动接管。

章节增强只改变卡片外部的导航和滚动上下文，不修改卡片内部的信息密度和交互职责。

当前已加载内容的最后一张卡片不折叠为卡脊。它在完成正常阅读后停留在卡脊层与分页操作区之间，直到当前章节容器结束；进入下一类型时与整个章节一起释放。完整末卡只有在可用视口高度足够时启用 sticky 保留，小视口、展开态或卡片高度超过可用区域时自动退化为普通文档流，避免卡片底部无法阅读。

### 23.4 类型内分页

普通浏览模式使用显式的“加载下一页”按钮，不使用滚动到底自动请求。

推荐继续采用追加式分页：

- 点击后把下一页追加到当前列表末尾；
- 用户看到的分页操作业务锚点相对主视口位置不变；治理层可以调整实际 `scrollTop` 补偿插入到按钮之前的新内容高度；
- 按钮进入 loading 和 disabled 状态，防止重复提交；
- 成功后通过 `aria-live` 轻量提示新增数量；
- 失败时在原按钮区域重试；
- 已加载全部数据后按钮替换为完成状态。
- 下一页追加后，上一页末卡解除“末卡保留”身份，在用户继续向下浏览时可以折叠成卡脊；
- 新增数据中的最后一张卡片成为新的末卡保留对象；
- 卡脊始终只保留最近通过折叠线的三张卡片，较早数量通过 `+N` 汇总。

按钮文案应包含结果预期，例如：

```text
加载下一页 · 6–10 / 28
```

不推荐点击后用下一页替换当前卡片。替换式分页会改变章节高度并产生明显位置跳跃，也会让浏览器返回恢复和业务锚点恢复更复杂。

### 23.5 进入下个类型

每个章节底部与 sticky 章节栏都可以提供“进入下个类型”入口，但保持一个主入口和一个轻量快捷入口：

- 章节底部按钮是主要动作，和“加载下一页”并列；
- sticky 章节栏使用文本链接或紧凑按钮，不抢占内容；
- Album 指向 EP / Single；
- EP / Single 指向 Live；
- Live 指向页面结尾或回到章节索引；
- 点击后调用公共锚点滚动能力，目标使用章节 `anchorId`；
- 即使当前类型尚未全部加载，也允许跳过；
- 目标类型只需要首屏数据，不因跳转预加载全部发布物。

用户完成当前类型全部加载后，“进入下个类型”提升为主要视觉动作；尚有下一页时，“加载下一页”为主动作，跳转为次动作。

### 23.6 搜索结果模式

当存在已提交的关键词时，页面进入独立的搜索结果模式。年份和类型可以继续作为搜索条件，但只设置年份或类型筛选时仍可保留普通档案章节模式。

搜索结果模式必须停用 Release 专属的章节滚动效果：

- 不使用 sticky 类型接管；
- 不显示章节进度和下个类型按钮；
- 不按 Album、EP / Single、Live 强制制造三段滚动距离；
- 结果仍使用 Album、EP / Single、Live 三个普通分组，以匹配现有三个独立类型接口；
- 每个分组内部使用接口已有排序，客户端不承诺跨类型全局排序；
- 每个分组维护自己的 `currentPage`、`hasMore`、loading、error 和“加载下一页结果”按钮；
- 选择单一类型时只显示对应结果分组；选择全部类型时显示最多三个普通分组；
- 提供“清除搜索，返回档案浏览”的稳定返回路径；
- 无结果时显示修改关键词、年份或类型的建议，不保留空章节。

这样可以避免用户执行目标明确的查找任务时，还被迫经历叙事式章节导航，同时不在客户端错误合并三套仅加载部分页的数据。首期不新增跨类型统一搜索 API；如果未来确实需要混合排序和单一分页，必须先在 Worker 增加统一搜索接口，再同步更新公开端代理白名单和页面数据模型。

### 23.7 动效和无障碍

- sticky 章节栏交接只使用位置变化和 150～300ms 的轻量颜色过渡；
- 卡片折叠只对轻量卡脊代理执行 `transform` 和 `opacity`，不缩放或复制完整 `WorkCard`；
- 完整卡片继续处于普通文档流，折叠后由摘要卡脊表达已读状态；
- `prefers-reduced-motion: reduce` 下禁用折叠插值、缩放和章节颜色插值，直接切换卡脊摘要与原生定位；
- sticky 偏移必须包含全站导航高度，并通过 `scroll-margin-top` 防止锚点标题被遮挡；
- 键盘、触摸和滚轮都使用同一个原生主滚动目标；
- “加载下一页”和“进入下个类型”使用原生按钮或链接，命中区域至少 44px；
- 加载状态、完成状态和新增结果数量通过文本与语义状态表达，不只依赖颜色。

### 23.8 状态模型

Release 页面建议明确区分两种显示模式：

```ts
type ReleaseDisplayMode = 'archive' | 'search'
```

其中：

- `archive`：三类章节、sticky 章节栏、类型内追加分页、下个类型跳转；
- `search`：按类型分组的普通结果流、各组独立分页、清除搜索返回入口。

模式由已提交条件决定，不由输入框中的临时文本决定，避免用户输入过程中页面结构突然切换。

### 23.9 实施边界

该布局属于页面级增强，必须建立在公共滚动治理之上：

- 章节激活状态使用 `IntersectionObserver` 或公共滚动状态派生；
- 不新增第二个页面级 scroll listener；
- 不创建具有纵向滚动条的卡片外层；
- 不拦截 `wheel`、touchmove、PageDown 或 Space；
- 分页追加后由现有恢复策略保持业务锚点；
- 搜索模式切换属于页面内容状态变化，不改变公共主滚动目标。

## 24. Release 卡脊滚动改造实施方案

### 24.1 实施目标

本次改造只作用于 Release 页面的普通档案浏览模式，并满足以下不可破坏条件：

- 页面继续使用公开端唯一的原生主滚动目标；
- `WorkCard` 的完整信息和内部交互保持不变；
- Album、EP / Single、Live 三个类型独立管理自己的卡脊状态；
- 类型内数据仍按现有接口每页 5 条追加；
- 任何关键词搜索结果都不启用卡脊效果；
- Shelf 模式不启用逐卡片折叠；
- 不拦截 `wheel`、touchmove、键盘滚动或浏览器历史恢复；
- CSR 首次挂载状态保持确定，客户端增强失败时退化为现有列表。

### 24.2 最终交互状态机

每个 `ReleaseSection` 独立运行以下状态：

```ts
type ReleaseSectionScrollPhase =
  | 'idle'
  | 'reading'
  | 'stacking'
  | 'terminal'
  | 'loading'
  | 'releasing'
```

状态含义：

- `idle`：章节尚未进入有效观察范围；
- `reading`：当前卡片正常占据完整宽度阅读；
- `stacking`：一张或多张已读卡片已经通过折叠线，顶部显示卡脊；
- `terminal`：当前已加载数据的最后一张卡片完整保留，分页操作区可见；
- `loading`：用户点击加载下一页，保留当前滚动锚点并等待追加；
- `releasing`：章节底部到达释放线，本章节 sticky 内容随容器退出，由下一类型接管。

状态不需要持久化到全局 store。刷新、浏览器返回或锚点恢复后，由当前 DOM 位置、已加载 work ID 和观察器重新派生。

### 24.3 组件职责

#### `ReleasesPage.vue`

继续承担页面级协调，不直接计算卡片折叠位置：

- 根据 `appliedKeyword` 计算 `displayMode: 'archive' | 'search'`；
- 只在 `displayMode === 'archive' && viewMode === 'list'` 时启用卡脊增强；
- 把 `currentPage`、下一章节 `anchorId`、是否启用增强传给各 `ReleaseSection`；
- 继续通过现有 `scrollToPageAnchor()` 处理“进入下个类型”；
- 搜索模式继续使用 albumsData、epsSinglesData、livesData 三套数据源，按类型渲染普通结果分组，不挂载卡脊观察器；
- 全类型搜索不能把三套部分分页结果客户端合并为统一排序列表。

建议页面派生值：

```ts
const displayMode = computed<ReleaseDisplayMode>(() =>
  appliedKeyword.value ? 'search' : 'archive',
)

const stackEnhancementEnabled = computed(
  () => displayMode.value === 'archive' && viewMode.value === 'list',
)
```

#### `ReleaseSection.vue`

作为单个发布类型的滚动边界：

- 持有章节根元素 `sectionRef`；
- 渲染 sticky 章节栏；
- 挂载轻量 `ReleaseSpineDeck`；
- 把卡片观察属性传给 `WorkStack`；
- 渲染分页与下一类型操作区；
- 通过 composable 获取 `visibleSpineWorks`、`hiddenSpineCount`、`terminalWorkId` 和 `phase`；
- 当章节根元素结束时，让 sticky 内容自然释放，不执行脚本滚动补偿。

需要新增或扩展的 props：

```ts
interface ReleaseSectionProps {
  currentPage: number
  stackEnabled: boolean
  nextSectionId?: string
  nextSectionLabel?: string
}
```

需要新增事件：

```ts
(event: 'enterNextSection', anchorId: string): void
```

#### `WorkStack.vue`

继续负责 `WorkCard` 列表和展开状态，但为观察器提供稳定 DOM 标记：

```html
<div
  data-release-card
  :data-release-id="work.id"
  :data-release-terminal="work.id === terminalWorkId ? 'true' : undefined"
>
  <WorkCard ... />
  <span
    data-release-fold-sentinel
    :data-release-terminal-read-sentinel="work.id === terminalWorkId ? 'true' : undefined"
    aria-hidden="true"
  ></span>
</div>
```

具体要求：

- 列表模式下每张卡片有一个真实 wrapper；
- fold sentinel 位于卡片内容之后，高度为 1px；当前末卡在同一节点增加 terminal-read 标记；
- Shelf 模式可以保留 wrapper，但不注册折叠观察器；
- 卡片 key 继续使用 `work.id`，分页追加时不重建已有卡片；
- 当前获得焦点或处于展开状态的卡片暂不折叠；
- `WorkStack` 增加 `terminalWorkId?: string | null` prop；
- `WorkStack` 在展开项变化时 emit `expanded-change(workId: string | null)`，让 `ReleaseSection` 可以把展开状态传给卡脊 composable；
- WorkStack 卸载或 works 变化导致展开项消失时同样 emit `expanded-change(null)`。

#### 新增 `ReleaseSpineDeck.vue`

只负责展示摘要卡脊，不读取 DOM、不监听滚动：

```ts
interface ReleaseSpineDeckProps {
  works: Work[]
  hiddenCount: number
  maxVisible?: number
}
```

渲染规则：

- 最多创建三个卡脊 DOM；
- 显示最近通过折叠线的三个 work；
- 较早内容显示为 `+N 条已收起`；
- 每条只显示封面缩略图、标题、年份；
- 整个组件 `aria-hidden="true"`、`pointer-events: none`；
- 不复制版本按钮、曲目、关联文章或 TrackModal；
- 卡脊不是导航入口，避免和原始卡片产生重复焦点。

#### 新增 `useReleaseCardStack.ts`

负责浏览器端观察和派生状态，建议 API：

```ts
interface UseReleaseCardStackOptions {
  sectionRef: Ref<HTMLElement | null>
  works: Ref<Work[]>
  enabled: Ref<boolean>
  expandedWorkId: Ref<string | null>
  pageScrollLocked: Readonly<Ref<boolean>>
  maxVisibleSpines: Ref<number>
  getScrollRoot: () => HTMLElement | null
}

interface UseReleaseCardStackResult {
  phase: Readonly<Ref<ReleaseSectionScrollPhase>>
  passedWorkIds: Readonly<Ref<string[]>>
  visibleSpineWorks: ComputedRef<Work[]>
  hiddenSpineCount: ComputedRef<number>
  terminalWorkId: ComputedRef<string | null>
  pinnedTerminalWorkId: Readonly<Ref<string | null>>
  terminalPinEligible: Readonly<Ref<boolean>>
  resync: () => Promise<void>
  disconnect: () => void
}
```

该 composable 只能在 `onMounted` 后访问 `window`、DOM、`IntersectionObserver` 和 `ResizeObserver`。

TrackModal 不通过层层组件事件把 modal 状态传到 ReleaseSection。`TrackModal.vue` 直接使用应用级协调器：

```ts
watch(
  () => props.open,
  (open) => {
    if (open) releasePageLock = lockPageScroll('track-modal')
    else releasePageLock?.()
  },
)
```

关闭、异常卸载时都释放 token。`useReleaseCardStack` 读取协调器的 `pageScrollLocked`；锁定期间暂停状态派生，解锁后执行一次 `resync()`。这样 TrackModal 同时完成底层页面锁定和卡脊冻结，不需要复制一套 modal 状态协议。

### 24.4 卡片折叠判定

不新增第二个全局 `scroll` listener。每张卡片后放置一个 1px fold sentinel；`IntersectionObserver` 用于低频唤醒、目标进入/离开提示，公共协调器的 `subscribeScrollFrame()` 用于滚动帧边界校正。1px 观察带不能单独承担正确性：快速滚动可能让 sentinel 从观察带下方直接跳到上方，全程 `isIntersecting === false`，浏览器不保证产生可用 callback。

折叠线采用“root 顶边 + root 内部遮挡”的统一坐标，但 window 和 element 的内部遮挡不同：

```text
window target：全站 sticky 导航高度 + Release 章节栏高度 + 8～12px 安全间距
element target：Release 章节栏高度 + 8～12px 安全间距
```

桌面 `LayoutApp` 的 element scrollport 已经位于全站 Header 下方，不能再把全站 Header 高度加一次。

推荐将折叠偏移统一为 CSS 变量：

```css
--release-global-sticky-offset: var(--app-sticky-offset, 4rem);
--release-chapter-bar-height: 4.5rem;
--release-fold-gap: 0.75rem;
--release-window-fold-offset: calc(
  var(--release-global-sticky-offset)
  + var(--release-chapter-bar-height)
  + var(--release-fold-gap)
);
--release-element-fold-offset: calc(
  var(--release-chapter-bar-height)
  + var(--release-fold-gap)
);

[data-page-scroll-target='window'] {
  --release-fold-line: var(--release-window-fold-offset);
}

[data-page-scroll-target='element'] {
  --release-fold-line: var(--release-element-fold-offset);
}
```

Release 页面通过协调器公开的 `state.targetKind` 响应式绑定根节点 `data-page-scroll-target`；协调器不得查询或修改 Release 业务 DOM。CSS sticky top 与脚本的 `rootRelativeOffset` 必须来自同一组变量/测量结果。

#### observer root 与 line 配置

必须同时支持 element 和 window 两种主滚动目标：

```ts
const observerRoot = target.kind === 'element' ? target.target : null
```

根据 target 选择 root-relative offset，再按实际 root viewport 高度把 IntersectionObserver 的有效 root 压缩成折叠线附近 1px 的提示带：

```ts
const rootRelativeOffset = target.kind === 'element'
  ? elementFoldOffset
  : windowFoldOffset
const topShrink = rootRelativeOffset
const bottomShrink = Math.max(0, rootViewportHeight - rootRelativeOffset - 1)
const rootMargin = `-${topShrink}px 0px -${bottomShrink}px 0px`
```

`foldLineViewportTop` 必须区分 IO callback 与共享 scroll frame 两个来源。`entry.rootBounds` 已经应用 `rootMargin`，其 top 就是收缩后 1px 观察带的顶边，不能再次叠加 offset：

```ts
const foldLineFromIntersectionEntry = entry.rootBounds?.top
  ?? (pageScrollState.viewportTop + rootRelativeOffset)

const foldLineFromSharedScrollFrame =
  pageScrollState.viewportTop + rootRelativeOffset
```

IO callback 只使用 `foldLineFromIntersectionEntry`；共享滚动帧、resync 和非 IO 几何测量统一使用 `foldLineFromSharedScrollFrame`。禁止把经过负 rootMargin 修正的 `rootBounds.top` 再加 `rootRelativeOffset`。

observer callback 不能只读取 `isIntersecting`。每次 entry 到达观察带时必须比较：

```ts
const hasPassed =
  entry.boundingClientRect.top <= foldLineFromIntersectionEntry
```

#### 状态规则

1. sentinel 从折叠线下方向上穿过：更新连续的几何已通过边界；
2. 用户向上滚动，sentinel 回到折叠线下方：回退几何边界；
3. `passedWorkIds` 从几何已通过区间派生，当前 `terminalWorkId` 永远被过滤；
4. 卡片内部存在键盘焦点或卡片处于展开状态时，只从可见 passed 中过滤该卡，几何扫描继续越过它；blur / collapse 后重新派生；
5. observer 回调只更新几何边界提示，不读取或修改卡片内部状态；
6. 页面恢复滚动位置后调用一次 `resync()`，确保卡脊状态和恢复位置一致；
7. 快速滚动跨过多张卡片时，不依赖 callback 到达顺序，更新后按照 WorkStack DOM 顺序重新排序 `passedWorkIds`；
8. 当前 terminal 的 fold sentinel 保留在 DOM 中但不进入 passed；分页成功后它失去 terminal 身份，可以直接成为普通折叠边界，无需补建旧卡片 DOM。

`rootMargin` 依赖实际主滚动根和 sticky 高度。导航高度、响应式断点或语言内容导致章节栏高度变化时，由 `ResizeObserver` 重新创建卡片 observer，不在 scroll 回调中测量布局。

#### 共享滚动帧校正

`useReleaseCardStack` 通过协调器订阅共享滚动帧，不直接 `addEventListener('scroll')`。内部维护连续的几何边界 `geometricPassedIndex`，UI 的 `passedWorkIds` 再从几何已通过集合中过滤 terminal、expanded 和含焦点卡片。这样受保护卡片不会卡住后续扫描：

1. 向下时，从 `geometricPassedIndex + 1` 的 sentinel 开始；只要其 `rect.top <= foldLineFromSharedScrollFrame` 就推进几何边界，并继续检查下一条，直到遇到仍在线下的 sentinel；
2. 向上时，从几何边界 sentinel 开始；只要其 `rect.top > foldLineFromSharedScrollFrame` 就回退边界，并继续检查前一条，直到边界稳定；
3. 因此一次大幅跳跃可以在同一帧补齐多张卡片，但稳定滚动通常只测量 1～2 个边界节点；
4. 每次边界变化后，从几何已通过 ID 中过滤当前 terminal、expanded、包含 `document.activeElement` 的卡片，生成可见 passed；过滤不改变几何边界，因此后面的卡片仍能继续折叠；
5. protected 状态解除时重新派生并 `resync()`，符合位置的卡片可以进入卡脊；
6. `scrollend` 可用时再执行一次 `resync()`；不可用时由最后一次共享 rAF 校正承担收尾；
7. ResizeObserver 只使几何缓存失效并调度一次 resync，不在其 callback 中同步反复写样式。

#### `resync()` 算法

`resync()` 必须同步重算，而不是等待 observer 逐条重新触发：

1. 查询当前 section 内所有 `[data-release-fold-sentinel]`；
2. 按 DOM 顺序读取对应 release ID；
3. 读取每个 sentinel 的 `getBoundingClientRect().top`；
4. `top <= pageScrollState.viewportTop + rootRelativeOffset` 的连续前缀视为几何已通过，并更新 `geometricPassedIndex`；
5. 从该前缀排除 terminal、expanded、包含 `document.activeElement` 的卡片；
6. 一次性替换派生的 `passedWorkIds`；
7. observer 重建、分页追加、路由恢复、目标切换、`scrollend` 和 TrackModal 解锁后都调用该算法；
8. 首次恢复和 resync 使用无动画标记，不能补播已经发生的折叠过程。

如果 `IntersectionObserver` 不可用，首轮实现直接停用卡脊增强，保留普通列表；不得为 Release 单独增加 scroll listener 作为补丁。共享滚动帧校正是启用增强后的必要组成，不是 IO 缺失时才临时开启的 fallback。

### 24.5 卡脊上限和紧凑间距

宽度上限：

```ts
const RELEASE_SPINE_MAX_DESKTOP = 3
const RELEASE_SPINE_MAX_TABLET = 2
const RELEASE_SPINE_MAX_MOBILE = 2
const RELEASE_SPINE_MAX_LOW_HEIGHT = 1
```

最终上限不能只按 viewport 宽度决定，还必须考虑高度。建议取宽度策略和高度策略的较小值：

```ts
const maxVisibleSpines = computed(() =>
  Math.min(maxByViewportWidth.value, maxByViewportHeight.value),
)
```

高度策略建议：

```text
主滚动视口高度 >= 800px：最多 3 条
主滚动视口高度 640～799px：最多 2 条
主滚动视口高度 < 640px：最多 1 条，关闭完整末卡 sticky
移动端横屏：最多 1 条，关闭完整末卡 sticky
```

宽度 × 高度决策表：

| 主视口宽度 | 宽度上限 | 高度 >= 800px | 高度 640～799px | 高度 < 640px / 横屏 |
|---|---:|---:|---:|---:|
| `< 640px` | 2 | 2 | 2 | 1 |
| `640～1023px` | 2 | 2 | 2 | 1 |
| `>= 1024px` | 3 | 3 | 2 | 1 |

最终使用 `Math.min(宽度上限, 高度上限)`。terminal sticky 还需要单独通过 24.6 的卡片高度资格，不能只根据该表启用。

桌面视觉参数建议：

```css
--release-spine-height: 2.25rem;
--release-spine-step: 0.75rem;
--release-spine-max-visible: 3;
```

三条卡脊的占用高度约为：

```text
2.25rem + 2 × 0.75rem = 3.75rem
```

再加一行 `+N` 汇总，卡脊区域应控制在约 64～76px 内。移动端竖屏最多显示两条，低高度视口和横屏最多显示一条，step 缩小到 0.5rem，避免压缩完整卡片的有效阅读空间。

派生逻辑：

```ts
const visibleSpineWorks = computed(() => {
  const passed = works.value.filter((work) => passedWorkIds.value.includes(work.id))
  return passed.slice(-maxVisibleSpines.value)
})

const hiddenSpineCount = computed(
  () => Math.max(0, passedWorkIds.value.length - visibleSpineWorks.value.length),
)
```

卡脊显示最近通过的卡片，较早的卡片只进入数量汇总，不继续增加 DOM、高度或视觉层级。

### 24.6 最后一张完整卡片保留

`terminalWorkId` 默认取当前已加载数组的最后一个 work：

```ts
const terminalWorkId = computed(() => works.value.at(-1)?.id ?? null)
```

`terminalWorkId` 表示数据身份；`pinnedTerminalWorkId` 表示已经通过 terminal read line、当前实际 sticky 的 UI 状态。两者必须分离：分页事务可以在 works 提交前同步清空 pinned，而新 terminal 不会仅因成为数组末项就自动固定。

但“保留”必须在卡片完整阅读后生效，不能让长卡片刚进入视口就固定。terminal wrapper 内在 WorkCard 之后放置独立的 `[data-release-terminal-read-sentinel]`；它与普通 fold sentinel 可以位于同一物理位置，但语义和判定线不同。

terminal 阅读完成线定义为：

```ts
const terminalReadLineViewportTop =
  pageScrollState.viewportTop
  + pageScrollState.viewportHeight
  - paginationActionMinHeight
  - terminalGap
```

这条线位于主 scrollport 底部上方，为分页操作区保留最小可见高度。进入/退出规则：

1. 末卡首先按普通文档流完整滚动；
2. 向下滚动且 terminal read sentinel 从线下到达 `rect.top <= terminalReadLineViewportTop` 时，如果高度条件满足，为 wrapper 增加 `data-terminal-pinned="true"`；
3. 用户反向滚动使 sentinel 回到 `rect.top > terminalReadLineViewportTop` 时立即解除 pinned，恢复普通文档流；
4. pinned wrapper 使用 sticky，停留在卡脊和分页操作区之间；
5. ReleaseSection 底部是 sticky containing block 的结束边界；section 进入 releasing 后不再脚本维持 pinned；
6. 分页成功时旧 terminal 在同一无动画事务中先解除 pinned，再改为普通卡；新 terminal 必须重新经过自己的 read sentinel，不能因数组末项变化而自动固定；
7. 搜索/视图切换、section 禁用、事务 abort 或组件卸载时清除 pinned 状态；
8. 下一类型到达时，末卡与卡脊一起被父章节自然推出。

建议 sticky top：

```css
[data-release-terminal][data-terminal-pinned='true'] {
  position: sticky;
  top: calc(var(--release-fold-line) + var(--release-spine-reserved-height));
  z-index: 10;
}
```

末卡固定资格必须通过 `ResizeObserver` 判断：

```text
卡片实际高度
+ fold line
+ 卡脊最大占用高度
+ 分页操作区最小可见高度
+ 24px 安全间距
<= 主滚动视口高度
```

不满足时：

- `terminalPinEligible = false`；
- 末卡保持普通文档流；
- 分页操作仍紧跟在末卡之后；
- 卡脊效果继续生效；
- 不为强行还原效果创建内部滚动条。

卡片展开曲目、切换版本或关联内容改变高度时立即重新计算资格。若固定中的卡片变得过高，应先保持当前视觉锚点，再解除 sticky，避免瞬间跳动。

### 24.7 分页追加后的续接

当前 `useReleaseData` 已提供：

- 固定 `pageSize = 5`；
- `currentPage`；
- `hasMore`；
- `loadMore()`；
- 追加式 `data.value = [...data.value, ...newData]`。

无需修改 API 请求路径，但必须把 composable 改为“准备 + 同步提交”两阶段契约。当前 `loadMore()` 会先追加 `data.value` 再返回，调用方无法保证旧 terminal 在数据变化前解除 pinned，因此不能继续作为增强模式的提交入口。

```ts
interface PreparedReleasePage {
  transactionId: string
  basePage: number
  nextPage: number
  items: Work[]
  total: number
}

type PrepareNextPageResult =
  | { status: 'success'; batch: PreparedReleasePage }
  | { status: 'aborted' }
  | { status: 'error'; error: unknown }

type CommitNextPageResult =
  | { status: 'committed'; addedCount: number }
  | { status: 'metadata-only'; hasMore: false }
  | { status: 'rejected'; reason: 'stale' | 'duplicate' | 'invalid-empty' }

prepareNextPage(options: {
  signal: AbortSignal
  transactionId: string
}): Promise<PrepareNextPageResult>

commitNextPage(
  batch: PreparedReleasePage,
  options: { beforeDataMutation: () => void },
): CommitNextPageResult
```

`prepareNextPage()` 只请求和校验数据，不修改 `data/currentPage/hasMore`。`commitNextPage()` 在内部先校验 transactionId、`basePage === currentPage` 且 batch 尚未提交；过期或重复 batch 直接返回 rejected，绝不调用 `beforeDataMutation`。

有效且包含 items 的 batch 在同一个同步调用栈中按“校验 → `beforeDataMutation()` → 追加 data → 更新 currentPage/hasMore → 标记 batch 已消费”执行。回调只允许做同步、no-throw 的 UI 状态切换（清空 pinned、开启无动画标记），中间不得出现 await。这样被拒绝的 commit 不会错误解除旧末卡。

空 batch 分两类处理：如果 `batch.total <= data.value.length`，允许 metadata-only commit，仅把 `hasMore` 更新为 false 并标记 batch 已消费，不调用回调、不改变 works/terminal/pinned；如果 `batch.total > data.value.length`，返回 `invalid-empty`，保留 hasMore 并进入 retry。

如果底层请求暂时不能接收 signal，仍需在请求返回后检查 signal 和 transactionId。不能只依赖 `error` ref，因为旧错误、重试和并发 section 会使它无法唯一表示本次操作结果。

分页追加以“用户看到的分页操作业务锚点相对视口位置不变”为正确性目标。允许治理层调整实际 `scrollTop`；不能同时要求真实 scrollTop 保持数值不变。

成功分支的原子顺序：

1. 用户点击“加载下一页”；
2. 记录分页操作区业务 anchor ID 和相对主视口 offset；
3. `ReleaseSection` 进入 `loading`，保持操作区最小高度不变；
4. 暂停当前 section 的卡脊 observer 状态提交和折叠过渡；
5. 调用 `prepareNextPage({ signal, transactionId })`；等待期间 works 和 terminal 均不变化；
6. prepare success 后直接调用 `commitNextPage(batch, { beforeDataMutation })`；调用方不得在 commit 校验前自行清除 pinned；
7. commit 内部校验通过且确实要追加 items 时，`beforeDataMutation` 同步清空 `pinnedTerminalWorkId` 并开启无动画标记，随后立即追加 data；此时 works 和 `terminalWorkId = works.at(-1)` 一起更新；
8. commit 返回 `committed` 后等待 `nextTick()`，WorkStack 旧 wrapper 失去 terminal 身份，新数组末项获得 terminal 身份，但新末卡保持未 pinned；
9. commit 返回 `metadata-only` 时直接把操作区切换为 complete，不执行 terminal、anchor 补偿或 observer 重建；返回 rejected 时按失败/取消规则处理；
10. 等待新增卡片和操作区尺寸稳定一帧；
11. 公共滚动治理层在仍允许补偿时调整实际 scrollTop，使业务 anchor 相对主视口 offset 保持不变；
12. 重建或补充新增 sentinel observer；
13. 调用 `useReleaseCardStack.resync()` 一次性重算通过状态；
14. 恢复 observer 状态提交，关闭本次无动画标记；
15. 通过 `aria-live` 报告 committed 返回的新增数量；metadata-only 报告已经加载全部内容；
16. 用户继续滚动时，旧末卡自然折叠，新页面内容依次阅读；新末卡只有越过自己的 terminal read line 后才能 pinned；
17. 卡脊仍只显示最近允许数量，其他内容进入 `+N`。

分页期间不得提前把所有新增卡片添加到卡脊，也不得把页面滚动到新增内容第一条。用户点击后当前视觉位置保持稳定，再由用户决定继续向下滚动。

#### 失败、取消与卸载

每次分页创建独立 `ReleasePaginationTransaction` 和 `AbortController`。所有临时状态必须在 `finally` 中恢复：observer 状态提交、折叠过渡、loading/无动画标记以及临时 anchor 订阅不能依赖成功分支清理。

- prepare `error`：因为尚未 commit，works、terminalWorkId、pinned 状态和滚动位置保持原值；操作区原位显示错误和重试；恢复 observer 后执行一次边界校正；
- `aborted`：不显示错误，不提交 terminal 变化；恢复 observer 并按当前 DOM `resync()`；
- commit `stale/duplicate`：按 aborted 处理，且 pinned 必须保持 commit 调用前的原值；
- commit `invalid-empty`：按 error-like retry 处理，保留 hasMore、works、terminal 与 pinned；
- 用户滚动取消 anchor compensation：仅取消第 11 步的位置补偿，不回滚已经 commit 的追加数据；仍执行 terminal 身份更新、observer 重建和 resync；
- 组件卸载、关键词搜索启用、archive/search 切换、list/Shelf 切换、section/类型切换或新分页覆盖旧分页：abort 当前事务；旧 prepare promise 完成后不得 commit；
- 有效空末页：只提交 `hasMore = false` 并进入 complete，不切换 terminal 或 pinned；
- `finally` 恢复完成后，再根据仍然有效的 transaction 决定 `phase` 是 reading、stacking、terminal 还是 releasing。

锚点补偿取消规则必须可判定：事务开始后如果公共协调器检测到 wheel、touchmove、pointerdown、PageUp/PageDown、Home/End、Space 或方向键输入，就把 `anchorCompensationAllowed` 设为 false；数据仍可正常追加，系统不再与用户争夺滚动位置。

建议把 `pageSize` 从 composable 内部常量一并返回，或者根据 `works.length` 和 `total` 计算按钮范围，文案保持：

```text
加载下一页 · 6–10 / 28
加载下一页 · 11–15 / 28
```

### 24.8 章节整体释放

不编写“释放动画控制器”。释放由 CSS sticky 的包含块边界自然完成：

- `ReleaseSection` 是章节 containing block；
- 章节栏、卡脊和 terminal card 的 sticky 都不能逃出 section；
- 分页与“进入下个类型”操作位于 section 尾部；
- section 尾部预留 24～48px 呼吸距离；
- 下一章节 header 到达 fold line 时，把上一章节内容自然推出；
- 章节 accent 颜色只在激活章节变化时进行 150～300ms 过渡。

点击“进入下个类型”时：

```ts
emit('enterNextSection', nextSectionId)
```

页面继续调用现有：

```ts
scrollToPageAnchor(nextSectionId)
```

该路径不要求当前类型全部加载，也不改变当前类型分页数据。

### 24.9 搜索和筛选模式

关键词已经提交时：

- 不挂载 `useReleaseCardStack` observer；
- `ReleaseSpineDeck` 不渲染；
- 所有 `data-release-terminal` 和 sticky terminal 样式停用；
- 结果按 Album、EP / Single、Live 分组使用普通 WorkCard 文档流；
- 每个可见分组使用自己的“加载下一页结果”按钮、loading、error 和 complete 状态；
- 不把三套部分分页数据合并成单一排序结果；
- 不显示“进入下个类型”；
- 清除关键词后重新进入 archive 模式，再在 `nextTick()` 后初始化观察器。

只选择年份或单一类型、没有关键词时，可以继续使用 archive 模式。若仅显示一个类型，则最后一个章节的“进入下个类型”替换为“返回类型索引”或不显示。

Shelf 模式同样停用卡脊和 terminal sticky。切回 list 模式后重新派生状态，不复用 Shelf 模式下的像素位置作为卡片通过状态。

### 24.10 CSR 首次挂载与未来 SSR 边界

Release 当前路由 `renderMode` 为 `csr`，服务端不会输出 Release 普通列表，因此本阶段需要保证的是 CSR 首次挂载状态确定：

- `passedWorkIds = []`；
- `visibleSpineWorks = []`；
- `terminalPinEligible = false`；
- 初次数据完成和 DOM 挂载前不解析 viewport 或 sticky eligibility；
- 首次 observer `resync()` 只设置最终状态，不播放历史折叠动画。

CSR `onMounted` 后按顺序执行：

1. 解析公共主滚动 root；
2. 等待当前 works DOM 完成；
3. 测量 sticky offset 和末卡高度；
4. 初始化 card sentinel observer；
5. 初始化 section release observer；
6. 如果存在路由恢复任务，先完成数据准备和滚动恢复；
7. 最后执行 `resync()` 显示正确卡脊。

不要在 setup 阶段直接访问 `window`、`document`、DOM 尺寸或观察器。

如果未来把 Release 改成 SSR/SSG，必须另行增加服务端数据预取、可序列化初始状态以及 `render.config.json` 配置；届时服务端和 hydration 才需要统一渲染同一普通列表结构。不能只修改本节文字就宣称 Release 支持 SSR。

### 24.11 焦点、无障碍和 reduced motion

- 卡脊是 `aria-hidden` 的视觉代理，不包含可点击元素；
- 原始 WorkCard 永远保留在 DOM，屏幕阅读器顺序不变；
- 如果焦点位于某张 WorkCard 内，该卡片不得切换为视觉折叠态；
- 末卡从 sticky 退化为普通文档流时不移动键盘焦点；
- 分页按钮 loading 时使用 `disabled` 和 `aria-busy`；
- 新增结果数量使用独立 `aria-live="polite"` 文本；
- “进入下个类型”按钮的 accessible name 包含目标类型；
- `prefers-reduced-motion: reduce` 时移除卡脊 translate/scale 动画，只进行即时状态切换；
- 浏览器缩放 200% 或字体放大导致卡片过高时，terminal sticky 自动失效；
- 页面使用键盘 Home、End、PageUp、PageDown、Space 时不改变原生行为。

### 24.12 性能约束

- 一个 ReleaseSection 使用一个卡片 observer 和一个 ResizeObserver；
- 三个章节可以共享公共主滚动 root，但不各自绑定 scroll listener；
- 卡脊最多渲染三个摘要节点，不克隆完整 WorkCard；
- observer callback 只维护 work ID，不读取大量样式；
- DOM 测量集中在初始化、分页追加、断点变化和卡片高度变化时；
- 动效只修改 `transform`、`opacity` 和 CSS 变量；
- 图片继续使用 lazy loading，卡脊缩略图复用已有 cover URL 但请求适合的小尺寸；
- 组件卸载、切换 search/Shelf 模式或切换语言时必须 disconnect observers；
- 不使用持续 RAF 模拟平滑滚动。

### 24.13 响应式策略

#### 桌面宽屏

- WorkCard 保持现有三列信息结构；
- 最大三条卡脊；
- terminal sticky 在高度资格满足时启用；
- 章节栏显示类型、数量、页码和下个类型快捷入口。

#### 平板和中等宽度

- WorkCard 保持现有两列加曲目下一行；
- 最大两条卡脊，卡脊只显示封面、标题和年份；
- terminal sticky 根据实际高度动态判断；
- 不设置固定卡片高度。

#### 移动端

- 常规竖屏最大两条卡脊，低高度或横屏最大一条，较早项目全部进入 `+N`；
- 卡脊 step 缩小到 0.5rem；
- 默认关闭完整 terminal sticky，仅保证末卡与分页操作相邻；
- 页面仍显示紧凑 sticky 章节栏；
- 不创建卡片内部纵向滚动区；
- 375px 宽度、横屏和大字体必须单独验证。

### 24.14 预计文件改动

正式实施时预计只修改公开端：

```text
src/views/milet/ReleasesPage.vue
src/components/milet/music/ReleaseSection.vue
src/components/milet/music/WorkStack.vue
src/composables/useReleaseData.ts
src/composables/lang/ReleaseMetaData.ts
```

建议新增：

```text
src/components/milet/music/ReleaseSpineDeck.vue
src/composables/useReleaseCardStack.ts
```

同时需要把以下现有文件纳入改造范围：

```text
src/components/milet/music/TrackModal.vue
```

`TrackModal.vue` 接入应用级滚动锁 token；`WorkStack.vue` 暴露 expanded 状态。当前方案不要求 `WorkCard.vue` 把 modal 状态逐级上传，但如果实际实现不采用协调器锁状态方案，则必须同步把 `WorkCard.vue` 加入文件清单并定义 `modal-change` 事件。

不需要修改：

- Worker API；
- `api-proxy.config.json`；
- Release 数据结构；
- `WorkCard.vue` 的业务内容布局；
- 全局滚动物理参数。

如果末卡高度资格需要读取 WorkCard 根元素，可优先通过 WorkStack wrapper 完成，不在 WorkCard 内引入滚动治理逻辑。

### 24.15 建议实施顺序

1. 在 `ReleasesPage` 明确 `archive/search` 显示模式；
2. 把 `useReleaseData.loadMore()` 拆为只读准备 `prepareNextPage()` 与同步 `commitNextPage()`，接入 AbortSignal 和 transaction 校验；
3. 给 `WorkStack` 增加稳定 wrapper、work ID、fold sentinel 和 terminal read sentinel；
4. 实现 `useReleaseCardStack` 的 IO 生命周期、共享 scroll-frame 边界校正和纯派生状态；
5. 实现最多三条的 `ReleaseSpineDeck`；
6. 在 `ReleaseSection` 接入章节栏、卡脊和释放边界；
7. 接入 terminal card 高度资格、read line 反向退出和 sticky 降级；
8. 接入分页事务的成功、失败、取消、用户输入取消补偿和卸载清理；
9. 接入“进入下个类型”按钮；
10. 确认关键词搜索和 Shelf 模式完全绕过增强并 abort 在途事务；
11. 完成 reduced motion、焦点保护和移动端降级；
12. 运行公开端校验并进行真实设备滚动测试。

建议先只开放桌面 list 模式，再扩展到平板；移动端默认使用卡脊摘要但关闭完整末卡 sticky，以降低首轮风险。

### 24.16 验收用例

#### 基础阅读

- 第一张完整卡片可从头到尾正常阅读；
- 卡片底部越过折叠线后生成卡脊；
- 向上滚动时卡脊正确撤销，原卡片重新成为当前内容；
- 触控板快速跳过多张卡片时，共享帧校正一次补齐 passed 状态，不依赖 1px IO callback 顺序；
- IO callback 直接使用应用 rootMargin 后的 `rootBounds.top`，共享帧使用原始 viewportTop + offset，两条路径得到同一折叠线；
- window 模式包含全站 Header offset，element 模式不重复计算 Header，两种模式的卡脊均不遮挡章节栏；
- 版本、曲目展开和 TrackModal 不受卡脊逻辑影响。

#### 卡脊上限

- 通过 1、2、3 张卡片时分别显示对应卡脊；
- 通过第 4 张后仍只显示最近三条；
- `+N` 数量随分页和反向滚动正确变化；
- 卡脊区域高度不会因加载多页继续增长。

#### 末卡和分页

- 当前页最后一张卡片不会折叠；
- 高度足够时末卡停留在卡脊与操作区之间；
- 卡片过高、展开或移动端时正确退化为普通流；
- 点击加载下一页不改变按钮相对视口位置；
- 分页失败后 observer、折叠过渡和 loading 状态恢复，可在原位置重试；
- prepare 成功前后 works 均不改变；`commitNextPage()` 校验通过后才在内部先清除旧 pinned、再同步追加数据；重复或过期 batch 被拒绝；
- commit 校验失败时 `beforeDataMutation` 不执行，旧 pinned 保持；有效空末页只更新 `hasMore=false`，异常空页保留重试；
- 分页期间切换搜索/Shelf、章节或卸载组件会 abort，旧请求完成后不污染当前 section；
- 分页请求成功但用户主动滚动时保留追加数据、取消 anchor 补偿，不抢回滚动位置；
- 旧末卡在继续滚动后可以折叠；
- 新页面最后一张卡片成为新的保留卡；
- 反向滚动越过 terminal read line 时解除末卡 pinned；
- 加载全部内容后分页按钮变为完成状态。

#### 章节交接

- 当前章节底部到达时，章节栏、卡脊、末卡和操作区整体退出；
- 下一类型自然接管，不出现双 sticky 重叠；
- 点击“进入下个类型”可以跳过未加载内容；
- Live 章节结束后正确进入页面结尾。

#### 搜索和视图切换

- 输入并提交关键词后无卡脊、无 terminal sticky、无下个类型按钮；
- 搜索结果按类型分组，各组独立分页并保持普通滚动；
- 清除搜索后 archive 模式重新初始化正确；
- Shelf 模式无逐卡片折叠；
- list/Shelf 切换没有遗留 observer 或错误卡脊。

#### 技术验证

- Release CSR 首次挂载没有由卡脊初始状态引起的可见跳动；
- 全站 SSR build 无 hydration mismatch；
- 路由返回恢复后卡脊与业务位置一致；
- reduced motion 下无折叠位移动画；
- 200% 浏览器缩放仍可阅读完整末卡；
- 页面不存在新增纵向滚动容器或持续 scroll handler；
- 分页加载、卡片高度变化和语言切换后无明显 CLS。

正式修改后运行：

```sh
npm run type-check
npm run build:ssr
npm run verify:ssr:local
```

## 25. `ui-ux-pro-max` 最终效果复核

### 25.1 复核结论

经过内容密集型娱乐档案、sticky 布局、动效、动态分页、移动端和 Vue SSR 规则复核，当前方案总体可行，且“完整卡片阅读 → 已读卡片折叠 → 最后一张完整保留 → 章节整体释放”的叙事与音乐档案场景匹配。

但该效果不能无条件在所有视口完整启用。最终实现必须把内容可读性和原生滚动稳定性置于视觉叙事之上，并执行以下优先级：

```text
完整内容可读
  > 原生滚动与焦点稳定
  > 分页位置不跳动
  > 章节方向感
  > 卡脊折叠动效
```

只要前四项中的任一项无法满足，就减少卡脊数量、关闭末卡 sticky 或完全退化为普通文档流，不强行保持演示中的视觉形态。

### 25.2 不直接采用的推荐

2026-07-26 使用本机 `ui-ux-pro-max`，以查询词 `music fan archive content-dense editorial vertical native scroll sticky stacked card spines responsive accessible` 生成 design system 时，返回了 Horizontal Scroll Journey、Exaggerated Minimalism、超大标题和黑粉强调色等建议。该结果是特定技能数据版本和查询词的检索快照，不代表所有查询都会得到相同结论，也不作为本项目的永久设计规范。

这些检索建议不直接用于当前 Release 页面：

- 横向滚动会压缩或截断 WorkCard 的版本、曲目和文章信息；
- 超大标题和大量留白与现有内容密度冲突；
- 新的黑粉配色会破坏公开端已经建立的蓝绿色与金色视觉语言；
- 横向手势与曲目切换、版本按钮和移动端浏览器返回手势可能产生冲突；
- 章节连续变色会让丰富的封面内容失去稳定背景。

本方案只吸收其中“章节持续可见、内容优先、渐进加载、150～300ms 轻动效和明确 CTA”的原则。颜色、字体、卡片密度和纵向主滚动继续遵循公开端现有设计系统。

### 25.3 视口占用预算

最终效果最大的 UX 风险不是卡脊本身，而是全站导航、章节栏、卡脊和末卡同时 sticky 后过度占用视口。

必须建立 sticky 占用预算：

```text
全站导航
+ Release 章节栏
+ 卡脊可见高度
<= min(12.5rem, 28dvh)
```

超过预算时按以下顺序降级：

1. 卡脊从 3 条降为 2 条；
2. 从 2 条降为 1 条；
3. 隐藏独立 `+N` 行，把数量并入章节栏；
4. 关闭完整末卡 sticky；
5. 保留章节栏，卡片全部恢复普通文档流。

不能通过缩小正文、压缩按钮命中区域或为 WorkCard 增加内部滚动条来满足预算。

### 25.4 避免布局跳动

卡脊数量变化不得改变列表正常文档流的高度。推荐结构：

```css
.release-spine-anchor {
  position: sticky;
  top: var(--release-fold-line);
  height: 0;
  z-index: var(--release-z-spine);
}

.release-spine-deck {
  position: absolute;
  inset-inline: 0;
  top: 0;
}
```

卡脊作为零高度 sticky anchor 的视觉层存在，不随 0、1、2、3 条状态改变列表占位高度。只有 terminal card 的 sticky top 使用固定的最大卡脊预留值，不根据实际卡脊数量逐条改变 top，避免每出现一条卡脊就把完整卡片向下推。

其他 CLS 约束：

- 卡脊缩略图必须声明固定宽高或 `aspect-ratio`；
- 图片加载不得改变卡脊高度；
- 章节字体使用现有字体回退，不新增可能改变指标的远程字体；
- 分页 skeleton 高度应接近真实卡片首屏高度；
- 路由恢复和 observer 首次 `resync()` 不播放折叠动画；
- 追加分页时使用公共业务锚点补偿，而不是依赖浏览器猜测滚动锚定。

### 25.5 z-index 与 stacking context

多层 sticky 必须使用局部、可解释的层级，不使用任意大数值：

```css
.release-section {
  position: relative;
  isolation: isolate;
  --release-z-content: 0;
  --release-z-terminal: 10;
  --release-z-spine: 20;
  --release-z-chapter: 30;
}
```

规则：

- 普通 WorkCard 使用 content 层；
- 完整末卡位于 terminal 层；
- 卡脊位于 terminal 之上、章节栏之下；
- 章节栏是 section 内最高层；
- 全站导航和 Modal 继续由现有全局层级管理；
- `ReleaseSection` 自身不得使用 transform 创建会干扰 sticky 的 containing block；
- 从主滚动 root 到 ReleaseSection 之间的祖先不能使用会截断 sticky 的 `overflow: hidden/auto`；
- WorkCard 自身的 `overflow-hidden` 只影响卡片内部，不影响外层 wrapper 和 sticky。

### 25.6 动效强度修正

每次滚动交接只允许一个主要动效：当前卡片折叠为卡脊。已经存在的卡脊不重复入场、弹跳或缩放。

推荐：

```text
进入：180～240ms ease-out
退出/释放：150～200ms ease-in
章节颜色：200～300ms ease-out
```

不推荐：

- 给每张完整 WorkCard 持续绑定 scale、blur 或视差；
- 同时移动封面、标题、曲目和卡脊；
- 使用弹簧回弹制造卡片碰撞感；
- 滚动停止后继续播放超过 300ms 的装饰动画；
- 对恢复出来的历史状态补播所有折叠过程。

卡脊折叠只表达位置和阅读状态变化，不应成为独立表演。

### 25.7 terminal sticky 的最终限制

完整末卡 sticky 是整个方案中风险最高的部分，应被定义为有条件增强，而不是页面基本能力。

除 24.6 的高度公式外，再增加以下限制：

- 浏览器缩放大于 150% 时默认重新评估；200% 时优先关闭；
- WorkCard 处于 expanded 状态时立即关闭；
- TrackModal 打开期间冻结卡脊派生状态，关闭后执行一次 `resync()`；
- 视口旋转或地址栏高度变化后重新判断资格；
- terminal card 和操作区不能同时形成两个独立 sticky 区域，操作区保持普通文档流；
- terminal dwell 区域只保留读取分页状态所需的最短距离，不增加大段空白制造停留；
- sticky 失效时仍保证末卡与分页按钮在 DOM 中相邻。

这样即使部分设备只看到“卡脊 + 普通末卡 + 分页”，信息结构仍然完整，不会出现功能降级。

### 25.8 长标题、语言和文本溢出

日文、中文和英文标题长度差异会直接影响卡脊高度。卡脊必须保持单行稳定：

```css
.release-spine-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

- 完整标题继续在原 WorkCard 中展示，不依赖卡脊读取；
- 年份和 `+N` 使用不换行文本；
- 卡脊不显示副标题、版本名称或文章标题；
- 中文和日文都不能通过缩小字体强行塞入；
- 200% 缩放下若卡脊无法保持稳定高度，进一步减少最大显示数量。

### 25.9 分页与错误状态

分页按钮区域需要维持稳定高度，避免 loading、error、complete 三种状态导致末卡和章节底部跳动：

- loading：保留原按钮尺寸，按钮 disabled，显示加载文本；
- error：在同一操作区显示失败文本和重试按钮；
- complete：用等高完成状态替换分页按钮；
- 新增数量通过 `aria-live="polite"` 报告；
- 失败时卡脊、末卡和当前滚动位置保持不变；
- 重试成功后再更新 terminal work 和 observer；
- 所有按钮可点击区域至少 44×44px，现有 `min-h-10` 的 40px 实现需要在正式改造时提升。

搜索无结果时必须显示可执行建议，例如清除年份、切换类型或修改关键词，不能只显示空白章节或单独的“0 条结果”。

### 25.10 Vue 渲染隔离

卡脊状态随观察器变化时，不应触发全部 WorkCard 重渲染：

- `ReleaseSpineDeck` 与 `WorkStack` 保持兄弟组件关系；
- 传给 WorkStack 的 works 数组在 observer 更新时保持引用稳定；
- passed ID、hidden count 和 phase 只传给卡脊及章节栏；
- terminal work ID 变化时只更新对应 wrapper 属性；
- `ResizeObserver` 回调通过单次 `requestAnimationFrame` 合并测量，防止 resize loop；
- 只有性能分析确认 WorkCard 被无关重渲染时，再使用 `v-memo`；
- 使用 `v-memo` 时依赖至少包含 `work` 引用、viewMode、expanded 状态和 terminal 身份，不能只依赖 work ID。

### 25.11 渐进增强和异常退化

以下任一情况出现时，页面必须退化为普通档案列表：

- `IntersectionObserver` 不可用；
- 无法解析公共主滚动 root；
- sticky offset 测量失败；
- ReleaseSection 祖先存在无法移除的滚动或裁切容器；
- 主视口高度不足以容纳章节栏和一条卡脊；
- hydration 或路由恢复仍在进行；
- Search 或 Shelf 模式启用。

退化只移除卡脊和 terminal sticky，不隐藏卡片、不改变分页 API，也不阻止“进入下个类型”。

### 25.12 最终 UX 审批条件

在生产实现进入发布前，除 24.16 的功能验收外，还必须满足：

- 375×667、390×844、768×1024、1366×768、1440×900 均无内容遮挡；
- 375px 移动端横屏最多保留一条卡脊且没有完整末卡 sticky；
- sticky 总占用不超过 `min(12.5rem, 28dvh)`；
- 卡脊从 3 条增长到 `+N` 时列表没有可见位移；
- 日文长标题不会撑高卡脊；
- 加载下一页、失败重试和加载完成的操作区高度稳定；
- 打开和关闭 TrackModal 后滚动位置与卡脊状态正确；
- 200% 缩放时可完整阅读 WorkCard；
- reduced motion 下无滚动驱动的连续动画；
- 键盘焦点不会进入隐藏或折叠的视觉代理；
- Chrome、Safari iOS 和 Firefox 至少各完成一次真实滚动检查。

满足以上条件后，该效果在最终体验上是合适的；若 terminal sticky 在真实内容上频繁失去资格，应保留“限量卡脊 + 普通末卡 + 分页”的稳定版本，不再继续增加强制固定逻辑。
