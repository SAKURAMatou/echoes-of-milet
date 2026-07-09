export function withDownloadParam(src: string) {
  if (!src) return ''

  try {
    const url = new URL(src, typeof window === 'undefined' ? 'https://miles-dml.org' : window.location.href)
    url.searchParams.set('download', 'true')
    return url.toString()
  } catch {
    return `${src}${src.includes('?') ? '&' : '?'}download=true`
  }
}
