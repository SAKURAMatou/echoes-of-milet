# 公开端全站个性化交互实现方案

## 1. 文档目的

本文定义 `echoes-of-milet` 公开端在现有原生滚动治理基础上的全站个性化交互方案。

本方案不是某一个业务页面的动效清单，也不替代 [原生滚动治理方案](./native-scroll-governance-plan.md)。两者的关系如下：

- 原生滚动治理负责“页面怎样可靠地滚动、恢复、锁定和交接”。
- 全站交互层负责“用户进入、选择、展开、完成和返回时，网站怎样表达状态与品牌个性”。
- 页面业务组件继续负责数据、内容结构和业务状态，不把业务状态迁入全局动效层。

最终目标是让全站形成统一的 `Echo Interaction Language`：回声扩散、路径留下痕迹、档案逐渐沉淀，同时保持内容优先、原生滚动、移动端可用和 SSR 安全。

## 2. 当前代码基线

方案基于 `feat/native-scroll-governance` 当前代码编写，关键基础能力已经存在：

- `createPageScrollCoordinator.ts` 已统一 `window` 与桌面内容容器两种主滚动目标。
- `browserScrollHistoryManager.ts` 已维护 history entry key、位置和前进/后退识别。
- `router/index.ts` 已有 navigation generation、滚动意图、失败中止和恢复时序。
- `LayoutApp.vue` 已注册主滚动容器和内容尺寸元素。
- Timeline、News、Gallery、Release 已支持业务锚点或业务状态恢复。
- Release 已实现“完整卡片 → 卡脊堆叠 → 章节释放”的页面级叙事。
- Anniversary 已实现 Echo Ribbon、回声环、舞台光、星座等强个性化动效，并处理了 reduced motion。

因此，全站交互层必须复用现有 router 与 scroll lifecycle，不能再创建第二套滚动状态、history key 或页面锁。

## 3. 审查结论与设计取舍

### 3.1 `ui-ux-pro-max` 结论

该站更接近内容优先、编辑式、个人档案型产品。适用规则包括：

- 微交互使用 `150–300ms`，输入反馈应更快。
- 单个视图同时运动的核心元素不超过 1–2 个。
- 进入使用 ease-out，离开使用更短的 ease-in。
- 动画优先使用 `transform` 与 `opacity`。
- 装饰性无限动画应取消；无限动画只保留给真实加载或正在播放的音频波形。
- 不得覆盖浏览器返回、原生纵向滚动和系统手势。
- 所有主要操作必须具备 hover、pressed、focus-visible 和 disabled 状态。
- 所有触控目标至少 `44 × 44px`。

搜索结果给出的 OLED 暗色娱乐模板与当前浅蓝、淡金、半透明纸张和水彩背景不一致，本方案不采用暗色重构，也不替换现有字体体系。

### 3.2 品牌语义

全站个性化效果使用以下语义，而不是无意义的粒子、弹跳或放大：

| 语义 | 视觉表达 | 对应状态 |
| --- | --- | --- |
| 回声 | 一次扩散后消失的细环 | 点击、选中、答对、定位完成 |
| 路径 | 细线从起点向目标绘制 | 页面进入、进度、地图路线、章节推进 |
| 沉淀 | 淡金节点、档案印记、稳定高亮 | 已读、已完成、当前定位 |
| 余韵 | 低幅度、短时淡出 | 页面离开、关闭详情、完成反馈 |
| 中断 | 波形或细线停止，不使用抖动 | 错误、取消、加载失败 |

### 3.3 强度分层

| 层级 | 使用范围 | 同时运动预算 |
| --- | --- | --- |
| L0 静态 | reduced motion、后台标签页、低性能回退 | 无位移动画 |
| L1 微反馈 | 按钮、筛选、卡片、输入 | 1 个局部元素，`80–220ms` |
| L2 页面反馈 | 路由进入、加载完成、长页进度 | 1 条路径 + 1 个内容容器，`180–320ms` |
| L3 业务叙事 | Release 卡脊、Timeline 节点、地图路线 | 当前业务区域内 1–2 个元素 |
| L4 沉浸叙事 | Anniversary | 页面独占，使用该页自身预算 |

普通页面不得复制 L4 的完整动效密度。

## 4. 非目标与禁止项

本方案明确不做：

- 不引入 Lenis、GSAP、ScrollTrigger 或新的动画框架。
- 不接管 `wheel`、`touchmove` 或浏览器滚动惯性。
- 不增加全局自定义光标。
- 不自动播放声音，不把声音作为反馈前提。
- 不在所有卡片上使用视差、3D 倾斜或持续呼吸。
- 不使用 `Math.random()` 生成 SSR 首屏装饰位置。
- 不用 `mode="out-in"` 的整页 Vue Transition 延迟新页面挂载。
- 不因为动画延迟滚动恢复、页面 ready 或焦点恢复。
- 不改变 Release 搜索结果的普通列表滚动规则。
- 不在服务端渲染阶段读取 `window`、`document`、`localStorage`、媒体查询或元素尺寸。

## 5. 全站交互架构

### 5.1 目录建议

```text
src/
├─ components/
│  └─ interaction/
│     ├─ SiteEchoLayer.vue
│     ├─ EchoScrollProgress.vue
│     ├─ EchoAsyncState.vue
│     └─ EchoStatusAnnouncer.vue
├─ composables/
│  └─ site-interaction/
│     ├─ createSiteInteractionCoordinator.ts
│     ├─ siteInteractionTypes.ts
│     ├─ useSiteInteraction.ts
│     └─ index.ts
├─ directives/
│  └─ echoPress.ts
└─ assets/
   └─ main.css
```

不新增独立 store 框架。协调器和 `PageScrollCoordinator` 一样由 `app.ts` 创建并通过 provide/inject 提供。

### 5.2 状态模型

```ts
export type SiteInteractionPhase = 'idle' | 'departing' | 'arriving'

export type SiteNavigationDirection =
  | 'forward'
  | 'back'
  | 'replace'
  | 'unknown'

export type SiteInteractionPreset =
  | 'standard'
  | 'quiet'
  | 'archive'
  | 'map'
  | 'challenge'
  | 'immersive'

export interface SiteInteractionState {
  phase: SiteInteractionPhase
  direction: SiteNavigationDirection
  preset: SiteInteractionPreset
  navigationGeneration: number | null
  routeKey: string
  motionEnabled: boolean
  documentVisible: boolean
}
```

协调器只维护交互表现状态，不保存页面滚动位置和业务数据。

### 5.3 Router 生命周期

`createAppRouter()` 同时接收 scroll coordinator 和 interaction coordinator：

1. `beforeEach` 创建同一个 navigation generation 对应的滚动任务和交互任务。
2. interaction coordinator 进入 `departing`，只启动非阻塞的 Echo 路径提示。
3. Router 完成导航，新组件按现有流程挂载。
4. `afterEach` 先让滚动协调器确认 entry key，再通过 `nextTick` 将交互层切到 `arriving`。
5. `arriving` 只影响新内容的 `transform/opacity` 和全局 overlay，不阻止滚动恢复。
6. 发生重复导航、导航失败或 router error 时，两套 coordinator 使用同一 generation 分别 abort。
7. 用户在过渡期间滚轮、触摸、键盘导航或 pointer down 时，只取消装饰动效，不取消路由和滚动恢复。

严禁用固定 `setTimeout` 决定路由 ready。定时器只负责动画结束后的 class 清理。

### 5.4 导航方向

扩展 `BrowserNavigationStart`，在已有 history `position` 基础上返回：

```ts
historyDirection: 'forward' | 'back' | 'unknown'
```

规则：

- history target position 小于当前 position：`back`。
- history target position 大于当前 position：`forward`。
- 非 history 的新路由：`forward`。
- route name 相同、仅语言参数变化：`replace`。
- SSR 首次进入、重定向链和无法判断的导航：`unknown`，使用无方向淡入。

不能通过覆写 history state 删除 Vue Router 或滚动治理已有字段。

## 6. 全站 Motion Token

在 `src/assets/main.css` 的 `@theme` 或 `@layer base` 中增加统一 token：

```css
:root {
  --echo-color-ink: #1a2c50;
  --echo-color-teal: #317f8d;
  --echo-color-sky: #8fc5df;
  --echo-color-gold: #ddbe5f;
  --echo-color-paper: rgba(255, 255, 255, 0.88);

  --echo-duration-press: 120ms;
  --echo-duration-micro: 200ms;
  --echo-duration-route: 280ms;
  --echo-duration-hero: 480ms;

  --echo-ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --echo-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --echo-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --echo-duration-press: 1ms;
    --echo-duration-micro: 1ms;
    --echo-duration-route: 1ms;
    --echo-duration-hero: 1ms;
  }
}
```

约束：

- 普通页面内容位移不超过 `10px`。
- 卡片 pressed 不使用 `scale(.95)`；使用边框、阴影、背景和局部波纹，避免视觉跳动。
- 普通 hover 缩放上限为 `1.015`，优先不缩放。
- route transition 不允许从 `opacity: 0` 开始，首帧内容必须可读。
- `will-change` 仅在动画执行期间添加，结束后移除。

## 7. 核心公共能力

### 7.1 `SiteEchoLayer.vue`

挂载在 `LayoutApp.vue`，位于背景之上、菜单和弹窗之下，始终 `pointer-events: none`。

效果分为两部分：

- 顶部或内容卡片边缘的一条短 Echo 路径，表示页面正在切换。
- 新页面到达时的一次节点扩散，表示目标已经稳定。

实现原则：

- 使用 CSS/SVG，固定几何，不读取内容 DOM 生成路径。
- 路径颜色来自当前 route 的菜单色或 preset，不硬编码到页面组件。
- `back` 反向绘制，`replace` 只做颜色交接，`unknown` 只做短淡入。
- overlay 不创建新的滚动容器，不参与 content metrics。
- Anniversary 使用自己的 `AnniversaryEchoRibbon`，全局层只做短暂入口交接并立即退出。

不能直接抽取 `AnniversaryEchoRibbon.vue` 作为全站组件。该组件绑定四章节固定节点、桌面/compact 固定路径和 Anniversary 状态机。全站只复用它的颜色、线宽、节点和一次性 pulse 语法。

### 7.2 `EchoScrollProgress.vue`

读取 `pageScroll.state.progress`，在 Header 下方显示一条低幅度波形或细线：

- 使用 `transform: scaleX(progress)`，不动画 `width`。
- `max <= viewportHeight * 0.5` 的短页不显示。
- 页面滚动锁定时冻结，不重置。
- history 恢复完成后直接显示恢复进度，不从 0 补动画。
- Map、弹窗内部滚动和 Release 卡片 sticky 不创建第二条全局进度。
- Anniversary preset 默认隐藏全局进度，避免和章节 Ribbon 重复。

首期只做连续进度，不做全站统一章节节点。章节节点仍由 Release、Anniversary、Timeline 等业务页自行注册和表达。

### 7.3 `v-echo-press`

仅应用到主要 CTA、筛选项和可点击卡片，不全局监听所有 click。

- pointer 输入以按下位置为圆心设置 CSS 变量。
- 键盘 Enter/Space 使用元素中心。
- 波纹为一次性边框或 radial gradient，`120–220ms` 后消失。
- directive 不调用 `preventDefault`、不改变焦点、不延迟 click。
- disabled 元素不产生反馈。
- reduced motion 下改为即时背景或边框变化。

### 7.4 `EchoAsyncState.vue`

统一 loading、empty、error 和 retry 的视觉与语义：

```ts
type EchoAsyncState = 'loading' | 'empty' | 'error'
```

- 请求超过 `300ms` 才显示 loading，避免快速请求闪烁。
- skeleton 尺寸尽量匹配最终内容，避免布局位移。
- loading 可以使用有限的波形循环；页面不可见时停止。
- empty 必须给出下一步，例如清除筛选、返回全部内容或重试。
- error 使用“路径中断”视觉，不使用抖动或全屏红色。
- 容器使用 `aria-busy`，状态消息进入统一的 polite live region。
- 重试按钮在请求中真正 disabled，防止重复提交。

首批替换 News、Timeline、Release、Live Archive 的 loading/empty/error；地图和 Gallery 在后续阶段迁移。

### 7.5 `EchoStatusAnnouncer.vue`

全站仅保留一个 `aria-live="polite"` 容器，业务组件通过 coordinator 发布简短消息：

- “筛选后显示 12 项”。
- “已进入 2024 年时间线”。
- “已恢复到上次浏览位置”。
- “地图地点已选择”。

视觉动效使用 `aria-hidden="true"`，不能把装饰路径和节点暴露给读屏器。

## 8. 导航与全局控件改造

### 8.1 Header 与移动菜单

当前菜单视觉符合站点风格，但需先完成交互基础：

- `TWHeader.vue` 的菜单按钮增加 `aria-expanded`、`aria-controls` 和动态的打开/关闭 label。
- `SideMenuLeft.vue` 打开时将焦点移入 dialog，支持 Escape 关闭并把焦点还给触发按钮。
- dialog 打开时使用现有 `pageScroll.lockPageScroll()`，同时让背景内容 inert；关闭时成对释放。
- 点击 scrim、选择路由、切换语言、浏览器返回都必须安全关闭菜单。
- 菜单项 stagger 从 `index * 120ms` 改为 `min(index, 5) * 30ms`，最大延迟不超过 `150ms`。
- `MORE` 提示的无限 bounce 改为最多两次；用户首次滚动后只保留静态提示。
- 触控目标保持至少 `44px`，不能因为贴纸轮廓缩小实际点击区域。

个性化表达：当前栏目贴纸在路由到达时产生一次低强度回声环，之后保持稳定下划线，不持续闪烁。

### 8.2 LanguageSelect

两种可选实现必须选择一种完整语义：

1. 保留 `listbox`：实现 ArrowUp、ArrowDown、Home、End、Enter、Escape 和 roving focus。
2. 改为普通 menu/button 语义：使用菜单项并支持相同键盘关闭逻辑。

语言切换交互：

- 使用 router replace 保持当前 route、query、hash 和滚动位置。
- 只做 `160–200ms` 的文字/色彩交接，不让整个页面重新淡出。
- 切换完成后 live region 提示当前语言。
- 旗帜 emoji 不再作为结构性图标；改为 `ZH` / `JA` 文本圆标或项目内 SVG。

### 8.3 返回顶部

`TWUpToTop.vue` 继续调用 `pageScroll.scrollToTop()`，只调整表现：

- 视觉从通用蓝色方块改为 Echo 节点按钮。
- 按钮周围的圆弧显示当前页面进度，但不持续旋转。
- 点击后圆弧向起点收束；用户滚轮或触摸中断 smooth scroll 时立即停止收束。
- reduced motion 下使用 `behavior: auto`，由滚动协调器的现有规则兜底。
- 保持 48px 点击区域和明确的 focus-visible。

## 9. 页面级个性化映射

### 9.1 首页 `MiletSiteHome.vue`

当前 `.animate-fadein` 为整块 `1.1s` 淡入，容易在首屏形成短暂无内容感。

调整方案：

- 文本首帧保持可读，只让 eyebrow、标题强调词和 CTA 依次产生 `0–8px` 的一次性到达。
- 总时长控制在 `420–480ms`，级联最大延迟不超过 `120ms`。
- 水彩背景保持静态；不增加鼠标跟随或大面积视差。
- 四个入口卡片 hover 只改变标题色、边线和局部光点；tap 使用 `v-echo-press`。

### 9.2 milet 首页 `MiletHomeView.vue` 与 home components

- Hero 中 8–14 秒无限波形改为一次到达后静止。
- scroll cue 最多播放两次，用户滚动后永久停止当前会话提示。
- Highlight 卡片进入详情时使用全站 route echo，不额外叠加整卡淡出。
- Timeline、Gallery lazy section 出现时只允许标题或首张卡片进入，不让每张卡片依次飞入。

### 9.3 Timeline

- 年份节点选择时扩散一次记忆波纹。
- 打开详情时当前节点保持淡金沉淀状态；关闭后回到原业务锚点。
- 关联文章按钮使用一次边框回声，取消持续 chevron 或 glow。
- 数据追加后只对新增首项做 arrival，已有内容不重播。
- history 恢复时不重播整页时间线动画。

### 9.4 Discography / Release

继续以现有卡脊滚动为主，不叠加全局 sticky 叙事：

- 完整卡片阅读、卡脊、terminal sticky 和章节释放沿用当前状态机。
- 类型按钮、List/Shelf 和“下一类型”使用统一 pressed/focus token。
- 分页成功后，新内容首项产生一次低强度节点到达；失败通过 `EchoAsyncState` 表达。
- 搜索结果继续使用普通列表和原生页面滚动，不启用卡脊、章节锁或结果重排滚动。
- 搜索条件变化只让结果计数和内容容器短淡入，不滚回顶部，除非用户明确提交了新的搜索并由页面策略决定。

### 9.5 Live Archive 与详情

- 移除 `live-archive-signal-pulse` 的装饰性无限循环，改为加载完成或筛选完成时播放一次。
- Live 卡片使用票根边线/舞台灯边缘作为 hover 和 pressed 状态，不移动整张卡片。
- 列表进入详情后，详情标题或主图可以使用渐进增强的 shared-element transition；不支持时回退到 route echo。
- 浏览器返回必须恢复列表位置和对应卡片焦点，不重新从页首播放。

### 9.6 News

- Topic 横向滚动箭头的无限位移动画改为最多两次，首次交互后静止。
- 选择主题时让当前 topic 的细线移动到新位置，结果数量 pulse 一次。
- skeleton 保留最终卡片高度，加载完成使用容器级 `180ms` 交接。
- 无结果提供“清除主题/查看全部”动作，不只显示 0。
- 无限加载或分页追加只标记新增项，不重播已加载卡片。

### 9.7 Gallery

- Album 卡片打开详情时，支持浏览器可用情况下的 `view-transition-name`，名称由稳定 gallery id 生成。
- 每个页面同一时刻只能存在一个相同的 `view-transition-name`，虚拟/无限列表卸载前清理。
- 不支持 View Transitions API 时回退为图片容器 `180ms` 淡入。
- 返回列表以业务锚点恢复为第一优先，不能为了 shared transition 强行滚动到缩略图。
- 加载更多保留 Gallery 的发现式浏览，不复用 Release 卡脊。

### 9.8 Pilgrimage

- 保持 `scrollPolicy: manual` 和地图自身手势，不把地图 wheel 交给全站 transition。
- 选中地点时标记 pulse 一次，路线绘制一次后保持静态。
- 当前路线 actor 只在用户主动开始路线演示时移动，离开可见区域或 document hidden 时暂停。
- Map/Collection 切换使用现有局部 Transition，不叠加全屏离场。
- 详情面板打开、关闭和 history 状态恢复继续使用 page state，不写入新的滚动快照格式。

### 9.9 Echo Room

- 波形只在真实音频播放和倒计时进行时运动，暂停、后台、答题完成时静止。
- 答对使用一次扩散回声；答错使用路径收束或颜色变化，不使用抖动。
- 难度选择和答案必须有明确 pressed、selected、disabled 状态。
- 不自动播放声音，不在普通点击上触发振动。
- 结果页进入时只强调分数和一条完成路径，避免所有题目逐项飞入。

### 9.10 About / Feedback

- 原有内容卡片的 `story-rise 720ms` 缩短或仅用于首个关键块，其余内容首帧可读。
- “确认”可使用信纸收拢的局部过渡，但不能延迟表单验证信息。
- 发送成功使用一次档案盖章效果并进入 live region。
- 请求中按钮 disabled，错误聚焦到错误摘要或首个无效字段。

### 9.11 Article 与关联内容

- Article mobile TOC 延用局部 panel transition，并补全 Escape、焦点返回和 page lock 对称释放。
- RelatedArticleList 的边框 glow、sweep、pulse 和 chevron 无限循环改为首次进入或 hover/focus 时播放一次。
- 从文章返回列表优先恢复阅读来源和滚动位置，不强制跳到标题。

### 9.12 Anniversary

- 保持 `immersive` preset，继续使用页面自有 Echo Ribbon、回声环、舞台灯和星座。
- 全局 `SiteEchoLayer` 只负责从普通站点进入周年页的入口交接，不覆盖章节动效。
- 周年页离开时只播放短余韵，不等待完整 finale。
- 现有 confetti 等持续效果必须遵守 document visibility、reduced motion 和用户操作后的停止规则。
- Anniversary 的固定四节点路径不提升为全站 API；只抽取视觉 token 与通用的单次 pulse 样式。

## 10. Route Meta 建议

扩展 route meta：

```ts
interface RouteMeta {
  interactionPreset?: SiteInteractionPreset
  showEchoProgress?: boolean
}
```

初始配置：

| Route | preset | progress |
| --- | --- | --- |
| home | quiet | false |
| milet | standard | true |
| timeline | archive | true |
| release | archive | true |
| live archive/detail | archive | true |
| news | archive | true |
| gallery/detail | archive | true |
| pilgrimage | map | false |
| song guess | challenge | false |
| about/article | quiet | true |
| anniversary | immersive | false |

Meta 只决定表现 preset，不改变 `scrollPolicy`。

## 11. 最近浏览与“档案沉淀”

此能力作为后续可选阶段，不阻塞基础动效上线。

首版只使用 `sessionStorage` 保存当前标签页内的有限已读记录：

```ts
interface VisitedEchoRecord {
  routeName: string
  contentId: string
  visitedAt: number
}
```

限制：

- 最多 100 条，按时间淘汰。
- 不保存搜索词、query 全量、邮件、地图精确坐标或表单内容。
- 不上传服务端，不跨设备同步。
- SSR 初始状态始终视为未读，mounted 后只增加轻量标记，避免 hydration mismatch。
- 已读只能是辅助信息，不能只靠颜色表达，也不能降低正文对比度。

稳定后再评估是否改为版本化 localStorage：`milet:visited-echoes:v1`。

## 12. Reduced Motion 与 document visibility

### 12.1 全局策略

新增统一 `useMotionPreference()` 或由 site interaction coordinator 暴露：

- `prefers-reduced-motion: reduce` 时关闭位移、路径绘制、波纹扩散和级联延迟。
- 保留即时颜色、边框、selected、pressed、loading 文本等状态反馈。
- `document.hidden` 时停止所有装饰动画和非必要 rAF。
- 页面重新可见时不补播已错过的装饰动画。
- 用户已经滚动或点击后，不重复播放引导动画。

### 12.2 必须清理的持续动画

优先审计以下现有位置：

- `HorizontalScrollHint.vue` 左右箭头。
- `SideMenuLeft.vue` MORE 箭头。
- `MiletHomeHero.vue` 波形、光束、雾层和 scroll cue。
- `MiletLiveArchiveView.vue` signal pulse。
- `MiletNewsCollectionView.vue` signal 与 topic hint。
- `RelatedArticleList.vue` border glow、sweep、pulse、chevron。
- Pilgrimage selected marker、scroll cue 和路线 actor。
- Anniversary confetti 和其他持续 ambience。

真实 loading skeleton 和真实播放中的音频波形允许循环，但必须在状态结束时停止。

## 13. 无障碍要求

- 所有可点击容器使用 `button` 或 `a`，不使用只有 click 的 `div`。
- 所有 primary action 的命中区域至少 `44 × 44px`。
- `focus-visible` 与 hover 具有同等级别的视觉辨识度。
- 页面前进导航完成后，将焦点移动到主标题或 main；history back/forward 优先恢复来源焦点，不强制抢焦点。
- Drawer、dialog、lightbox、track modal 统一实现初始焦点、焦点约束、Escape 和焦点返回。
- disabled 必须使用真实 `disabled` / `aria-disabled` 并阻止事件。
- loading、结果数、成功、错误通过单一 live region 发布，避免重复播报。
- 装饰 SVG、路径、节点统一 `aria-hidden="true"`。
- 200% zoom 下固定 Header、进度和返回顶部不能遮挡正文与操作。

## 14. 性能预算

### 14.1 主线程与绘制

- scroll handler 不查询大范围 DOM；进度直接订阅 page scroll frame。
- 同一帧只更新 CSS variable 或 transform，不在循环中交替读写布局。
- pointer move 不作为全站能力；本方案不做全局鼠标跟随。
- 路由 overlay 使用固定 SVG/CSS，不根据页面内容实时计算路径。
- 页面卡片列表不逐项创建 IntersectionObserver；复用页面已有 observer 或容器级观察。
- 动效完成后清除临时 class、timer、listener 和 `will-change`。

### 14.2 包体

- 不增加运行时动画依赖。
- 公共交互层目标 gzip 增量小于 8KB，不含页面已有 SVG。
- 页面特有动效留在路由懒加载 chunk，不进入首页公共 chunk。

### 14.3 响应指标

- pointer/keyboard pressed 反馈在 100ms 内可见。
- route 新内容不因动效额外等待超过一个 `nextTick`。
- 普通过渡不超过 `320ms`；Hero 一次性进入不超过 `480ms`。
- loading 小于 300ms 时不闪 skeleton。
- 动画期间不得产生新的水平滚动条或改变主滚动高度。

## 15. SSR 与渐进增强

- SSR 输出不包含运行中的 transition phase，初始 phase 固定为 `idle`。
- 所有本地存储、媒体查询、 document visibility 和 View Transitions 检测只在 mounted 后执行。
- 首屏内容不能依赖 animation class 才可见。
- 不支持 View Transitions API 时使用现有 CSS overlay 和内容 arrival。
- 不支持 IntersectionObserver 或 ResizeObserver 时，内容和操作仍完整可用。
- JS 加载失败时，链接、按钮、原生页面滚动和服务端输出仍可访问。
- 任何个性化效果失败都不能阻塞 router、scroll restore、search、map 或表单提交。

## 16. 预计文件改动

### 16.1 第一阶段必改

| 文件 | 改动 |
| --- | --- |
| `src/assets/main.css` | Echo 颜色、时长、缓动、focus 和 reduced-motion token |
| `src/app.ts` | 创建并 provide site interaction coordinator |
| `src/router/index.ts` | 与滚动 generation 同步驱动交互 lifecycle |
| `src/router/routes.ts` | 增加 interaction preset meta |
| `src/views/LayoutApp.vue` | 挂载 SiteEchoLayer、EchoScrollProgress、announcer |
| `src/components/TWHeader.vue` | 菜单状态语义、进度承载和焦点契约 |
| `src/components/menu/SideMenuLeft.vue` | Drawer focus、Escape、inert、提示停止规则 |
| `src/components/menu/SideMenuItems.vue` | 缩短 stagger，统一 active/pressed/focus |
| `src/components/LanguageSelect.vue` | 完整键盘语义和 replace 交接 |
| `src/components/TWUpToTop.vue` | Echo 节点视觉，保留原 scroll API |

### 16.2 新增文件

| 文件 | 职责 |
| --- | --- |
| `src/composables/site-interaction/*` | 状态、生命周期、注入和 motion preference |
| `src/components/interaction/SiteEchoLayer.vue` | 非阻塞路由路径和到达 pulse |
| `src/components/interaction/EchoScrollProgress.vue` | 全站长页进度 |
| `src/components/interaction/EchoAsyncState.vue` | loading/empty/error/retry |
| `src/components/interaction/EchoStatusAnnouncer.vue` | 单一 polite live region |
| `src/directives/echoPress.ts` | 可选的局部按压回声 |

### 16.3 页面分批修改

- `MiletSiteHome.vue`
- `MiletHomeView.vue` 与 `components/milet/home/*`
- `MiletTimeLineAll.vue`
- `ReleasesPage.vue` 与 `components/milet/music/*`
- `MiletLiveArchiveView.vue`、Live detail components
- `MiletNewsCollectionView.vue`
- `MiletGalleryView.vue`、Gallery viewer
- `MiletPilgrimageView.vue` 与 pilgrimage components
- Song Guess views/components
- `AboutMeView.vue`
- Article views/components
- Anniversary 仅同步 token 和全局入口边界

## 17. 实施阶段

### 阶段 0：基线和回归护栏

1. 记录当前路由、滚动、history、菜单、语言、弹窗和 reduced motion 行为。
2. 为 interaction coordinator、方向判断和 motion preference 写单元测试。
3. 明确不改变现有 scroll snapshot 与 pageState 数据格式。

完成条件：现有滚动治理用例可以独立通过。

### 阶段 1：交互基础和无障碍

1. 增加 motion token。
2. 修复移动菜单、LanguageSelect、返回顶部的语义和焦点。
3. 清理全站高风险无限装饰动画。
4. 建立统一 live region。

完成条件：即使尚无路由 Echo 动画，交互基础已经稳定。

### 阶段 2：全站 Route Echo

1. 新增 site interaction coordinator。
2. 接入 router generation 和 history direction。
3. 挂载 `SiteEchoLayer` 与 `EchoScrollProgress`。
4. 为 standard、quiet、archive、map、challenge、immersive 配置 preset。

完成条件：前进、返回、replace、导航失败和用户中断均不会影响滚动恢复。

### 阶段 3：统一反馈组件

1. 实现 `v-echo-press`。
2. 实现 `EchoAsyncState`。
3. 首批迁移 News、Timeline、Release、Live Archive。
4. 统一筛选结果计数、empty、error 和 retry。

完成条件：同类状态跨页面具有一致反馈和语义。

### 阶段 4：页面个性化变体

按 Home → Timeline → Live/News → Gallery → Pilgrimage → Echo Room → About/Article 的顺序实施。

Release 和 Anniversary 只做体系接入，不重写已完成的页面状态机。

完成条件：每页最多一个主个性化动作，不出现效果叠加竞争。

### 阶段 5：档案沉淀

1. 先实现 session 内已读标记。
2. 验证 SSR、隐私、视觉和恢复行为。
3. 再决定是否持久化到版本化 localStorage。

此阶段可延期，不影响前四阶段上线。

## 18. 验收用例

### 18.1 路由与滚动

- 从任意长列表进入详情再返回，位置和业务锚点正确。
- history back/forward 的动效方向正确，且不覆盖恢复位置。
- 快速连续点击两个路由时，旧 generation 的动效被取消。
- 导航失败、重定向和 chunk 加载失败不会留下遮罩或锁。
- 用户在 smooth scroll 或 route arrival 中滚轮/触摸，装饰动画立即让路。
- Release 搜索结果不启用卡脊或额外滚动接管。
- Pilgrimage 地图手势与页面滚动不冲突。

### 18.2 导航与输入

- Mobile menu 支持 Tab、Shift+Tab、Escape、scrim 关闭和焦点返回。
- LanguageSelect 支持完整键盘选择并保持当前页面上下文。
- 所有按钮可从键盘触发，pressed/focus/disabled 清晰。
- 浏览器缩放 200% 后没有操作被固定元素遮挡。

### 18.3 动效与性能

- reduced motion 下无路径绘制、位移、波纹和级联延迟。
- document hidden 时无装饰性持续动画。
- 页面返回和 history 恢复不重播整页入场。
- 同一视图同时运动的核心元素不超过两个。
- 动画只使用 transform/opacity 或 SVG stroke，不产生可感知 layout shift。
- 不出现横向页面滚动条。

### 18.4 视口

至少验证：

- `1528 × 732`
- `1366 × 768`
- `768 × 1024`
- `390 × 844`
- `375 × 667`
- `844 × 390`

同时验证 hover 精细指针、touch 粗指针、键盘、reduced motion 和 200% zoom。

### 18.5 SSR

- SSR HTML 首屏内容可见，不依赖 mounted 动画。
- hydration 无 class、随机数或本地存储状态不一致。
- CSR 页面仍遵循现有 route render mode。
- 页面级懒加载和 interaction coordinator 不把 Leaflet/Fancyapps 引入 SSR 执行路径。

## 19. 验证命令

每个阶段至少运行：

```bash
npm run type-check
npm run build:ssr
```

公共路由、SSR 初始状态或 LayoutApp 有修改时运行：

```bash
npm run verify:ssr:local
```

还应增加 site interaction coordinator 的 Vitest 或现有测试框架用例；如果项目当前没有公开端单测入口，至少把纯方向判断、preset 解析和状态机拆为无 DOM 的纯函数，便于后续补测。

## 20. 风险与退化策略

| 风险 | 处理 |
| --- | --- |
| 路由动效与滚动恢复竞争 | 动效层不控制 scroll，不延迟 mount，和 scroll 共用 generation 但各自 abort |
| 页面已有动效叠加 | route preset 控制强度，immersive/map/challenge 可关闭全局进度或内容位移 |
| SSR hydration mismatch | 初始 idle、固定几何、mounted 后才读取浏览器状态 |
| 长列表性能下降 | 不逐卡监听 pointermove，不逐项创建全局 observer |
| reduced motion 漏网 | 全局 token + 现有局部 media query 双层兜底，并列出无限动画审计清单 |
| View Transitions API 兼容性 | 只作为 Gallery/Detail 渐进增强，基础 Route Echo 使用 CSS/SVG |
| 菜单焦点与 page lock 泄漏 | 所有打开动作返回 release/restore 函数，unmount 时强制清理 |
| 已读状态涉及隐私 | 首版 sessionStorage、有限 ID、不保存查询和表单、不上传 |

## 21. 最终决策

全站个性化应建立在现有原生滚动治理上，而不是通过更强的滚动接管实现。

优先级如下：

1. 先统一 motion token、焦点、菜单、语言和持续动画停止规则。
2. 再实现不阻塞路由和滚动恢复的全站 Route Echo 与长页进度。
3. 然后统一 loading、empty、error、筛选和 pressed 反馈。
4. 最后为各业务页增加一个与内容语义对应的局部个性化动作。
5. Anniversary 保持高强度特例，Release 保持卡脊特例，两者只向全站输出视觉语言，不输出固定状态机。

按此顺序实施，可以在不牺牲原生滚动、可访问性、SSR 和内容阅读的前提下，让网站从“视觉风格统一”进一步发展为“行为也具有识别度”的完整体验。
