# 投稿 R2 上传加固与部署验收（2026-10-01）

本次保留浏览器直传 WebP 到 milet-pilgrimage-submissions。上传大小限制由 Worker 签名实现；CORS 只允许浏览器发送所需头部，不能作为文件大小或身份限制。真实 R2/浏览器验收尚未执行，在验收完成前保留 MODE=test/off。

## 签名与期限

- 图片处理名额：首次预留起 10 分钟，过期不能重新签发或 complete；已 sealed 的图片不受此期限影响，可以正常提交并等待审核。
- main/thumb 的 PUT：首次预留起 2 分钟，不因重试延长，每个对象单独签入预留的准确 Content-Length；预留时仍限制 main ≤4 MiB、thumb ≤256 KiB。
- SignedHeaders 必须为 content-length;content-type;host;if-none-match，Content-Type=image/webp，If-None-Match=*。不同大小应签名失败，已有对象应拒绝覆盖。
- 前端使用 Blob 作为请求体，由浏览器生成 Content-Length，不能手工设置这个受浏览器控制的请求头。服务端返回 uploadHeaders 供前端使用。
- PUT 返回 412 时只表示对象已经存在，前端继续处理另一变体并调用 complete；仍必须通过服务端准确长度、结构、SHA-256 校验，不把 412 直接当成图片完成。
- 成功冻结后，incoming 删除任务不早于 signed_until + 60 秒。complete 失败时不删 incoming，只排本次 sealed 副本清理，便于有限重试。

## R2 控制台配置

打开 Cloudflare → R2 object storage → milet-pilgrimage-submissions → Settings → CORS Policy → 编辑 JSON。合并到现有规则，必须允许 If-None-Match。生产规则如下：

```json
[
  {
    "AllowedOrigins": ["https://miles-dml.org"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type", "If-None-Match"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 300
  }
]
```

实际使用其他站点域名时逐一加入 AllowedOrigins，不能包含路径或末尾斜杠。本地直传测试可临时加入 http://localhost:5173、http://127.0.0.1:5173；生产不需要时移除。不要配置任意来源 *。PUT 预检由 R2 处理，不需要添加 OPTIONS 方法。Content-Length 由浏览器自动管理，无需作为手工发送的头列入 AllowedHeaders；ETag 暴露是可选项，当前 complete 不依赖浏览器提供 ETag。

保持该桶 private，关闭 r2.dev/public custom domain；签名用的 API token 只授予该临时桶的 Object Read & Write，不授予整个账户所有桶。转移到正式桶由现有 Worker 的两个 R2 binding 完成，签名 token 不需要正式桶权限。生命周期继续沿既有 incoming/sealed 分区保留策略配置；不能给待审 sealed 设置过短的统一过期规则。本次代码修改不会自动变更控制台 CORS、生命周期或访问权限。

R2 没有在这里通过 CORS JSON 设置“单文件最大 4 MiB”的选项，也不能将本站 WAF 当作 R2 S3 endpoint 的上传拦截器。若真实验收发现长度签名没有得到执行，保持上传关闭并改为受控上传网关，不退回仅在 complete 校验大小的方案。即使长度与防覆盖生效，泄露的短期 URL 仍可被反复发起请求；拒绝覆盖限制存储增量，不能保证阻止所有网络请求成本。

## 发布顺序与验收

1. 先更新 CORS，并保留测试模式；部署公开端兼容 uploadHeaders 的版本，再部署 Worker。Worker 的默认/production 配置都新增 120 次/60 秒的 PILGRIMAGE_SUBMISSION_ABUSE_RATE_LIMITER；其缺失会返回 503。不要修改创建的 2 次/60 秒额度。
2. 使用一张很小的真实 WebP：正常长度与全部签名头应上传成功，main/thumb 均成功后 complete 应成功。检查浏览器实际 Content-Length 和 X-Amz-SignedHeaders。
3. 使用新的测试名额，用相同 URL/签名头发送长度不同的小文件（例如多 1 字节），预期非 2xx，且 R2 中没有对象；不需要上传超大文件。省略 If-None-Match 也应签名失败。
4. 正常上传成功后重复同一 PUT，预期 412，对象长度与内容不变；在浏览器重试主图已成功、缩略图失败的场景，412 应可衔接 complete。若 412 响应没有 CORS 头而浏览器无法读取，需要处理这一兼容性后再开放。
5. 等首次预留超过 2 分钟后旧 PUT 应失效；再次 reserve 同一 clientImageId 不续期。超过 10 分钟后 complete 也应返回 UPLOAD_EXPIRED。已 sealed 重复 complete 应幂等成功。
6. 确认标准路径与末尾斜杠创建都受到限流；一稿六张照片的 reserve/complete/submit 不触发创建的 2 次额度。模拟错误 ID 高频访问触发独立 120 次防刷。
7. 每日 cron 不变（日本时间 04:00）。检查日志的 expiredScanned、objectsScanned、tasksAttempted 与 backlog；达到两分钟/数量预算后剩余记录次日继续，持续积压时扩容到持久队列。真实清理吞吐受套餐与 I/O 影响。

本地已通过隔离 D1/R2 的 47 项投稿/限流/路由测试、45 项相关 unit 测试及公开端 3 项请求重试测试；这些不能证明 R2 S3 endpoint 的线上签名执行行为。当前无 schema 变更，处理次数复用现有 quota 表。管理端没有 API 或显示结构变化，无需同步修改。

## 官方依据

- [R2 预签名 URL](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)：有效期、S3 endpoint、可重复使用及签名头。
- [R2 S3 API 兼容性](https://developers.cloudflare.com/r2/api/s3/api/)：PutObject 支持 If-None-Match 等条件请求。
- [R2 CORS 配置](https://developers.cloudflare.com/r2/buckets/cors/)：控制台 JSON 和 AllowedHeaders；过期签名可能不返回 CORS 头。
- [Fetch 标准](https://fetch.spec.whatwg.org/#forbidden-request-header)：Content-Length 属于浏览器控制的请求头。
- [Workers 限制](https://developers.cloudflare.com/workers/platform/limits/)：定时调用及 subrequest 预算。
