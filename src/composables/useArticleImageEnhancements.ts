import { nextTick } from 'vue'
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
  let fancyboxApi: any = null
  let root: HTMLElement | null = null
  let groupName = ''
  let selector = ''

  function cleanup() {
    if (root && selector) fancyboxApi?.unbind(root, selector)

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

  async function enhance(container: HTMLElement | null, articleKey: string) {
    cleanup()
    if (!container) return

    await nextTick()
    fancyboxApi = fancyboxApi || (await import('@fancyapps/ui')).Fancybox
    root = container
    groupName = `article-images-${articleKey.replace(/[^a-z0-9_-]/gi, '-') || 'current'}`
    selector = `[data-fancybox="${groupName}"]`

    const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
    for (const img of images) {
      if (img.closest('.milet-album-embed-host,[data-type="milet-album-embed"]')) continue
      if (img.closest('[data-fancybox]')) continue

      img.setAttribute('loading', 'lazy')
      img.setAttribute('decoding', 'async')

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

      const href = img.currentSrc || img.src || img.getAttribute('src') || ''
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
