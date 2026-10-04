# 巡礼路线角色动画

角色基于用户确认的 `character-study-04.png`（工作区 designs/pilgrimage-walking-duo），保留 milet 的波浪长发、黑色马甲/长裤/短靴，以及 Jean 的金色毛发和薄荷绿围巾。此前抽象 SVG 草稿不再由页面引用。

## 资源与播放

- `public/pilgrimage/route/milet-jean-walk.webp`：4 列 × 4 行，16 帧，每帧 384 × 384。一个循环 1100ms，约 14.5 帧/秒，包含双腿收拢、交会和展开的中间姿态。
- `milet-jean-idle.webp`：同尺寸站立姿态。
- `milet-jean-motion.json`：打包尺寸与对齐记录。
- `jean-painted-walk.webp`：Jean 独立完整姿态，4 × 4 共 16 帧，每帧 256px。与人物共用 1100ms 周期。
- `pilgrimageRouteDog.ts`：只按帧裁取完整 Jean 插画并绘制，已移除关节 IK、网格拉伸、分离四肢拼接及帧间形变。停步使用第 10 格的垂直承重姿态。
- `pilgrimageRouteHumanClips.ts`：沿人物轮廓裁取既有人物帧，排除旧狗的像素；牵引绳跟随人物手部坐标重绘。
- `pilgrimageRouteActor.ts`：Canvas 只在帧号、方向或姿态改变时重绘，没有独立动画计时器。
- `usePilgrimageMapRendering.ts`：现有路线 RAF 同时驱动位置与角色帧；资源加载完成才开始。后台暂停累计时间，长帧间隔限制为 64ms，减少返回页面时的位置跳跃。减少动态效果偏好启用时显示站姿并暂停移动。
- 到达终点切换站立，沿用原有 3 秒重播等待；切换路线或离开页面会取消 RAF/重播并使异步资源回调失效。
- 保持人物直立，以左右镜像跟随路线大方向；接近垂直时保留方向以避免翻转抖动。

素材由内置 image_gen 依据确认稿和逐帧关节参考生成；源图为工作区 `designs/pilgrimage-walking-duo/walk-sheet-16-generated.png`，完整提示词保存在同目录 `walk-sheet-16-prompt.md`。打包时以角色主体测量边界，排除脱离主体的零散像素对尺寸的影响；所有步行帧和站姿共用同一角色高度、脚底和脸部锚点，避免逐帧缩放抖动。打包脚本只做裁切、比例与锚点对齐、WebP 编码，不重新绘制角色。使用本机已有 sharp，不为应用增加运行时依赖：

```text
node scripts/pack-pilgrimage-actor.mjs ../designs/pilgrimage-walking-duo/walk-sheet-16-generated.png ../designs/pilgrimage-walking-duo/idle-generated.png <sharp-module-path>
```

人物是透明贴图，不是纯矢量。地图显示为 148px，源帧为 384px。旧路线 PNG、旧打包脚本和 CSS 单次序列帧方案已经移除。

## Jean 四肢失真修正

网格变形曾使 Jean 的前腿出现不自然弯曲。当前改用内置 image_gen 绘制的完整步行帧，最终源图为工作区 `designs/pilgrimage-walking-duo/jean-anatomy-walk-padded.png`。完整生成提示词已合并到同目录 `jean-walk-production-notes.md`；上游候选、关节参考和检查截图已清理，重新打包只依赖保留的最终 PNG 源图。

打包测量连通主体，忽略脱离主体的生成噪点，并检查所有姿态不触及源单元边缘。每只狗只做一次整体等比缩放和位置平移，统一围巾顶部与脚底锚点；不独立缩放下半身、腿或脚掌。最终肩部偏差不超过 1px，接地边界偏差不超过 1px（地图显示不到 0.4px）。

```text
node scripts/pack-pilgrimage-dog.mjs ../designs/pilgrimage-walking-duo/jean-anatomy-walk-padded.png <sharp-module-path>
node ../designs/pilgrimage-walking-duo/build-motion-preview.mjs
```

## 验证

```text
npm run type-check
node --test --import ./tests/pet/node-test-hooks.mjs tests/pilgrimage/route-actor.test.ts
npm run verify:ssr:local:watch
```

测试涵盖完整姿态不进行四肢形变、素材布局和统一高度/锚点、连续循环不越界、不同刷新率帧选择、暂停/恢复时钟及转向滞回。独立预览位于工作区 `designs/pilgrimage-walking-duo/motion-preview.html`，与网站复用同一渲染模块。已验证本地 SSR 澳门路线、桌面及 390px 手机布局、取消路线清理角色、预览中的停步与转向。

本次路线替换只修改公开端。地点 marker 的皮肤 ID、URL、尺寸、锚点和管理端选择契约保持不变；不新增 API、权限或数据库变更，因此 data-admin 与 milet-worker-ts 无需同步修改。
