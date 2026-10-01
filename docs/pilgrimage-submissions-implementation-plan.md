# 圣地巡礼公开投稿实施方案

日期：2026-09-23。需求依据：[公开投稿需求文档](./pilgrimage-submissions-requirements.md)。本文为后续开发设计，不表示已创建表、接口、云资源或完成安全验证。

## 1. 基线与实施顺序

三个工程均使用已有 `pilgramage` 分支，基于已 fetch 的各工程主开发分支快进同步：

| 工程 | 同步来源 | 基线提交 |
| --- | --- | --- |
| 公开端 `echoes of milet` | `origin/ssr-cf-dev` | `20fa1a4` |
| 管理端 `data-admin` | `origin/echoes-room` | `41475fc` |
| 服务端 `milet-worker-ts` | `origin/master` | `c3cc77d` |

阶段顺序：数据库与协议 → 投稿上传 API → 审核合并服务 → 管理端 → 公开端 → Cloudflare 配置与联合验收。默认关闭公开功能，先完成可恢复的审核闭环再开放投稿。

首版使用弹层/移动端全屏投稿组件，不新增公开路由；地图链接为位置输入，不要求经纬度。服务端保留最小匿名状态查询能力，当前公开端使用投稿完成提示与邮件结果通知；最小照片署名纳入设计，数值限制保留为配置。不实现短链接联网展开、账号或自动翻译；可选邮箱不公开展示，在审核完成后用于发送结果通知及必要沟通。

## 2. 与当前实现的衔接

| 当前代码 | 复用及改动原则 |
| --- | --- |
| Worker `src/component/shared/pilgrimage/PilgrimageService.ts` | 复用地区校验、正式字段构造、地图解析及缓存清理；抽出可组合的数据库写入，不能直接串调现有 save 当作事务 |
| `src/component/db/pilgrimage/PilgrimageTableOrms.ts` | 保留现有地点/语言/图集查询方式，新增投稿 ORM；复杂参数化 SQL 通过现有 SQLLoader |
| `src/component/admin/image-upload/*` | 复用签名与类型校验经验，投稿独立 bucket、凭证、目录和状态；不能把匿名投稿接入正式上传初始化 |
| `src/middleware/adminPermission.ts` | 当前 permission 数组是 `.some()`，即 OR；审核动作与正式 create/update 必须在服务内再做 AND 校验 |
| 管理端 `src/components/pilgrimage/PilgrimageSpotFormCard.vue` | 当前由父级传入状态并发出 saveSpot；抽出适用的字段组给审核编辑器复用，不让旧保存事件绕过审核服务 |
| `data-admin/src/workers/webp.worker.ts`、`src/lib/webp.ts` | 延续任务 ID + postMessage + Promise，但公开端增加按需初始化、串行队列、清理和异常恢复 |
| 公开端 `src/composables/miletPilgrimage.ts`、`usePilgrimageDataState.ts` | 复用地点上下文；投稿状态独立，不写入正式地点缓存或 SSR 初始状态 |

## 3. 文件与职责拆分

下列为拟新增名称，实施中可顺应邻近文件命名作小范围调整，不引入新框架。

### Worker

- `src/component/shared/pilgrimage-submission/SubmissionTypes.ts`：状态、DTO、错误码、配置类型。
- 同目录 `SubmissionValidation.ts`：正文、URL、权利确认和发布字段白名单。
- 同目录 `SubmissionImageValidation.ts`：有界 WebP 容器检查、尺寸、元数据、hash。
- `src/component/public/pilgrimage-submission/SubmissionService.ts`：匿名会话、草稿创建、submit、状态查询。
- 同目录 `SubmissionUploadService.ts`：预占、签名、complete 冻结、移除。
- `src/component/admin/pilgrimage-submission/SubmissionReviewService.ts`：详情、差异、草案、拒绝、权限。
- 同目录 `SubmissionApplyService.ts`：持久化处理任务、正式图片转存、D1 原子写入和恢复。
- `src/component/shared/pilgrimage-submission/SubmissionMaintenanceService.ts`：清理、过期、恢复及缓存重试。
- `src/component/db/pilgrimage-submission/SubmissionTableOrms.ts` 与 `src/component/db/sql/` 下配套 SQL：参数化持久化逻辑。
- `src/handlers/milet/MiletPilgrimageSubmissionHandler.ts`、`src/handlers/admin/AdminPilgrimageSubmissionHandler.ts`：解析请求、调用 service、统一响应；在现有 routes 模块注册。

### 公开端

- `src/components/milet/pilgrimage/submission/PilgrimageSubmissionDialog.vue`：自主管理草稿、校验、提交及关闭；只接收类型/目标，发出关闭和成功事件。
- 同目录 `SubmissionImageUploader.vue`：图片队列、预览、取消/重试、用途/署名；不依赖父页面操作其内部任务。
- 同目录 `SubmissionResultPanel.vue`：投稿成功、投稿编号与邮箱结果通知说明。
- `src/composables/usePilgrimageSubmission.ts`：表单业务状态与会话；`useSubmissionImageQueue.ts`：转换/上传队列。
- `src/workers/submissionWebp.worker.ts`、`src/utils/submissionWebp.ts`：客户端延迟创建 Worker 和转换桥接。
- `src/composables/pilgrimageSubmissions.ts`：沿现有 composable API 组织方式封装代理请求；文案沿既有 zh/ja 配置组织。

### 管理端

- `src/pages/PilgrimageSubmissionsAdmin.vue`：列表筛选和分页，打开审核后只负责刷新列表。
- `src/components/pilgrimage/submission/SubmissionReviewDialog.vue`：按 ID 取详情、独立编辑/保存草案/确认/拒绝。
- 同目录 `SubmissionFieldDiff.vue`、`SubmissionImagePicker.vue`、`SubmissionTargetPicker.vue`：差异、鉴权图片、按需目标搜索。
- `src/api/pilgrimage-submissions.ts` 与 `src/composables/pilgrimage/usePilgrimageSubmissions.ts`：API 与列表协调。
- `src/router/modules/content.ts`：添加投稿管理页面；复用 shadcn-vue、全局通知、权限按钮和确认组件。

## 4. 数据模型与 migration

当前 migrations 最后编号为 0026；建议预留下一可用编号创建投稿表，落地前再次检查，避免与同期改动冲突。使用现有 D1 主 DB，不另建数据库。

| 表 | 主要字段及约束 |
| --- | --- |
| `pilgrimage_submissions` | `id TEXT PK`、`type` CHECK、`status` CHECK、`version INTEGER`、`original_target_id`、`target_spot_id`、`target_snapshot_json`、`payload_json`、`language`、`submitter_name/email`、权利声明版本/时间、`upload_token_hash`、`status_token_hash`、各凭证过期时间、`created_at/submitted_at/reviewed_at/expires_at`、结果地点 ID/动作/发布状态、`cleanup_status/cache_status` |
| `pilgrimage_submission_images` | 逻辑照片、归属、用途、说明、署名与状态；物理变体/重试对象拆到 objects 表，具体见第 15 节 |
| `pilgrimage_submission_reviews` | 随机 ID、投稿 ID、操作者、决定、字段选择、图片选择、before/after 快照、公开原因/内部备注、创建时间；只追加，保留原始投稿 |
| `pilgrimage_submission_apply_jobs` | `operation_id UNIQUE`、`submission_id UNIQUE`、审核计划 JSON/hash、基线版本、步骤、正式资源映射、lease owner/expiry、fencing version、错误码、次数、next_run_at |
| `pilgrimage_submission_quota` | `scope + window_start` 联合唯一、已预占次数/字节、到期时间；仅处理会话及启用的严格业务预算，不自建通用 IP 限流器 |
| `pilgrimage_submission_requests` | 投稿/操作范围 + idempotency key 联合唯一、请求摘要、结果引用/到期时间；禁止保存明文 token 或签名 URL |
| `pilgrimage_submission_review_drafts` | 可修改审核草案及版本，不能写入只追加的 reviews 表 |
| `pilgrimage_submission_objects` | 主图/缩略图每次尝试的不可变对象标识、key、hash、租约代数与清理状态 |
| `pilgrimage_submission_tasks` | 缓存失效/对象清理的持久化任务，与正式提交同批入队 |

正文 JSON 使用已验证的版本化 schema；邮箱与正文分列便于限期删除。所有表同步 ORM 列白名单和类型。索引：状态+提交时间、target_spot_id、expires_at、cleanup_status、job.next_run_at。匿名 ID 使用 crypto.randomUUID，凭证使用 8 字节安全随机数（16 位小写十六进制），数据库存其 SHA-256。

原始目标 ID 和名称快照不随地点变化抹掉。所有地点迁移/删除路径（包括导入）需检查：移动地区导致 ID 改变时更新活跃稿的当前引用；删除时解除当前引用并标记冲突，保留原始快照。禁止级联删除投稿历史。

为正式地点增加单调 `revision`，并覆盖语言表变更等影响合并的写入；普通编辑、导入、审核和区域迁移必须一致维护。图集内容亦需要版本或等效内容摘要校验，不能仅比较秒级 updated_at。该协调是审批并发安全的前置条件。

## 5. 公共协议

前缀 `/api/milet/pilgrimage/submissions`，路径匹配严格限界，ID 使用与随机 ID 格式相符的 validator。JSON 采用项目已有 `{ code, data, message }` 风格，增加稳定 `errorCode` 供 zh/ja 映射；响应不缓存。

```ts
type SubmissionInput = {
  type: 'new_spot' | 'update_spot';
  targetSpotId?: string; // 纠错必需，新地点禁止携带
  language: 'zh' | 'ja';
  title?: string;
  description: string;
  mapUrl?: string;
  address?: string;
  sourceUrl?: string;
  sourceDescription?: string;
  proposed?: { title?: string; workTitle?: string; address?: string; description?: string; tags?: string[] };
  submitterName?: string;
  submitterEmail?: string;
  rights: { accepted: boolean; version: string };
};
```

坐标和正式管理字段不在公开 DTO 内。中文/日文只在审核映射到现有 zh/jp 字段，不强制用户双语填写。

| 方法/相对路径 | 输入/权限 | 结果与语义 |
| --- | --- | --- |
| POST `/` | 初始正文、Turnstile token、创建幂等键；客户端安全生成的写/只读随机凭证 | 校验真人/目标/预算后创建 draft，只存凭证 hash，返回 ID 及到期时间；凭证留在客户端 |
| POST `/:id/images` | 写凭证；客户端生成逻辑 image client ID、两个变体的声明大小和 hash | 原子预占一个逻辑槽位与累计签发次数，返回 imageId、短期 PUT、到期时间 |
| POST `/:id/images/:imageId/complete` | 写凭证；幂等键 | 从 DB 定位 key，验证并冻结两变体，返回 sealed 状态，重复成功不复制新文件 |
| POST `/:id/images/:imageId/remove` | 写凭证；draft | 标记移除并排清理，不返还累计签发次数；释放未消耗槽位遵守会话累计上限 |
| POST `/:id/submit` | 写凭证；最终正文、选定 imageIds、幂等键 | 校验正文和图片已 sealed，冻结内容，条件更新 draft→pending |
| GET `/:id/status` | 独立只读凭证 | 仅状态、提交时间、公开处理原因和已公开结果链接；不返回正文/邮箱/内部错误 |

凭证放 `Authorization: Bearer ...`（公开端独立 API 客户端），不得复用管理端会话。检查公开代理头转发。当前公开端不持久保存只读凭证、不恢复投稿记录、不展示状态刷新操作；服务端最小状态查询接口保持兼容，不提供 ID 枚举找回。审核结果通过可选联系邮箱通知。

创建失败重试不能让用户重复消耗已验证 token 后陷入死循环：客户端在请求前使用 crypto.getRandomValues 生成并保存随机幂等键与两份独立会话凭证（各 8 字节，编码为 16 位小写十六进制），经请求体提交；服务端严格验证编码/长度，只存凭证 hash，把幂等记录和创建原子提交；相同 key、业务请求摘要及凭证重复请求返回相同 ID。首次创建仍必须成功验证 Turnstile，若验证成功但尚未创建就中断，客户端获取新 Turnstile token 后以相同业务幂等键重试。摘要不包含易过期的 Turnstile token，重试不允许无凭证读取别人结果。凭证由客户端生成是为避免普通 DB 保存可重发的明文 secret，不改变匿名会话权限边界；后续请求仍把凭证放请求头。

400 表示输入非法，401/403 表示凭证/权限无效，404 对不存在或无权访问采用一致语义，409 表示状态/版本冲突，410 表示过期，413 表示过大，429 表示限额，503 表示功能关闭或暂不可用。图片与正文错误返回可定位字段，不泄漏内部 key。

## 6. 图片冻结与直传实现

专用 `PILGRIMAGE_SUBMISSION_BUCKET`，拟配置桶名与签名凭证分别由变量/secrets 提供，不沿用正式 bucket 的通用签名密钥。目录：

```text
incoming/{submissionId}/{imageId}/{attemptId}/main.webp
incoming/{submissionId}/{imageId}/{attemptId}/thumb.webp
sealed/{submissionId}/{imageId}/{generation}/{mainHash}/main.webp
sealed/{submissionId}/{imageId}/{generation}/{thumbHash}/thumb.webp
```

只对 incoming 签 PUT；key 由服务端决定。图片处理名额自首次预留起有效 10 分钟，PUT 链接自首次预留起有效 2 分钟；重复申请不延长期限，不另建对象。签名绑定 Content-Type、准确 Content-Length 和 If-None-Match: *；浏览器由 Blob 自动生成 Content-Length，只显式发送 Content-Type 与 If-None-Match。删除旧 incoming 必须等签名到期加 60 秒，生命周期与对账兜底。2026-10-01 已取得真实 R2 长度篡改拒绝及正常浏览器投稿证据，具体范围见第 16.14 节链接的生产验收记录。

complete 在 D1 同批原子取得图片租约并扣减处理额度，每图最多 5 次、单稿累计最多 60 次，之后执行有界读取。主图和缩略图全部验证成功后才开始写 sealed；两份缓冲合计不超过 4.25 MiB。使用一次 R2 get 返回的对象及字节验证实际长度、MIME、RIFF 长度、块边界/padding、VP8/VP8L/VP8X 尺寸和标志、动画/EXIF/XMP，计算 SHA-256；超过上限立即停止读取。允许 Chrome/Skia 画布编码器生成的 ICCP 色彩配置，但要求 VP8X 标志一致、位于图像数据前、配置长度不超过 128 KiB，并校验 ICC 声明长度与 `acsp` 签名；仍拒绝 EXIF、XMP、动画及未知分块。不能先 head 检查后无界 arrayBuffer，因为两次读取之间可能被覆盖。写入失败排清理本代副本，成功冻结两变体后才排 incoming 清理，保留失败重试所需原材料；已 sealed 的 complete 幂等返回，不重复扣额度或读 R2。超出累计尝试额度返回 IMAGE_PROCESSING_LIMIT（409）。

同一份验证通过的字节写 sealed，禁止重新 get incoming 后复制。sealed key 必须包含处理 attempt/fence 与内容 hash，不复用不同字节的目标 key；同 key 的重试只接受完全相同 hash，并采用 R2 条件写入防覆盖。数据库租约只能保护 DB，不能阻止旧任务写 R2，必须同时隔离对象 key。DB 只在同一有效代数的两个变体均确认后标记 sealed；旧代对象不进入审核，作为孤儿清理。

结构验证不等价完整解码，正式发布仍需人工查看；不声称平台已提供病毒扫描或自动内容审核。保持 Worker 不做昂贵转码，但冻结校验必然需要有限二进制 I/O。

预览用管理端已认证 API fetch Blob 后生成 Object URL，关闭时撤销；不能把需要 Authorization 的地址直接赋给裸 img 并假定带登录头。返回固定 image/webp、no-store、nosniff；用户不获得 sealed 的 PUT，也不开放匿名服务端读取接口。

## 7. 审核权限、草案和正式合并

新增业务 subject 建议使用现有 camelCase 风格 `pilgrimageSubmission`，先复用现有 action `view/update`；查看用 view，草案/审核/重试用 update。若要进一步分离审核角色再扩展 action，避免同时引入无必要权限维度。同步 Worker 共享权限定义、路由权限映射、管理端权限标签和用户角色可配置项。

前缀 `/admin/pilgrimage/submissions`：GET 列表/详情/图片，POST `/:id/review-draft`、`/:id/apply`、`/:id/reject`、`/:id/retry`。路由至少声明投稿权限。apply/retry 服务内额外校验正式 `pilgrimage.create` 或 `.update`，新建地区仍通过已有地区管理权限，不在审核请求里隐式建地区。仅有审核权限不能写正式地点。

审核草案包含：draftVersion、resultAction、targetSpotId、expectedTargetRevision、按语言/字段选择的 patch、显式 clearFields、selectedImageIds、最终正式状态、公开原因和内部备注。草案与原始投稿分开保存，多管理员保存也带版本。

合并公式：最新正式完整数据 + 管理员选中的 patch。未选字段和缺省字段保持原值，清空只接受 clearFields 白名单。严禁直接将 submission JSON 传给 savePilgrimageSpot。图片默认追加；参考用途禁止进入 selectedImageIds。新地点由管理员补齐地区、中日文标题和坐标，普通投稿者的 nickname 不是 updated_by。

地图解析复用现有管理员接口，只预填候选值；链接包含地图视图中心时不能标成 exact，短链无法解析给出人工操作提示。是否采纳 mapUrl 不改变原投稿目标，改目标必须管理员主动操作并重新读取差异。

## 8. 持久化应用任务与事务方案

状态：draft→pending→applying→merged；pending→rejected；draft/pending 按期限→expired；applying 失败→apply_failed。merged 不因清理/缓存失败降级；结果同时保存 created/updated 与 draft/published。

1. apply 校验管理员 AND 权限、投稿/草案版本与正式目标 revision，原子抢占投稿并创建唯一 job，持久化不可变审核计划。返回 operationId，前端显示处理中。
2. job 获取带 fencing version 的短租约，生成确定性的正式图片 key，读取 sealed 并核对 hash，逐张复制到 `MILET_IMG_BUCKET`；正式主图及 preview 目录按现有 ImgInfo 字段约定映射。
3. 读取并校验最新目标和图集，建立整套参数化 D1 statements：地点与 zh/jp、图集/图片/关系、审核结果、job、submission merged。正式 ID 使用现有地区编号方式，唯一冲突时重新规划，不能产生重复地点。
4. 一次 D1 batch 原子提交。关键版本条件失败必须导致整个 batch 中止，采用第 15 节 CHECK 守卫；不能只在第一句使用 UPDATE WHERE revision 后忽略 0 行，也不能在普通 SELECT 中调用仅供 trigger 使用的 RAISE。P1 用真实 D1 测试证明整批回滚。
5. 缓存失效及临时清理任务与正式数据在同一 batch 中入队，提交后执行；不能提交完成才另写待办，否则中途终止会永久漏清理。响应丢失后再次 apply 查询同 job 返回既有结果。

普通地点编辑/导入也必须遵守 revision 更新；仅把审批路径加锁并不能阻止其他编辑。最终提交前重新验证目标、图集版本及 job fencing token，阻止长时间复制期间的陈旧审批。

复用既有 BaseRepository 的 protected batchSql 与 DBClient.batch，复杂 SQL 留在 db/sql，经 SQLLoader 加载。新增聚合提交 ORM 方法即可组合跨表 statements，不必新增事务框架。不使用跨请求 BEGIN/COMMIT，不依赖内存锁，也不引入第二套 ORM。

图集映射：选中图写 `img_info`，写 `img_series_items`，调整 `img_count`；已有封面不变，没有封面时按正式编辑确认的顺序选首图。无图集则创建 spot 类型图集及其必要 i18n。共享图集须提示并选择独立图集；如复制关系保留旧图，只复制关联，不重复复制已有 R2 对象。

job 的每一步可重复执行，正式 key 与 image→formal mapping 唯一。R2 成功/D1 失败留下的文件只由对账清理，清理前确认无正式引用且没有有效任务租约。正式 R2 中尚未被 D1 引用的副本不能视为强私有；只复制管理员已明确采纳的图片，失败后尽快清理，不把参考图提前放进去。

执行器与请求分离为可重入函数；首次可用 ctx.waitUntil 启动少量步骤，持久化任务由定时调用兜底恢复。waitUntil 不提供持久化保证。拒绝操作保存原因与状态后排清理，不尝试和 R2 删除组成事务。

## 9. 公开端交互与 SSR

页面入口传 `{ type: 'new_spot' }`；详情发出纠错事件，页面传 `{ type: 'update_spot', target: { id, title } }`。弹层打开时复制目标快照，后续地图切换不偷偷更改；从新地点入口重新打开必须清空旧 target。

组件状态：editing→preparing→uploading→submitting→success。转换可在 editing 期间逐张执行，上传开始前再验证真人和创建草稿；用户最终提交的正文在 submit 时校验持久化。关闭上传中的弹层需用现有风格确认，取消本地任务但承认已有 R2 PUT 可能已完成，服务端照常过期清理。

浏览器 Worker 懒加载，主线程维护 jobId→Promise、任务 generation 与 AbortController，串行 decode；复用一次 bitmap 生成主图/缩略图，finally close。Worker error/messageerror/超时会释放待办，允许重新创建；移除后忽略迟到结果，退出时 revoke Object URL。不支持 OffscreenCanvas 时本地 Canvas 回退，失败时拒绝原图上传。

只有 onMounted/客户端事件才访问 window/document/storage/Worker/Turnstile。初始 SSR 不渲染持久化投稿记录，不从随机 ID 决定 markup，上传组件采用异步加载；关闭销毁验证码实例。桌面与手机有清晰标题、焦点管理、键盘关闭、滚动隔离和错误定位。

## 10. 代理与 Cloudflare 配置交付

公开 `api-proxy.config.json` 加 submissions 路径；检查 `functions/[[path]].ts` 的 Authorization、幂等头、流式 body 及 no-store 响应转发。Pages 用可信客户端来源覆盖专用 IP 头，Worker 仅在 source guard 通过后信任。不把后端 origin 或来源密钥塞进浏览器。

管理 `public/_worker.js` 现有 `/admin/pilgrimage/` 的 GET/POST 可覆盖拟定 API；确认私有 Blob 预览和错误体不过滤，若增加头只放行必要项目。

配置清单：

- `PILGRIMAGE_SUBMISSION_BUCKET`、桶名、仅该桶签名用 key ID/secret；各实际部署环境分别绑定。
- 投稿开关、上传开关、图片限制、严格预算开关/阈值、保留期限；私有值用 secrets，不写文档中的真实值。
- Turnstile sitekey、secret、允许 hostname、action；公开预览同样保护，开发测试 key。
- WAF 按公开 host、投稿路径、方法匹配限流；普通页面 GET 不混入写请求计数，规则数量和窗口以实际套餐为准。
- 需要时添加 Workers Rate Limiting binding；仅做短窗口防刷，不作为精确总量计费器。
- R2 CORS 允许必要公开域名 PUT 和签名头；不开公开 bucket；incoming 生命周期兜底。
- Cron 增加投稿任务恢复/清理调度，并按 controller.cron 分流，保留原 D1 备份频率。
- 平台拦截可能不是 JSON，前端能保留表单并提示；API 明确限额返回 Retry-After。本站 WAF 不保护直连 R2 PUT。

配置清单作为开发交付项，实际启用前核实账号权限/套餐。当前方案不代表已配置云端资源，也不预设付费升级。

## 11. 缓存、清理和运维

合并后调用现有地点和新旧地区缓存失效，确保 region-tree、collections 受影响缓存同步失效；检查正式图集缓存、计数与封面相关缓存。失效任务持久化重试，清理不影响 merged 结果。处理中的投稿不出现在公开 API。

清理按有限批次执行：查询 DB 可清理记录→检查有效 job/正式引用→按记录的 key 删除→更新清理完成。分页 cursor/next_run_at 避免一次扫描全部 R2。incoming 残留通过签名到期后二次清理及 lifecycle 回收；sealed 依据状态，不能统一过期误删 pending。

要求保留内部结构化错误码、job 阶段与耗时、待审核数量、清理失败数，避免日志包含正文、邮箱、token、签名 URL。有权限管理员可重试失败应用；重新修改失败审核计划前先确认旧任务失效并处理孤儿资源，不对 merged 重开应用。

## 12. 可执行阶段与验收映射

| 阶段 | 交付物 | 退出条件 |
| --- | --- | --- |
| P0 协议固定 | DTO、状态、错误码、配置默认值、权限矩阵 | 需求第 3/7 节及匿名凭证恢复方案无矛盾 |
| P1 数据与原子操作 | migration、ORM、revision、quota、幂等 job 与 batch 守卫 | 真实 D1 中并发失败全回滚、唯一任务成立；见需求验收 6/8 |
| P2 匿名投稿上传 | 会话/Turnstile、签名、冻结、submit/status | 越权、超量、畸形图、重放 PUT、配对失败测试；见 1–5 |
| P3 审核合并 | 管理 API、正式图集映射、任务恢复、缓存/清理 | 部分采纳/新建/拒绝及全部失败窗口可恢复；见 6–10 |
| P4 管理界面 | 分页列表、独立审核弹层、差异选择与权限 | 仅有部分权限无法执行；图片预览鉴权且可清理 |
| P5 公开界面 | 两个入口、链接表单、异步转码和完成反馈 | 不填坐标即可投稿，目标稳定，弱网/移动端/SSR 正常；见 11/14/15/16.13 |
| P6 发布准备 | 平台配置清单、隔离环境联调及回退说明 | WAF/Turnstile/生命周期实际验证；见 12/13 |

测试必须覆盖：并发预占、错误目标、重复幂等键不同 payload、过期凭证、same job 重试、普通编辑与审批冲突、审批 lease 过期、复制后 DB 失败、提交成功响应丢失、清理期间重放 PUT、无头信息的错误图片、恶意 URL/文本、未采纳参考图不进入正式图库。

验证命令：Worker `npm run test:unit -- --run` 与必要 Worker pool `npm run test -- --run`；管理端 `npm run type-check`、`npm run build`；公开端 `npm run type-check`、`npm run build:ssr`、`npm run verify:ssr:local`。公开页面浏览器验证使用 `npm run verify:ssr:local:watch`，其生产读取只用于页面观察；写投稿安全测试使用隔离 D1/R2。管理联调在 Worker 工程直接 `npm run dev`，不改用远端 API。

上线顺序：追加 migration→关闭开关部署 Worker→配置私有桶与平台防护→部署并验证管理端→部署公开端→小流量启用。回退先关闭新建/签发，保留状态查询、审核、恢复和清理；不回滚删除已有投稿表或已经采纳的正式内容。

## 13. 本次文档工作的完成边界

本次仅同步本地巡礼分支、迁移需求文档和编写实施方案。未开发上述组件/API、执行 migration、运行功能测试或修改 Cloudflare。后续实现涉及三个工程，不能只部署公开端。管理端既有未提交用户管理改动不属于本方案，应原样保留。

## 14. 二次核查：隔离、安全与阻塞

### 14.1 隔离结论

**合适：审核完成前，所有投稿数据和审核中间数据都用新的 submission 表保存。** 不提前创建 `pilgrimage_spots` 草稿，不向 `img_info` 写 uploading 记录，不借 `img_series.is_public=0` 存待审核照片。用户原稿、图片元信息、管理员整理草案、审核决定、任务/租约、配额全部留在新表。

同一个 D1 内的新表是业务隔离，不是数据库级权限隔离：同一 Worker DB binding 仍可读写正式表。匿名 service 只依赖投稿 ORM；代码审查和越权测试保证公开 handler 无法调用正式保存方法。单独 D1 将失去正式数据与审核结果同批提交能力，首版不建议拆库。正式表允许增加 revision 这类并发控制元信息，但不保存待审核正文。

人工作出采纳决定后，进入 applying 才复制选中图片和提交正式数据；merged 为入库完成。若要求连 applying 期间的图片也绝不能被公开访问，需要给正式静态图片出口增加“已提交引用才可读”控制，并禁用绕过出口的公开 bucket 域名；否则只能承诺未采纳图片不进入正式桶，无法承诺跨 R2/D1 的瞬时原子公开。本文沿用前者的业务隔离要求，正式桶短时孤儿风险作为上线明确项。

### 14.2 发现与措施

| 优先级 | 核查发现 | 补强措施/验收 |
| --- | --- | --- |
| 必须 | R2 旧任务即使失去 DB lease 仍可能写同 key | 每个处理代数+hash 使用独立 sealed key，条件写，不同内容不覆盖；测试旧任务迟到 |
| 必须 | 审核草案原来无对应表 | 新增 review_drafts；最终审核记录不可修改；apply job 引用锁定计划 |
| 必须 | 判断目标版本再保存存在竞态 | 在同一 D1 batch 内做 CHECK 守卫，覆盖目标/图集版本、投稿状态、job fence 和审核版本 |
| 必须 | formal img_info 的 id 为自增整数，不能依赖批次外先写图片占 ID | 在 batch 内 INSERT 后紧跟映射更新取得 last_insert_rowid，再通过映射写图集关系；禁止交错无关 INSERT；验证回滚与多图映射 |
| 必须 | 只在成功后排清理可能漏掉任务 | 同批持久化 tasks/outbox，定时恢复；任务重试不得删除正式引用 |
| 必须 | 只校验两张图尺寸/hash，无法证明缩略图对应主图 | 审核必须能查看实际主图及缩略图，不能只看 thumb；人工选择涵盖两个变体，禁止审核后替换。若需机器保证对应，必须增加可信端缩略图生成，与纯客户端方案另作取舍 |
| 必须 | 公开 DTO/幂等记录可能把邮箱和凭证复制进长期 JSON | payload/plan/review/task/request 都显式白名单，邮箱只在独立列，token 只存 hash；不得记录完整请求体 |
| 必须 | 新增权限不能仅加常量和按钮 | 同步权限页面/模板配置；apply/retry 同时检查审核和正式编辑权限，按目标动作区分；当前巡礼无 publish 权限，不虚构已有权限，首版沿用 create/update 发布语义 |
| 必须 | 草稿过期、submit、remove、complete 可同时发生 | 每个写请求在最终 DB 写入时再次验证状态/过期/版本；submit 检查图片归属、两变体同代完成；取消不假设上传真的中止 |
| 必须 | 签发接口被限制仍可通过 complete/预览高频读取烧资源 | 分别限速和并发预算，sealed complete 返回已有结果不重复读 R2；预览鉴权后才读对象，读取和 body 有界 |
| 必须 | 管理员权限撤销后持久任务可能继续执行 | 最终提交前重新确认操作者可执行；撤权则暂停任务等待有权限者接管，接管留审计，不静默沿用旧授权 |
| 兼容 | 投稿 Bearer 可能被管理员认证中间件误识别 | 当前 adminAuth 路径保护需端到端测试；匿名凭证只能由投稿 handler 识别，不能作为管理 JWT 使用 |
| 兼容 | 前端 CSP/代理/缓存可能阻断 R2、验证码、Worker | 检查实际响应策略允许必要 connect-src/worker-src/frame-src/script-src，不能直接放宽为 *；敏感响应 no-store，所有来源含预览不能绕过保护 |
| 已知剩余风险 | 短期签名被反复请求、畸形编码无法靠头部证明可解码 | 准确长度及防覆盖条件已通过 2026-10-01 真实 R2 小文件验收；仍保留有限预占、结构验证、人工审核、隔离和清理；硬网络流量预算/完整解码需要受控网关/可信图像处理 |

### 14.3 实施阻塞的分类

没有发现必须更换架构的障碍，但以下是**正式开发/上线的前置验证项**，不是已经通过的能力：

1. P1：真实 D1 batch 守卫、自增图片映射、目标 revision 全写入路径覆盖。未完成前禁止接通正式合并按钮。先复用现有 batchSql，避免无关 ORM 重构。
2. P2：WebP 校验实现/测试样本、R2 条件写与旧租约竞争、读取大小硬边界。没有现成可信解码能力，不能把“完整解码安全”写成已实现。
3. P3：图集共享/计数/封面/删除和 ID 迁移并发策略；普通管理员编辑同样必须维护版本，不能只保护审批入口。
4. 部署：私有 R2、最小签名凭证、Turnstile、WAF 套餐能力、Cron 分流尚未实测；不阻塞本地接口开发，但阻塞公开启用。
5. 产品余项：纯直传的短时超额风险、正式桶 applying 窗口、状态查询凭证保留时长。按当前草案默认值设计，不把它们误写成技术已解决。

## 15. 必要表结构设计（DDL 草案）

本节为第 4 节的具体化，未放入 migrations、未执行到项目数据库。列名以本节为准。时间统一 Unix 毫秒 INTEGER，由服务端生成；同现有正式表的文本时间在边界转换，不混用比较。

固定 JSON 仅用于版本化正文/审核计划，不代替图片归属、任务状态和索引字段。DB CHECK 负责基本结构，字段长度、64 KiB 请求上限、URL 和业务 schema 仍由 service 校验。表间外键只引用新表；正式目标/图片 ID 为审计引用，不加会阻断正式删除/换 ID 的外键。

```sql
CREATE TABLE pilgrimage_submissions (
  id TEXT PRIMARY KEY NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('new_spot','update_spot')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN
    ('draft','pending','applying','apply_failed','merged','rejected','expired')),
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  language TEXT NOT NULL CHECK(language IN ('zh','ja')),
  original_target_id TEXT,
  target_spot_id TEXT,
  target_conflict INTEGER NOT NULL DEFAULT 0 CHECK(target_conflict IN (0,1)),
  target_snapshot_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(target_snapshot_json)),
  schema_version INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL CHECK(json_valid(payload_json)),
  submitter_name TEXT,
  submitter_email TEXT,
  rights_version TEXT NOT NULL,
  rights_accepted_at INTEGER NOT NULL,
  upload_token_hash TEXT NOT NULL CHECK(length(upload_token_hash)=64),
  status_token_hash TEXT NOT NULL CHECK(length(status_token_hash)=64),
  upload_token_expires_at INTEGER NOT NULL,
  status_token_expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  submitted_at INTEGER,
  reviewed_at INTEGER,
  reviewed_by TEXT,
  result_spot_id TEXT,
  result_action TEXT CHECK(result_action IN ('created','updated')),
  result_status TEXT CHECK(result_status IN ('draft','published','archived')),
  public_reason TEXT,
  CHECK(type <> 'update_spot' OR original_target_id IS NOT NULL),
  CHECK(status <> 'merged' OR (result_spot_id IS NOT NULL AND result_action IS NOT NULL))
);
CREATE INDEX idx_ps_queue ON pilgrimage_submissions(status, submitted_at, id);
CREATE INDEX idx_ps_target ON pilgrimage_submissions(target_spot_id, status);
CREATE INDEX idx_ps_expiry ON pilgrimage_submissions(status, expires_at);

CREATE TABLE pilgrimage_submission_images (
  id TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  client_image_id TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('publish','reference')),
  caption TEXT NOT NULL DEFAULT '',
  credit_name TEXT,
  display_credit INTEGER NOT NULL DEFAULT 0 CHECK(display_credit IN (0,1)),
  rights_version TEXT,
  rights_accepted_at INTEGER,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK(status IN
    ('reserved','validating','sealed','failed','removed')),
  generation INTEGER NOT NULL DEFAULT 1 CHECK(generation > 0),
  lease_owner TEXT,
  lease_until INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  reserved_bytes INTEGER NOT NULL CHECK(reserved_bytes > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(submission_id,client_image_id),
  CHECK(purpose <> 'publish' OR (rights_version IS NOT NULL AND rights_accepted_at IS NOT NULL))
);
CREATE INDEX idx_psi_parent ON pilgrimage_submission_images(submission_id,status);

CREATE TABLE pilgrimage_submission_objects (
  id TEXT PRIMARY KEY NOT NULL,
  image_id TEXT NOT NULL REFERENCES pilgrimage_submission_images(id) ON DELETE RESTRICT,
  variant TEXT NOT NULL CHECK(variant IN ('main','thumb')),
  stage TEXT NOT NULL CHECK(stage IN ('incoming','sealed','formal')),
  generation INTEGER NOT NULL CHECK(generation > 0),
  bucket_kind TEXT NOT NULL CHECK(bucket_kind IN ('submission','formal')),
  object_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN
    ('planned','ready','referenced','delete_pending','deleted','failed')),
  expected_bytes INTEGER CHECK(expected_bytes > 0),
  expected_sha256 TEXT CHECK(expected_sha256 IS NULL OR length(expected_sha256)=64),
  actual_bytes INTEGER CHECK(actual_bytes > 0),
  width INTEGER CHECK(width > 0),
  height INTEGER CHECK(height > 0),
  sha256 TEXT CHECK(sha256 IS NULL OR length(sha256)=64),
  etag TEXT,
  validator_version INTEGER,
  signed_until INTEGER,
  formal_image_id INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(bucket_kind,object_key),
  UNIQUE(image_id,variant,stage,generation),
  CHECK((stage='formal' AND bucket_kind='formal') OR
        (stage IN ('incoming','sealed') AND bucket_kind='submission'))
);
CREATE INDEX idx_pso_cleanup ON pilgrimage_submission_objects(status,signed_until);

CREATE TABLE pilgrimage_submission_review_drafts (
  submission_id TEXT PRIMARY KEY NOT NULL REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version > 0),
  plan_json TEXT NOT NULL CHECK(json_valid(plan_json)),
  target_spot_id TEXT,
  expected_target_revision INTEGER,
  updated_by TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE pilgrimage_submission_reviews (
  id TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  operation_id TEXT NOT NULL,
  event TEXT NOT NULL CHECK(event IN ('apply_requested','merged','rejected','expired','failed','takeover')),
  actor_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL CHECK(json_valid(snapshot_json)),
  public_reason TEXT,
  internal_note TEXT,
  created_at INTEGER NOT NULL,
  UNIQUE(operation_id,event)
);
CREATE INDEX idx_psr_parent ON pilgrimage_submission_reviews(submission_id,created_at);

CREATE TABLE pilgrimage_submission_apply_jobs (
  operation_id TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL UNIQUE REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  plan_version INTEGER NOT NULL DEFAULT 1,
  plan_json TEXT NOT NULL CHECK(json_valid(plan_json)),
  plan_sha256 TEXT NOT NULL CHECK(length(plan_sha256)=64),
  requested_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued','running','failed','committed','cancelled')),
  step TEXT NOT NULL DEFAULT 'copy',
  expected_target_id TEXT,
  expected_target_revision INTEGER,
  formal_spot_id TEXT,
  formal_series_id INTEGER,
  lease_owner TEXT,
  lease_until INTEGER,
  fence INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_run_at INTEGER NOT NULL,
  last_error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_psj_due ON pilgrimage_submission_apply_jobs(status,next_run_at);

CREATE TABLE pilgrimage_submission_quota (
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK(request_count >= 0),
  reserved_bytes INTEGER NOT NULL DEFAULT 0 CHECK(reserved_bytes >= 0),
  request_limit INTEGER NOT NULL CHECK(request_limit >= 0),
  byte_limit INTEGER NOT NULL CHECK(byte_limit >= 0),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(scope,window_start),
  CHECK(request_count <= request_limit AND reserved_bytes <= byte_limit)
);
CREATE INDEX idx_psq_expiry ON pilgrimage_submission_quota(expires_at);

CREATE TABLE pilgrimage_submission_requests (
  scope TEXT NOT NULL,
  idempotency_key_hash TEXT NOT NULL,
  actor_proof_hash TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
  submission_id TEXT REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  result_ref TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY(scope,idempotency_key_hash)
);
CREATE INDEX idx_psreq_expiry ON pilgrimage_submission_requests(expires_at);

CREATE TABLE pilgrimage_submission_tasks (
  id TEXT PRIMARY KEY NOT NULL,
  submission_id TEXT NOT NULL REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  task_type TEXT NOT NULL CHECK(task_type IN ('invalidate_cache','delete_object','purge_private_data')),
  target_ref TEXT NOT NULL,
  payload_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(payload_json)),
  status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','running','failed','done')),
  fence INTEGER NOT NULL DEFAULT 0,
  lease_owner TEXT,
  lease_until INTEGER,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_run_at INTEGER NOT NULL,
  last_error_code TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(submission_id,task_type,target_ref)
);
CREATE INDEX idx_pst_due ON pilgrimage_submission_tasks(status,next_run_at);

-- 事务内断言用途：成功事务不保留行；不得作为长期业务数据。
CREATE TABLE pilgrimage_submission_tx_guards (
  id TEXT PRIMARY KEY NOT NULL,
  passed INTEGER NOT NULL CHECK(passed=1)
);
```

### 15.1 表结构的关键执行约定

- images 是逻辑照片；objects 是物理主图/缩略图/每次尝试。所有准备写入 R2 的对象先登记 planned，再写对象再确认，避免写完但没有任何清理线索。异常时按 key 前缀和创建时间补充对账。
- sealed 成功要求当前 generation 恰有 main/thumb 两行 ready，hash/尺寸/validator_version 完整；submit 同批检查。DDL 的 UNIQUE 只限制最多一个，不代替“必须两个”。
- logical image 不存任意正式图 ID；formal_image_id 仅由应用 job 写 objects 映射，不接收用户输入。正式自增 ID 在同批 INSERT 紧后取得并写映射；后续所有 statements 通过对象映射 SELECT 引用，避免在应用层等待上一个 batch 的 ID。
- job 每投稿一行，重试复用 operation_id。发生目标版本冲突不得盲目重试旧计划：先 cancel/失效旧 fence、处理未引用对象，经管理员重审后递增 plan_version，重新排队并记录新审核事件。审核 event 的 operation_id 使用包含 plan_version/尝试序号的审计事件键，确保多次失败/接管都能留记录，而非被 UNIQUE 吞掉。
- reviews 只追加，drafts 可改；拒绝/过期也写审计。系统操作 actor_id 使用固定 system 标识，不伪装管理员。
- objects 中的准备正式资源记录仍属于新表，只有最后 batch 写正式 `img_info` 等。draft/pending 阶段绝不访问正式写入 API。
- tasks 提供缓存/清理状态，不再在 submission 重复维护不一致的 cleanup_status/cache_status。对象 delete_pending 和任务相互对应，任务 done 前确认删除，且签名有效时安排到期后的再次清理。
- 配额表 scope 由服务端决定，如 submission:{id}、global:day；同业务请求幂等记录、配额扣减及槽位创建一个 batch。不能用先读 count 再加的非原子流程；超过 CHECK 上限整批失败。
- 联系信息过期置 NULL；正文到期可置为 `{}` 并保留最小授权/采纳审计。需要删除整条投稿时按依赖顺序显式处理，新表 ON DELETE RESTRICT 防止误清除已采纳来源。

### 15.2 D1 事务守卫示意

将下面语句作为同一 batch 的第一句，版本预期由已鉴权的 job 提供；对创建目标、图集版本、权限版本等另写对应条件。它始终 INSERT 一行，条件失败写 0 触发 CHECK，而不是静默插入 0 行。此处仅演示投稿/job 条件，不能当作完整正式合并 SQL。

```sql
INSERT INTO pilgrimage_submission_tx_guards(id,passed)
VALUES (?, CASE WHEN EXISTS (
  SELECT 1 FROM pilgrimage_submission_apply_jobs j
  JOIN pilgrimage_submissions s ON s.id=j.submission_id
  WHERE j.operation_id=? AND j.fence=? AND j.status='running'
    AND j.lease_until>? AND s.status='applying' AND s.version=?
) THEN 1 ELSE 0 END);
-- 同一个 batch：正式写入 + 审核结果 + tasks 入队。
-- 同一个 batch 最后一条：
DELETE FROM pilgrimage_submission_tx_guards WHERE id=?;
```

正式表拟追加 `pilgrimage_spots.revision` 和 `img_series.revision`，使用 `INTEGER NOT NULL DEFAULT 1`。新增这些字段前先检查当前实际 schema；覆盖地点/语言、图集成员/封面/图片说明更改对 revision 的影响。可以用明确迁移 trigger 统一维护或修改所有 service 写路径，P1 必须选定一种并覆盖删除/导入。本节不提供未验证的全库 trigger 清单，也不把 revision 字段存在当成并发保障已成立。

### 15.3 校验范围与资料

DDL 草案可用独立 SQLite 内存库验证建表、CHECK、FK 和事务守卫回滚；这不等同 Cloudflare D1/Worker/R2 集成验收。正式 migration 仍须在隔离 D1 和完整现有 schema 上验证。

本次实际已完成内存 SQLite 校验：10 张表创建成功、超配额 CHECK 拒绝、无父记录 FK 拒绝、错误 fence 引起整笔事务回滚、正确 fence 提交成功、文档 UTF-8 正常。未执行到本地/远端业务 DB；未声称已完成 D1 集成测试。

- [D1 batch 文档](https://developers.cloudflare.com/d1/worker-api/d1-database/)：语句失败会回滚序列；0 行更新本身不是失败。
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)：条件操作和对象元数据，落地时验证条件失败返回分支。


## 16. 第一版落地与测试开放（2026-09-24）

当前三个工程的 `pilgramage` 分支已实现公开端三步投稿、地图链接、异步 WebP 主图/缩略图、投稿回执，管理端列表/逐字段差异选择/独立审核草稿/参考图片私密预览/审核合并，以及 Worker 投稿和审核 API。生产部署与真实 Cloudflare 验收尚未执行。

实际迁移为 Worker `migrations/0029_pilgrimage_submissions.sql`，包含上述 10 张隔离业务表、revision 字段与触发器。新增 `pilgrimage_submissions.is_test INTEGER NOT NULL DEFAULT 0 CHECK(is_test IN (0,1))`。审核前所有投稿数据存入新表，正式地点仅被读取；只有审核 job 的最终原子 batch 写正式数据。地点正常保存和导入也已接入 revision 守卫。图片采用新独立图集追加，保留原图集成员和封面，不就地修改共享图集。

### 16.1 开关与测试访问

以服务端 `PILGRIMAGE_SUBMISSION_MODE` 为准，默认 `off`：

| 模式 | 公开入口 | 创建投稿 |
| --- | --- | --- |
| off | 隐藏 | 拒绝 |
| test | 普通访客隐藏；有效访问码可见 | 需要测试访问码和正常 Turnstile 验证 |
| public | 公开显示 | 正常 Turnstile 验证 |

生产验证时在巡礼页面 URL 后添加 `?submissionTest=1`，显示测试访问码输入区。标记本身不是鉴权；访问码必须是通过 Worker secret 配置的 16 位小写十六进制随机值 `PILGRIMAGE_SUBMISSION_TEST_TOKEN`，不得进入 URL、Vite 环境变量、源码或文档。浏览器仅在当前标签页 sessionStorage 保存，以 `X-Pilgrimage-Test-Token` 请求头提交；退出测试移除。测试期间仍执行真人验证、配额、图片检查与审核权限。

测试投稿永久保留 is_test 标记，管理端显示测试提示。采纳新增内容强制生成 `draft`；纠正合并只允许选择由测试投稿生成且仍为 draft 的地点，不能更新真实地点或已发布地点。验证纠正链路时可从真实地点发起纠正，但审核时须改选此前生成的测试草稿；原始目标 ID 保留供审计。不要用普通地点编辑器发布测试草稿。测试采纳图片进入正式 bucket 的独立对象 key，用于验证跨 bucket 链路；草稿不公开列出，但正式图片不再享有待审 bucket 的私密属性，测试只使用非敏感素材。

切换 off 会停止新会话和新上传名额，已取得签名仍可能在最多 5 分钟内 PUT；完成处理与维护任务继续负责清理。紧急停止整个 Worker 写链路需在 Cloudflare 边缘阻断相应 POST，不能把隐藏入口当作封禁措施。

### 16.2 Cloudflare 上线前配置

1. 建立私有 R2 bucket `milet-pilgrimage-submissions`（wrangler 已声明绑定 `PILGRIMAGE_SUBMISSION_BUCKET`），关闭 r2.dev 和公开域名。S3 访问密钥仅授权该 bucket 对象读写，作为 secrets `PILGRIMAGE_SUBMISSION_ACCESS_KEY_ID` / `PILGRIMAGE_SUBMISSION_SECRET_ACCESS_KEY` 保存；`ACCOUNT_ID` 复用现有配置，`PILGRIMAGE_SUBMISSION_BUCKET_NAME` 与绑定一致。
2. 上传 CORS 只允许实际公开端 origin、PUT 和 Content-Type。CORS 不提供鉴权，不能限制持签名者在非浏览器环境使用 URL；授权与配额由签名、服务端会话和 D1 负责。[官方 CORS 文档](https://developers.cloudflare.com/r2/buckets/cors/)。
3. incoming/ 前缀配置 1 天生命周期兜底；sealed/ 前缀至少 100 天，覆盖 90 天待审期限。正式 bucket 不添加批量过期规则。生命周期不是实时清理保证，主清理由持久任务完成。[官方生命周期文档](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)。
4. 直接复用 About Me：公开端使用已有 `VITE_TURNSTILE_SITE_KEY`，Worker 使用已有 secret `ABOUT_FEEDBACK_TURNSTILE_SECRET`，不再配置独立的投稿 Site Key / Secret。允许的验证域名默认从 Worker 现有 `ALLOWED_ORIGINS` 提取 hostname；仅需额外收窄范围时才配置可选的 `PILGRIMAGE_TURNSTILE_HOSTNAMES`（逗号分隔，不带协议或路径）。服务端验证 success、hostname 和 action=pilgrimage_submission，不允许测试访问码跳过真人验证。[官方服务端验证文档](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)。
5. 在公开端所属 Cloudflare zone 给投稿 API 设置按 IP 的创建、签名、完成和查询限流，覆盖实际代理 URL；Worker origin 继续要求来源密钥。按套餐可用能力配置 WAF，返回 429，避免对 JSON API 直接返回交互挑战 HTML。R2 S3 域名直传不经过站点 WAF，不能依赖 WAF 限制直传重放和总字节数；短签名、累计名额、全局预算与生命周期共同兜底。
6. 应用 0029 迁移，部署 Worker、管理端与公开端，先保持 mode=off。为审核人员分配 `pilgrimageSubmission.view/update`，采纳还需要 `pilgrimage.create/update`；迁移只注册权限，不自动授予。
7. 配置 `PILGRIMAGE_SUBMISSION_UPLOADS_ENABLED=true`、`PILGRIMAGE_SUBMISSION_MAINTENANCE=true`，确认每天日本时间 04:00 的 cron 正常（UTC `0 19 * * *`）。最后设 mode=test 并配置测试 secret。旧 `PILGRIMAGE_SUBMISSIONS_ENABLED` 只在 MODE 未设置时作兼容判断，不覆盖显式 MODE。

### 16.3 正式环境验收顺序

- 普通窗口无入口；仅 URL 标记无访问码仍不能投稿；错误码、过期 Turnstile、错误 hostname/action 均拒绝。
- 测试窗口新增文字投稿、照片投稿、纠正投稿；验证主图/缩略图 WebP、R2 CORS、上传失败重试和参考照片不公开。
- 管理端逐字段选择，测试新建强制草稿；尝试合并真实地点必须失败；改选测试草稿后验证字段保留、版本冲突、重复提交不重复创建。
- 实际触发 cron，核对过期会话、拒绝材料、审核完成临时对象清理，任务失败可重试；验证正式引用图片不会被清理。
- 核对公开 API 不暴露待审内容、邮箱、上传 token 和测试口令；审核图片无凭证不能读取。
- 验证 Cloudflare 限流及低配额测试，观察 429、操作次数、bucket 字节和任务积压。按第 16.14 节验收 PUT 的长度签名及防覆盖；未通过真实 R2 验收前不宣称存储侧硬性字节上限。异常量必须能关上传开关并回收签名凭据。
- 验收完成再设 public；轮换/移除测试口令。测试标记仍保留在历史记录，不能自动把测试草稿发布。

### 16.4 当前验证结果与限制

本地 workerd 隔离 D1/R2 的 16 项业务测试和 6 项路由测试通过。三工程类型检查通过，管理端构建通过；公开端 SSR build 与本地生产数据验证服务启动成功。真实 Vue 组件已验证 Web Worker 转码及分步布局。上述结果不替代生产 Turnstile、R2 CORS/生命周期、WAF 和 cron 验收。

既有 Worker unit suite 存在与本功能无关的失败：文章预览测试引用不存在的 `0028_article_preview_revision.sql`，以及 timeline_id 输入预期不一致。0029 不占用该缺失迁移编号。部署前需核对线上迁移记录，不能把缺失文章迁移视为本功能已解决。

图片校验是有界读取、哈希和 WebP 结构/尺寸/元数据检查，不是完整像素解码或恶意内容审核。第一版由管理员人工核实图片内容。维护器对注册对象表进行对账；所有本功能对象先登记再写入，但不扫描清理人工绕过登记的任意 R2 对象。


### 16.5 图片格式与配置精简

R2 只保存客户端重新编码后的 WebP 主图和 WebP 缩略图。incoming 是 WebP 上传暂存区，sealed 是校验后的 WebP 待审副本，均不是手机原始文件；审核采纳后复制同一套 WebP 到 milet-img，并清理临时对象。转换失败不回退上传原文件。

About Me 与投稿共用 widget 密钥，但投稿每次单独生成 token，仍验证 hostname 与 action=pilgrimage_submission，也不复用 About Me 非生产环境跳过验证的行为。前端 Site Key 缺失时隐藏投稿入口，服务端 Secret 或可信域名配置缺失时拒绝创建。删除旧投稿专用 Site Key / Secret 配置不会影响新实现。


### 16.6 每日维护频率

投稿维护任务整体改为每天一次，日本时间 04:00（UTC cron `0 19 * * *`），默认配置与 production 环境一致。现有备份定时计划不变。

图片清理、投稿过期处理、个人信息清除、缓存刷新和中断合并任务恢复都在每日任务中执行。管理员正常采纳仍立即触发合并，但缓存刷新及异常恢复可能等到下一次每日运行；接受公开数据延迟显示。失败清理的 next_run_at 仍采用退避算法，但实际重试要等满足条件的下一次每日运行。凭证过期仍由请求实时校验。

每日运行在 2 分钟扫描/处理预算内分页：过期投稿按 50 条一页、最多 1000 条；对象对账按 50 个一页、最多 5000 个；维护任务按 30 条一页、最多尝试 10000 条；恢复最多 20 个合并任务。临时桶对象按页原子领取 fence，批量删除 R2，再同批确认对象与任务状态；部分失败可幂等重试。正式桶对象仍逐个验证没有有效 job 和正式引用。数量预算足以覆盖默认 200 稿每天各 6 张正常图片的 4800 个 incoming/sealed 回收对象，但实际完成量仍受 I/O、运行时间与套餐限制影响。到达上限时，持久化记录保留供下一日续跑，输出过期投稿、待回收对象、到期任务积压计数及警告。已过期 draft 不计入创建的有效 backlog，无需等 cron 才释放此限制；持续告警需接入持久队列扩容。R2 生命周期独立兜底，不随 Cron 修改而自动配置。


### 16.7 投稿流程入口限流（2026-09-26 修订）

Worker 使用 `PILGRIMAGE_SUBMISSION_RATE_LIMITER` Rate Limiting Binding，配置 limit=2、period=60。只在 `POST /api/milet/pilgrimage/submissions` 创建投稿会话时消耗额度，一次创建代表启动一次完整投稿流程。config、申请上传、完成校验、移除、最终提交及状态查询不消耗该短窗口额度；普通地点浏览和管理端审核也不在范围内，OPTIONS 不计入。测试模式下创建投稿仍计入。

限流 middleware 位于路由业务处理之前。所有投稿子接口校验 Pages 来源身份和可信代理转发的访客 IP，并调用独立的 PILGRIMAGE_SUBMISSION_ABUSE_RATE_LIMITER（120 次/60 秒），在访问 D1 查凭证前防刷。创建额外调用 2 次/60 秒的 Binding，末尾斜杠与规范路径统一计数。超限返回 HTTP 429、errorCode=RATE_LIMITED、Retry-After: 60、Cache-Control: no-store，提示“图片处理中，请稍后重试。”；相应绑定缺失/异常返回 503，不默默放行。图片流程不消耗创建额度，但依赖独立防刷绑定，同时由会话权限、D1 配额和状态机保护。OPTIONS、普通地点浏览和管理审核不受这些限制。

生产 Pages 代理覆盖 X-Milet-Client-IP，取 Cloudflare 提供的 CF-Connecting-IP；Worker 仅接受现有来源密钥校验通过的代理传入该标识，并用其哈希作为限流 key。开发 Vite 和 SSR 验证代理从实际 socket 地址生成标识，不信任用户自带的同名头或 X-Forwarded-For。匿名访客以 IP 区分，共用出口网络的访客会共用额度；该限制适合当前低流量测试，后续可按误限情况调整。

公开端请求遇到 RATE_LIMITED 时展示等待提示并依 Retry-After 自动重试同一请求，单次 API 调用最多自动重试 3 次；关闭弹窗/组件卸载取消等待。D1 QUOTA_EXCEEDED 和 IMAGE_PROCESSING_LIMIT 不自动重试。每张逻辑照片只占一个 `pilgrimage_submission_images` 名额，同时生成 main/thumb 两个 R2 对象；申请、complete 和移除只调用独立防刷 Binding，两个签名 PUT 直接访问 R2。D1 对单稿最多 6 张有效图片、单会话最多 20 次累计签发及 32 MiB 累计预占做原子校验，删除图片不返还累计签发额度。每图/单稿处理次数独立通过现有 quota 表的 complete-image / complete-submission scope 原子记录，不新增表或迁移。

wrangler 默认和 production 均声明绑定，分别使用不同 namespace_id 避免共用计数；部署前核对这些 namespace_id 不与账户其他 Worker 的用途冲突。应先部署支持身份转发的公开端代理，再部署启用限流的 Worker。生产验证应确认同一访客第三次创建在窗口内返回 429，同时用前两次创建得到的会话完成多张图片的申请、main/thumb PUT、complete、移除和最终提交，确认这些内部请求不会消耗或触发 Binding 配额。

Binding 是 Cloudflare 节点内最终一致的短窗口防刷，不保证全球严格每 60 秒恰好 2 次；不能替代 D1 全局累计额度。官方文档：https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/

验证重点：middleware 测试覆盖创建额度、图片流程豁免、来源身份校验、Binding 缺失/异常和不同访客 key；投稿集成测试覆盖 6 张逻辑图片上限及累计签发/字节配额。真实多节点限流和生产代理 IP 仍需正式环境验收。


### 16.8 多人审核：第一版版本校验，临时占用为后续可选升级（2026-09-26）

第一版确定沿用现有 submission.version、review_drafts.version、正式地点/图集 revision 和 apply job lease/fence，允许多人查看和编辑，通过提交时的版本校验拒绝陈旧写入，通过任务互斥防止重复合并。发生冲突后重新读取并核对，不自动覆盖他人修改。

“开始审核”临时占用仅作为后续可选升级，不属于第一版实现或验收范围，也不是上线阻塞项。本期不新增占用表、领取/续期/释放接口、heartbeat 或占用界面。只有实际出现多人重复审核的问题、决定升级时，才考虑下面保留的设计草案；现有图片处理租约和合并任务租约继续保留。

以下条目、DDL 和验收用例均仅适用于未来选择实施占用功能时：

- 查看详情不占用；有 update 权限的管理员点击“开始审核”才尝试取得占用。其他管理员可只读查看，界面显示处理人、到期时间，禁用保存/采纳/拒绝。
- 占用有效期 5 分钟，编辑期间每 60 秒续期。关闭弹窗主动释放；断网、崩溃或关闭浏览器时到期即可重新领取，不依赖每天一次的清理任务。
- 以投稿 ID 为唯一资源，持有者同时绑定服务端确认的管理员身份与该弹窗的随机 token；同账号不同标签页不能仅凭用户名互相续期/释放。数据库只存 token 哈希。无权用户不能取得、续期或执行审核写入。
- 领取使用 D1 原子条件 INSERT/UPDATE：只允许空闲或过期占用；每次重新领取递增 fence。并发领取只能成功一个，失败返回 409 REVIEW_IN_USE。重复领取同 token 可幂等返回当前占用。
- 保存草稿、拒绝、提交采纳/重试必须在现有同一 D1 batch 内检查 owner、token_hash、fence、lease_until>服务端当前时间，以及原有投稿/草稿版本。不能在 handler 先查占用后无条件写入。
- 续期只允许尚未过期的当前 token/fence，不得让旧页面复活失效占用；释放同样按 token/fence 比较，不能释放新持有者的占用。占用丢失后前端停止写操作，保留本地输入，重新领取后重新加载最新版本并人工核对，禁止自动覆盖他人草稿。
- 提交采纳时在一个 batch 内完成审核占用守卫、锁定计划、切换 applying、创建 job、释放编辑占用。此后由既有 job lease/fence 承担执行互斥，不要求管理员保持页面在线。拒绝同样在提交成功时释放占用。
- 第一期不加入强制抢占；到期可重新领取。未来如需强制接管，必须单独权限、原因和审计，并递增 fence 让原页面失效。

拟追加独立表（正式 migration 编号待落地时按最新目录确定，避免和其他分支迁移冲突）：

```sql
CREATE TABLE pilgrimage_submission_review_leases (
  submission_id TEXT PRIMARY KEY REFERENCES pilgrimage_submissions(id) ON DELETE RESTRICT,
  owner_id TEXT,
  token_hash TEXT,
  fence INTEGER NOT NULL DEFAULT 0 CHECK(fence >= 0),
  lease_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  CHECK ((owner_id IS NULL AND token_hash IS NULL) OR
         (owner_id IS NOT NULL AND token_hash IS NOT NULL))
);
```

释放后清空 owner_id/token_hash、lease_until=0，保留行和递增 fence，避免重新插入导致代次复用。时间统一毫秒。owner_id 用现有审核 actor 标识，来自登录上下文，禁止信任请求体。领取/续期/释放 API 放在 /admin/pilgrimage/submissions/:id/review-lease/* 并声明 pilgrimageSubmission.update 权限，不受公开投稿 60 秒 2 次限流影响；审核组件独立管理 heartbeat、卸载和失锁状态。

占用只覆盖“同一投稿”。两条不同投稿可能指向同一正式地点，继续用最终地点 revision 及图集 revision 守卫避免覆盖；后完成的一方收到冲突后重新核对。普通地点编辑器、导入等入口也由 revision 约束。

验收需覆盖：两人同时领取仅一人成功、同账号双标签隔离、无权用户领取/续期拒绝、到期后他人接手、旧 token 写入/续期/释放均失败、保存与接管竞态、采纳与拒绝竞态、审核人与普通编辑器冲突、正常合并不依赖 heartbeat、掉线不永久锁定。上述为方案设计，尚未新增表或启用占用功能。


### 16.9 正式地点并发保护（2026-09-26）

正式地点采用 revision 乐观并发控制：允许同时查看/填写，保存（含排序、状态快捷修改）和删除必须携带读取时的 revision，版本不一致或地点已删除/迁移时返回 HTTP 409 / PILGRIMAGE_VERSION_CONFLICT。管理端使用已有统一错误通知，失败保留弹窗输入，不自动换成最新版本强制重试。

保存已有的主表、多语言及 ID 迁移关联更新位于同一 D1 batch；事务守卫再次检查版本，覆盖预读之后的并发修改。删除补充同样的版本守卫与原子删除。地点和语言触发器持续递增 revision，审核写入同样会让旧编辑页面失效。无需新的 schema，依赖已有 0029 迁移。

导入已有地点必须提供源数据 revision：缺失/过期时返回逐条校验错误且不开始导入；有 revision 的已删除/迁移地点不能静默重建。写入时仍以预检版本守卫防止预检之后并发覆盖。导入保持原有分批/逐地点事务模型，不承诺整份导入全局回滚；并发造成中途失败时前面完成的批次可能已经生效。管理端在返回校验错误时不再显示导入成功。

审核第一版采用现有版本校验与任务互斥；16.8 节“临时占用”仅为后续可选升级，本期不实施。正式地点乐观校验已实现；未来即使引入编辑占用，也不能代替最终版本守卫。新增隔离 D1 验证覆盖同时保存只成功一方、语言写入与主表一致、旧版本/缺失版本删除拒绝、正确版本删除、旧导入文件禁止覆盖。


### 16.10 公开端图片失败分类与提示（2026-09-29）

公开端按失败发生阶段保留稳定错误码并显示对应的中日文提示，不再把格式、尺寸、客户端转换、R2 直传和 complete 校验统一解释为“文件过大”或普通网络失败。选择文件阶段直接按浏览器 `File` 属性判断；客户端转换错误由 Web Worker 或 Canvas fallback 返回；R2 PUT 失败由上传器转换为稳定错误码；complete 和投稿 API 保留 Worker 返回的 `errorCode`。弹窗关闭引起的主动取消不显示错误。

#### 选择与客户端 WebP 转换

| 阶段/错误码 | 判断条件 | 中文提示 | 日文提示 |
| --- | --- | --- | --- |
| 文件格式检查 | `File.type` 不是 JPEG、PNG、WebP | 无法识别这张照片的格式，仅支持 JPG、PNG 或 WebP。 | この写真の形式を認識できません。JPG・PNG・WebP のみ対応しています。 |
| 原文件大小检查 | 原文件超过 20 MiB | 原图超过 20 MiB，请选择文件更小的照片。 | 元画像が 20 MiB を超えています。ファイルサイズの小さい写真を選んでください。 |
| `IMAGE_DECODE_FAILED` | 浏览器不能解码，文件可能损坏或格式不支持 | 无法读取这张照片，文件可能损坏或格式不受支持。 | この写真を読み込めません。ファイルが破損しているか、対応していない形式の可能性があります。 |
| `IMAGE_DIMENSIONS_TOO_LARGE` | 解码后超过 4800 万像素 | 照片超过 4800 万像素，当前设备无法安全转换，请先降低分辨率。 | 写真が4800万画素を超えているため、この端末では安全に変換できません。解像度を下げてください。 |
| `WEBP_MAIN_TOO_LARGE` | 转换后的 2560 长边主图超过 4 MiB | 转换后的主图仍超过 4 MiB，请降低照片分辨率后重试。 | 変換後のメイン画像が4 MiBを超えています。写真の解像度を下げて再試行してください。 |
| `WEBP_THUMB_TOO_LARGE` | 转换后的 640 长边缩略图超过 256 KiB | 转换后的缩略图仍超过 256 KiB，请更换照片后重试。 | 変換後のサムネイルが256 KiBを超えています。別の写真で再試行してください。 |
| `WEBP_UNAVAILABLE` | Canvas/OffscreenCanvas 无法生成 WebP | 当前浏览器无法生成 WebP 图片，请更新浏览器或更换设备后重试。 | このブラウザでは WebP 画像を生成できません。ブラウザを更新するか、別の端末で再試行してください。 |
| `CONVERSION_TIMEOUT` | 客户端转换超过 45 秒 | 照片在本机转换超过 45 秒，请选择分辨率较低的照片后重试。 | 端末での写真変換が45秒を超えました。解像度の低い写真で再試行してください。 |
| `CONVERSION_FAILED` | Worker、Canvas 或其他未分类转换异常 | 照片在本机转换失败，请重试或更换照片。 | 端末での写真変換に失敗しました。再試行するか、別の写真を選んでください。 |

#### R2 直传与 complete 校验

| 错误码 | 判断条件 | 中文提示 | 日文提示 |
| --- | --- | --- | --- |
| `UPLOAD_NETWORK_MAIN` | 主图 PUT 的 `fetch` 被网络、浏览器或 CORS 中断，无法读取 HTTP 响应 | 主图上传请求未能到达图片服务器，可能是网络中断或浏览器拦截，请检查网络后重试。 | メイン画像のアップロード要求が画像サーバーに届きませんでした。通信切断またはブラウザによるブロックの可能性があります。通信環境を確認して再試行してください。 |
| `UPLOAD_NETWORK_THUMB` | 缩略图 PUT 的 `fetch` 被网络、浏览器或 CORS 中断 | 缩略图上传请求未能到达图片服务器，可能是网络中断或浏览器拦截，请检查网络后重试。 | サムネイルのアップロード要求が画像サーバーに届きませんでした。通信切断またはブラウザによるブロックの可能性があります。通信環境を確認して再試行してください。 |
| `UPLOAD_EXPIRED` | R2 返回 `ExpiredRequest` | 图片上传时间已过，请移除该图片后重新选择。 | 画像のアップロード期限が切れました。画像を選び直してください。 |
| `UPLOAD_SIZE_REJECTED` | R2 PUT 返回 413 或 `EntityTooLarge` | 图片服务器拒绝了文件大小，请重新选择照片后重试。 | 画像サーバーがファイルサイズを拒否しました。写真を選び直して再試行してください。 |
| `UPLOAD_AUTH_REJECTED` | R2 PUT 返回 401/403、`AccessDenied`、签名不匹配或访问密钥无效 | 图片上传凭证无效或已过期，请移除该图片后重新选择。 | 画像のアップロード認証が無効または期限切れです。画像を選び直してください。 |
| `UPLOAD_SERVICE_UNAVAILABLE` | R2 PUT 返回 5xx、`RequestTimeout` 或 `SlowDown` | 图片存储服务暂时不可用，请稍后重试。 | 画像ストレージを一時的に利用できません。しばらくして再試行してください。 |
| `UPLOAD_REJECTED` | R2 返回其他可读取的非成功响应 | 图片存储服务拒绝了上传，请稍后重试。 | 画像ストレージがアップロードを拒否しました。しばらくして再試行してください。 |
| `INVALID_IMAGE` | 上传初始化参数中的大小、hash、用途或照片状态不合法 | 图片转换结果未通过上传参数检查，请重新选择照片。 | 変換後の画像がアップロード条件を満たしていません。写真を選び直してください。 |
| `IMAGE_NOT_READY` | complete 时 R2 对象不存在或 Content-Type 不是 `image/webp` | 图片服务器尚未收到完整文件，请检查网络后重新上传。 | 画像サーバーが完全なファイルを受信していません。通信環境を確認して再アップロードしてください。 |
| `IMAGE_SIZE` | R2 实际大小越界、与声明大小不同或读取长度不一致 | 服务器收到的图片大小与上传记录不一致，可能是上传不完整，请重新上传。 | 受信した画像サイズがアップロード記録と一致しません。アップロードが不完全な可能性があるため、再アップロードしてください。 |
| `INVALID_WEBP` | complete 的 RIFF/WebP 结构、尺寸或元数据检查失败 | 上传后的文件未通过 WebP 格式检查，请重新选择照片。 | アップロード後のファイルが WebP 形式の確認に通りませんでした。写真を選び直してください。 |
| `IMAGE_HASH` | R2 对象 SHA-256 与客户端声明不一致 | 上传后的图片内容与本机文件不一致，请检查网络后重新上传。 | アップロード後の画像内容が端末上のファイルと一致しません。通信環境を確認して再アップロードしてください。 |
| `IMAGE_CONFLICT` | complete 冻结已校验图片时发生条件写入冲突 | 服务器保存已校验图片时发生冲突，请稍后重试。 | 確認済み画像の保存中に競合が発生しました。しばらくして再試行してください。 |

#### 投稿 API 与诊断规则

| 错误码 | 判断条件 | 中文提示 | 日文提示 |
| --- | --- | --- | --- |
| `API_NETWORK_ERROR` | 投稿 API `fetch` 未取得任何响应 | 连接投稿服务失败，请检查当前网络后重试。 | 投稿サービスに接続できません。通信環境を確認して再試行してください。 |
| `API_RESPONSE_ERROR` | 投稿 API 返回非成功状态且没有可识别 JSON `errorCode` | 投稿服务返回了无法识别的响应，请稍后重试。 | 投稿サービスから認識できない応答が返されました。しばらくして再試行してください。 |
| `UPLOAD_FAILED` | 兼容旧调用或旧部署的通用上传失败码 | 图片没有上传成功，请稍后重试。填写内容仍保留在本页。 | 画像をアップロードできませんでした。しばらくして再試行してください。入力内容は保持されています。 |

R2 非成功响应在浏览器控制台只记录变体、HTTP 状态和 R2 `<Code>`，不记录签名 URL、投稿凭证或图片内容。若浏览器因 CORS 或网络策略不允许读取响应，前端只能归类为对应变体的 `UPLOAD_NETWORK_*`，不能把它断言为 R2 鉴权失败。排查顺序为：没有 `/images` 请求表示选择或转换失败；`/images` 成功但 PUT 失败且没有 complete 表示直传问题；两个 PUT 均成功而 complete 失败表示服务端对象校验问题。


### 16.11 外部邮件与审核结果通知（2026-09-29）

Worker 的外部邮件能力放在 `src/component/shared/external-email`，调用方依赖统一的 `ExternalEmailService`，由 `ExternalEmailServiceFactory` 根据 `EXTERNAL_EMAIL_PROVIDER` 创建实现。第一版只支持 `resend`，具体 HTTP 调用封装在 `ResendEmailService`；以后增加服务商时新增实现并扩展工厂分支，不在业务 service 中判断服务商或拼接请求。邮件主题、HTML 和纯文本正文放在独立 `templates` 目录，通过稳定模板 key 与类型化 payload 渲染，使其他业务可以选择自己的模板。

所有发往外部地址的邮件统一使用发件人 `echoes of milet <noreply@mail.miles-dml.org>`，回复地址固定为 `pil-contact@miles-dml.org`。Resend API key 只通过 Worker secret `RESEND_API_KEY` 注入；普通变量 `EXTERNAL_EMAIL_PROVIDER=resend` 用于选择服务商。代码、公开端、管理端和日志均不得保存或输出 API key。部署时分别为目标环境执行 `wrangler secret put RESEND_API_KEY --env production`，再部署包含变量与迁移的 Worker；非 production 环境按实际使用的 Wrangler 环境单独配置 secret。

审核结果邮件使用 `pilgrimage_review_result` 模板。只有投稿保存了格式有效的联系邮箱时才创建通知；邮件包括投稿编号、类型、简要标题/说明、采纳或拒绝结果、公开审核说明，以及采纳后的创建/更新和公开状态。模板按投稿语言选择中文或日文，所有投稿文本在 HTML 输出前转义并限制长度。公开端在资料步骤即时校验可选邮箱，服务端再次校验，空值不创建通知。

审核决定与邮件发送解耦。拒绝时在保存审核决定的同一 D1 batch 中写入通知 outbox；采纳时在正式地点、审核结果和任务完成的同一原子提交中写入 outbox。事务提交后尝试立即发送，失败不会回滚已完成的审核。`external_email_outbox` 使用唯一幂等 key、状态、attempt count、lease/fence 和 next_run_at 防止并发重复发送；Resend 请求携带相同 `Idempotency-Key`。失败按服务商 `Retry-After` 或指数退避重试，最多 8 次；每日维护任务补发到期邮件，已发送记录保留 90 天，最终放弃记录保留 180 天后删除。日志只包含 outbox ID、模板、次数和稳定错误码，不包含收件人、正文或密钥。

数据库结构由 `migrations/0033_external_email_outbox.sql` 创建。上线顺序是先应用 D1 migration，再配置 secret 和 provider 变量，最后部署 Worker。若外部服务或配置暂时不可用，审核仍可正常完成，通知留在 outbox 等待维护任务重试；审核接口不把第三方错误或敏感信息返回管理端。

### 16.12 指定地点仅补充照片（2026-09-30）

地点详情的补充入口将当前地点 ID 传入公开投稿弹窗，创建 `update_spot` 投稿并绑定目标。只选择“补充照片”时，名称、地图、地址和作品名无需填写，简短照片说明仍必填；该说明属于投稿资料，不自动替换正式地点说明。公开端同时提示照片用途，只有可公开照片能被审核采纳。

管理员选择合并已有地点，保持文字、位置和状态字段不勾选，仅查看并选中照片即可采纳。无图集时创建地点图集；有图集时须明确选择独立图集，复制旧照片关联、排序和封面后追加新照片，再更新目标地点的图集关联。原图集及已有照片文件保持原样。目标地点和原图集继续执行 revision 守卫，重复处理已完成任务不重复追加照片。

隔离 D1/R2 集成测试已覆盖无图集和已有图集两种照片补充场景，验证目标绑定、纯照片审核、旧照片和封面保留、文本和坐标不变、任务重复执行幂等。测试模式仍保留现有保护：测试投稿不能合并到真实已发布地点，需按测试目标规则验证；正式使用需要切换正常开放模式。

### 16.13 公开端说明与投稿完成反馈（2026-10-01）

`PilgrimageSubmissionDialog` 在弹窗头部展示备用邮件投稿说明，并提供 `mailto:dml4015@miles-dml.org` 链接。填写资料、上传照片和预览确认各步骤均可见，提交成功后隐藏。此说明覆盖弱网、网络策略等上传失败情况，不替代细分错误提示，也不把网络失败误判为文件过大。邮件需包含地点信息、照片及说明。

`SubmissionResultPanel` 只在最终提交成功后展示成功状态、投稿编号及邮箱通知说明。移除保存查询凭证、刷新状态和页面投稿记录入口，不在本设备保存投稿凭证；页面挂载时清除旧版本的 `pilgrimage-submission-receipt`。草稿创建、幂等提交及服务端 `/status` 协议保持兼容，无需 Worker 或数据库变更。

使用说明由独立 `PilgrimageUsageGuide` 弹窗管理四步内容、前后切换、步骤跳转和关闭，页面仅协调开启/关闭。首次显示在客户端挂载后判断，关闭、稍后再看或完成时仅保存 `pilgrimage-usage-guide-v1=seen` 标记；同一浏览器后续访问不自动弹出，页面「查看使用说明」可随时重开。存储不可用时仍允许查看和关闭，首次判断不进入 SSR，避免 hydration 不一致。中日文共用同一个已读标记。

「查看使用说明」与「地图介绍与致谢」放在同一个响应式入口区域，按容器实际宽度判断：达到 28rem 时同行，否则分为两行；中文、日文各入口保持完整文字与至少 44px 点击高度。地图介绍使用带 aria-expanded / aria-controls 的独立按钮控制内容显示，正文单独占满入口区域宽度，展开后不会改变两按钮所在位置。

地图介绍展开时，通过 nextTick 和 ResizeObserver 测量说明内容高度，将该高度加到桌面工作区的原有高度及最小高度上，保持地图与详情区域原有可用高度。手机保持页面自然文档流；监听器在页面卸载时清理，初始状态为关闭且不依赖视口读取，保持 SSR 首屏一致。

### 16.14 开放前安全加固（2026-10-01）

修复创建路径末尾斜杠绕过限流、失败 complete 无上限复制和每日单批清理积压。补充全流程独立 120 次/60 秒防刷、处理累计额度、完整配对校验后再复制及失败副本清理。图片名额 10 分钟、PUT 链接 2 分钟，不因重试续期。复用既有 quota/object/task 表，没有新增 migration；管理端没有协议改动。

直传签名已加 Content-Length 与 If-None-Match，公开端支持服务器返回的 uploadHeaders，以及条件重试的 412 响应。控制台必须在临时桶 CORS 中加入 If-None-Match，否则新上传会被浏览器拦截。发布顺序、可粘贴的 CORS JSON、小文件长度篡改与重放测试见 [R2 上传加固与部署验收](./pilgrimage-submissions-r2-upload-hardening.md)。本地测试不能替代真实 R2 执行验证；完成验收前继续 test/off。P2-2 测试访问码轮换不在本次修改范围。

同日部署后的 [生产验收记录](./pilgrimage-submissions-production-validation-2026-10-01.md) 已确认正常页面异步 WebP 上传、complete、最终提交，以及真实 R2 长度篡改 403、防覆盖 412、过期签名 403；标准路径及末尾斜杠创建均观察到 429 / Retry-After: 60。Binding 最终一致且按 location 限流，不能承诺第 3 次请求严格拒绝；D1 保持累计额度职责。CORS 正确、临时桶非公开，初次发现缺少 incoming/ 对象生命周期，同日后续已补配 1 天兜底，详见 16.15；2026-10-02 04:00 JST 起可检查每日维护实际运行。本次 job 补充仍需重新部署。此次只新增待审测试稿，没有执行审核或合并正式地点。

### 16.15 incoming 一天保留与清理对账（2026-10-01）

原有每日维护只按投稿终态、图片移除、冻结成功和旧 generation 选择对象。新增独立的一天条件：临时桶中 stage=incoming 的已登记对象，created_at 距本轮维护开始满 86400000ms 后，即使所属投稿仍为 draft、图片仍为 reserved/failed，也进入对账候选。未满一天的对象仍可按冻结成功、移除或投稿终态等既有原因提前清理。

| 材料与状态 | 清理方式 | 保护与结果 |
| --- | --- | --- |
| 满一天的已登记 incoming | 每日 job 选择候选，创建唯一 delete_object 持久任务 | 保留 10 分钟更新时间宽限、有效图片处理租约与审核任务租约保护；删除时点不早于 signed_until + 60 秒 |
| 已冻结成功的 incoming | complete 后排队，或每日对账补排 | 不必等一天；原签名到期及宽限结束后即可删除 |
| R2 已先删除的 incoming | 同一持久任务再次执行幂等 delete | 文件缺失也视为删除完成，D1 对象置 deleted、任务置 done |
| R2 删除失败 | 保留对象记录，任务置 failed 并设置 next_run_at | 指数退避，下一次每日维护继续；不提前确认删除 |
| 未登记、写入中断的 incoming 孤儿 | R2 incoming/ 前缀生命周期 | 按 R2 对象上传年龄 1 天过期，不依赖 D1 记录或 job 是否正常运行 |
| 待审的当前 sealed | 不受 incoming 年龄条件和生命周期影响 | 继续按投稿状态、generation 和任务清理，覆盖原定 90 天待审期限 |
| 正式桶 milet-img | 沿用正式引用和活跃任务检查 | 没有新增按年龄批量过期规则 |

Worker 沿用现有对象表、任务表、fence/lease、批量 R2 delete 和 D1 原子确认，不增加 migration，也不把 Cloudflare 管理 API/token 放入 cron。维护 backlog 的 objects 统计同步计入满一天的 incoming。每日调度仍为 UTC `0 19 * * *`（日本时间 04:00），扫描/处理预算仍为 2 分钟、1000 条过期投稿、5000 个对象、10000 次任务尝试。

R2 生命周期是独立的基础设施配置。参考基线保存于 Worker `config/r2/pilgrimage-submissions-lifecycle.json`：保留原有 7 天 multipart abort，仅给 incoming/ 添加 deleteObjectsTransition，Age / maxAge=86400（Cloudflare REST 单位为秒）。配置更新前读取并合并当前规则，不能用基线文件覆盖未来新增的其他规则；不得把 prefix 改为空串或 sealed/。R2 到期删除异步执行，1 天是过期条件，不是文件恰好在第 24 小时消失的保证。[官方说明](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)

每天运行一次意味着错过本轮年龄门槛的对象需等次日；运行失败或达到预算后也会延后，所以应用任务的目标清理时间与 R2 生命周期兜底都不是严格 24 小时 SLA。业务代码需要重新部署后生效；R2 规则单独配置，不随 Worker 部署自动更新。验收时查看 expiredScanned、objectsScanned、tasksAttempted 和 backlog，核对对象 deleted、任务 done，并确认待审 sealed 与正式引用图片仍在。

新增隔离测试覆盖：满一天但投稿未过期的 incoming 清理、未满一天与 sealed 保留、有效处理租约与 PUT 签名宽限、生命周期先删后的 D1 对账；连同既有删除失败重试等回归，共 50 项投稿/限流/路由测试通过。具体云端配置读取状态和页面截图更新于 [生产验收记录](./pilgrimage-submissions-production-validation-2026-10-01.md)。
