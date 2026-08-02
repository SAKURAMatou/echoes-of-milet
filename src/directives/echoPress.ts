import type { Directive } from 'vue'

interface EchoPressElement extends HTMLElement {
  __echoPressCleanup?: () => void
}

export const echoPress: Directive<EchoPressElement> = {
  mounted(element) {
    let timer: number | null = null
    const activate = (x: number, y: number) => {
      if (element.matches(':disabled,[aria-disabled="true"]')) return
      element.style.setProperty('--echo-press-x', `${x}px`)
      element.style.setProperty('--echo-press-y', `${y}px`)
      element.classList.remove('is-echo-pressed')
      void element.offsetWidth
      element.classList.add('is-echo-pressed')
      if (timer !== null) window.clearTimeout(timer)
      timer = window.setTimeout(() => element.classList.remove('is-echo-pressed'), 220)
    }
    const pointerDown = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      activate(event.clientX - rect.left, event.clientY - rect.top)
    }
    const keyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      activate(element.clientWidth / 2, element.clientHeight / 2)
    }
    element.classList.add('echo-press')
    element.addEventListener('pointerdown', pointerDown)
    element.addEventListener('keydown', keyDown)
    element.__echoPressCleanup = () => {
      if (timer !== null) window.clearTimeout(timer)
      element.removeEventListener('pointerdown', pointerDown)
      element.removeEventListener('keydown', keyDown)
    }
  },
  unmounted(element) {
    element.__echoPressCleanup?.()
  },
}
