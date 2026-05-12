/**
 * highlightStore — 划线/摘录状态管理
 *
 * 本地 + 服务端双向同步。
 * 离线优先：先写本地，再异步同步服务端。
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '../utils/request'
import type { ApiResponse } from '../types/api'

/* ===================== 类型 ===================== */

export interface HighlightItem {
  id: string
  bookId: number
  bookTitle: string
  chapterNo: number
  paragraphIndex: number
  quoteText: string
  color: string
  createdAt: string
}

interface HighlightCreatePayload {
  bookId: number | string
  bookTitle?: string
  chapterNo: number
  paragraphIndex: number
  quoteText: string
  color?: string
}

interface GroupedHighlights {
  bookId: number
  bookTitle: string
  items: HighlightItem[]
}

const STORAGE_KEY = 'reader_highlights'

/* ===================== Store ===================== */

export const useHighlightStore = defineStore('highlight', () => {
  /* ---- 状态 ---- */
  const highlights = ref<HighlightItem[]>([])

  /* ---- 计算属性 ---- */
  const groupedHighlights = computed<GroupedHighlights[]>(() => {
    const map = new Map<number, GroupedHighlights>()
    highlights.value.forEach((h) => {
      const key = h.bookId
      let group = map.get(key)
      if (!group) {
        group = { bookId: key, bookTitle: h.bookTitle, items: [] }
        map.set(key, group)
      }
      group.items.push(h)
    })
    return Array.from(map.values()).sort((a, b) => {
      const latestA = Math.max(0, ...a.items.map((i) => new Date(i.createdAt).getTime()))
      const latestB = Math.max(0, ...b.items.map((i) => new Date(i.createdAt).getTime()))
      return latestB - latestA
    })
  })

  const highlightCount = computed(() => highlights.value.length)

  /* ---- 本地持久化 ---- */
  function loadFromStorage(): void {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      highlights.value = Array.isArray(raw) ? raw : []
    } catch {
      highlights.value = []
    }
  }

  function persist(): void {
    uni.setStorageSync(STORAGE_KEY, highlights.value)
  }

  /* ---- 服务端同步 ---- */
  async function syncFromServer(): Promise<void> {
    try {
      const res = await request({
        url: '/api/v1/highlights',
        silentAuth: true,
        silent: true,
      })
      if (res.code === 200 && Array.isArray(res.data)) {
        const serverItems: HighlightItem[] = (res.data as HighlightItem[]).map(
          (h: Record<string, unknown>) => ({
            id: String(h.id),
            bookId: Number(h.bookId),
            bookTitle: (h.bookTitle as string) || '',
            chapterNo: Number(h.chapterNo),
            paragraphIndex: Number(h.paragraphIndex),
            quoteText: (h.quoteText as string) || '',
            color: (h.color as string) || '#FFEB3B',
            createdAt: (h.createdAt as string) || '',
          }),
        )

        // 合并：服务端优先，保留本地未同步的（id 非纯数字 = 本地临时）
        const localOnly = highlights.value.filter((h) => isNaN(Number(h.id)))
        highlights.value = [...serverItems, ...localOnly]
        persist()
      }
    } catch {
      // 离线时使用本地数据
    }
  }

  /* ---- 增删改 ---- */
  async function addHighlight(
    payload: HighlightCreatePayload,
  ): Promise<HighlightItem> {
    const item: HighlightItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      bookId: Number(payload.bookId),
      bookTitle: payload.bookTitle || '',
      chapterNo: Number(payload.chapterNo),
      paragraphIndex: Number(payload.paragraphIndex),
      quoteText: payload.quoteText,
      color: payload.color || '#FFEB3B',
      createdAt: new Date().toISOString(),
    }

    highlights.value.push(item)
    persist()

    // 异步同步服务端
    try {
      const res = await request({
        url: '/api/v1/highlights',
        method: 'POST',
        data: payload,
      })
      if (res.code === 200 && res.data) {
        const serverData = res.data as { id?: number; createdAt?: string }
        if (serverData.id) {
          item.id = String(serverData.id)
          item.createdAt = serverData.createdAt || item.createdAt
          persist()
        }
      }
    } catch {
      // 离线时保留本地
    }

    return item
  }

  async function removeHighlight(id: string): Promise<void> {
    highlights.value = highlights.value.filter((h) => h.id !== id)
    persist()

    // 如果是服务端数据，同步删除
    if (!isNaN(Number(id))) {
      try {
        await request({
          url: `/api/v1/highlights/${id}`,
          method: 'DELETE',
        })
      } catch {
        // 忽略
      }
    }
  }

  function getHighlightsByChapter(
    bookId: number | string,
    chapterNo: number,
  ): HighlightItem[] {
    return highlights.value.filter(
      (h) => h.bookId === Number(bookId) && h.chapterNo === Number(chapterNo),
    )
  }

  function clearAll(): void {
    highlights.value = []
    persist()
  }

  return {
    // 状态
    highlights,

    // 计算属性
    groupedHighlights,
    highlightCount,

    // 持久化
    loadFromStorage,
    syncFromServer,

    // 操作
    addHighlight,
    removeHighlight,
    getHighlightsByChapter,
    clearAll,
  }
})
