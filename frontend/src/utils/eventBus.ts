type EventHandler<T = unknown> = (data: T) => void

interface EventBus {
  on<T>(event: string, handler: EventHandler<T>): () => void
  emit<T>(event: string, data: T): void
  off<T>(event: string, handler: EventHandler<T>): void
  clear(event?: string): void
}

class EventBusImpl implements EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as EventHandler)
    return () => this.off(event, handler)
  }

  emit<T>(event: string, data: T): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(data))
    }
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler as EventHandler)
    }
  }

  clear(event?: string): void {
    if (event) {
      this.handlers.delete(event)
    } else {
      this.handlers.clear()
    }
  }
}

export const eventBus = new EventBusImpl()

export type { EventHandler, EventBus }