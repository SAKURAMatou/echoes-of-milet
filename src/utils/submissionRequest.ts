export async function requestSubmission<T>(
  url: string,
  options: RequestInit,
  signal?: AbortSignal,
  onRateLimit?: (waiting: boolean) => void,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { ...options, signal })
    const data = await response.json().catch(() => null)
    if (response.status === 429 && data?.errorCode === 'RATE_LIMITED' && signal && attempt < 3) {
      const rawDelay = response.headers.get('Retry-After')
      const seconds = Number(rawDelay)
      const delay = Math.min(
        300000,
        Math.max(1000, rawDelay && Number.isFinite(seconds) ? seconds * 1000 : 60000),
      )
      onRateLimit?.(true)
      try {
        await waitSubmissionRetry(delay, signal)
      } finally {
        onRateLimit?.(false)
      }
      continue
    }
    if (!response.ok || data?.code !== 200)
      throw new Error(
        data?.errorCode || (response.status === 429 ? 'QUOTA_EXCEEDED' : 'NETWORK_ERROR'),
      )
    return data.data as T
  }
}
function waitSubmissionRetry(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', cancel)
      resolve()
    }, delay)
    signal.addEventListener('abort', cancel, { once: true })
    if (signal.aborted) cancel()
  })
}
