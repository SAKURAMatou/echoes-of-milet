import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

import { usePageScroll } from '@/composables/page-scroll'
import type { Work } from '@/composables/releaseType'

export type ReleaseSectionScrollPhase =
  | 'idle'
  | 'reading'
  | 'stacking'
  | 'terminal'
  | 'loading'
  | 'releasing'

interface UseReleaseCardStackOptions {
  sectionRef: Ref<HTMLElement | null>
  chapterHeaderRef: Ref<HTMLElement | null>
  paginationActionRef: Ref<HTMLElement | null>
  works: Readonly<Ref<Work[]>>
  terminalWorkId: Readonly<Ref<string | null>>
  enabled: Readonly<Ref<boolean>>
  loading: Readonly<Ref<boolean>>
  expandedWorkId: Ref<string | null>
}

const FOLD_GAP = 12
const CHAPTER_TOP_GAP = 8
const PAGINATION_ACTION_MIN_HEIGHT = 64
const TERMINAL_GAP = 24
const SPINE_HEIGHT = 36
const SPINE_STEP_DESKTOP = 12
const SPINE_STEP_MOBILE = 8
const SPINE_SUMMARY_HEIGHT = 16

export function useReleaseCardStack(options: UseReleaseCardStackOptions) {
  const pageScroll = usePageScroll()
  const passedWorkIds = ref<string[]>([])
  const pinnedTerminalWorkId = ref<string | null>(null)
  const terminalPinEligible = ref(false)
  const phase = ref<ReleaseSectionScrollPhase>('idle')
  const foldOffset = ref(0)
  const chapterTop = ref(0)
  const maxVisibleSpines = ref(1)
  const spineStep = ref(SPINE_STEP_DESKTOP)
  const noAnimation = ref(true)

  let geometricPassedIndex = -1
  let cardObserver: IntersectionObserver | null = null
  let resizeObserver: ResizeObserver | null = null
  let unsubscribeScrollFrame: (() => void) | null = null
  let observerPaused = false
  let mounted = false

  function sentinels() {
    return Array.from(
      options.sectionRef.value?.querySelectorAll<HTMLElement>('[data-release-fold-sentinel]') || [],
    )
  }

  function visiblePassedIds() {
    const terminalId = options.terminalWorkId.value
    const activeElement = typeof document === 'undefined' ? null : document.activeElement
    return sentinels()
      .slice(0, geometricPassedIndex + 1)
      .map((element) => element.dataset.releaseId || '')
      .filter((id) => {
        if (!id || id === terminalId || id === options.expandedWorkId.value) return false
        const wrapper = options.sectionRef.value?.querySelector<HTMLElement>(
          `[data-release-card][data-release-id="${CSS.escape(id)}"]`,
        )
        return !(activeElement && wrapper?.contains(activeElement))
      })
  }

  function derivePassedState() {
    if (observerPaused) return
    passedWorkIds.value = visiblePassedIds()
  }

  function sharedFoldLine() {
    return pageScroll.state.viewportTop + foldOffset.value
  }

  function scanGeometricBoundary(direction: 'up' | 'down' | 'idle' = 'idle') {
    if (!options.enabled.value || observerPaused || pageScroll.pageScrollLocked.value) return
    const nodes = sentinels()
    const line = sharedFoldLine()

    if (direction !== 'up') {
      while (
        geometricPassedIndex + 1 < nodes.length &&
        nodes[geometricPassedIndex + 1].getBoundingClientRect().top <= line
      ) {
        geometricPassedIndex += 1
      }
    }
    if (direction !== 'down') {
      while (
        geometricPassedIndex >= 0 &&
        nodes[geometricPassedIndex].getBoundingClientRect().top > line
      ) {
        geometricPassedIndex -= 1
      }
    }

    derivePassedState()
    updateTerminalPin(direction)
    updatePhase()
  }

  function resync() {
    if (!options.enabled.value || observerPaused || pageScroll.pageScrollLocked.value) return
    const line = sharedFoldLine()
    const nodes = sentinels()
    geometricPassedIndex = -1
    for (let index = 0; index < nodes.length; index += 1) {
      if (nodes[index].getBoundingClientRect().top > line) break
      geometricPassedIndex = index
    }
    derivePassedState()
    updateTerminalPin('idle')
    updatePhase()
  }

  function calculateMaxVisibleSpines(viewportHeight: number) {
    const width = typeof window === 'undefined' ? 0 : window.innerWidth
    const widthLimit = width >= 1024 ? 3 : 2
    const heightLimit = viewportHeight >= 800 ? 3 : viewportHeight >= 640 ? 2 : 1
    const mobileLandscape = width < 768 && width > viewportHeight
    const responsiveLimit = mobileLandscape ? 1 : Math.min(widthLimit, heightLimit)
    spineStep.value = width < 768 ? SPINE_STEP_MOBILE : SPINE_STEP_DESKTOP

    const stickyBudget = Math.min(200, viewportHeight * 0.28)
    for (let count = responsiveLimit; count > 0; count -= 1) {
      const spineHeight = SPINE_HEIGHT + (count - 1) * spineStep.value + SPINE_SUMMARY_HEIGHT
      if (foldOffset.value + spineHeight <= stickyBudget) return count
    }
    return 1
  }

  function refreshMetrics() {
    const section = options.sectionRef.value
    const chapterHeader = options.chapterHeaderRef.value
    if (!section || !chapterHeader || !options.enabled.value) {
      terminalPinEligible.value = false
      return
    }

    const globalHeaderHeight =
      pageScroll.state.targetKind === 'window'
        ? document.querySelector('header')?.getBoundingClientRect().height || 0
        : 0
    chapterTop.value = globalHeaderHeight + CHAPTER_TOP_GAP
    foldOffset.value = chapterTop.value + chapterHeader.getBoundingClientRect().height + FOLD_GAP
    maxVisibleSpines.value = calculateMaxVisibleSpines(pageScroll.state.viewportHeight)

    const terminalId = options.terminalWorkId.value
    const terminal = terminalId
      ? section.querySelector<HTMLElement>(
          `[data-release-card][data-release-id="${CSS.escape(terminalId)}"]`,
        )
      : null
    const terminalHeight = terminal?.getBoundingClientRect().height || 0
    const mobile = typeof window !== 'undefined' && window.innerWidth < 768
    terminalPinEligible.value = Boolean(
      terminal &&
        !mobile &&
        options.expandedWorkId.value !== terminalId &&
        terminalHeight +
          foldOffset.value +
          spineReservedHeight.value +
          PAGINATION_ACTION_MIN_HEIGHT +
          TERMINAL_GAP <=
          pageScroll.state.viewportHeight,
    )
    if (!terminalPinEligible.value) pinnedTerminalWorkId.value = null
  }

  function updateTerminalPin(direction: 'up' | 'down' | 'idle') {
    const terminalId = options.terminalWorkId.value
    if (!terminalId || !terminalPinEligible.value || !options.enabled.value) {
      pinnedTerminalWorkId.value = null
      return
    }

    const sentinel = options.sectionRef.value?.querySelector<HTMLElement>(
      `[data-release-card][data-release-id="${CSS.escape(terminalId)}"] [data-release-terminal-read-sentinel="true"]`,
    )
    if (!sentinel) return
    const readLine =
      pageScroll.state.viewportTop +
      pageScroll.state.viewportHeight -
      PAGINATION_ACTION_MIN_HEIGHT -
      TERMINAL_GAP
    const passedReadLine = sentinel.getBoundingClientRect().top <= readLine

    if (direction === 'up' && !passedReadLine) {
      pinnedTerminalWorkId.value = null
    } else if (direction !== 'up' && passedReadLine) {
      pinnedTerminalWorkId.value = terminalId
    }
  }

  function updatePhase() {
    if (!options.enabled.value) {
      phase.value = 'idle'
      return
    }
    if (options.loading.value) {
      phase.value = 'loading'
      return
    }
    const sectionBottom = options.sectionRef.value?.getBoundingClientRect().bottom || Infinity
    if (sectionBottom <= sharedFoldLine()) {
      phase.value = 'releasing'
    } else if (pinnedTerminalWorkId.value) {
      phase.value = 'terminal'
    } else if (passedWorkIds.value.length > 0) {
      phase.value = 'stacking'
    } else {
      phase.value = 'reading'
    }
  }

  function rebuildObserver() {
    cardObserver?.disconnect()
    cardObserver = null
    if (
      !mounted ||
      !options.enabled.value ||
      typeof IntersectionObserver === 'undefined' ||
      foldOffset.value >= pageScroll.state.viewportHeight
    ) {
      return
    }

    const target = pageScroll.getTarget()
    const root = target?.kind === 'element' ? target.target : null
    const bottomShrink = Math.max(0, pageScroll.state.viewportHeight - foldOffset.value - 1)
    cardObserver = new IntersectionObserver(
      (entries) => {
        if (observerPaused || pageScroll.pageScrollLocked.value) return
        for (const entry of entries) {
          const foldLine = entry.rootBounds?.top ?? sharedFoldLine()
          const hasPassed = entry.boundingClientRect.top <= foldLine
          const nodes = sentinels()
          const index = nodes.indexOf(entry.target as HTMLElement)
          if (index < 0) continue
          if (hasPassed && index === geometricPassedIndex + 1) geometricPassedIndex = index
          if (!hasPassed && index <= geometricPassedIndex) geometricPassedIndex = index - 1
        }
        scanGeometricBoundary('idle')
      },
      {
        root,
        rootMargin: `-${foldOffset.value}px 0px -${bottomShrink}px 0px`,
        threshold: 0,
      },
    )
    sentinels().forEach((sentinel) => cardObserver?.observe(sentinel))
  }

  async function rebuild() {
    await nextTick()
    refreshMetrics()
    rebuildObserver()
    noAnimation.value = true
    resync()
    requestAnimationFrame(() => {
      noAnimation.value = false
    })
  }

  function pauseStateCommits() {
    observerPaused = true
  }

  function resumeStateCommits() {
    observerPaused = false
  }

  function clearPinnedTerminal() {
    pinnedTerminalWorkId.value = null
  }

  function setNoAnimation(value: boolean) {
    noAnimation.value = value
  }

  const visibleSpineWorks = computed(() => {
    const workMap = new Map(options.works.value.map((work) => [work.id, work]))
    return passedWorkIds.value
      .map((id) => workMap.get(id))
      .filter((work): work is Work => Boolean(work))
      .slice(-maxVisibleSpines.value)
  })
  const hiddenSpineCount = computed(() =>
    Math.max(0, passedWorkIds.value.length - visibleSpineWorks.value.length),
  )
  const spineReservedHeight = computed(
    () => SPINE_HEIGHT + (maxVisibleSpines.value - 1) * spineStep.value + SPINE_SUMMARY_HEIGHT,
  )

  watch(
    () => [
      options.works.value.map((work) => work.id).join(','),
      options.enabled.value,
      pageScroll.state.targetKind,
      pageScroll.state.viewportHeight,
    ],
    rebuild,
    { flush: 'post' },
  )
  watch(options.expandedWorkId, () => {
    refreshMetrics()
    resync()
  })
  watch(options.terminalWorkId, () => {
    pinnedTerminalWorkId.value = null
    void rebuild()
  })
  watch(options.loading, updatePhase)
  watch(pageScroll.pageScrollLocked, (locked) => {
    if (!locked) void rebuild()
  })

  onMounted(() => {
    mounted = true
    if (typeof IntersectionObserver === 'undefined') return
    unsubscribeScrollFrame = pageScroll.subscribeScrollFrame(({ state }) => {
      scanGeometricBoundary(state.direction)
    })
    resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            pageScroll.invalidateMetrics()
            void rebuild()
          })
    if (options.sectionRef.value) resizeObserver?.observe(options.sectionRef.value)
    if (options.chapterHeaderRef.value) resizeObserver?.observe(options.chapterHeaderRef.value)
    if (options.paginationActionRef.value) {
      resizeObserver?.observe(options.paginationActionRef.value)
    }
    options.sectionRef.value?.addEventListener('focusin', resync)
    options.sectionRef.value?.addEventListener('focusout', resync)
    void rebuild()
  })

  onBeforeUnmount(() => {
    mounted = false
    cardObserver?.disconnect()
    resizeObserver?.disconnect()
    unsubscribeScrollFrame?.()
    options.sectionRef.value?.removeEventListener('focusin', resync)
    options.sectionRef.value?.removeEventListener('focusout', resync)
  })

  return {
    phase,
    passedWorkIds,
    visibleSpineWorks,
    hiddenSpineCount,
    pinnedTerminalWorkId,
    terminalPinEligible,
    foldOffset,
    chapterTop,
    spineReservedHeight,
    noAnimation,
    pauseStateCommits,
    resumeStateCommits,
    clearPinnedTerminal,
    setNoAnimation,
    resync,
    rebuild,
  }
}
