/**
 * eventBus — 跨组件事件总线
 *
 * 用于非父子组件间的简单事件通信。
 * 阅读器内核使用 ReaderEngine 的事件系统，
 * 此总线仅用于 UI 组件间通信（例如工具栏通知设置面板）。
 */

type Handler = (...args: unknown[]) => void

const events = new Map<string, Set<Handler>>()

export function on(event: string, handler: Handler): () => void {
  if (!events.has(event)) events.set(event, new Set())
  events.get(event)!.add(handler)
  return () => {
    events.get(event)?.delete(handler)
  }
}

export function emit(event: string, ...args: unknown[]): void {
  events.get(event)?.forEach((handler) => {
    try {
      handler(...args)
    } catch (e) {
      console.error(`[EventBus] handler error (${event}):`, e)
    }
  })
}

export function off(event: string, handler: Handler): void {
  events.get(event)?.delete(handler)
}

export function clear(event?: string): void {
  if (event) {
    events.delete(event)
  } else {
    events.clear()
  }
}
