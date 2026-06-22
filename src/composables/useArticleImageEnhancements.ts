import { nextTick } from 'vue'
import loadingImg from '@/assets/loading.gif'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

type EnhancedAnchorRecord = {
  anchor: HTMLAnchorElement
  previousFancybox: string | null
  previousCaption: string | null
}

type WrappedImageRecord = {
  wrapper: HTMLAnchorElement
  image: HTMLImageElement
}

type LazyImageRecord = {
  image: HTMLImageElement
  originalSrc: string | null
  originalSrcset: string | null
  originalSizes: string | null
  originalLoading: string | null
  originalDecoding: string | null
}

function isImageHref(value: string) {
  if (!value) return false
  if (/\.(jpe?g|png|webp|gif|avif)(\?.*)?$/i.test(value)) return true
  return value.includes('/static/milet/img/') || value.includes('/static/blog/img/')
}

function imageCaption(img: HTMLImageElement) {
  return img.getAttribute('alt') || img.getAttribute('title') || ''
}

export function useArticleImageEnhancements() {
  const enhancedAnchors: EnhancedAnchorRecord[] = []
  const wrappedImages: WrappedImageRecord[] = []
  const lazyImages: LazyImageRecord[] = []
  let lazyObserver: IntersectionObserver | null = null
  let fancyboxApi: any = null
  let root: HTMLElement | null = null
  let groupName = ''
  let selector = ''

  function cleanup() {
    if (root && selector) fancyboxApi?.unbind(root, selector)
    lazyObserver?.disconnect()
    lazyObserver = null

    for (const item of lazyImages.splice(0)) {
      if (item.originalSrc === null) item.image.removeAttribute('src')
      else item.image.setAttribute('src', item.originalSrc)

      if (item.originalSrcset === null) item.image.removeAttribute('srcset')
      else item.image.setAttribute('srcset', item.originalSrcset)

      if (item.originalSizes === null) item.image.removeAttribute('sizes')
      else item.image.setAttribute('sizes', item.originalSizes)

      if (item.originalLoading === null) item.image.removeAttribute('loading')
      else item.image.setAttribute('loading', item.originalLoading)

      if (item.originalDecoding === null) item.image.removeAttribute('decoding')
      else item.image.setAttribute('decoding', item.originalDecoding)

      item.image.removeAttribute('data-article-lazy-src')
      item.image.removeAttribute('data-article-lazy-state')
      item.image.removeAttribute('data-article-lazy-managed')
    }

    for (const item of enhancedAnchors.splice(0)) {
      if (item.previousFancybox === null) item.anchor.removeAttribute('data-fancybox')
      else item.anchor.setAttribute('data-fancybox', item.previousFancybox)

      if (item.previousCaption === null) item.anchor.removeAttribute('data-caption')
      else item.anchor.setAttribute('data-caption', item.previousCaption)
    }

    for (const item of wrappedImages.splice(0)) {
      item.wrapper.replaceWith(item.image)
    }

    root = null
    groupName = ''
    selector = ''
  }

  function revealLazyImage(img: HTMLImageElement) {
    const src = img.getAttribute('data-article-lazy-src')
    if (!src) return
    const record = lazyImages.find((item) => item.image === img)
    img.setAttribute('data-article-lazy-state', 'loaded')
    img.setAttribute('src', src)
    if (record?.originalSrcset) img.setAttribute('srcset', record.originalSrcset)
    if (record?.originalSizes) img.setAttribute('sizes', record.originalSizes)
    lazyObserver?.unobserve(img)
  }

  function setupLazyObserver() {
    lazyObserver?.disconnect()
    if (!('IntersectionObserver' in window)) {
      lazyObserver = null
      return
    }
    lazyObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target instanceof HTMLImageElement) {
            revealLazyImage(entry.target)
          }
        }
      },
      { rootMargin: '240px 0px' },
    )
  }

  function resolveImageSrc(img: HTMLImageElement) {
    return img.getAttribute('data-article-lazy-src') || img.currentSrc || img.getAttribute('src') || img.src || ''
  }

  function applyGifLazyLoading(img: HTMLImageElement) {
    const src = resolveImageSrc(img)
    if (!src || src === loadingImg || img.getAttribute('data-article-lazy-managed') === 'true') return src
    if (!lazyObserver) {
      img.setAttribute('loading', 'lazy')
      img.setAttribute('decoding', 'async')
      return src
    }

    lazyImages.push({
      image: img,
      originalSrc: img.getAttribute('src'),
      originalSrcset: img.getAttribute('srcset'),
      originalSizes: img.getAttribute('sizes'),
      originalLoading: img.getAttribute('loading'),
      originalDecoding: img.getAttribute('decoding'),
    })

    img.setAttribute('data-article-lazy-src', src)
    img.setAttribute('data-article-lazy-state', 'pending')
    img.setAttribute('data-article-lazy-managed', 'true')
    img.setAttribute('loading', 'lazy')
    img.setAttribute('decoding', 'async')
    img.removeAttribute('srcset')
    img.removeAttribute('sizes')
    img.setAttribute('src', loadingImg)
    lazyObserver?.observe(img)
    return src
  }

  async function enhance(container: HTMLElement | null, articleKey: string) {
    cleanup()
    if (!container) return

    await nextTick()
    fancyboxApi = fancyboxApi || (await import('@fancyapps/ui')).Fancybox
    root = container
    groupName = `article-images-${articleKey.replace(/[^a-z0-9_-]/gi, '-') || 'current'}`
    selector = `[data-fancybox="${groupName}"]`
    setupLazyObserver()

    const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
    for (const img of images) {
      if (img.closest('.milet-album-embed-host,[data-type="milet-album-embed"]')) continue

      const imageSrc = applyGifLazyLoading(img)
      if (img.closest('[data-fancybox]')) continue

      const parentAnchor = img.closest('a')
      if (parentAnchor instanceof HTMLAnchorElement) {
        if (!isImageHref(parentAnchor.href)) continue
        enhancedAnchors.push({
          anchor: parentAnchor,
          previousFancybox: parentAnchor.getAttribute('data-fancybox'),
          previousCaption: parentAnchor.getAttribute('data-caption'),
        })
        parentAnchor.setAttribute('data-fancybox', groupName)
        parentAnchor.setAttribute('data-caption', imageCaption(img))
        continue
      }

      const href = imageSrc
      if (!href) continue
      const wrapper = document.createElement('a')
      wrapper.href = href
      wrapper.setAttribute('data-fancybox', groupName)
      wrapper.setAttribute('data-caption', imageCaption(img))
      wrapper.className = 'article-image-lightbox-link'
      img.replaceWith(wrapper)
      wrapper.appendChild(img)
      wrappedImages.push({ wrapper, image: img })
    }

    if (wrappedImages.length > 0 || enhancedAnchors.length > 0) {
      fancyboxApi.bind(container, selector, {
        Hash: false,
        Carousel: {
          Toolbar: {
            display: {
              left: ['counter'],
              middle: [],
              right: ['download', 'thumbs', 'close'],
            },
          },
        },
      })
    }
  }

  return { enhance, cleanup }
}
