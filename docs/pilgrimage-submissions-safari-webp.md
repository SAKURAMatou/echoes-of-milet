# Safari 投稿照片 WebP 转换与验证

## 问题与修复（2026-10-05）

原实现仅检查 Worker / OffscreenCanvas 是否存在，并要求 convertToBlob 生成 WebP；普通 Canvas 回退同样依赖 toBlob。Safari 能显示 WebP 并不意味着能原生编码 WebP，不支持指定输出格式时 Canvas 可返回 PNG，因此两条路径均可能报 WEBP_UNAVAILABLE。依据：[MDN Canvas 文档](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)、[MDN 兼容性记录](https://github.com/mdn/browser-compat-data/blob/main/api/HTMLCanvasElement.json)。这是代码中可确认的兼容缺口；没有原始 Safari 错误记录，不能排除设备内存、文件损坏或资源下载失败等其他原因。

转换仍在用户端完成，优先原生 Worker 解码、缩放及编码。原生返回 PNG、null 或编码失败时，按需加载固定版本 `@jsquash/webp@1.5.0`，以 libwebp WebAssembly 编码缩放后的像素；依赖和 WASM 随站点部署，不访问第三方 CDN。支持 Worker 时编码保留在 Worker 内，不增加服务端转码。Worker 构造/加载失败、Worker 解码失败或无法建立 OffscreenCanvas 2D 上下文时，改用 HTML Image/Canvas 解码、缩放，再尝试原生编码或将像素交给编码 Worker。Worker 完全不可用时，才在主线程加载 WASM 编码；此分支的同步编码阶段无法强制抢占，低性能设备需实际检查响应情况。

两种输出均检查 MIME、RIFF/WEBP 魔数及容器长度，拒绝 PNG 改 MIME 冒充 WebP。保留 48 MP 输入像素限制、2560/640 长边、4 MiB/256 KiB 输出上限、主图 82/缩略图 75 质量配置；不上传原图，服务端完整 WebP 校验不变。取消和 45 秒时限覆盖 Worker 与 DOM 回退，终止活动 Worker，清理 Blob URL、ImageBitmap 和 Canvas。Worker 采用 ES 输出支持 codec 动态加载，WASM 显式用 Vite `?url` 打包；开发预构建排除该 codec，避免资源路径失效。

| 新增错误码 | 含义 | 中文提示 | 日文提示 |
| --- | --- | --- | --- |
| WEBP_ENCODER_LOAD_FAILED | 编码模块或 WASM 初始化/下载失败 | 图片转换组件未能加载，请检查网络后重试；也可以通过邮件投稿。 | 画像変換モジュールを読み込めませんでした。通信環境を確認して再試行するか、メールで投稿してください。 |

它与图片解码失败、转换超时、转换后文件过大及 R2 上传网络失败分别处理。资源加载失败不提示文件过大。

## 没有 iOS / macOS 时的本地验证

在公开端工程目录执行：

```powershell
npm run test:submission-webp
npm run type-check
npm run build:ssr
npm run verify:submission-webp:browser
```

最后一个命令单独构建开发检查页，沿用正式 Vite/Worker 配置，输出到 `.ssr-runtime/submission-webp-browser`，仅在 `127.0.0.1:4312` 提供服务。打开 `http://127.0.0.1:4312/tests/browser/submission-webp.html`，点击「运行自动检查」，期望 ALL CHECKS PASSED。Ctrl+C 停止；检查页不是正式站点路由，不随正常 build:ssr 发布，不创建投稿、不调用 R2、不包含密钥。

- native：调用实际转换入口，使用浏览器正常能力。
- worker：专用测试 Worker 将原生编码结果模拟为 PNG，验证真实 WASM 回退、资源加载、主图和缩略图输出。
- dom：专用测试 Worker 模拟解码失败，普通 Canvas 模拟 PNG 输出，验证 HTML Image 解码及像素编码 Worker。
- 另检查损坏图片的 IMAGE_DECODE_FAILED 与取消的 AbortError。文件选择器可检查设备真实照片的方向、颜色和输出大小，仅在本机生成预览。

Node 回归覆盖路径选择、输出格式、字节限制、Worker 构造失败、取消、DOM 超时和真实 WASM 透明图编码。浏览器检查使用生产哈希资源，能发现 codec/WASM 未输出或路径错误。Safari 缺少原生 WebP 编码时，使用真实 WASM 自动生成 WebP 输入素材，不跳过该格式；另外生成 EXIF orientation=6 的 JPEG，验证每个转换分支保留旋转方向。

已接入 [Playwright WebKit](https://playwright.dev/docs/browsers#webkit) 做 Windows 本地自动化回归，无需本地 Mac。固定开发依赖 `@playwright/test@1.63.0`；浏览器引擎、截图和测试输出存放在被 Git 忽略的 `.ssr-runtime`，不会进入生产包。执行：

```powershell
# 首次下载引擎；此次本机已完成安装
npm run install:submission-webkit
# 自动构建检查页、启动服务、运行两组测试并停止服务
npm run test:submission-webkit
```

2026-10-05 本机已下载并运行 WebKit 26.6 / build 2359。桌面 Safari 参数与 iPhone 13 参数两组测试均通过：各组覆盖 JPG、透明 PNG、WebP、带 EXIF 旋转的 JPEG 在 native / worker / dom 三种路径的转换、尺寸/字节上限、可解码性、损坏图片提示和取消；每组 12 次主图/缩略图配对转换。截图位于 `.ssr-runtime/submission-webp-webkit-results`，失败时保留 trace。Node 10 项回归、公开端类型检查与 SSR 构建也已通过。

Playwright WebKit 是带补丁的引擎构建，平台媒体能力可能不同；iPhone viewport 也是参数模拟，不能等同真实 iOS Safari。尚未执行真实 Safari、真实 R2 PUT 或 complete 验收。最终可用 [BrowserStack Live](https://www.browserstack.com/docs/live) 的真实 Safari / iPhone 环境，亦可通过其 [Local Testing](https://www.browserstack.com/docs/local-testing/overview) 测试本机检查页；需用户已有账号和可用额度，本次未登录、购买服务或开放本机隧道。

## 部署后的 Safari 最终验收

用借来的 iPhone/iPad、Mac Safari，或提供真实 Apple 设备的云测试服务测试部署后的页面。沿用投稿 MODE=test 与既有测试访问码，不需要额外 Safari 配置；从正式投稿页面进入，不必对外发布开发检查页。

1. 记录设备型号、系统与 Safari 版本，用非敏感 JPG、透明 PNG、已有 WebP、带 EXIF 旋转的手机照片分别测试；HEIC/HEIF 仍不属于当前声明的上传格式。
2. 确认显示「已完成 WebP 转换」，预览方向与颜色正确；12 MP 照片不出现页面卡死或标签页重载。
3. 上传测试照片，确认仅发送 WebP main/thumb，PUT、complete 和最终提交成功。管理端检查同一测试稿的主图/缩略图，不采纳到真实正式地点。
4. 测试转换时删除照片/关闭弹窗、连续选择 6 张、失败后重试，确认取消后不会继续上传。
5. 核对编码 JS/WASM 成功加载、`.wasm` 返回 application/wasm，关注资源被网络或额外 CSP 拦截。已有 CSP 时应核查 WebAssembly 编译与同源 Worker 是否允许，不为排障关闭整套 CSP。
6. 弱网/断网时区分 WEBP_ENCODER_LOAD_FAILED 与后续 UPLOAD_NETWORK_MAIN / UPLOAD_NETWORK_THUMB，错误提示应对应真实阶段。

本地 Chromium 与模拟 Safari 能力只能证明回退路径和构建资源可工作，不能证明真实 Safari 文件解码、内存压力、EXIF 方向和网络环境均已通过。真实设备上的 complete 成功也是服务端接受 WASM 输出的重要验收项。

本次仅变更公开端转换、错误提示和开发验证工具；管理端、Worker、R2 CORS、API 契约与数据库表不需要同步修改。
