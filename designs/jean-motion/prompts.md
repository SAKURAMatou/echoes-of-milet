# Jean 动作素材提示词

母图与服装规范以 [`docs/assets/pet/jean-shirt-concept-v1.md`](../../docs/assets/pet/jean-shirt-concept-v1.md) 为唯一角色来源。方向动作可以改变头部、眼睛、耳朵与颈部，不能改变毛色、脸部身份、身体比例、站姿、四只爪、尾巴或衣服。

## 母图约束

> Preserve the exact Jean character from the reference image: cream golden retriever coat, navy eyes, a fully dark navy nose with only one tiny highlight (never white or hollow), the same face and body proportions, left-facing full-body standing pose, all four paws, fluffy tail, and simplified clean 2D illustration style. Preserve the exact pale butter-yellow sleeveless shirt, teal ribbed trim at neckline, armholes and lower hem, two small honeybee motifs with pale blue wings, and the exact readable dark navy word "Jean". Do not redesign, mirror, recolor, resize or reposition the body, paws, tail, garment, lettering or bee motifs. Only the head, eyes, ears and natural neck fur may move for the requested gaze direction.

## 五方向图集通用提示词

> Create one 3 columns × 2 rows spritesheet with exactly six equal cells in row-major order. Frame 1 is the exact neutral idle reference. Frames 2–6 form a smooth, evenly spaced transition toward **{DIRECTION}**. Keep the paws on one baseline and keep the torso, legs, tail, shirt silhouette, teal trim, two bees and “Jean” lettering pixel-stable. Animate only the eyes first, then a small head rotation or lift, with subtle ear follow-through and no squash or stretch. Every frame must show the complete dog with generous margins and no cropped fur, ears, paws or tail. Use a perfectly flat pure white background; transparency is optional because the project script removes the background and exports WebP. No checkerboard, gradient, grid lines, captions, labels, extra text, props, shadows, scene, logo or watermark.

方向替换值：

| 动作 ID | `{DIRECTION}` | 第 6 帧目标 |
| --- | --- | --- |
| `lookLeft` | screen-left, toward something close to Jean | 视线先左移，头颈逐帧向左探出约头宽 16%，鼻尖下压约 12°，身体不动 |
| `lookLeftUp` | screen-left and upward | 左上约 30°，保持侧脸 |
| `lookUp` | directly upward above Jean | 鼻尖向上，保持偏左的三分之四侧脸，不转成完全正面 |
| `lookRightUp` | screen-right and upward over the near shoulder | 向右上转头，和 `lookUp` 有清楚区别 |
| `lookRight` | screen-right over the near shoulder | 转向右侧，身体仍保持朝左且不能镜像 |

## 时间与处理规范

- 每个方向 6 帧，单帧时长为 `90, 70, 70, 80, 90, 110 ms`。
- Hover 进入时正向播放，第 6 帧停留；离开时沿原帧序反向回到第 1 帧。
- 脚本会把第 1 帧替换为当前 `idle.static.webp`，再按衣服锚点统一缩放、基线和画布。头部与身体不做局部拼接，避免颈部断层；身体和衣服的一致性由母图参考与逐帧生成约束保证。
- 运行时单元格为 `256 × 256`，锚点为 `(128, 232)`，最终输出透明 WebP。
