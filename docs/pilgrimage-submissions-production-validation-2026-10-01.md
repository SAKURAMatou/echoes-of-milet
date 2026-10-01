# 巡礼投稿生产验收记录（2026-10-01）

本次在已部署的 `https://miles-dml.org/ja/milet/pilgrimage` 和真实 R2 上测试。正常投稿、长度签名、防覆盖、CORS 与创建限流均取得实际结果；保持 `MODE=test`。初次验收没有执行审核、合并正式地点或修改生产配置；同日后续按用户请求添加的 R2 生命周期及清理/页面修改单独记录于下文。本记录不是完整渗透测试或负载测试。

## 浏览器正常流程

普通页面没有公开投稿入口；添加 `submissionTest=1` 并输入测试码后开启测试投稿。使用自行生成的 64×64 PNG，不包含用户照片或个人信息，经当前页面的异步转换得到 WebP 主图和缩略图，再完成 Turnstile、上传、complete 和最终提交。页面显示「投稿完了・審査待ち」。

- 投稿 ID：`84099464-8cc3-48c9-8d3e-64b45638088d`。
- 标题：`[SECURITY TEST 2026-10-01] 投稿アップロード検証`；内容明确说明为虚构测试地点，不应采纳为正式内容。
- D1：`status=pending`、`is_test=1`；图片 `e5928fad-1a78-4e25-bcac-445394662831` 为 sealed，main 674 字节、thumb 664 字节。
- 两个 incoming 的 `signed_until - created_at = 120000` 毫秒，确认实际签名记录固定为 2 分钟。
- 本图 processing quota 使用 1 次，生成两条 incoming 清理任务；该投稿的正式对象和审核合并结果均为 0。
- 未填写邮箱，不验收审核结果邮件。保留这条待审测试稿，后续可以在管理端按正常流程拒绝并观察清理。



## R2 小文件探针

独立探针复用当前项目的 aws4fetch 签名方式，签入 `content-length;content-type;host;if-none-match`，对同一真实临时桶内新建的随机 `incoming/security-probe-…/main.webp` 测试。使用本地已有操作凭证，不读取生产 secret；因此这些结果验证 R2 的签名执行与桶 CORS，不证明生产投稿专用 token 的最小权限范围。该独立对象未注册为投稿图片，不经过 complete。

| 检查 | 实际结果 |
| --- | --- |
| 带 Content-Type、If-None-Match 的跨域预检 | 204，允许 `https://miles-dml.org` 和所需头 |
| 签名声明 26 字节，实际发送 27 字节 | 403 `SignatureDoesNotMatch`；随后 HEAD 404，未生成对象 |
| 省略签入的 If-None-Match | 403 `SignatureDoesNotMatch` |
| 正确 26 字节、完整签名头 | 200，带允许本站来源的 CORS 头 |
| 重复发送相同内容 | 412 `PreconditionFailed`，带允许本站来源的 CORS 头 |
| 改内容但维持相同长度，再 PUT 同一 key | 412；GET 确认原始内容长度和 SHA-256 不变 |
| 独立 1 秒有效期签名，等待到期后 PUT | 403 `ExpiredRequest` |
| 删除本次独立探针 | DELETE 204，随后 HEAD 404 |

长度篡改和过期请求的 403 未带 CORS 头，浏览器可能只能报告网络/CORS 失败；这不代表 R2 接受了请求。实际 412 带 CORS 头，前端能够读取该状态。正常浏览器完整流程通过；未人为制造“主图成功、缩略图失败”并重走浏览器重试流程。

2 分钟期限由实际 D1 记录确认；过期拒绝行为采用独立短期限签名验证，没有捕获并等待应用签发的链接超过 2 分钟。10 分钟名额过期、不续期、六张图、处理额度耗尽与失败副本回收仍沿用此前隔离测试结果，本次未对生产重复执行。

## 创建限流

仅通过公开端现有代理发送少量空 JSON 请求，不携带有效投稿正文，不创建新草稿或重复调用真人验证。标准路径和末尾 `/` 路径最终均返回 `429 / RATE_LIMITED`，并带 `Retry-After: 60`。

最初快速连续的三个请求均返回 400；后续每隔约 1 秒交替请求，结果为 400、400、400、429、429。400 表示通过限流后被输入校验拒绝，不能将本次结果描述为“第 3 个请求一定被拦截”。Binding 按 Cloudflare location 使用最终一致计数，不是精确全局账本；D1 继续承担原子累计额度。[Cloudflare 官方说明](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)

生产配置确认创建 Binding 为 2 次/60 秒，全流程防刷 Binding 为 120 次/60 秒。未对生产执行 120 次高频负载测试。

## 生产配置与剩余验收

| 项目 | 当前状态 |
| --- | --- |
| Worker 模式与开关 | `MODE=test`，`UPLOADS_ENABLED=true`，`MAINTENANCE=true` |
| R2 CORS | Origin 仅本站，PUT，Content-Type / If-None-Match，Expose ETag，MaxAge 300 |
| 临时桶公开入口 | r2.dev 禁用，自定义域名列表为空 |
| R2 生命周期 | 初次仅有 multipart abort；同日后续已启用 incoming/ 的 1 天对象过期规则，并保留默认 7 天未完成分片上传中止规则 |
| 每日维护调度 | 已配置 `0 19 * * *`，即日本时间次日 04:00；未手动触发全库维护 |
| 新版维护实际执行 | 本次部署在 2026-10-01 15:00 JST 左右，下一次自然运行为 **2026-10-02 04:00 JST**；旧版本的过期记录不能证明新版运行成功 |
| 测试访问码 | 生产绑定仍为 plain_text；此前 P2-2 的 secret 化与轮换尚未执行 |

初次验收发现缺少 `incoming/` 前缀的 1 天对象过期兜底。同日后续已添加并 GET 回读确认：规则 pilgrimage-incoming-expire-after-1-day，enabled=true，prefix=incoming/，deleteObjectsTransition.condition 为 Age / maxAge=86400。默认 multipart abort 仍保留；它只清理未完成的分片上传，不能替代普通 PUT 对象清理。`sealed/` 按数据库状态和持久任务清理；若配置生命周期兜底，遵循实现方案至少 100 天以覆盖 90 天待审期限，不能给整个临时桶设置 1 天过期。配置成功不等于已观察到一天后的实际删除，R2 也异步执行过期操作。[R2 生命周期说明](https://developers.cloudflare.com/r2/buckets/object-lifecycles/)

新版 cron 首次自然执行后应核对维护日志的扫描量、尝试量、积压量，以及本测试投稿的 incoming 清理任务与对象状态。待审 sealed 应保留，不能为清理验收直接删除待审材料。WAF 路径/方法配置、投稿专用 R2 token 桶范围、审核结果邮件和完整审核链路未在本次验收中核实。

## 交付范围

初次测试交付仅补充验收记录、更新上传加固/安全审查/实现文档并保存成功截图。后续变更见下节；本次没有操作管理员审核或正式数据。

## 同日后续：清理补充与入口响应式布局

- Worker 新增已登记 incoming 的独立 1 天年龄条件及 backlog 统计，继续排持久删除任务并使用现有 fence/lease、R2 批量 delete 和 D1 原子确认。R2 已先删除时幂等更新对象 deleted / 任务 done；失败仍按既有退避重试。代码需要重新部署，不在本次自动部署。
- 真实 R2 仅新增 incoming/ 生命周期，读取确认 enabled / maxAge 与预期一致，原 multipart abort 保留；没有给 sealed/ 或 milet-img 添加过期规则。参考基线写入 Worker config/r2/pilgrimage-submissions-lifecycle.json，更新前须合并现有规则。
- 公开端入口按容器宽度 28rem 切换同行/双行，展开介绍后正文占满区域，保留工作区增高及地图高度。1440×900 桌面中文、日文均同行；390×844 手机中文、日文均双行，320px 窄屏日文也完整显示，无横向溢出。桌面中文展开前后地图高度均为约 715.42px；手机日文展开无横向溢出。查看使用说明仍可重复开启。
- 新增 3 项清理集成测试，投稿/限流/路由共 50 项通过；Worker tsc、公开端 type-check、SSR 构建通过，本地验证使用项目 verify:ssr:local:watch 服务。默认 5173 已占用，使用 5174 验证。schema、API 与管理端协议均未变，无需 migration 或管理端同步。

完整规则和清理时序见 [实现方案 16.15](./pilgrimage-submissions-implementation-plan.md)。