import type { PageScrollTarget, PageScrollViewport } from './pageScrollTypes'

export function readPageScrollTop(target: PageScrollTarget): number {
  if (target.kind === 'window') {
    return (
      target.target.scrollY ||
      target.target.document.documentElement.scrollTop ||
      target.target.document.body.scrollTop ||
      0
    )
  }

  return target.target.scrollTop
}

export function readPageScrollMax(target: PageScrollTarget): number {
  if (target.kind === 'window') {
    const documentElement = target.target.document.documentElement
    const body = target.target.document.body
    const scrollHeight = Math.max(
      documentElement.scrollHeight,
      documentElement.offsetHeight,
      body?.scrollHeight || 0,
      body?.offsetHeight || 0,
    )
    return Math.max(0, scrollHeight - target.target.innerHeight)
  }

  return Math.max(0, target.target.scrollHeight - target.target.clientHeight)
}

export function readPageViewport(target: PageScrollTarget): PageScrollViewport {
  if (target.kind === 'window') {
    return {
      top: 0,
      height: target.target.visualViewport?.height || target.target.innerHeight,
    }
  }

  const bounds = target.target.getBoundingClientRect()
  return {
    top: bounds.top,
    height: target.target.clientHeight,
  }
}

export function scrollPageTo(target: PageScrollTarget, options: ScrollToOptions): void {
  target.target.scrollTo(options)
}

export function bindPageScroll(target: PageScrollTarget, listener: EventListener): () => void {
  target.target.addEventListener('scroll', listener, { passive: true })

  let active = true
  return () => {
    if (!active) return
    active = false
    target.target.removeEventListener('scroll', listener)
  }
}
