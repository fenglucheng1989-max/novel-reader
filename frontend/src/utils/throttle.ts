/**
 * 节流工具
 * 在指定时间间隔内最多执行一次
 */
export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  interval: number,
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= interval) {
      lastTime = now
      fn(...args)
    }
  }
}
