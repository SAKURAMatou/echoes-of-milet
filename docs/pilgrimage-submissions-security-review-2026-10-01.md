# 巡礼投稿开放前安全审查（2026-10-01）

结论：当前继续保持测试模式。下文保留最初审查的复现记录；已修复 P1-1、P1-2 和 P2-1，P1-3 的准确长度签名及防覆盖条件已通过同日真实 R2 小文件验收，正常浏览器投稿成功。同日后续已配置 incoming/ 1 天生命周期并补上 job 独立年龄条件；job 新代码待部署，每日维护仍待实际运行验收，专用签名 token 范围和 WAF 配置本次未核实。未发现本次检查范围内的匿名审核越权、无需审核写入正式地点、跨投稿读取正文或邮箱、SQL 注入或后台存储型 XSS。

## 修复进度（同日更新）

- P1-1：与路由一致地去除末尾斜杠，创建入口共享限流。
- P1-2：D1 原子扣减每图 5 次、每稿 60 次处理额度，校验两变体后才复制；失败副本排持久化清理，成功才排 incoming 清理。全链路独立 120 次/60 秒 Binding 保护 D1 查询。
- P1-3：签入 Content-Length、Content-Type、If-None-Match，名额有效 10 分钟、PUT 有效 2 分钟；前端衔接条件重试。真实 R2 上长度多 1 字节返回 403 且没有对象，重复 PUT 返回带 CORS 的 412，原内容不变；正常浏览器 main/thumb、complete 和提交成功。上传入口接受超声明长度与覆盖已有对象的问题已取得拒绝证据；剩余网络请求成本、专用 token 权限与异常浏览器重试边界仍按验收记录说明。
- P2-1：每日任务改为在两分钟及数量预算内分页处理、输出积压计数，已过期 draft 不进入有效 backlog。剩余任务持久化供下一日继续，持续积压需队列扩容。
- P2-2：按此次范围未修改配置或轮换测试码。

修复后隔离投稿/限流/路由 47 项、相关 unit 45 项、公开端请求重试 3 项通过，Worker/公开端类型检查和公开端 SSR 构建通过。数据库沿用现有表，不需要新迁移。具体 R2 配置与上线验证见 [上传加固文档](./pilgrimage-submissions-r2-upload-hardening.md)。

初次审查检查公开端 Pages 代理、Worker middleware/route/handler/service/ORM、管理端审核组件，以及相关配置和清理逻辑，使用隔离的本地 D1/R2 测试。同日后续生产验收创建一条 is_test=1 的待审投稿，并对真实临时桶执行小文件签名探针，没有执行线上审核或写正式数据。配置读取确认临时桶没有公开入口、CORS 已更新；发现缺少对象过期规则后，按用户请求补上 incoming/ 一天生命周期并读取确认。专用 API token 权限、WAF 和新版 cron 实际运行未确认；详细范围见 [生产验收记录](./pilgrimage-submissions-production-validation-2026-10-01.md)。

## P1-1：末尾斜杠绕过创建接口的 Binding 限流

- 位置：Worker `src/middleware/pilgrimageSubmissionRateLimit.ts:28`；`src/router/TrieRouter.ts:162`；公开端 `functions/[[path]].ts:199`。
- 原因：middleware 只对严格等于 `/api/milet/pilgrimage/submissions` 的 POST 调用 Binding，而 TrieRouter 去除末尾斜杠后仍匹配同一创建 handler。Pages 的路径白名单也允许该路径后接 `/`。
- 本地证据：使用始终拒绝的测试 Binding，标准路径返回 429，末尾带 `/` 的路径进入下游并返回 200；`createRouter().testRoute('POST', path + '/')` 匹配成功。没有调用真实 Turnstile 或线上创建接口。
- 影响：攻击者不必绕过 Turnstile就能跳过创建入口的廉价短窗口防护，使请求进入 JSON 校验、D1 幂等查询和适用时的 Siteverify。创建成功仍需要真人验证和 D1 全局配额，因此不是绕过审核或直接修改正式数据。
- 修复：限流判断使用与路由一致的规范路径，或在代理/Worker 统一拒绝非规范路径；增加末尾斜杠回归测试。不要把整个图片流程重新纳入每分钟两次的创建额度。

## P1-2：失败的 complete 可无限生成副本而不增加配额

- 位置：Worker `src/component/public/pilgrimage-submission/SubmissionUploadService.ts:137`、`:164`、`:220`；配额仅在 `reserveImage` 中扣减。
- 原因：每次 complete 增加 generation，按变体逐个验证并写入 sealed。主图成功、缩略图缺失或失败时，主图副本已经写入；catch 将图片改为 failed 并释放 lease。下次 complete 可以立即重试，再写一份新 generation 的主图。没有累计 complete 尝试次数限制，也没有对此路径的 Binding 防护。
- 本地证据：只写入 incoming 主图，不写缩略图，连续调用三次 complete。三次均因 `IMAGE_NOT_READY` 失败，但 D1 及 R2 中存在三份不同 generation 的 sealed 主图；会话配额仍为 request_count=1、reserved_bytes=52，而 sealed 主图共 78 字节，未计入 incoming。小文件用于验证逻辑，不对线上消耗资源。
- 影响：一次有效草稿和一个图片名额即可在 30 分钟内反复增加 D1 写入、R2 读取/写入和临时存储；“最多六张、累计二十个上传名额、32 MiB”无法限制这条路径。原有图片租约只阻止同时处理，不能阻止顺序重复处理。
- 修复：在执行 R2 I/O 前，原子扣减每图/每会话的累计处理尝试额度；校验主图与缩略图全部成功后再开始 sealed 写入；失败尝试及时排清理，并保持有界重试与幂等。对于网络暂时失败可允许有限重试，不把失败用户直接永久封禁。
- 补充防护：图片、submit、status 等接口在鉴权前仍会访问 D1，未知 ID 和错误凭证请求也不消耗当前 Binding。需要覆盖整条投稿路径的较高阈值 WAF/独立滥用限流，避免匿名高频请求打到 D1；阈值必须容纳正常六张照片的上传流程，与创建的 2 次/60 秒额度分开。

## P1-3：签名 PUT 没有在上传入口限制实际字节数

- 位置：Worker `src/component/public/pilgrimage-submission/SubmissionUploadService.ts:37`；`src/component/shared/pilgrimage-submission/SubmissionImageValidation.ts:103`。
- 本地证据：签名的 `X-Amz-SignedHeaders` 为 `content-type;host`；没有绑定 Content-Length 或内容摘要。提交的 bytes/sha256 保存在 D1，在 complete 时才校验。没有对真实 R2 执行超大文件上传。
- 影响：取得签名的人可以绕过客户端 WebP 转换和文件大小检查，声明小文件却向固定 incoming key 上传更大的数据，也可在签名有效期内反复 PUT。complete 拒绝该文件可以保护审核材料和正式数据，但无法撤销此前的 R2 上传、操作和暂存成本。签名不能写其他 key，也不能直接写正式 bucket。
- 现状：此前实现文档已将签名重放、短时超额存储记录为剩余风险；D1 reserved_bytes 是声明额度，不是实际直传字节的硬上限。网站 WAF 不在 R2 S3 直传链路上。
- 修复选择：若公开开放前需要实际字节硬上限，采用有界流式上传网关，在写入前限制长度、累计额度与重试。若保留直传，需要验证并签入实际可执行的长度/摘要约束和防覆盖条件，并做真实 R2 与浏览器兼容性测试；不能仅增加前端检查或 complete 检查就宣称解决。R2 官方文档列出 PutObject 的条件请求和 Content-MD5 支持，但长度约束与浏览器行为仍需实际验收。
- 官方依据：[R2 预签名 URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) 明确 URL 在过期前可重复使用；[R2 S3 兼容性](https://developers.cloudflare.com/r2/api/s3/api/) 列出 PutObject 可用条件和头部。

## P2-1：每日清理吞吐明显低于每日接收额度

- 位置：Worker `src/component/admin/pilgrimage-submission/SubmissionMaintenanceService.ts:10`、`:54`、`:63`；`src/component/public/pilgrimage-submission/SubmissionService.ts:110`。
- 现状：每日仅运行一轮，最多处理 20 条过期投稿、50 个对账对象和 30 条维护任务；默认每日可新建 200 条。没有在单次调度内部继续分页消化。
- 本地证据：准备 25 条已过期草稿，执行一次维护，仅 20 条转 expired，另 5 条仍是 draft。
- 影响：过期 draft 仍进入 backlog 计数；持续大量创建后弃置会累积到 2000 条 backlog 上限，阻止正常投稿。图片副本和拒绝/过期材料的清理也可能长期积压，生命周期只能部分兜底，不能消除 D1 状态积压。
- 修复：保留“每天触发一次”，但在时间/操作预算内执行多批次，并在有积压时使用持久队列或后续任务续跑；创建时的有效 backlog 统计排除已经到期的 draft。至少增加过期草稿、孤儿对象和任务积压指标。不要求恢复每五分钟 cron。

## P2-2：测试访问码以明文 vars 保存在已跟踪配置中

- 位置：Worker `wrangler.jsonc:129`、`:255`；实际值不在本报告中复述。
- 影响：仓库或配置读取者可以获得测试门禁，知道测试码的人可在 test 模式使用投稿链路。它仍不能绕过 Turnstile 或管理员审核，public 模式也不依赖该门禁，因此不是生产管理员权限泄露。
- 修复：从 vars 移除，轮换已保存的测试码，并作为目标环境的 Worker secret 配置。单纯从当前文件删除不能使旧值失效。

## 本次确认的有效边界

- Pages 覆盖访客传入的 `X-Milet-Client-IP` 并注入来源密钥；Worker 对投稿链路要求来源密钥和有效代理 IP。共享来源密钥没有从公开配置接口返回。
- 创建需要 Siteverify success、允许的 hostname 及 `pilgrimage_submission` action；About Me 的同一 widget secret 被复用，但 action 校验仍保留。
- 写凭证和只读凭证分离、只存 hash、按投稿 ID 绑定并检查期限；公开状态接口不返回正文、邮箱、图片 key 或内部备注。当前 16 位十六进制是 64-bit 随机能力凭证，并非文档早期的 256-bit；本次没有发现可实际利用的枚举漏洞。
- JSON 有 64 KiB 有界读取，公开字段、图片参数、URL 协议及审核 patch 有服务端校验；SQL 值使用参数绑定。管理端显示采用 Vue 转义，URL 仅允许 http/https，并设置新窗口隔离。
- 地图链接解析为本地字符串解析，不会由 Worker 请求投稿者提供的任意 URL。
- complete 对实际读取字节执行长度、结构、尺寸和 hash 检查，sealed 与 incoming 分离，正式合并再次校验同一 sealed 材料；这是结构验证，不是完整图片解码。
- 管理路由需要会话及显式投稿权限；正式 create/update 还需要巡礼数据相应权限。审核和执行器使用版本、lease/fence 和 D1 原子守卫，正式提交检查地点/图集 revision。参考图不能作为发布照片采纳。
- 测试投稿不能合并到真实已发布地点，测试新地点强制保持 draft。
- 审核结果邮件只在管理员采纳或拒绝之后创建，模板转义 HTML，发送者/回复邮箱固定；匿名用户不能直接调用邮件服务作为开放 relay。

## 验证与开放判定

隔离环境共 42 项测试通过：现有 24 项投稿集成测试、8 项限流测试、6 项路由测试，以及本次 4 项复现探针。复现探针断言的是当前不安全行为，测试通过不表示漏洞已修复。临时探针和配置在审查结束后删除，业务代码未修改。

使用最新 Workers 类型 `5.20261001.1` 与本地 Wrangler schema 核对绑定接口，并检索官方 Workers、Turnstile、R2 文档。Rate Limiting Binding 按 Cloudflare location 限流，采用最终一致计数，不能承担精确累计账本；保留 D1 原子累计额度的方向正确。[官方说明](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

前两个已复现问题已修复，上传入口长度和防覆盖也已取得真实 R2 拒绝证据。incoming 生命周期兜底已配置；后续需部署 job 年龄条件补充，检查每日维护实际执行、专用 R2 token 桶范围及 WAF 路径/方法覆盖。当前保持 test，不以隐藏按钮或前端校验代替服务端保护。
