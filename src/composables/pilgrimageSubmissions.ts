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
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
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
    RIGHTS_REQUIRED: ['请确认投稿和照片的使用授权。', '投稿と写真の使用許諾を確認してください。'],
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
