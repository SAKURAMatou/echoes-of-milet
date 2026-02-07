export function initImgUrl(url: string): string {
  if (!url) return ''

  if (url.startsWith('http') || url.startsWith('https')) return url

  const paths = url.split('/')
  if (paths.length === 2) {
    return import.meta.env.VITE_BASE_IMG_URL + import.meta.env.VITE_URL_STATIC_MILET_I + url
  } else {
    return ''
  }
}
