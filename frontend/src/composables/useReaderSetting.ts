/**
 * useReaderSetting — 阅读设置 Composable
 *
 * 封装阅读设置的读写、持久化、服务端同步。
 * 提供精细的排版调节方法（字号 ±、行距 ±、段距 ±）。
 */

import { computed } from 'vue'
import { useReaderStore } from '../store/reader'
import { request } from '../utils/request'
import type { ReaderSettings } from '../types/reader'

export function useReaderSetting() {
  const store = useReaderStore()
  const settings = computed(() => store.settings)

  /* ---- 排版快捷操作 ---- */

  function increaseFontSize(step: number = 1): void {
    store.updateTypography({ fontSize: step })
  }

  function decreaseFontSize(step: number = 1): void {
    store.updateTypography({ fontSize: -step })
  }

  function increaseLineHeight(step: number = 0.1): void {
    store.updateTypography({ lineHeight: step })
  }

  function decreaseLineHeight(step: number = 0.1): void {
    store.updateTypography({ lineHeight: -step })
  }

  function setFontFamily(font: string): void {
    store.updateSettings({ fontFamily: font })
  }

  /* ---- 亮度 ---- */

  const brightness = computed(() => settings.value.brightness)
  const isNight = computed(() => settings.value.nightMode)

  function setBrightness(value: number): void {
    store.updateSettings({ brightness: Math.max(0, Math.min(100, value)) })
  }

  /* ---- 主题 ---- */

  const themeBackground = computed(() => settings.value.backgroundColor)
  const themeTextColor = computed(() => settings.value.textColor)

  function applyTheme(themeKey: string): void {
    const themes: Record<string, { bg: string; text: string }> = {
      DEFAULT: { bg: '#FFFFFF', text: '#1F1F1F' },
      PARCHMENT: { bg: '#F9F5E8', text: '#3D2B1F' },
      LIGHT_GREEN: { bg: '#E8F0E3', text: '#2D3A28' },
      LIGHT_BLUE: { bg: '#E4ECF0', text: '#1F2A3A' },
      NIGHT: { bg: '#161A1D', text: '#D8D1C7' },
      GRAY: { bg: '#EBEBE7', text: '#2D2D2D' },
    }
    const theme = themes[themeKey]
    if (theme) {
      store.updateSettings({
        backgroundColor: theme.bg,
        textColor: theme.text,
        nightMode: themeKey === 'NIGHT',
      })
    }
  }

  /* ---- 服务端同步 ---- */

  async function syncToServer(): Promise<void> {
    try {
      await request({
        url: '/api/v1/reading/setting',
        method: 'PUT',
        data: settings.value,
      })
    } catch {
      // 静默失败
    }
  }

  async function loadFromServer(): Promise<void> {
    try {
      const res = await request({
        url: '/api/v1/reading/setting',
        silentAuth: true,
        silent: true,
      })
      if (res.code === 200 && res.data) {
        const s = res.data as Partial<ReaderSettings>
        store.updateSettings({
          fontSize: s.fontSize ?? settings.value.fontSize,
          lineHeight: s.lineHeight ?? settings.value.lineHeight,
          fontFamily: s.fontFamily ?? settings.value.fontFamily,
          backgroundColor: s.backgroundColor ?? settings.value.backgroundColor,
          textColor: s.textColor ?? settings.value.textColor,
          readerMode: s.readerMode ?? settings.value.readerMode,
          turnMode: s.turnMode ?? settings.value.turnMode,
          brightness: s.brightness ?? settings.value.brightness,
          nightMode: s.nightMode ?? settings.value.nightMode,
          paragraphSpacing: s.paragraphSpacing ?? settings.value.paragraphSpacing,
          marginHorizontal: s.marginHorizontal ?? settings.value.marginHorizontal,
        } as Partial<ReaderSettings>)
      }
    } catch {
      // 静默失败
    }
  }

  return {
    settings,
    brightness,
    isNight,
    themeBackground,
    themeTextColor,

    increaseFontSize,
    decreaseFontSize,
    increaseLineHeight,
    decreaseLineHeight,
    setFontFamily,
    setBrightness,
    applyTheme,

    syncToServer,
    loadFromServer,
  }
}
