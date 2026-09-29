import { requestSubmission } from '@/utils/submissionRequest'
import { apiRoutes } from '@/config/api'

export type SubmissionConfig = {
  enabled: boolean
  mode?: 'off' | 'test' | 'public'
  siteKey: string
  rightsVersion: string
  maxImages: number
}
export type SubmissionReceipt = { id: string; token: string }
export async function submissionApi<T>(
  path: string,
  body?: unknown,
  token?: string,
  signal?: AbortSignal,
  onRateLimit?: (waiting: boolean) => void,
): Promise<T> {
  let testToken: string | null = null
  try {
    if (typeof window !== 'undefined')
      testToken = sessionStorage.getItem('pilgrimage-submission-test-token')
  } catch {}
  return requestSubmission<T>(
    `${apiRoutes.miletPilgrimageSubmissions}${path}`,
    {
      method: body === undefined ? 'GET' : 'POST',
      cache: 'no-store',
      signal,
      headers: {
        ...(testToken ? { 'X-Pilgrimage-Test-Token': testToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    signal,
    onRateLimit,
  )
}

export function randomCredential() {
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) =>
    n.toString(16).padStart(2, '0'),
  ).join('')
}
export async function imageDigest(blob: Blob) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())),
    (n) => n.toString(16).padStart(2, '0'),
  ).join('')
}
export function submissionErrorMessage(error: unknown, ja: boolean) {
  const code = error instanceof Error ? error.message : ''
  const messages: Record<string, [string, string]> = {
    RATE_LIMITED: [
      '图片处理中，请稍后重试。填写内容和上传进度已保留。',
      '画像を処理中です。しばらくして再試行してください。入力内容と送信状況は保持されています。',
    ],
    TEST_ACCESS_REQUIRED: [
      '请输入有效的测试访问码。',
      '有効なテストアクセスコードを入力してください。',
    ],
    VERIFICATION_FAILED: [
      '验证已失效，请重新完成真人验证。',
      '認証の期限が切れました。もう一度認証してください。',
    ],
    SESSION_EXPIRED: [
      '投稿会话已过期，请保留内容并重新验证。',
      '送信セッションの期限が切れました。内容を保持して再認証してください。',
    ],
    UPLOAD_EXPIRED: [
      '图片上传时间已过，请移除该图片后重新选择。',
      '画像のアップロード期限が切れました。画像を選び直してください。',
    ],
    UPLOAD_FAILED: [
      '图片没有上传成功，请稍后重试。填写内容仍保留在本页。',
      '画像をアップロードできませんでした。しばらくして再試行してください。入力内容は保持されています。',
    ],
    IMAGE_DECODE_FAILED: [
      '无法读取这张照片，文件可能损坏或格式不受支持。',
      'この写真を読み込めません。ファイルが破損しているか、対応していない形式の可能性があります。',
    ],
    IMAGE_DIMENSIONS_TOO_LARGE: [
      '照片超过 4800 万像素，当前设备无法安全转换，请先降低分辨率。',
      '写真が4800万画素を超えているため、この端末では安全に変換できません。解像度を下げてください。',
    ],
    WEBP_MAIN_TOO_LARGE: [
      '转换后的主图仍超过 4 MiB，请降低照片分辨率后重试。',
      '変換後のメイン画像が4 MiBを超えています。写真の解像度を下げて再試行してください。',
    ],
    WEBP_THUMB_TOO_LARGE: [
      '转换后的缩略图仍超过 256 KiB，请更换照片后重试。',
      '変換後のサムネイルが256 KiBを超えています。別の写真で再試行してください。',
    ],
    WEBP_UNAVAILABLE: [
      '当前浏览器无法生成 WebP 图片，请更新浏览器或更换设备后重试。',
      'このブラウザでは WebP 画像を生成できません。ブラウザを更新するか、別の端末で再試行してください。',
    ],
    CONVERSION_TIMEOUT: [
      '照片在本机转换超过 45 秒，请选择分辨率较低的照片后重试。',
      '端末での写真変換が45秒を超えました。解像度の低い写真で再試行してください。',
    ],
    CONVERSION_FAILED: [
      '照片在本机转换失败，请重试或更换照片。',
      '端末での写真変換に失敗しました。再試行するか、別の写真を選んでください。',
    ],
    UPLOAD_NETWORK_MAIN: [
      '主图上传请求未能到达图片服务器，可能是网络中断或浏览器拦截，请检查网络后重试。',
      'メイン画像のアップロード要求が画像サーバーに届きませんでした。通信切断またはブラウザによるブロックの可能性があります。通信環境を確認して再試行してください。',
    ],
    UPLOAD_NETWORK_THUMB: [
      '缩略图上传请求未能到达图片服务器，可能是网络中断或浏览器拦截，请检查网络后重试。',
      'サムネイルのアップロード要求が画像サーバーに届きませんでした。通信切断またはブラウザによるブロックの可能性があります。通信環境を確認して再試行してください。',
    ],
    UPLOAD_SIZE_REJECTED: [
      '图片服务器拒绝了文件大小，请重新选择照片后重试。',
      '画像サーバーがファイルサイズを拒否しました。写真を選び直して再試行してください。',
    ],
    UPLOAD_AUTH_REJECTED: [
      '图片上传凭证无效或已过期，请移除该图片后重新选择。',
      '画像のアップロード認証が無効または期限切れです。画像を選び直してください。',
    ],
    UPLOAD_SERVICE_UNAVAILABLE: [
      '图片存储服务暂时不可用，请稍后重试。',
      '画像ストレージを一時的に利用できません。しばらくして再試行してください。',
    ],
    UPLOAD_REJECTED: [
      '图片存储服务拒绝了上传，请稍后重试。',
      '画像ストレージがアップロードを拒否しました。しばらくして再試行してください。',
    ],
    IMAGE_NOT_READY: [
      '图片服务器尚未收到完整文件，请检查网络后重新上传。',
      '画像サーバーが完全なファイルを受信していません。通信環境を確認して再アップロードしてください。',
    ],
    IMAGE_SIZE: [
      '服务器收到的图片大小与上传记录不一致，可能是上传不完整，请重新上传。',
      '受信した画像サイズがアップロード記録と一致しません。アップロードが不完全な可能性があるため、再アップロードしてください。',
    ],
    INVALID_WEBP: [
      '上传后的文件未通过 WebP 格式检查，请重新选择照片。',
      'アップロード後のファイルが WebP 形式の確認に通りませんでした。写真を選び直してください。',
    ],
    IMAGE_HASH: [
      '上传后的图片内容与本机文件不一致，请检查网络后重新上传。',
      'アップロード後の画像内容が端末上のファイルと一致しません。通信環境を確認して再アップロードしてください。',
    ],
    INVALID_IMAGE: [
      '图片转换结果未通过上传参数检查，请重新选择照片。',
      '変換後の画像がアップロード条件を満たしていません。写真を選び直してください。',
    ],
    IMAGE_CONFLICT: [
      '服务器保存已校验图片时发生冲突，请稍后重试。',
      '確認済み画像の保存中に競合が発生しました。しばらくして再試行してください。',
    ],
    API_NETWORK_ERROR: [
      '连接投稿服务失败，请检查当前网络后重试。',
      '投稿サービスに接続できません。通信環境を確認して再試行してください。',
    ],
    API_RESPONSE_ERROR: [
      '投稿服务返回了无法识别的响应，请稍后重试。',
      '投稿サービスから認識できない応答が返されました。しばらくして再試行してください。',
    ],
    SUBMISSIONS_DISABLED: ['投稿暂未开放，请稍后再试。', '現在、投稿の受付を停止しています。'],
    UPLOADS_DISABLED: [
      '照片上传暂不可用，你可以移除照片后提交文字。',
      '画像の受付を停止しています。画像を外してテキストのみ送信できます。',
    ],
    QUOTA_EXCEEDED: [
      '投稿较多，请稍后再试，填写内容仍在本页保留。',
      '混み合っています。内容はこのページに保持されています。しばらくして再試行してください。',
    ],
    TARGET_UNAVAILABLE: [
      '原地点已变更，请关闭后重新选择地点。',
      '元のスポットが変更されました。閉じて選び直してください。',
    ],
    VERSION_CONFLICT: [
      '数据状态已变化，请重试或刷新处理状态。',
      '状態が変わりました。再試行するか、処理状況を更新してください。',
    ],
    RIGHTS_REQUIRED: [
      '请确认你有权提交材料；拟公开照片须由你拥有权利，或其公开使用规则允许本站使用。',
      '資料を投稿する権利を確認してください。公開予定の写真は、権利を保有しているか、公開利用条件で当サイトの使用が認められている必要があります。',
    ],
  }
  return (
    messages[code]?.[ja ? 1 : 0] ||
    (ja
      ? '送信できませんでした。内容を保持しています。接続を確認して再試行してください。'
      : '操作未成功，填写内容仍保留。请检查网络后重试。')
  )
}

// The public widget key is shared with About Me; secrets stay in the Worker.
export async function getSubmissionConfig(): Promise<SubmissionConfig> {
  const config = await submissionApi<Omit<SubmissionConfig, 'siteKey'>>('/config')
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  return { ...config, siteKey, enabled: config.enabled && !!siteKey }
}
