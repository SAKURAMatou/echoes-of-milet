const PAGE_SCROLL_CONTAINER_SELECTOR = '[data-page-scroll-container]'
const PAGE_LAYOUT_ROOT_SELECTOR = '[data-page-layout-root]'

type AnchorHistoryMode = 'none' | 'push' | 'replace'

type PageAnchorScrollOptions = {
  behavior?: ScrollBehavior
  history?: AnchorHistoryMode
}

function getAnchorTarget(anchor: string | HTMLElement) {
  if (anchor instanceof HTMLElement) {
    return {
      hash: anchor.id ? `#${encodeURIComponent(anchor.id)}` : '',
      target: anchor,
    }
  }

  const hash = anchor.startsWith('#') ? anchor : `#${anchor}`
  const encodedId = hash.slice(1)

  if (!encodedId) {
    return null
  }

  let targetId = encodedId
  try {
    targetId = decodeURIComponent(encodedId)
  } catch {
    // Keep the literal id when a malformed escape sequence is supplied.
  }

  const target = document.getElementById(targetId)
  return target ? { hash, target } : null
}

export function getScrollablePageContainer() {
  if (typeof window === 'undefined') {
    return null
  }

  const scrollContainer = document.querySelector<HTMLElement>(PAGE_SCROLL_CONTAINER_SELECTOR)

  if (!scrollContainer) {
    return null
  }

  const style = window.getComputedStyle(scrollContainer)
  const canScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight > 1
  const hasScrollOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll'

  return canScroll && hasScrollOverflow ? scrollContainer : null
}

function resetPageLayoutRootScroll() {
  const layoutRoot = document.querySelector<HTMLElement>(PAGE_LAYOUT_ROOT_SELECTOR)

  if (layoutRoot?.scrollTop) {
    layoutRoot.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }
}

function updateAnchorHistory(hash: string, mode: AnchorHistoryMode) {
  if (!hash || mode === 'none' || window.location.hash === hash) {
    return
  }

  const url = `${window.location.pathname}${window.location.search}${hash}`
  window.history[mode === 'replace' ? 'replaceState' : 'pushState'](null, '', url)
}

export function scrollToPageAnchor(
  anchor: string | HTMLElement,
  options: PageAnchorScrollOptions = {},
) {
  if (typeof window === 'undefined') {
    return false
  }

  const resolvedAnchor = getAnchorTarget(anchor)
  if (!resolvedAnchor) {
    return false
  }

  const { behavior = 'smooth', history = 'push' } = options
  const { hash, target } = resolvedAnchor
  const scrollMarginTop = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
  const scrollContainer = getScrollablePageContainer()

  if (scrollContainer) {
    resetPageLayoutRootScroll()

    const containerTop = scrollContainer.getBoundingClientRect().top
    const targetTop = target.getBoundingClientRect().top
    const nextTop = targetTop - containerTop + scrollContainer.scrollTop - scrollMarginTop

    scrollContainer.scrollTo({
      top: Math.max(0, nextTop),
      left: 0,
      behavior,
    })
  } else {
    const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 0
    const fallbackOffset = Math.max(scrollMarginTop, headerHeight + 12)
    const nextTop = target.getBoundingClientRect().top + window.scrollY - fallbackOffset

    window.scrollTo({
      top: Math.max(0, nextTop),
      left: 0,
      behavior,
    })
  }

  updateAnchorHistory(hash, history)
  return true
}

export function resetPageScrollContainer() {
  if (typeof window === 'undefined') {
    return
  }

  resetPageLayoutRootScroll()
  document.querySelector<HTMLElement>(PAGE_SCROLL_CONTAINER_SELECTOR)?.scrollTo({
    top: 0,
    left: 0,
    behavior: 'auto',
  })
}
