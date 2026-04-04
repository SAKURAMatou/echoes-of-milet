type EventHandler<T = unknown> = (payload: T) => void

type EventMap = Record<string, EventHandler[]>

const eventBus = {
  events: {} as EventMap,
  on(event: string, handler: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = []
    }

    this.events[event].push(handler)
  },
  off(event: string, handler: EventHandler) {
    if (!this.events[event]) {
      return
    }

    this.events[event] = this.events[event].filter((fn) => fn !== handler)
  },
  emit(event: string, payload?: unknown) {
    if (!this.events[event]) {
      return
    }

    this.events[event].forEach((fn) => fn(payload))
  },
}

export default eventBus
