import { onBeforeUnmount, onMounted, watch } from 'vue'
import type { PetHostApi } from './petTypes'
import { resolvePetContentPosition, type PetViewportBox } from './petGeometryCore'

/** Preserve the avatar's touch target while giving forms and map controls priority. */
export function usePetContentAvoidance(
  pet: PetHostApi,
  geometry: () => { mobile: boolean; size: number; viewport: PetViewportBox },
) {
  let frame = 0
  let release: (() => void) | null = null
  let observer: MutationObserver | null = null
  let mounted = false

  function resume() {
    release?.()
    release = null
  }
  function measure() {
    frame = 0
    const { mobile, size, viewport } = geometry()
    if (!mobile) {
      resume()
      return
    }
    if (pet.state.dragging || pet.state.menuOpen) return
    const active = document.activeElement
    if (
      active instanceof HTMLElement &&
      active.matches('input,textarea,select,[contenteditable="true"]')
    ) {
      release ||= pet.suspend('mobile-content-focus')
      return
    }
    const obstacles = Array.from(
      document.querySelectorAll<HTMLElement>(
        'form,[data-pet-avoid],.leaflet-control,[data-release-mobile-toolbar]',
      ),
    )
      .filter((element) => element.getClientRects().length > 0)
      .map((element) => element.getBoundingClientRect())
    const current = pet.state.position
    const next = resolvePetContentPosition(current, size, viewport, obstacles)
    if (!next) {
      release ||= pet.suspend('mobile-content-obstructed')
      return
    }
    if (next.x !== current.x || next.y !== current.y) pet.setPosition(next)
    resume()
  }
  function schedule() {
    if (mounted && !frame) frame = requestAnimationFrame(measure)
  }
  watch(
    () => [pet.state.route.fullPath, pet.state.dragging, pet.state.menuOpen, geometry().mobile],
    schedule,
    { flush: 'post' },
  )
  onMounted(() => {
    mounted = true
    document.addEventListener('scroll', schedule, true)
    document.addEventListener('click', schedule)
    document.addEventListener('focusin', schedule)
    document.addEventListener('focusout', schedule)
    window.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('resize', schedule)
    observer = new MutationObserver(schedule)
    const app = document.getElementById('app')
    if (app)
      observer.observe(app, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['open', 'hidden'],
      })
    schedule()
  })
  onBeforeUnmount(() => {
    mounted = false
    cancelAnimationFrame(frame)
    observer?.disconnect()
    document.removeEventListener('scroll', schedule, true)
    document.removeEventListener('click', schedule)
    document.removeEventListener('focusin', schedule)
    document.removeEventListener('focusout', schedule)
    window.removeEventListener('resize', schedule)
    window.visualViewport?.removeEventListener('resize', schedule)
    resume()
  })
}
