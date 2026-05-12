/**
 * useReaderProgress — 阅读进度 Composable
 *
 * 封装进度的自动保存、恢复、以及定时保存。
 */

import { onMounted, onBeforeUnmount, watch } from 'vue'
import { useReaderStore } from '../store/reader'
import { ProgressService } from '../services/ProgressService'

export function useReaderProgress() {
  const store = useReaderStore()
  let saveTimer: ReturnType<typeof setInterval> | null = null

  /** 启动自动保存（每 30s） */
  function startAutoSave(): void {
    if (saveTimer) return
    saveTimer = setInterval(() => {
      store.saveCurrentProgress()
    }, 30_000)
  }

  /** 停止自动保存 */
  function stopAutoSave(): void {
    if (saveTimer) {
      clearInterval(saveTimer)
      saveTimer = null
    }
  }

  /** 立即保存 */
  async function saveNow(): Promise<void> {
    await store.saveCurrentProgress()
  }

  /** 恢复进度 */
  async function restoreProgress(bookId: string | number): Promise<void> {
    await store.loadProgress(bookId)
  }

  /** 注册页面可见性变化自动保存 */
  function setupVisibilitySave(): void {
    if (typeof document === 'undefined') return
    const handler = (): void => {
      if (document.hidden) {
        store.saveCurrentProgress()
      }
    }
    document.addEventListener('visibilitychange', handler)
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', handler)
    })
  }

  /** 注册页面卸载自动保存 */
  function setupBeforeUnloadSave(): void {
    if (typeof window === 'undefined') return
    const handler = (): void => {
      store.saveCurrentProgress()
    }
    window.addEventListener('beforeunload', handler)
    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handler)
    })
  }

  return {
    startAutoSave,
    stopAutoSave,
    saveNow,
    restoreProgress,
    setupVisibilitySave,
    setupBeforeUnloadSave,
  }
}
