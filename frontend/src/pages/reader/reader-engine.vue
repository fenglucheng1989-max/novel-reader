<template>
  <view class="re-root">
    <!-- ====== Reading Container ====== -->
    <view
      ref="containerRef"
      class="re-container"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @contextmenu.prevent
    >
      <!-- Three-page cache stage -->
      <view class="re-stage">
        <!-- Previous page (behind, for backward flip reveal) -->
        <view ref="prevPageRef" class="re-page re-page-prev" />
        <!-- Current page (always visible) -->
        <view ref="currentPageRef" class="re-page re-page-current" />
        <!-- Next page (behind, for forward flip reveal) -->
        <view ref="nextPageRef" class="re-page re-page-next" />
      </view>

      <!-- Flipping element (animated during transition) -->
      <view
        ref="flipRef"
        class="re-flip"
        @transitionend="onFlipEnd"
      >
        <view ref="flipFrontRef" class="re-flip-face re-flip-front">
          <slot name="flip-front" />
        </view>
        <view ref="flipBackRef" class="re-flip-face re-flip-back">
          <slot name="flip-back" />
        </view>
      </view>

      <!-- Tap zones -->
      <view class="re-tap re-tap-left"   @click="onTapLeft" />
      <view class="re-tap re-tap-center" @click="onTapCenter" />
      <view class="re-tap re-tap-right"  @click="onTapRight" />
    </view>

    <!-- ====== Back Indicator ====== -->
    <view ref="backIndicatorRef" class="re-back" @click="$emit('back')">
      <text class="re-back-arrow">‹</text>
      <text class="re-back-label">{{ backLabel }}</text>
    </view>

    <!-- ====== Next-Chapter Ready Badge ====== -->
    <view ref="readyBadgeRef" class="re-badge" style="display:none" @click="jumpPreloadedChapter">
      <text>下一章已就绪 ›</text>
    </view>

    <!-- ====== Selection Bubble Menu (Phase 1/2) ====== -->
    <view ref="bubbleRef" class="re-bubble" style="display:none">
      <view class="re-bubble-body">
        <text class="re-bub-btn" @click="actCopy">📋</text>
        <text class="re-bub-btn" @click="actTypo">⚠️</text>
        <text class="re-bub-btn" @click="actComment">💬</text>
        <text class="re-bub-btn" @click="actShare">↗️</text>
        <text class="re-bub-btn" @click="actHighlight">🔖</text>
      </view>
      <view class="re-bubble-arrow" />
    </view>

    <!-- ====== Full Selection Menu (Phase 3) ====== -->
    <view ref="fullMenuRef" class="re-full-menu" style="display:none">
      <view class="re-full-body">
        <view class="re-full-row re-full-actions">
          <text class="re-full-action" @click="actListen">听</text>
          <text class="re-full-action" @click="actHighlight">{{ hasHL ? '取消划线' : '划线' }}</text>
          <text class="re-full-action" @click="actShare">分享</text>
          <text class="re-full-action" @click="actCopy">复制</text>
          <text class="re-full-action" @click="actDictionary">词典</text>
          <text class="re-full-action" @click="actTypo">错字反馈</text>
          <text class="re-full-action" @click="actComment">写段评</text>
        </view>
        <view class="re-full-row re-full-tags">
          <text class="re-full-tag" @click="actTag('名场面')">名场面</text>
          <text class="re-full-tag" @click="actTag('名台词')">名台词</text>
          <text class="re-full-tag" @click="actTag('好磕')">好磕</text>
          <text class="re-full-tag" @click="actTag('好虐')">好虐</text>
        </view>
      </view>
      <view class="re-full-arrow" />
    </view>

    <!-- ====== Toolbar (Top + Bottom) ====== -->
    <view ref="toolbarRef" class="re-toolbar">
      <!-- Top bar -->
      <view class="re-topbar">
        <text class="re-tbtn re-tbtn-back" @click="$emit('back')">&lt;</text>
        <text class="re-tbtn" @click="addShelf">加入书架</text>
        <text class="re-tbtn re-tbtn-dl" @click="download">下载</text>
        <text class="re-tbtn" @click="openComments">💬</text>
        <text class="re-tbtn" @click="shareChapter">分享</text>
        <text class="re-tbtn" @click="showMore">⋯</text>
      </view>
      <!-- Bottom panel -->
      <view class="re-bottombar">
        <view class="re-bp-row">
          <text class="re-bp-nav" @click="prevChapter">上一章</text>
          <view class="re-bp-progress">
            <text class="re-bp-label">{{ pageLabel }}</text>
            <view class="re-bp-track">
              <view class="re-bp-fill" :style="{ width: progressPct + '%' }" />
            </view>
          </view>
          <text class="re-bp-nav" @click="nextChapter">下一章</text>
        </view>
        <view class="re-bp-actions">
          <view class="re-bp-action" @click="openCatalog">📖<text class="re-bp-alabel">目录</text></view>
          <view class="re-bp-action" @click="toggleNight">🌙<text class="re-bp-alabel">夜间</text></view>
          <view class="re-bp-action" @click="openSettingsPanel">⚙️<text class="re-bp-alabel">设置</text></view>
        </view>
      </view>
    </view>

    <!-- ====== Settings Sheet ====== -->
    <view ref="settingsRef" class="re-settings-overlay" :class="{ 're-settings-open': settingsOpen }" @click="closeSettingsPanel">
      <view class="re-settings" @click.stop>
        <view class="re-sheet-handle" />
        <!-- Brightness -->
        <view class="re-set-row">
          <text class="re-set-label">亮度</text>
          <slider :min="10" :max="100" :value="brightness" @change="onBrightness" />
        </view>
        <!-- Font size -->
        <view class="re-set-row">
          <text class="re-set-label">字号</text>
          <view class="re-stepper">
            <text class="re-step-btn" @click="adjFont(-1)">A−</text>
            <text class="re-step-val">{{ fontSize }}</text>
            <text class="re-step-btn" @click="adjFont(1)">A+</text>
          </view>
        </view>
        <!-- Font -->
        <view class="re-set-row">
          <text class="re-set-label">字体</text>
          <view class="re-font-options">
            <text v-for="f in FONTS" :key="f.val" class="re-font-opt" :class="{ active: fontFamily === f.val }" @click="setFont(f.val)">{{ f.label }}</text>
          </view>
        </view>
        <!-- Theme -->
        <view class="re-set-row">
          <text class="re-set-label">主题</text>
          <view class="re-theme-chips">
            <view v-for="t in THEMES" :key="t.key" class="re-theme-chip" :class="{ active: theme === t.key }" :style="{ backgroundColor: t.bg }" @click="setTheme(t.key)" />
          </view>
        </view>
        <!-- Line spacing -->
        <view class="re-set-row">
          <text class="re-set-label">行距</text>
          <view class="re-stepper">
            <text class="re-step-btn" @click="adjLineH(-0.1)">−</text>
            <text class="re-step-val">{{ lineHeight.toFixed(1) }}</text>
            <text class="re-step-btn" @click="adjLineH(0.1)">+</text>
          </view>
        </view>
        <!-- Turn mode -->
        <view class="re-set-row">
          <text class="re-set-label">翻页</text>
          <view class="re-turn-options">
            <text v-for="m in TURN_MODES" :key="m.val" class="re-turn-opt" :class="{ active: turnMode === m.val }" @click="setTurnMode(m.val)">{{ m.label }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * reader-engine.vue  —  High‑performance novel reading engine
 * =============================================================================
 * Architecture:
 *   1. PageSplitter    – pixel‑accurate page splitting via hidden measuring div
 *   2. PreloadManager  – speculative chapter loading (3‑page horizon)
 *   3. PageTurner      – 60fps multi‑mode flip with 3‑page cache
 *   4. InteractionMgr  – 3‑phase text selection (long‑press → fine‑tune → full)
 *   5. SettingsStore   – persisted user preferences
 *
 * Quality targets:
 *   - Intra‑chapter page line‑count variance ≤ 2 lines
 *   - Flip at 60fps (no layout during animation)
 *   - Zero‑delay chapter transitions (preload at page total‑3)
 *   - Unified measurement across App / H5 / Mini‑program
 * =============================================================================
 */
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { request } from '../../utils/request'

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  EMITS                                                                     */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const emit = defineEmits([
  'back', 'catalog', 'add-shelf', 'download',
  'share', 'comments', 'more', 'listen', 'dictionary',
  'typo', 'tag', 'comment', 'load-chapter',
  'next-chapter', 'prev-chapter',
])

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  PROPS                                                                     */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const props = defineProps({
  bookId:        { type: [String, Number], default: '' },
  chapterNo:     { type: Number, default: 1 },
  maxChapterNo:  { type: Number, default: 0 },
  chapterTitle:  { type: String, default: '' },
  bookTitle:     { type: String, default: '' },
  content:       { type: String, default: '' },
})

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  CONSTANTS                                                                 */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const THEMES = [
  { key: 'PARCHMENT',   bg: '#F9F5E8', text: '#3D2B1F' },
  { key: 'DEFAULT',     bg: '#FFFFFF', text: '#1F1F1F' },
  { key: 'LIGHT_GREEN', bg: '#E8F0E3', text: '#2D3A28' },
  { key: 'LIGHT_BLUE',  bg: '#E4ECF0', text: '#1F2A3A' },
  { key: 'NIGHT',       bg: '#161A1D', text: '#D8D1C7' },
]

const FONTS = [
  { label: '宋体', val: 'SERIF' },
  { label: '楷体', val: 'KAITI' },
]

const TURN_MODES = [
  { label: '仿真', val: 'SIMULATION' },
  { label: '覆盖', val: 'COVER' },
  { label: '平移', val: 'SLIDE' },
  { label: '无',   val: 'NONE' },
]

const FONT_FAMILY_MAP = {
  SERIF: "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif",
  KAITI: "'KaiTi','STKaiti',Kai,serif",
}

const HL_COLORS = ['rgba(255,235,59,0.5)', 'rgba(144,202,249,0.5)', 'rgba(206,147,216,0.5)']
const P_STYLE = 'margin:0;text-indent:2em;line-height:inherit'

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  1.  SETTINGS STORE  (Module 5)                                            */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const STORAGE_KEY = 're_settings'

const fontSize       = ref(18)
const lineHeight     = ref(1.8)
const fontFamily     = ref('SERIF')
const theme          = ref('PARCHMENT')
const brightness     = ref(80)
const turnMode       = ref('SIMULATION')
const paragraphGap   = ref(6)
const showToolbar    = ref(false)
const settingsOpen   = ref(false)

function loadSettings() {
  try {
    const s = uni.getStorageSync(STORAGE_KEY)
    if (s) {
      fontSize.value     = s.fs ?? 18
      lineHeight.value   = s.lh ?? 1.8
      fontFamily.value   = s.ff ?? 'SERIF'
      theme.value        = s.th ?? 'PARCHMENT'
      brightness.value   = s.br ?? 80
      turnMode.value     = s.tm ?? 'SIMULATION'
      paragraphGap.value = s.pg ?? 6
    }
  } catch (_) {}
}

function saveSettings() {
  try {
    uni.setStorageSync(STORAGE_KEY, {
      fs: fontSize.value, lh: lineHeight.value, ff: fontFamily.value,
      th: theme.value, br: brightness.value, tm: turnMode.value, pg: paragraphGap.value,
    })
  } catch (_) {}
}

watch([fontSize, lineHeight, fontFamily, theme, brightness, turnMode, paragraphGap], saveSettings)

function setFont(v)   { fontFamily.value = v }
function setTheme(k)  { theme.value = k }
function setTurnMode(v) { turnMode.value = v }
function adjFont(d)   { fontSize.value = Math.max(14, Math.min(36, fontSize.value + d)) }
function adjLineH(d)  { lineHeight.value = Math.max(1.2, Math.min(3.0, +(lineHeight.value + d).toFixed(1))) }
function onBrightness(e) { brightness.value = e.detail?.value ?? e.detail ?? 80 }

function openSettingsPanel()  { hideToolbar(); settingsOpen.value = true }
function closeSettingsPanel() { settingsOpen.value = false }

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  DOM REFS                                                                  */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const containerRef     = ref(null)
const prevPageRef      = ref(null)
const currentPageRef   = ref(null)
const nextPageRef      = ref(null)
const flipRef          = ref(null)
const flipFrontRef     = ref(null)
const flipBackRef      = ref(null)
const backIndicatorRef = ref(null)
const readyBadgeRef    = ref(null)
const bubbleRef        = ref(null)
const fullMenuRef      = ref(null)
const toolbarRef       = ref(null)
const settingsRef      = ref(null)

function $el(thing) {
  if (!thing) return null
  return thing.$el ?? thing
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  COMPOSABLES — helpers                                                     */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function $show(el, show) {
  const d = $el(el)
  if (d) d.style.display = show ? '' : 'none'
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  COMPUTED                                                                  */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const pageLabel   = computed(() => `${currentPage.value + 1} / ${pages.value.length || 1}`)
const progressPct = computed(() => {
  const t = pages.value.length
  return t <= 1 ? 0 : (currentPage.value / (t - 1)) * 100
})

const backLabel = computed(() => {
  if (currentPage.value === 0) return props.bookTitle || props.chapterTitle || '返回'
  return props.chapterTitle || '返回'
})

const nightMode = computed(() => theme.value === 'NIGHT')

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  2.  PAGE SPLITTER  (Module 1)                                             */
/*      Pixel‑accurate, character‑level binary‑search splitting               */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const pages         = ref([])           // Array of HTML strings, one per page
const currentPage   = ref(0)
const isUpdating    = ref(false)

/** Build the measuring div with exact same CSS as the real reader */
function createMeasure(width) {
  const div = document.createElement('div')
  div.id = 're-measure'
  div.style.cssText = `
    position:absolute;left:-9999px;top:0;visibility:hidden;
    width:${width}px;
    font-size:${fontSize.value}px;
    line-height:${lineHeight.value};
    font-family:${FONT_FAMILY_MAP[fontFamily.value] || FONT_FAMILY_MAP.SERIF};
    padding:44px 32px 24px;
    box-sizing:border-box;
    text-align:justify;
    word-break:break-word;
    overflow-wrap:break-word;
  `
  return div
}

/**
 * Split raw text into evenly‑filled pages using cumulative measurement.
 * Returns { pagesHtml: string[], viewH: number }
 */
function splitIntoPages(content) {
  const pagesHtml = []
  if (!content || !content.trim()) {
    pagesHtml.push('<p style="text-align:center;color:#999;margin-top:40px">（暂无内容）</p>')
    return { pagesHtml, viewH: 0 }
  }

  const container = $el(containerRef.value)
  const viewH = container?.clientHeight || window.innerHeight
  const viewW = container?.clientWidth  || window.innerWidth
  if (viewH < 100) return { pagesHtml: [''], viewH }

  // 1. Split paragraphs
  const paragraphs = content.split(/\n+/).filter(p => p.trim())
  if (!paragraphs.length) {
    pagesHtml.push('<p style="text-align:center;color:#999;margin-top:40px">（暂无内容）</p>')
    return { pagesHtml, viewH }
  }

  // 2. Build paragraph HTMLs
  const paraHtmls = paragraphs.map(p => {
    const body = escapeHtml(p)
    const gap = paragraphGap.value > 0 ? `margin-bottom:${paragraphGap.value * 2}px` : ''
    return gap ? `<p style="${P_STYLE};${gap}">${body}</p>` : `<p style="${P_STYLE}">${body}</p>`
  })

  // 3. Cumulative measurement
  const measure = createMeasure(viewW)
  document.body.appendChild(measure)
  measure.innerHTML = ''

  const cumH = []
  for (const h of paraHtmls) {
    measure.innerHTML += h
    cumH.push(measure.scrollHeight)
  }
  // cumH[i] = scrollHeight(paragraphs[0..i]) = topPad + content + botPad

  const TOP = 44, BOT = 24
  const TITLE_H = 46        // 4px pt + 20*1.4 lh + 14px mb
  const TARGET_FILL = 0.90  // ≥ 90 % fill target

  function rangeH(s, e) {
    if (s === 0) return cumH[e]
    return cumH[e] - cumH[s - 1] + TOP + BOT
  }

  // 4. Greedy fill with character‑level splitting at overflow
  let start = 0
  let isFirst = true

  while (start < paraHtmls.length) {
    const maxH = isFirst ? viewH - TITLE_H : viewH
    let end = start

    // Find last paragraph that fits
    while (end < paraHtmls.length && rangeH(start, end) <= maxH) end++
    end-- // back to last fitting paragraph

    if (end < start) {
      // Even first paragraph doesn't fit — split at character level
      const split = splitParagraph(paraHtmls[start], maxH, measure)
      pagesHtml.push(split.first)
      // Replace current paragraph with remainder for next iteration
      paraHtmls[start] = split.remainder
      measure.innerHTML = ''
      for (let i = 0; i < paraHtmls.length; i++) {
        measure.innerHTML += paraHtmls[i]
        cumH[i] = measure.scrollHeight
      }
      isFirst = false
      continue
    }

    // Check if adding the *next* paragraph barely overflows (≤ 2 lines worth)
    const nextIdx = end + 1
    if (nextIdx < paraHtmls.length) {
      const overflowH = rangeH(start, nextIdx) - maxH
      const lineH = fontSize.value * lineHeight.value
      const overflowLines = overflowH / lineH

      if (overflowLines <= 2 && overflowLines > 0) {
        // Try character‑level split of the overflowing paragraph
        const split = splitParagraph(paraHtmls[nextIdx], maxH - rangeH(start, end), measure)
        if (split.first) {
          // Replace the overflowing para and include the split‑off portion
          paraHtmls[nextIdx] = split.remainder
          pagesHtml.push(paraHtmls.slice(start, end + 1).join('') + split.first)
          start = nextIdx
          // Re‑measure from current position
          measure.innerHTML = ''
          for (let i = start; i < paraHtmls.length; i++) {
            measure.innerHTML += paraHtmls[i]
            cumH[i] = measure.scrollHeight
          }
          // Rebase cumH (now cumH[i] is relative to paraHtmls[start..i])
          // We need cumH relative to start, so we shift
          isFirst = false
          continue
        }
      }
    }

    pagesHtml.push(paraHtmls.slice(start, end + 1).join(''))
    start = end + 1
    isFirst = false
  }

  // 5. Rebalance tail pages to meet ≥90% fill and ≤2 line variance
  rebalanceTail(pagesHtml, viewH, TITLE_H, measure)

  document.body.removeChild(measure)
  return { pagesHtml, viewH }
}

/**
 * Binary‑search character split of a single <p> element.
 * Returns { first: string, remainder: string }
 */
function splitParagraph(paraHtml, availableH, measure) {
  // Extract text content and rebuild character by character
  const textMatch = paraHtml.match(/^<p[^>]*>(.*?)<\/p>$/s)
  if (!textMatch) return { first: '', remainder: paraHtml }

  const innerText = textMatch[1]
  const chars = [...innerText]
  if (!chars.length) return { first: '', remainder: paraHtml }

  // Extract the <p> tag open to preserve attributes
  const tagMatch = paraHtml.match(/^(<p[^>]*>)/)
  const pOpen = tagMatch ? tagMatch[1] : '<p>'
  const pClose = '</p>'
  const baseStyle = pOpen.includes('style=') ? '' : ''

  let lo = 0, hi = chars.length
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1
    measure.innerHTML = pOpen + chars.slice(0, mid).join('') + pClose
    const h = measure.scrollHeight
    if (h <= availableH) lo = mid
    else hi = mid - 1
  }

  if (lo === 0) return { first: '', remainder: paraHtml }
  if (lo >= chars.length) return { first: paraHtml, remainder: '' }

  const firstHtml = pOpen + chars.slice(0, lo).join('') + pClose
  const remainderHtml = pOpen + chars.slice(lo).join('') + pClose
  return { first: firstHtml, remainder: remainderHtml }
}

/**
 * Rebalance the last few pages to achieve even fill.
 * Strategy: merge sparse tail pages, then redistribute paragraphs.
 */
function rebalanceTail(pagesHtml, viewH, titleH, measure) {
  while (pagesHtml.length >= 2) {
    const last = pagesHtml.length - 1
    const prev = pagesHtml.length - 2

    measure.innerHTML = pagesHtml[last]
    const lastH = measure.scrollHeight
    if (lastH >= 0.9 * viewH) break

    // Attempt 1: merge last two pages
    const combined = pagesHtml[prev] + pagesHtml[last]
    measure.innerHTML = combined
    const combinedH = measure.scrollHeight
    const combinedMax = prev === 0 ? viewH - titleH : viewH

    if (combinedH <= combinedMax) {
      pagesHtml[prev] = combined
      pagesHtml.pop()
      continue
    }

    // Attempt 2: shift paragraphs between last two pages
    const pRe = /<p[^>]*>.*?<\/p>/gs
    const prevParas = pagesHtml[prev].match(pRe) || [pagesHtml[prev]]
    if (prevParas.length <= 1) break

    const prevMax = prev === 0 ? viewH - titleH : viewH
    let bestPrev = pagesHtml[prev], bestLast = pagesHtml[last]
    let bestMinFill = 0
    const maxMove = Math.min(prevParas.length - 1, 5)

    for (let n = 1; n <= maxMove; n++) {
      const moved = prevParas.slice(prevParas.length - n).join('')
      const newPrev = prevParas.slice(0, prevParas.length - n).join('')
      const newLast = moved + pagesHtml[last]

      measure.innerHTML = newPrev; const h1 = measure.scrollHeight
      measure.innerHTML = newLast; const h2 = measure.scrollHeight

      if (h1 > prevMax || h2 > viewH) continue
      const fill1 = h1 / prevMax, fill2 = h2 / viewH
      const minFill = Math.min(fill1, fill2)
      if (minFill > bestMinFill) {
        bestMinFill = minFill
        bestPrev = newPrev
        bestLast = newLast
      }
    }

    if (bestMinFill > 0) {
      pagesHtml[prev] = bestPrev
      pagesHtml[last] = bestLast
    }
    break
  }
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  3.  THREE‑PAGE CACHE & RENDER  (Module 3 — PageTurner)                    */
/*      Always keep prev/current/next pages ready in DOM + memory             */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const pageIndexes = ref({ prev: -1, curr: 0, next: 1 })
const isFlipping  = ref(false)

/** Render one page slot */
function renderPage(slot, idx) {
  const refMap = {
    prev:    { page: prevPageRef,    title: null },
    curr:    { page: currentPageRef, title: null },
    next:    { page: nextPageRef,    title: null },
  }
  const info = refMap[slot]
  if (!info) return
  const el = $el(info.page.value)
  if (!el) return

  if (idx < 0 || idx >= pages.value.length) {
    el.innerHTML = ''
    return
  }
  el.innerHTML = pages.value[idx] || ''
}

function renderAllPages() {
  renderPage('prev', currentPage.value - 1)
  renderPage('curr', currentPage.value)
  renderPage('next', currentPage.value + 1)
}

/** Flip to target page with animation */
function turnTo(target, dir) {
  if (isFlipping.value) return
  if (target < 0 || target >= pages.value.length) return

  isFlipping.value = true

  const flipEl = $el(flipRef.value)
  if (!flipEl) {
    // fallback: instant switch
    currentPage.value = target
    renderAllPages()
    isFlipping.value = false
    return
  }

  const ff = $el(flipFrontRef.value)
  const fb = $el(flipBackRef.value)

  if (dir > 0) {
    // Forward: current on front, target on back
    if (ff) ff.innerHTML = pages.value[currentPage.value] || ''
    if (fb) fb.innerHTML = pages.value[target] || ''
  } else {
    // Backward: target on front, current on back
    if (ff) ff.innerHTML = pages.value[target] || ''
    if (fb) fb.innerHTML = pages.value[currentPage.value] || ''
  }

  flipEl.style.display = 'block'
  flipEl.style.visibility = ''

  if (turnMode.value === 'SIMULATION') {
    flipEl.style.transformOrigin = dir > 0 ? 'left center' : 'right center'
    flipEl.style.transform = 'rotateY(0deg)'
    flipEl.style.transition = 'none'
    void flipEl.offsetHeight
    requestAnimationFrame(() => {
      flipEl.style.transition = 'transform 0.45s cubic-bezier(0.4,0.0,0.2,1)'
      flipEl.style.transform = `rotateY(${dir > 0 ? -180 : 180}deg)`
    })
  } else if (turnMode.value === 'COVER') {
    const tx = dir > 0 ? '100%' : '-100%'
    flipEl.style.transform = `translateX(${tx})`
    flipEl.style.transition = 'none'
    void flipEl.offsetHeight
    requestAnimationFrame(() => {
      flipEl.style.transition = 'transform 0.3s ease'
      flipEl.style.transform = 'translateX(0)'
    })
  } else if (turnMode.value === 'SLIDE') {
    const tx = dir > 0 ? '100%' : '-100%'
    flipEl.style.transform = `translateX(${tx})`
    flipEl.style.transition = 'none'
    const currEl = $el(currentPageRef.value)
    if (currEl) {
      currEl.style.transition = 'none'
      currEl.style.transform = 'translateX(0)'
    }
    void flipEl.offsetHeight
    requestAnimationFrame(() => {
      flipEl.style.transition = 'transform 0.3s ease'
      flipEl.style.transform = 'translateX(0)'
      if (currEl) {
        currEl.style.transition = 'transform 0.3s ease'
        currEl.style.transform = `translateX(${dir > 0 ? '-30%' : '30%'})`
      }
    })
  } else {
    // NONE — instant
    currentPage.value = target
    renderAllPages()
    isFlipping.value = false
    return
  }
}

function onFlipEnd() {
  if (!isFlipping.value) return

  const flipEl = $el(flipRef.value)
  const target = flipDirection.value > 0
    ? currentPage.value + 1
    : currentPage.value - 1

  if (target >= 0 && target < pages.value.length) {
    currentPage.value = target
    renderAllPages()
  }

  // Clean up flip element
  if (flipEl) {
    flipEl.style.display = 'none'
    flipEl.style.visibility = ''
    flipEl.style.transition = 'none'
    flipEl.style.transform = 'none'
  }

  // Reset current page transform (SLIDE mode)
  const currEl = $el(currentPageRef.value)
  if (currEl) {
    currEl.style.transition = 'none'
    currEl.style.transform = 'none'
  }

  isFlipping.value = false
  checkPreloadTrigger()
}

let flipDirection = ref(1)

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  4.  PRELOAD MANAGER  (Module 2)                                           */
/*      Preload next chapter when within 3 pages of the end                   */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
const preloadedChapter = ref(null)  // { chapterNo, pagesHtml[], title, maxChapterNo }
const preloading       = ref(false)

function checkPreloadTrigger() {
  if (preloading.value || preloadedChapter.value) return
  const remaining = pages.value.length - 1 - currentPage.value
  if (remaining <= 3 && props.chapterNo < props.maxChapterNo) {
    triggerPreload()
  }
}

async function triggerPreload() {
  const nextNo = props.chapterNo + 1
  preloading.value = true
  try {
    const data = await request({
      url: `/api/v1/books/${props.bookId}/chapters/${nextNo}`,
      method: 'GET',
    })
    const ch = data?.data
    if (!ch?.content) { preloading.value = false; return }

    // Split the next chapter in the background
    const { pagesHtml } = await splitInBackground(ch.content)
    preloadedChapter.value = {
      chapterNo: nextNo,
      pagesHtml,
      title: ch.title || '',
      maxChapterNo: ch.maxChapterNo || ch.totalChapters || 0,
    }
    $show(readyBadgeRef.value, true)
  } catch (_) {}
  preloading.value = false
}

/** Async split to avoid blocking the UI thread */
function splitInBackground(content) {
  return new Promise(resolve => {
    // Use requestIdleCallback or setTimeout to yield to main thread
    const doSplit = () => {
      const result = splitIntoPages(content)
      resolve(result)
    }
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(doSplit, { timeout: 500 })
    } else {
      setTimeout(doSplit, 50)
    }
  })
}

function jumpPreloadedChapter() {
  if (!preloadedChapter.value) return
  $show(readyBadgeRef.value, false)
  // Swap current chapter for preloaded one
  pages.value = preloadedChapter.value.pagesHtml
  currentPage.value = 0
  // Parent should also update chapter metadata
  emit('load-chapter', preloadedChapter.value.chapterNo)
  preloadedChapter.value = null
  // Preload next-next chapter
  preloading.value = false
  checkPreloadTrigger()
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  5.  INTERACTION MANAGER  (Module 4)                                       */
/*      3‑phase text selection: long‑press → bubble → fine‑tune → full menu   */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
// Phase state
const SEL_NONE      = 0
const SEL_BUBBLE    = 1  // Phase 1/2: long‑press triggered, bubble menu
const SEL_FULL      = 2  // Phase 3: drag‑selected, full menu
let selectionPhase   = SEL_NONE
let longPressTimer   = null
let touchStartTime   = 0
let touchStartPos    = { x: 0, y: 0 }
let isFineTuning     = false
let hasDragged       = false

const highlights = ref([])
const selText    = ref('')
const hasHL      = computed(() => {
  if (!selText.value) return false
  return highlights.value.some(h => h.text === selText.value && h.chapterNo === props.chapterNo)
})

function onTouchStart(e) {
  if (isFlipping.value) return
  const t = e.touches?.[0]
  if (!t) return
  touchStartTime = Date.now()
  touchStartPos = { x: t.clientX, y: t.clientY }
  hasDragged = false
  isFineTuning = false

  clearTimeout(longPressTimer)
  longPressTimer = setTimeout(() => {
    if (hasDragged) return
    // Phase 1: long‑press → smart selection + bubble menu
    detectLongPress(t.clientX, t.clientY)
  }, 450)
}

function onTouchMove(e) {
  const t = e.touches?.[0]
  if (!t) return
  const dx = t.clientX - touchStartPos.x
  const dy = Math.abs(t.clientY - touchStartPos.y)
  if (Math.abs(dx) > 10 || dy > 10) {
    hasDragged = true
    clearTimeout(longPressTimer)
    isFineTuning = true  // user is adjusting selection
  }
}

function onTouchEnd(e) {
  clearTimeout(longPressTimer)
  if (selectionPhase === SEL_BUBBLE && hasDragged) {
    // Phase 2: fine‑tuning — update bubble position but keep it simple
    updateBubblePosition()
  }
  if (!hasDragged && !isFineTuning) {
    // Quick tap — clear selections
    clearSelection()
  }
}

/** Phase 1: long‑press → smart word selection */
function detectLongPress(cx, cy) {
  const sel = window.getSelection()
  if (!sel) return

  // Find text node at touch point
  const range = document.caretRangeFromPoint(cx, cy)
  if (!range) return

  const node = range.startContainer
  if (!node || node.nodeType !== Node.TEXT_NODE) return

  const text = node.textContent || ''
  const offset = range.startOffset

  // Smart word selection for Chinese: expand to punctuation‑bounded phrase
  const punctBefore = /[，。！？、；：""''（）《》【】\s]/g
  let startOff = offset
  let endOff   = offset

  // Scan backward for phrase boundary
  for (let i = offset - 1; i >= 0; i--) {
    if (punctBefore.test(text[i])) break
    startOff = i
  }
  punctBefore.lastIndex = 0
  // Scan forward
  for (let i = offset; i < text.length; i++) {
    if (punctBefore.test(text[i])) break
    endOff = i + 1
  }

  // Enforce length window 5–15 chars
  const phraseLen = endOff - startOff
  if (phraseLen < 5) {
    // Expand symmetrically
    const needed = 5 - phraseLen
    startOff = Math.max(0, startOff - Math.ceil(needed / 2))
    endOff   = Math.min(text.length, endOff + Math.floor(needed / 2))
  }
  if (endOff - startOff > 15) {
    // Trim to 15 centered on tap
    const center = (startOff + endOff) / 2
    startOff = Math.max(0, Math.round(center - 7))
    endOff   = Math.min(text.length, startOff + 15)
  }

  // Create range
  const r = document.createRange()
  r.setStart(node, startOff)
  r.setEnd(node, endOff)
  sel.removeAllRanges()
  sel.addRange(r)

  selText.value = sel.toString().trim()
  if (!selText.value || selText.value.length < 2) return

  // Phase 1 → show bubble menu
  selectionPhase = SEL_BUBBLE
  showBubbleMenu(r)
}

function showBubbleMenu(range) {
  const rect = range.getBoundingClientRect()
  const bub = $el(bubbleRef.value)
  if (!bub) return

  const bubW = 220
  let left = rect.left + rect.width / 2 - bubW / 2
  left = Math.max(8, Math.min(left, window.innerWidth - bubW - 8))
  let top = rect.top - 50
  if (top < 40) top = rect.bottom + 10

  bub.style.left = left + 'px'
  bub.style.top  = top + 'px'
  $show(bubbleRef.value, true)
  $show(fullMenuRef.value, false)
}

function updateBubblePosition() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return
  const r = sel.getRangeAt(0)
  selText.value = sel.toString().trim()
  showBubbleMenu(r)
}

function showFullMenu() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return
  selText.value = sel.toString().trim()

  const r = sel.getRangeAt(0)
  const rect = r.getBoundingClientRect()
  const fm = $el(fullMenuRef.value)
  if (!fm) return

  const fmW = 360
  let left = rect.left + rect.width / 2 - fmW / 2
  left = Math.max(8, Math.min(left, window.innerWidth - fmW - 8))
  let top = rect.top - 120
  if (top < 40) top = rect.bottom + 12

  fm.style.left = left + 'px'
  fm.style.top  = top + 'px'
  $show(bubbleRef.value, false)
  $show(fullMenuRef.value, true)
  selectionPhase = SEL_FULL
}

function clearSelection() {
  window.getSelection()?.removeAllRanges()
  $show(bubbleRef.value, false)
  $show(fullMenuRef.value, false)
  selectionPhase = SEL_NONE
  selText.value = ''
}

/* Selection change listener (Phases 2 & 3) */
function onSelectionChange() {
  if (selectionPhase === SEL_BUBBLE) {
    // Phase 2: fine‑tuning — just update bubble position
    if (isFineTuning) updateBubblePosition()
    return
  }

  const sel = window.getSelection()
  if (!sel || sel.isCollapsed) {
    if (selectionPhase !== SEL_NONE && !isFineTuning) clearSelection()
    return
  }

  const text = sel.toString().trim()
  if (text.length < 2) return

  // Phase 3: if user drag‑selected multiple lines → full menu
  if (hasDragged && text.length > 20) {
    selText.value = text
    showFullMenu()
  }
}

/* Selection actions */
function actCopy() {
  const text = selText.value
  clearSelection()
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '已复制', icon: 'success' }),
  })
}
function actHighlight()  { toggleHighlight(); clearSelection() }
function actShare()      { clearSelection(); emit('share', selText.value) }
function actComment()    { clearSelection(); emit('comment', selText.value) }
function actTypo()       { if (selText.value.length <= 5) { clearSelection(); emit('typo', selText.value) } }
function actListen()     { clearSelection(); emit('listen', selText.value) }
function actDictionary() { clearSelection(); emit('dictionary', selText.value) }
function actTag(t)       { clearSelection(); emit('tag', { text: selText.value, tag: t }) }

function toggleHighlight() {
  const ch = props.chapterNo
  const existing = highlights.value.findIndex(h => h.text === selText.value && h.chapterNo === ch)
  if (existing >= 0) {
    highlights.value.splice(existing, 1)
  } else {
    highlights.value.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      bookId: props.bookId,
      chapterNo: ch,
      text: selText.value,
      color: HL_COLORS[highlights.value.length % HL_COLORS.length],
      createdAt: Date.now(),
    })
  }
  uni.setStorageSync('re_highlights', highlights.value)
  applyHighlightsToDOM()
}

function applyHighlightsToDOM() {
  const container = $el(containerRef.value)
  if (!container) return

  // Remove existing <hl> marks
  container.querySelectorAll('.re-hl').forEach(el => {
    const p = el.parentNode
    if (p) { p.replaceChild(document.createTextNode(el.textContent), el); p.normalize() }
  })

  const chHighlights = highlights.value.filter(h => h.chapterNo === props.chapterNo)
  for (const h of chHighlights) {
    try {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false)
      let node
      while ((node = walker.nextNode())) {
        const idx = node.textContent.indexOf(h.text)
        if (idx === -1) continue
        const range = document.createRange()
        range.setStart(node, idx)
        range.setEnd(node, idx + h.text.length)
        const span = document.createElement('span')
        span.className = 're-hl'
        span.style.cssText = `background-color:${h.color};border-radius:2px;padding:0 1px`
        range.surroundContents(span)
        break
      }
    } catch (_) {}
  }
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  TAP HANDLING                                                              */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
function onTapLeft()    { prevPage() }
function onTapRight()   { nextPage() }
function onTapCenter()  { toggleToolbar() }

function prevPage() {
  if (isFlipping.value || isUpdating.value) return
  if (showToolbar.value) { hideToolbar(); return }
  if (currentPage.value > 0) {
    flipDirection.value = -1
    turnTo(currentPage.value - 1, -1)
    return
  }
  emit('prev-chapter')
}

function nextPage() {
  if (isFlipping.value || isUpdating.value) return
  if (showToolbar.value) { hideToolbar(); return }
  if (currentPage.value < pages.value.length - 1) {
    flipDirection.value = 1
    turnTo(currentPage.value + 1, 1)
    return
  }
  // End of chapter — try preloaded chapter or emit
  if (preloadedChapter.value) {
    jumpPreloadedChapter()
    return
  }
  emit('next-chapter')
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  TOOLBAR                                                                   */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
let hideTimer = null

function toggleToolbar() {
  showToolbar.value = !showToolbar.value
  applyToolbar()
  if (showToolbar.value) startHideTimer()
}

function hideToolbar() {
  showToolbar.value = false
  applyToolbar()
  clearHideTimer()
}

function startHideTimer() {
  clearHideTimer()
  hideTimer = setTimeout(() => hideToolbar(), 5000)
}

function clearHideTimer() {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
}

function applyToolbar() {
  const el = $el(toolbarRef.value)
  if (!el) return
  el.classList.toggle('visible', showToolbar.value)
}

function toggleNight() {
  // handled by theme change
  theme.value = theme.value === 'NIGHT' ? 'PARCHMENT' : 'NIGHT'
}

/* Top-bar actions */
function addShelf()        { emit('add-shelf') }
function download()        { emit('download') }
function openComments()    { emit('comments') }
function shareChapter()    { emit('share') }
function showMore()        { emit('more') }
function openCatalog()     { hideToolbar(); emit('catalog') }

/* Chapter navigation */
function nextChapter() {
  if (props.chapterNo >= props.maxChapterNo) {
    uni.showToast({ title: '已是最后一章', icon: 'none' })
    return
  }
  hideToolbar()
  emit('load-chapter', props.chapterNo + 1)
}

function prevChapter() {
  if (props.chapterNo <= 1) {
    uni.showToast({ title: '已是第一章', icon: 'none' })
    return
  }
  hideToolbar()
  emit('load-chapter', props.chapterNo - 1, -1)  // -1 = last page
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  WATCHERS                                                                  */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
watch(() => props.content, (val) => {
  if (!val) return
  isUpdating.value = true
  clearSelection()
  const { pagesHtml } = splitIntoPages(val)
  pages.value = pagesHtml
  currentPage.value = 0
  nextTick(() => {
    renderAllPages()
    applyHighlightsToDOM()
    isUpdating.value = false
    preloading.value = false
    preloadedChapter.value = null
    $show(readyBadgeRef.value, false)
  })
})

watch(theme, () => applyReaderTheme())
watch([fontSize, lineHeight, fontFamily], () => {
  // Re‑split when typography changes
  if (props.content) {
    const { pagesHtml } = splitIntoPages(props.content)
    pages.value = pagesHtml
    currentPage.value = 0
    nextTick(() => renderAllPages())
  }
})
watch(brightness, () => applyReaderTheme())
watch(currentPage, () => { checkPreloadTrigger() })

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  THEME APPLICATION                                                         */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
function applyReaderTheme() {
  const container = $el(containerRef.value)
  if (!container) return
  const t = THEMES.find(x => x.key === theme.value) || THEMES[0]
  container.style.backgroundColor = t.bg
  container.style.color = t.text
  container.style.filter = brightness.value < 100 ? `brightness(${brightness.value / 100})` : 'none'

  // Sync background to flip elements so they're opaque during 3D rotation
  ;[flipFrontRef, flipBackRef, prevPageRef, currentPageRef, nextPageRef].forEach(ref => {
    const dom = $el(ref.value)
    if (dom) dom.style.backgroundColor = t.bg
  })
}

/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
/*  LIFECYCLE                                                                 */
/* –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––– */
onMounted(() => {
  loadSettings()
  applyReaderTheme()
  // Restore highlights
  try {
    const saved = uni.getStorageSync('re_highlights')
    if (saved) highlights.value = saved
  } catch (_) {}

  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('click', onDocClick)

  if (props.content) {
    const { pagesHtml } = splitIntoPages(props.content)
    pages.value = pagesHtml
    nextTick(() => renderAllPages())
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('click', onDocClick)
  clearTimeout(longPressTimer)
  clearHideTimer()
})

function onDocClick(e) {
  // Dismiss bubble / full menu on outside click
  const target = e.target
  const bub = $el(bubbleRef.value)
  const fm = $el(fullMenuRef.value)
  if (selectionPhase !== SEL_NONE) {
    if (bub && !bub.contains(target) && fm && !fm.contains(target)) {
      clearSelection()
    }
  }
}
</script>

<style>
/* ==========================================================================
   ROOT
   ========================================================================== */
.re-root {
  position: relative;
  width: 100%;
  height: 100vh; height: 100dvh;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}

/* ==========================================================================
   READING CONTAINER
   ========================================================================== */
.re-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  transition: filter 0.2s ease;
}
.re-stage {
  position: relative;
  width: 100%;
  height: 100%;
}
.re-page {
  position: absolute;
  inset: 0;
  padding: 44px 32px 24px;
  box-sizing: border-box;
  overflow: hidden;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: justify;
}
.re-page p { margin:0; text-indent:2em; line-height:inherit; user-select:text; -webkit-user-select:text; }

/* ==========================================================================
   FLIP ELEMENT
   ========================================================================== */
.re-flip {
  position: absolute;
  inset: 0;
  display: none;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
  z-index: 10;
}
.re-flip-face {
  position: absolute;
  inset: 0;
  overflow: hidden;
  padding: 44px 32px 24px;
  box-sizing: border-box;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
}
.re-flip-front { z-index: 2; }
.re-flip-back {
  z-index: 1;
  transform: rotateY(180deg);
}

/* ==========================================================================
   TAP ZONES
   ========================================================================== */
.re-tap {
  position: absolute;
  top: 0; bottom: 0;
  z-index: 5;
  background: transparent;
}
.re-tap-left   { left: 0;   width: 33.33%; }
.re-tap-center { left: 33.33%; width: 33.34%; }
.re-tap-right  { right: 0;  width: 33.33%; }

/* ==========================================================================
   BACK INDICATOR
   ========================================================================== */
.re-back {
  position: fixed;
  z-index: 6;
  top: 0; left: 0; right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  cursor: pointer;
  max-width: 100vw;
  overflow: hidden;
}
.re-back-arrow { font-size:16px; opacity:0.6; flex-shrink:0; }
.re-back-label { font-size:14px; opacity:0.6; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.re-back:active { opacity:0.85; }

/* ==========================================================================
   READY BADGE
   ========================================================================== */
.re-badge {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  background: rgba(0,0,0,0.75);
  color: #fff;
  font-size: 13px;
  padding: 8px 18px;
  border-radius: 20px;
  cursor: pointer;
  animation: re-badge-in 0.3s ease;
}
@keyframes re-badge-in { from { opacity:0; transform:translateX(-50%) translateY(10px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }

/* ==========================================================================
   BUBBLE MENU  (Phase 1/2)
   ========================================================================== */
.re-bubble {
  position: fixed;
  z-index: 50;
}
.re-bubble-body {
  display: flex;
  gap: 2px;
  background: #2D2D2D;
  border-radius: 10px;
  padding: 5px 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.re-bub-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
}
.re-bub-btn:active { background: rgba(255,255,255,0.12); }
.re-bubble-arrow {
  width: 0; height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #2D2D2D;
  margin-left: 16px;
}

/* ==========================================================================
   FULL MENU  (Phase 3)
   ========================================================================== */
.re-full-menu {
  position: fixed;
  z-index: 50;
}
.re-full-body {
  background: #2D2D2D;
  border-radius: 12px;
  padding: 6px 10px;
  box-shadow: 0 6px 28px rgba(0,0,0,0.4);
  max-width: 360px;
}
.re-full-row { display:flex; gap:2px; flex-wrap:wrap; }
.re-full-tags { margin-top:5px; padding-top:5px; border-top:1px solid rgba(255,255,255,0.1); }
.re-full-action {
  padding: 5px 9px; font-size:12px; color:#e4e4e4;
  border-radius:6px; cursor:pointer; white-space:nowrap;
}
.re-full-action:active { background:rgba(255,255,255,0.12); }
.re-full-tag {
  padding:4px 10px; font-size:11px; color:#C0B0A0;
  border-radius:14px; border:1px solid rgba(255,255,255,0.14); cursor:pointer;
}
.re-full-tag:active { background:rgba(255,255,255,0.08); }
.re-full-arrow {
  width:0; height:0;
  border-left:8px solid transparent; border-right:8px solid transparent;
  border-top:8px solid #2D2D2D; margin-left:20px;
}

/* ==========================================================================
   TOOLBAR
   ========================================================================== */
.re-toolbar {
  position: fixed;
  inset: 0;
  z-index: 20;
  pointer-events: none;
}
.re-toolbar.visible { pointer-events: auto; }

.re-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 10px;
  padding-top: env(safe-area-inset-top,0);
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(12px);
  transform: translateY(-100%);
  transition: transform 0.32s ease;
}
.re-toolbar.visible .re-topbar { transform: translateY(0); }

.re-tbtn { font-size:14px; color:#333; cursor:pointer; white-space:nowrap; }
.re-tbtn:active { opacity:0.55; }
.re-tbtn-back { font-size:22px; font-weight:700; min-width:32px; }

.re-bottombar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: rgba(248,248,246,0.96);
  backdrop-filter: blur(12px);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.32s ease;
}
.re-toolbar.visible .re-bottombar { transform: translateY(0); }

.re-bp-row {
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  margin-bottom: 8px;
}
.re-bp-nav {
  height: 30px; line-height:30px; text-align:center;
  border-radius:15px; background:rgba(0,0,0,0.05);
  color:#555; font-size:13px; cursor:pointer;
}
.re-bp-nav:active { background:rgba(0,0,0,0.12); }

.re-bp-progress {
  display:flex; flex-direction:column; align-items:center; gap:4px;
}
.re-bp-label { font-size:11px; color:#999; }
.re-bp-track {
  width:100%; height:4px;
  border-radius:2px; background:rgba(0,0,0,0.08); overflow:hidden;
}
.re-bp-fill {
  height:100%; border-radius:2px;
  background:#C4A882; transition:width 0.2s ease;
}

.re-bp-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 8px 16px 0;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.re-bp-action {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:3px; height:52px; border-radius:10px; color:#5A5A5A; cursor:pointer;
}
.re-bp-action:active { background:rgba(0,0,0,0.06); color:#1F1F1F; }
.re-bp-alabel { font-size:11px; }

/* ==========================================================================
   SETTINGS
   ========================================================================== */
.re-settings-overlay {
  position: fixed; inset:0; z-index:30;
  background:rgba(0,0,0,0.35);
  opacity:0; pointer-events:none;
  transition:opacity 0.25s ease;
  display: none;
}
.re-settings-overlay.re-settings-open {
  display: block;
  opacity:1; pointer-events:auto;
}

.re-settings {
  position:absolute; bottom:0; left:0; right:0;
  max-height:min(80vh,600px); overflow-y:auto;
  background:#fff; border-radius:16px 16px 0 0;
  padding:10px 18px calc(18px + env(safe-area-inset-bottom));
  transform:translateY(100%);
  transition:transform 0.32s cubic-bezier(0.32,0.72,0,1);
}
.re-settings-open .re-settings { transform:translateY(0); }

.re-sheet-handle {
  width:36px; height:4px; margin:0 auto 16px;
  border-radius:2px; background:rgba(0,0,0,0.15);
}
.re-set-row {
  display:flex; align-items:center; justify-content:space-between;
  min-height:44px; padding:6px 0;
}
.re-set-row + .re-set-row { border-top:1px solid rgba(0,0,0,0.04); }
.re-set-label { color:#333; font-size:14px; min-width:56px; }

.re-stepper { display:flex; align-items:center; gap:8px; }
.re-step-btn {
  width:34px; height:30px; line-height:30px; text-align:center;
  border-radius:6px; background:#F0F0ED; color:#333; font-size:14px; cursor:pointer;
}
.re-step-btn:active { background:#E0E0DD; }
.re-step-val { font-size:15px; color:#333; min-width:28px; text-align:center; }

.re-font-options { display:flex; gap:8px; }
.re-font-opt {
  padding:4px 14px; border-radius:14px; border:1px solid #ddd;
  font-size:13px; color:#666; cursor:pointer;
}
.re-font-opt.active { background:#333; color:#fff; border-color:#333; }

.re-theme-chips { display:flex; gap:8px; }
.re-theme-chip {
  width:32px; height:32px; border-radius:50%;
  border:2px solid #ddd; cursor:pointer;
  transition:transform 0.15s;
}
.re-theme-chip.active { border-color:#333; transform:scale(1.15); box-shadow:0 0 0 2px #333; }

.re-turn-options { display:flex; border-radius:8px; overflow:hidden; border:1px solid #ddd; }
.re-turn-opt {
  padding:5px 10px; font-size:12px; color:#666;
  background:#fafafa; cursor:pointer; border-right:1px solid #ddd;
}
.re-turn-opt:last-child { border-right:none; }
.re-turn-opt.active { background:#333; color:#fff; }

/* ==========================================================================
   RESPONSIVE
   ========================================================================== */
@media (max-width: 480px) {
  .re-back { left:0; right:0; }
}
</style>
