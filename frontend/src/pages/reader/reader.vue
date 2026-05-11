<template>
  <view class="reader-root">
    <!-- ====== Reading Area + 3D Page Stage ====== -->
    <view
      ref="readerAreaRef"
      class="reader-area"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <view ref="pageStageRef" class="page-stage">
        <!-- Static front page -->
        <view ref="frontPageRef" class="front-page">
          <view class="chapter-title" ref="frontTitleRef">{{ chapterTitle }}</view>
          <view class="page-body" ref="frontBodyRef" />
        </view>
        <!-- Static back page (hidden, prepared for flip) -->
        <view ref="backPageRef" class="back-page" style="display:none">
          <view class="chapter-title" ref="backTitleRef"></view>
          <view class="page-body" ref="backBodyRef" />
        </view>
        <!-- Animated flipping element -->
        <view
          ref="flipPageRef"
          class="flipping-page"
          style="display:none"
          @transitionend="onFlipTransitionEnd"
        >
          <view class="flip-front" ref="flipFrontRef">
            <view class="chapter-title" ref="flipFrontTitleRef"></view>
            <view class="page-body" ref="flipFrontBodyRef" />
          </view>
          <view class="flip-back" ref="flipBackRef">
            <view class="chapter-title" ref="flipBackTitleRef"></view>
            <view class="page-body" ref="flipBackBodyRef" />
          </view>
        </view>
      </view>
      <!-- Tap zones: left 33% / center 34% / right 33% -->
      <view class="tap-zone tap-left"  @click.stop="prevPage" />
      <view class="tap-zone tap-center" @click.stop="toggleToolbar" />
      <view class="tap-zone tap-right" @click.stop="nextPage" />
    </view>

    <!-- ====== Persistent Back Indicator ====== -->
    <view ref="backIndicatorRef" class="back-indicator" @click.stop="goBack">
      <text class="back-arrow">‹</text>
      <text class="back-label" ref="backIndicatorTextRef">返回</text>
    </view>

    <!-- ====== Top Control Bar ====== -->
    <view ref="topBarRef" class="top-bar">
      <view class="top-bar-row">
        <text class="top-btn top-back" @click.stop="goBack">&lt;</text>
        <text class="top-btn top-shelf" @click.stop="addToBookshelf">加入书架</text>
        <view class="top-btn top-download" @click.stop="downloadChapter">
          <text>下载</text>
          <text class="free-badge">免费</text>
        </view>
        <view class="top-btn top-comments" @click.stop="openComments">
          <text>💬</text>
          <text ref="commentBadgeRef" class="comment-badge" style="display:none">99+</text>
        </view>
        <text class="top-btn top-share" @click.stop="showShareCard">分享</text>
        <text class="top-btn top-more" @click.stop="showMoreMenu">⋯</text>
      </view>
    </view>

    <!-- ====== Bottom Panel ====== -->
    <view ref="bottomPanelRef" class="bottom-panel">
      <view class="bottom-panel-inner">
        <!-- Progress row -->
        <view class="bp-row bp-progress-row">
          <view class="chapter-nav-btn" @click.stop="prevChapter">上一章</view>
          <view class="progress-col">
            <text class="progress-page-label">{{ currentPage + 1 }}&nbsp;/&nbsp;{{ totalPages || 1 }}</text>
            <view class="progress-track" ref="progressTrackRef">
              <view class="progress-fill" ref="progressFillRef" />
              <view class="progress-thumb" ref="progressThumbRef" />
            </view>
          </view>
          <view class="chapter-nav-btn" @click.stop="nextChapter">下一章</view>
        </view>
        <!-- Actions row -->
        <view class="bp-row bp-actions-row">
          <view class="bp-action" @click.stop="openCatalog">
            <text class="bp-action-icon">📖</text>
            <text class="bp-action-label">目录</text>
          </view>
          <view class="bp-action" @click.stop="toggleNightMode">
            <text class="bp-action-icon" ref="nightIconRef">{{ isNight ? '☀️' : '🌙' }}</text>
            <text class="bp-action-label" ref="nightLabelRef">{{ isNight ? '日间' : '夜间' }}</text>
          </view>
          <view class="bp-action" @click.stop="openSettings">
            <text class="bp-action-icon">⚙️</text>
            <text class="bp-action-label">设置</text>
          </view>
          <view class="bp-action" @click.stop="showMoreAdaptations">
            <text class="bp-action-icon">⋯</text>
            <text class="bp-action-label">更多改编</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ====== Text Selection Floating Menu ====== -->
    <view ref="selectionMenuRef" class="selection-menu">
      <view class="selection-menu-body" ref="selectionMenuBodyRef">
        <!-- Row 1: actions -->
        <view class="sel-row sel-row-actions">
          <text class="sel-action" @click.stop="listenSelection">听</text>
          <text class="sel-action" @click.stop="openCommentEditor">写段评</text>
          <text class="sel-action" ref="highlightBtnRef" @click.stop="toggleHighlight">{{ hasCurrentHighlight ? '取消划线' : '划线' }}</text>
          <text class="sel-action" @click.stop="shareSelection">分享</text>
          <text class="sel-action" @click.stop="copySelection">复制</text>
          <text class="sel-action" @click.stop="lookupDictionary">词典</text>
          <text ref="typoBtnRef2" class="sel-action sel-action-typo" style="display:none" @click.stop="reportTypo">错字反馈</text>
        </view>
        <!-- Row 2: tags -->
        <view class="sel-row sel-row-tags">
          <text class="sel-tag" @click.stop="tagSelection('名场面')">名场面</text>
          <text class="sel-tag" @click.stop="tagSelection('名台词')">名台词</text>
          <text class="sel-tag" @click.stop="tagSelection('好磕')">好磕</text>
          <text class="sel-tag" @click.stop="tagSelection('好虐')">好虐</text>
        </view>
      </view>
      <view class="sel-arrow" ref="selArrowRef" />
    </view>

    <!-- ====== Share Card Modal ====== -->
    <view ref="shareOverlayRef" class="modal-overlay" style="display:none" @click.stop="closeShare">
      <view class="share-card" @click.stop>
        <view class="share-card-head">
          <text class="share-book-name">{{ bookTitle }}</text>
        </view>
        <view class="share-card-quote">
          <text ref="shareQuoteRef">{{ selectedTextForShare }}</text>
        </view>
        <view class="share-card-meta">
          <text class="share-card-tagline">悦读 · 发现好故事</text>
          <view class="share-card-qr"><text>QR</text></view>
        </view>
        <view class="share-card-channels">
          <text class="share-channel" @click.stop="shareToChannel('书友圈')">书友圈</text>
          <text class="share-channel" @click.stop="shareToChannel('微信')">微信</text>
          <text class="share-channel" @click.stop="shareToChannel('朋友圈')">朋友圈</text>
          <text class="share-channel" @click.stop="shareToChannel('QQ')">QQ</text>
        </view>
        <text class="share-card-close" @click.stop="closeShare">关闭</text>
      </view>
    </view>

    <!-- ====== Comment Editor Sheet ====== -->
    <view ref="commentOverlayRef" class="modal-overlay" style="display:none" @click.stop="closeCommentEditor">
      <view class="comment-editor" @click.stop>
        <text class="comment-editor-title">写段评</text>
        <view class="comment-editor-quote">
          <text ref="commentQuoteRef">{{ selectionText }}</text>
        </view>
        <textarea
          ref="commentTextareaRef"
          class="comment-editor-input"
          maxlength="500"
          placeholder="写下你对这一段的想法..."
        />
        <view class="comment-editor-actions">
          <view class="comment-btn comment-btn-cancel" @click.stop="closeCommentEditor">取消</view>
          <view class="comment-btn comment-btn-submit" @click.stop="submitComment">发布</view>
        </view>
      </view>
    </view>

    <!-- ====== Settings Panel ====== -->
    <view ref="settingsOverlayRef" class="settings-overlay" @click.stop="closeSettings">
      <view ref="settingsSheetRef" class="settings-sheet" @click.stop>
        <view class="sheet-handle" />

        <!-- Brightness + eye protection -->
        <view class="setting-row">
          <text class="setting-label">亮度</text>
          <view class="brightness-row">
            <text class="brightness-icon">☀️</text>
            <slider
              class="slider brightness-slider"
              :min="10"
              :max="100"
              :value="brightness"
              activeColor="#333"
              backgroundColor="#e0e0e0"
              block-size="18"
              @change="onBrightnessChange"
            />
            <text class="brightness-icon brightness-icon-big">☀️</text>
          </view>
          <switch ref="eyeSwitchRef2" class="setting-switch" color="#C4A882" @change="onEyeProtectionChange" />
        </view>

        <!-- Font size -->
        <view class="setting-row">
          <text class="setting-label">字号</text>
          <view class="stepper-row">
            <text class="stepper-btn" @click.stop="adjustFontSize(-1)">A-</text>
            <text class="stepper-value">{{ fontSize }}</text>
            <text class="stepper-btn" @click.stop="adjustFontSize(1)">A+</text>
          </view>
        </view>

        <!-- Font family -->
        <view class="setting-row">
          <text class="setting-label">字体</text>
          <view ref="fontOptionsWrapRef" class="font-options">
            <text
              v-for="f in fontOptions"
              :key="f.value"
              class="font-option"
              @click.stop="selectFont(f.value)"
            >{{ f.label }}</text>
          </view>
        </view>

        <!-- Color themes -->
        <view class="setting-row">
          <text class="setting-label">主题</text>
          <view ref="themeChipsRef" class="theme-chips">
            <view
              v-for="t in themeOptions"
              :key="t.key"
              class="theme-chip"
              @click.stop="selectTheme(t.key)"
            >
              <view class="theme-chip-swatch" :style="{ backgroundColor: t.bg }" />
              <text class="theme-chip-tick" ref="themeTickRef">✓</text>
            </view>
          </view>
        </view>

        <!-- Wallpaper -->
        <view class="setting-row">
          <text class="setting-label">壁纸</text>
          <view ref="wallpaperRef" class="wallpaper-row">
            <view
              v-for="(wp, i) in wallpapers"
              :key="i"
              class="wallpaper-chip"
              :style="{ backgroundImage: wp }"
              @click.stop="selectWallpaper(i)"
            />
            <view class="wallpaper-chip wallpaper-upload" @click.stop="uploadWallpaper">
              <text>+</text>
            </view>
          </view>
        </view>

        <!-- Turn mode -->
        <view class="setting-row">
          <text class="setting-label">翻页</text>
          <view ref="turnModeRef" class="turn-mode-row">
            <text
              v-for="m in turnModes"
              :key="m.value"
              class="turn-mode-item"
              @click.stop="selectTurnMode(m.value)"
            >{{ m.label }}</text>
          </view>
        </view>

        <!-- Paragraph spacing -->
        <view class="setting-row">
          <text class="setting-label">间距</text>
          <view class="stepper-row">
            <text class="stepper-btn" @click.stop="adjustSpacing(-1)">−</text>
            <text class="stepper-value">{{ paragraphSpacing }}</text>
            <text class="stepper-btn" @click.stop="adjustSpacing(1)">+</text>
          </view>
        </view>

        <!-- Paragraph break -->
        <view class="setting-row">
          <text class="setting-label">段间空行</text>
          <switch ref="paraBreakSwitchRef2" class="setting-switch" color="#333" @change="onParagraphBreakChange" />
        </view>

        <!-- Inline comments -->
        <view class="setting-row">
          <text class="setting-label">评论透传</text>
          <switch ref="inlineCommentsSwitchRef2" class="setting-switch" color="#333" @change="onInlineCommentsChange" />
        </view>

        <view class="setting-more-row" @click.stop="showAllSettings">
          <text>更多设置 ›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '../../utils/request'

// ===================== STATE =====================
// --- book ---
const bookId = ref('')
const chapterNo = ref(1)
const maxChapterNo = ref(0)
const chapterTitle = ref('')
const bookTitle = ref('')
const rawContent = ref('')

// --- reading settings (persisted) ---
const fontSize = ref(18)
const fontFamily = ref('SERIF')
const theme = ref('PARCHMENT')
const brightness = ref(80)
const eyeProtection = ref(false)
const turnMode = ref('SIMULATION')
const paragraphSpacing = ref(6)
const paragraphBreak = ref(true)
const showInlineComments = ref(true)
const currentWallpaper = ref(-1)
const nightOverride = ref(false)

// --- toolbar ---
const toolbarVisible = ref(false)
let autoHideTimer = null

// --- page state ---
const pages = ref([])
const currentPage = ref(0)
const isFlipping = ref(false)
const flipDirection = ref(1)

// --- chapter cache ---
const chapterCache = {}  // key: "bookId:chapterNo" → { title, content, maxChapterNo }

// --- split settling ---
let splitSettleTimer = null

// --- touch/drag ---
let touchStartX = 0
let touchStartY = 0
let touchTimestamp = 0
let isDragging = false

// --- text selection ---
const selectionVisible = ref(false)
const selectionText = ref('')
const selectedTextForShare = ref('')
const menuX = ref(0)
const menuY = ref(0)

// --- highlights ---
const highlights = ref([])

// --- comment editor ---
const commentWriterVisible = ref(false)
const commentText = ref('')
const commentCount = ref(0)

// --- share ---
const shareVisible = ref(false)

// --- settings ---
const settingsVisible = ref(false)

// ===================== COMPUTED =====================
const isNight = computed(() => theme.value === 'NIGHT' || nightOverride.value)
const totalPages = computed(() => Math.max(1, pages.value.length))
const currentHighlight = computed(() =>
  selectionText.value
    ? highlights.value.find(h => h.text === selectionText.value && h.chapterNo === chapterNo.value)
    : null
)
const hasCurrentHighlight = computed(() => !!currentHighlight.value)

// ===================== CONSTANTS =====================
const THEMES = {
  DEFAULT:     { bg: '#FFFFFF', text: '#1F1F1F' },
  PARCHMENT:   { bg: '#F9F5E8', text: '#3D2B1F' },
  LIGHT_GREEN: { bg: '#E8F0E3', text: '#2D3A28' },
  LIGHT_BLUE:  { bg: '#E4ECF0', text: '#1F2A3A' },
  NIGHT:       { bg: '#161A1D', text: '#D8D1C7' },
}

const themeOptions = [
  { key: 'DEFAULT',     bg: '#FFFFFF' },
  { key: 'PARCHMENT',   bg: '#F9F5E8' },
  { key: 'LIGHT_GREEN', bg: '#E8F0E3' },
  { key: 'LIGHT_BLUE',  bg: '#E4ECF0' },
  { key: 'NIGHT',       bg: '#161A1D' },
]

const fontOptions = [
  { label: '宋体', value: 'SERIF' },
  { label: '楷体', value: 'KAITI' },
]

const turnModes = [
  { label: '仿真', value: 'SIMULATION' },
  { label: '覆盖', value: 'COVER' },
  { label: '平移', value: 'SLIDE' },
  { label: '上下', value: 'SCROLL' },
  { label: '无',   value: 'NONE' },
]

const wallpapers = [
  'linear-gradient(135deg, #f5f0e8, #e8dcc8)',
  'linear-gradient(135deg, #e8e0d0, #d8cebc)',
  'linear-gradient(135deg, #f0ece4, #e4dcd0)',
  'radial-gradient(circle at 20% 30%, #f0e8dc, #e0d4c0)',
]

// ===================== DOM REFS =====================
const readerAreaRef = ref(null)
const pageStageRef = ref(null)
const backIndicatorRef = ref(null)
const backIndicatorTextRef = ref(null)
const frontPageRef = ref(null)
const frontTitleRef = ref(null)
const frontBodyRef = ref(null)
const backPageRef = ref(null)
const backTitleRef = ref(null)
const backBodyRef = ref(null)
const flipPageRef = ref(null)
const flipFrontRef = ref(null)
const flipFrontTitleRef = ref(null)
const flipFrontBodyRef = ref(null)
const flipBackRef = ref(null)
const flipBackTitleRef = ref(null)
const flipBackBodyRef = ref(null)
const topBarRef = ref(null)
const commentBadgeRef = ref(null)
const bottomPanelRef = ref(null)
const progressTrackRef = ref(null)
const progressFillRef = ref(null)
const progressThumbRef = ref(null)
const listenFabRef = ref(null)
const nightIconRef = ref(null)
const nightLabelRef = ref(null)
const selectionMenuRef = ref(null)
const selectionMenuBodyRef = ref(null)
const selArrowRef = ref(null)
const highlightBtnRef = ref(null)
const typoBtnRef2 = ref(null)
const shareOverlayRef = ref(null)
const shareQuoteRef = ref(null)
const commentOverlayRef = ref(null)
const commentQuoteRef = ref(null)
const commentTextareaRef = ref(null)
const settingsOverlayRef = ref(null)
const settingsSheetRef = ref(null)
const eyeSwitchRef2 = ref(null)
const fontOptionsWrapRef = ref(null)
const themeChipsRef = ref(null)
const themeTickRef = ref(null)
const wallpaperRef = ref(null)
const turnModeRef = ref(null)
const paraBreakSwitchRef2 = ref(null)
const inlineCommentsSwitchRef2 = ref(null)

// ===================== LIFECYCLE =====================
onLoad((query) => {
  bookId.value = query.bookId || ''
  chapterNo.value = Number(query.chapterNo ?? 1)
  bookTitle.value = query.title || ''
  loadSettings()
  restoreChapterCache()
  loadChapter()
})

onMounted(() => {
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('click', onDocClick)
  applyAllUI()
  updateBackIndicator()
})

onBeforeUnmount(() => {
  clearAutoHideTimer()
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('click', onDocClick)
})

// ===================== UI SYNC (directive bug workaround) =====================

/** Get native DOM element from a uni-app component proxy, a plain DOM element, or a Vue ref */
function $el(thing) {
  if (!thing) return null
  const v = thing.$el ?? thing  // component proxy → DOM element
  return v
}

function toggleClass(thing, cls, state) {
  const el = $el(thing)
  if (el?.classList) el.classList.toggle(cls, !!state)
}

/** Full UI sync, called on mount & on major state changes */
function applyAllUI() {
  nextTick(() => {
    applyReaderTheme()
    applyToolbar()
    applySelectionMenu()
    applyModals()
    applySettingsPanel()
    applyActiveStates()
    applySwitches()
    applyBadge()
    applyProgressBar()
  })
}

function applyReaderTheme() {
  const el = $el(readerAreaRef.value)
  if (!el) return
  const t = THEMES[theme.value] ?? THEMES.PARCHMENT
  const bgColor = t.bg
  el.style.backgroundColor = bgColor
  el.style.color = t.text
  el.style.fontSize = `${fontSize.value}px`
  el.style.fontFamily =
    fontFamily.value === 'SERIF'
      ? "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif"
      : "'KaiTi','STKaiti',Kai,serif"
  el.style.lineHeight = '1.8'

  const filters = []
  if (eyeProtection.value) filters.push('sepia(0.2) saturate(0.9) brightness(0.95)')
  if (brightness.value < 100) filters.push(`brightness(${brightness.value / 100})`)
  el.style.filter = filters.length ? filters.join(' ') : 'none'

  // Wallpaper background
  if (currentWallpaper.value >= 0 && wallpapers[currentWallpaper.value]) {
    el.style.backgroundImage = wallpapers[currentWallpaper.value]
    el.style.backgroundSize = 'cover'
  } else {
    el.style.backgroundImage = ''
  }

  // Stage perspective
  const st = $el(pageStageRef.value)
  if (st) st.style.perspective = turnMode.value === 'SIMULATION' ? '1500px' : 'none'

  // Sync background to flip elements so they're opaque during 3D rotation
  const flipEls = [flipFrontRef, flipBackRef, frontPageRef, backPageRef]
  flipEls.forEach(ref => {
    const dom = $el(ref.value)
    if (dom) dom.style.backgroundColor = bgColor
  })
}

function applyToolbar() {
  const v = toolbarVisible.value
  toggleClass(topBarRef.value, 'visible', v)
  toggleClass(bottomPanelRef.value, 'visible', v)
  toggleClass(listenFabRef.value, 'visible', v)
}

function applySelectionMenu() {
  const el = $el(selectionMenuRef.value)
  if (!el) return
  if (selectionVisible.value && selectionText.value) {
    el.style.display = 'block'
    el.style.left = `${menuX.value}px`
    el.style.top = `${menuY.value}px`
    el.style.opacity = '1'
    el.style.pointerEvents = 'auto'
    // Show/hide typo button
    const tb = $el(typoBtnRef2.value)
    if (tb) tb.style.display = selectionText.value.length > 5 ? '' : 'none'
    // Update highlight button text
    const hb = $el(highlightBtnRef.value)
    if (hb) hb.textContent = hasCurrentHighlight.value ? '取消划线' : '划线'
  } else {
    el.style.display = 'none'
    el.style.opacity = '0'
    el.style.pointerEvents = 'none'
  }
}

function applyModals() {
  const sh = $el(shareOverlayRef.value)
  const cm = $el(commentOverlayRef.value)
  if (sh) sh.style.display = shareVisible.value ? 'flex' : 'none'
  if (cm) cm.style.display = commentWriterVisible.value ? 'flex' : 'none'
}

function applySettingsPanel() {
  toggleClass(settingsOverlayRef.value, 'visible', settingsVisible.value)
  toggleClass(settingsSheetRef.value, 'visible', settingsVisible.value)
}

function applyActiveStates() {
  // Font select
  const fw = $el(fontOptionsWrapRef.value)
  if (fw) {
    const items = fw.querySelectorAll('.font-option')
    items.forEach((el, i) => el.classList.toggle('active', fontOptions[i]?.value === fontFamily.value))
  }
  // Theme chips
  const tw = $el(themeChipsRef.value)
  if (tw) {
    const chips = tw.querySelectorAll('.theme-chip')
    chips.forEach((el, i) => {
      const active = themeOptions[i]?.key === theme.value
      el.classList.toggle('active', active)
      const tick = el.querySelector('.theme-chip-tick')
      if (tick) tick.style.display = active ? '' : 'none'
    })
  }
  // Wallpaper
  const ww = $el(wallpaperRef.value)
  if (ww) {
    const chips = ww.querySelectorAll('.wallpaper-chip')
    chips.forEach((el, i) => el.classList.toggle('active', i === currentWallpaper.value))
  }
  // Turn mode
  const tm = $el(turnModeRef.value)
  if (tm) {
    const items = tm.querySelectorAll('.turn-mode-item')
    items.forEach((el, i) => el.classList.toggle('active', turnModes[i]?.value === turnMode.value))
  }
}

function applySwitches() {
  [eyeSwitchRef2, paraBreakSwitchRef2, inlineCommentsSwitchRef2].forEach((refVal, i) => {
    const el = $el(refVal.value)
    if (el) {
      const input = el.querySelector('input') ?? el
      const states = [eyeProtection.value, paragraphBreak.value, showInlineComments.value]
      if (input.checked !== undefined) input.checked = states[i]
    }
  })
}

function applyBadge() {
  const el = $el(commentBadgeRef.value)
  if (!el) return
  if (commentCount.value > 0) {
    el.style.display = ''
    el.textContent = commentCount.value > 99 ? '99+' : String(commentCount.value)
  } else {
    el.style.display = 'none'
  }
}

function applyProgressBar() {
  const fill = $el(progressFillRef.value)
  const thumb = $el(progressThumbRef.value)
  const total = totalPages.value
  const cur = Math.max(0, Math.min(currentPage.value, total - 1))
  const pct = total <= 1 ? 0 : (cur / (total - 1)) * 100
  if (fill) fill.style.width = `${pct}%`
  if (thumb) thumb.style.left = `${pct}%`
}

// ===================== WATCHERS =====================
watch([fontSize, fontFamily, theme, brightness, eyeProtection, paragraphSpacing, paragraphBreak], () => {
  applyReaderTheme()
  saveSettings()
})
watch(turnMode, () => { applyReaderTheme(); applyActiveStates(); saveSettings() })
watch(currentWallpaper, () => { applyReaderTheme(); applyActiveStates(); saveSettings() })
watch(showInlineComments, saveSettings)
watch(toolbarVisible, applyToolbar)
watch(selectionVisible, applySelectionMenu)
watch(settingsVisible, applySettingsPanel)
watch(shareVisible, applyModals)
watch(commentWriterVisible, applyModals)
watch(commentCount, applyBadge)
watch([eyeProtection, paragraphBreak, showInlineComments], applySwitches)
watch(currentPage, applyProgressBar)
watch(totalPages, applyProgressBar)
watch(pages, () => { nextTick(renderFrontPage) })

// ===================== SETTINGS PERSISTENCE =====================
function loadSettings() {
  try {
    const s = uni.getStorageSync('readerSettings')
    if (s) {
      fontSize.value = s.fontSize ?? 18
      fontFamily.value = s.fontFamily ?? 'SERIF'
      theme.value = s.theme ?? 'PARCHMENT'
      brightness.value = s.brightness ?? 80
      eyeProtection.value = s.eyeProtection ?? false
      turnMode.value = s.turnMode ?? 'SIMULATION'
      paragraphSpacing.value = s.paragraphSpacing ?? 6
      paragraphBreak.value = s.paragraphBreak ?? true
      showInlineComments.value = s.showInlineComments ?? true
    }
  } catch (_) {}
}

function saveSettings() {
  try {
    uni.setStorageSync('readerSettings', {
      fontSize: fontSize.value,
      fontFamily: fontFamily.value,
      theme: theme.value,
      brightness: brightness.value,
      eyeProtection: eyeProtection.value,
      turnMode: turnMode.value,
      paragraphSpacing: paragraphSpacing.value,
      paragraphBreak: paragraphBreak.value,
      showInlineComments: showInlineComments.value,
    })
  } catch (_) {}
}

// ===================== DATA LOADING + CACHE =====================
function cacheKey(bId, chNo) { return `${bId}:${chNo}` }

function persistChapterCache() {
  try { uni.setStorageSync('chapterCache', chapterCache) } catch (_) {}
}
function restoreChapterCache() {
  try {
    const saved = uni.getStorageSync('chapterCache')
    if (saved) Object.assign(chapterCache, saved)
  } catch (_) {}
}

async function loadChapter(desiredPage) {
  const key = cacheKey(bookId.value, chapterNo.value)
  const cached = chapterCache[key]

  // Show cached content immediately if available
  if (cached) {
    chapterTitle.value = cached.title
    maxChapterNo.value = cached.maxChapterNo
    rawContent.value = cached.content
    splitIntoPages(rawContent.value, desiredPage)
  }

  // Fetch fresh data from API
  try {
    const data = await request({
      url: `/api/v1/books/${bookId.value}/chapters/${chapterNo.value}`,
      method: 'GET',
    })
    if (data?.code === 200 && data?.data) {
      const ch = data.data
      chapterTitle.value = ch.title ?? ''
      maxChapterNo.value = ch.maxChapterNo ?? ch.totalChapters ?? 0
      rawContent.value = ch.content ?? ''
      // Update cache
      chapterCache[key] = {
        title: chapterTitle.value,
        content: rawContent.value,
        maxChapterNo: maxChapterNo.value,
      }
      persistChapterCache()
      // Re-split only if content differs from cached version
      if (!cached || cached.content !== rawContent.value) {
        splitIntoPages(rawContent.value, desiredPage)
      }
    }
  } catch (e) {
    console.error('loadChapter failed:', e)
  }

  // Schedule deferred re-split to catch layout-timing issues
  // (on first load, DOM may not be settled, causing wrong clientHeight)
  scheduleSettleCheck()

  // Preload adjacent chapters in background
  preloadAdjacentChapters()
}

/** Deferred re-split after fonts/layout settle, to fix first-load timing issues */
function scheduleSettleCheck() {
  if (splitSettleTimer) clearTimeout(splitSettleTimer)
  const capturedContent = rawContent.value
  const capturedChapter = chapterNo.value
  splitSettleTimer = setTimeout(async () => {
    splitSettleTimer = null
    // Only re-split if still on the same chapter
    if (chapterNo.value !== capturedChapter || rawContent.value !== capturedContent) return
    try { await document.fonts.ready } catch (_) {}
    requestAnimationFrame(() => {
      if (chapterNo.value !== capturedChapter || rawContent.value !== capturedContent) return
      const raEl = $el(readerAreaRef.value)
      const settledH = raEl?.clientHeight || window.innerHeight
      if (settledH >= 100 && pages.value.length > 0) {
        splitIntoPages(rawContent.value, currentPage.value)
      }
    })
  }, 800)
}

async function preloadAdjacentChapters() {
  const bId = bookId.value
  const curNo = chapterNo.value
  const maxNo = maxChapterNo.value
  // Preload next chapter
  if (curNo < maxNo) {
    preloadSingleChapter(bId, curNo + 1)
  }
  // Preload previous chapter
  if (curNo > 1) {
    preloadSingleChapter(bId, curNo - 1)
  }
}

async function preloadSingleChapter(bId, chNo) {
  const key = cacheKey(bId, chNo)
  if (chapterCache[key]) return  // already cached
  try {
    const data = await request({
      url: `/api/v1/books/${bId}/chapters/${chNo}`,
      method: 'GET',
    })
    if (data?.code === 200 && data?.data) {
      const ch = data.data
      chapterCache[key] = {
        title: ch.title ?? '',
        content: ch.content ?? '',
        maxChapterNo: ch.maxChapterNo ?? ch.totalChapters ?? 0,
      }
      persistChapterCache()
    }
  } catch (_) {
    // Preload failure is non-critical
  }
}

// ===================== PAGE SPLITTING =====================
function splitIntoPages(content, targetPage) {
  if (!content) {
    pages.value = ['<p style="text-align:center;color:#999;margin-top:40px">（暂无内容）</p>']
    currentPage.value = targetPage === -1 ? 0 : (targetPage ?? 0)
    return
  }

  const paragraphs = content.split(/\n+/).filter(p => p.trim())
  if (!paragraphs.length) {
    pages.value = ['<p style="text-align:center;color:#999;margin-top:40px">（暂无内容）</p>']
    currentPage.value = targetPage === -1 ? 0 : (targetPage ?? 0)
    return
  }

  const raEl = $el(readerAreaRef.value)
  const viewH = raEl?.clientHeight || window.innerHeight
  if (viewH < 100) {
    currentPage.value = targetPage === -1 ? 0 : (targetPage ?? 0);
    return
  }

  const measureWidth = raEl?.clientWidth || window.innerWidth

  // Build paragraph HTMLs (all styles matching .page-body p:
  // margin:0, text-indent:2em, text-align:justify, line-height:inherit)
  const P_STYLE = 'margin:0;text-indent:2em;line-height:inherit'
  const paraHtmls = []
  for (const para of paragraphs) {
    const body = escapeHtml(para)
    if (paragraphBreak.value) {
      paraHtmls.push(`<p style="${P_STYLE};margin-bottom:${paragraphSpacing.value * 2}px">${body}</p>`)
    } else {
      paraHtmls.push(`<p style="${P_STYLE}">${body}</p>`)
    }
  }

  // ----- Pre-measure all paragraphs cumulatively -----
  const measure = document.createElement('div')
  measure.style.cssText = `
    position:absolute;left:-9999px;top:0;
    width:${measureWidth}px;
    font-size:${fontSize.value}px;
    line-height:1.8;
    font-family:${fontFamily.value === 'SERIF' ? "'Noto Serif SC','Source Han Serif SC',SimSun,STSong,serif" : "'KaiTi','STKaiti',Kai,serif"};
    padding:44px 16px 24px;
    box-sizing:border-box;
    text-align:justify;
    word-break:break-word;
    overflow-wrap:break-word;
  `
  document.body.appendChild(measure)

  const cumH = []
  measure.innerHTML = ''
  for (const h of paraHtmls) {
    measure.innerHTML += h
    cumH.push(measure.scrollHeight)
  }
  // cumH[i] = scrollHeight(paragraphs[0..i]) = topPad + content + botPad

  const TOP = 44
  const BOT = 24
  const titleH = 46  // 4px padding-top + 20*1.4 line-height + 14px margin-bottom

  // scrollHeight for paragraphs [s, e] (s, e inclusive)
  function rangeH(s, e) {
    if (s === 0) return cumH[e]
    return cumH[e] - cumH[s - 1] + TOP + BOT
  }

  const result = []
  let start = 0
  let firstPage = true

  while (start < paraHtmls.length) {
    const maxH = firstPage ? viewH - titleH : viewH
    let end = start

    // Scan forward: find the last paragraph that keeps total ≤ maxH
    while (end < paraHtmls.length) {
      if (rangeH(start, end) > maxH) break
      end++
    }
    end--

    // If even the first paragraph alone exceeds maxH, include it anyway
    if (end < start) end = start

    result.push(paraHtmls.slice(start, end + 1).join(''))
    start = end + 1
    firstPage = false
  }

  // ----- Rebalance: compress sparse tail pages to achieve ≥90% fill -----
  while (result.length >= 2) {
    const lastIdx = result.length - 1
    const prevIdx = result.length - 2

    // Measure last page fill
    measure.innerHTML = result[lastIdx]
    const lastH = measure.scrollHeight
    // Already ≥ 90% of a full non-first page → done
    if (lastH >= 0.9 * viewH) break

    const prevMaxH = prevIdx === 0 ? viewH - titleH : viewH

    // --- Attempt 1: merge last two pages into one ---
    const combinedHtml = result[prevIdx] + result[lastIdx]
    measure.innerHTML = combinedHtml
    const combinedH = measure.scrollHeight
    const combinedMaxH = prevIdx === 0 ? viewH - titleH : viewH

    if (combinedH <= combinedMaxH) {
      // Merged page doesn't overflow — combine into one
      result[prevIdx] = combinedHtml
      result.pop()
      continue  // re-check the new last page
    }

    // --- Attempt 2: shift paragraphs between last two pages for balance ---
    const pRegex = /<p[^>]*>.*?<\/p>/gs
    const prevParas = result[prevIdx].match(pRegex) || [result[prevIdx]]
    const lastParas = result[lastIdx].match(pRegex) || [result[lastIdx]]

    if (prevParas.length <= 1) break  // nothing to shift

    // Try moving 1..N paragraphs from end of prev page to start of last page
    let bestPrevHtml = result[prevIdx]
    let bestLastHtml = result[lastIdx]
    let bestMinFill = 0
    const maxMove = Math.min(prevParas.length - 1, 5)  // move at most 5

    for (let n = 1; n <= maxMove; n++) {
      const moved = prevParas.slice(prevParas.length - n).join('')
      const newPrev = prevParas.slice(0, prevParas.length - n).join('')
      const newLast = moved + result[lastIdx]

      measure.innerHTML = newPrev
      const h1 = measure.scrollHeight
      measure.innerHTML = newLast
      const h2 = measure.scrollHeight

      if (h1 > prevMaxH || h2 > viewH) continue  // would overflow — skip

      const fill1 = h1 / prevMaxH
      const fill2 = h2 / viewH
      const minFill = Math.min(fill1, fill2)

      if (minFill > bestMinFill) {
        bestMinFill = minFill
        bestPrevHtml = newPrev
        bestLastHtml = newLast
      }
    }

    if (bestMinFill > 0) {
      result[prevIdx] = bestPrevHtml
      result[lastIdx] = bestLastHtml
    }
    break  // only rebalance the tail once
  }

  document.body.removeChild(measure)
  pages.value = result.length ? result : ['<p style="text-align:center;color:#999;margin-top:40px">（暂无内容）</p>']

  // Set current page
  if (targetPage === -1) {
    currentPage.value = pages.value.length - 1
  } else if (typeof targetPage === 'number' && targetPage >= 0) {
    currentPage.value = Math.min(targetPage, pages.value.length - 1)
  } else {
    currentPage.value = 0
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Update persistent back-indicator text */
function updateBackIndicator() {
  const el = $el(backIndicatorTextRef.value)
  if (!el) return
  const label = currentPage.value === 0
    ? (bookTitle.value || chapterTitle.value)
    : chapterTitle.value
  el.textContent = label || '返回'
}

/** Push current page HTML into the front-page DOM */
function renderFrontPage() {
  updateBackIndicator()
  const titleEl = $el(frontTitleRef.value)
  const bodyEl = $el(frontBodyRef.value)
  if (titleEl) {
    titleEl.textContent = chapterTitle.value
    titleEl.style.display = currentPage.value === 0 ? '' : 'none'
  }
  if (bodyEl) bodyEl.innerHTML = pages.value[currentPage.value] ?? ''
  nextTick(applyHighlightsToDOM)
}

// Hide title when not on first page; update persistent back indicator
watch(currentPage, () => {
  updateBackIndicator()
  nextTick(() => {
    const titleEl = $el(frontTitleRef.value)
    if (titleEl) titleEl.style.display = currentPage.value === 0 ? '' : 'none'
  })
})

// ===================== PAGE NAVIGATION =====================
function prevPage() {
  if (toolbarVisible.value) { toolbarVisible.value = false; clearAutoHideTimer(); return }
  if (isFlipping.value) return
  if (currentPage.value > 0) return doFlip(-1)
  prevChapter()
}
function nextPage() {
  if (toolbarVisible.value) { toolbarVisible.value = false; clearAutoHideTimer(); return }
  if (isFlipping.value) return
  if (currentPage.value < totalPages.value - 1) return doFlip(1)
  nextChapter()
}

function prevChapter() {
  if (chapterNo.value <= 1) {
    uni.showToast({ title: '已经是第一章了', icon: 'none' })
    return
  }
  chapterNo.value--
  loadChapter(-1)  // -1 = last page
}

function nextChapter() {
  if (maxChapterNo.value && chapterNo.value >= maxChapterNo.value) {
    uni.showToast({ title: '已经是最后一章了', icon: 'none' })
    return
  }
  chapterNo.value++
  loadChapter(0)  // 0 = first page
}

// ===================== 3D PAGE FLIP =====================
function doFlip(dir) {
  const targetIdx = currentPage.value + dir
  if (targetIdx < 0 || targetIdx >= totalPages.value) return

  isFlipping.value = true
  flipDirection.value = dir

  const isSim = turnMode.value === 'SIMULATION'

  // For non-SIMULATION modes: show back page content behind the flip
  if (!isSim) {
    const bt = $el(backTitleRef.value)
    const bb = $el(backBodyRef.value)
    if (bt) bt.textContent = chapterTitle.value
    if (bb) bb.innerHTML = pages.value[targetIdx] ?? ''
    const bp = $el(backPageRef.value)
    if (bp) bp.style.display = ''
  }

  // Populate flipping element content
  const fft = $el(flipFrontTitleRef.value)
  const ffb = $el(flipFrontBodyRef.value)
  const fbt = $el(flipBackTitleRef.value)
  const fbb = $el(flipBackBodyRef.value)
  if (fft) {
    fft.textContent = chapterTitle.value
    fft.style.display = currentPage.value === 0 ? '' : 'none'
  }
  if (ffb) ffb.innerHTML = pages.value[currentPage.value] ?? ''
  if (fbt) {
    fbt.textContent = chapterTitle.value
    fbt.style.display = targetIdx === 0 ? '' : 'none'
  }
  if (fbb) fbb.innerHTML = pages.value[targetIdx] ?? ''

  const fp = $el(flipPageRef.value)
  if (!fp) return onFlipComplete()

  nextTick(() => {
    fp.style.display = 'block'
    fp.style.visibility = ''
    fp.style.transition = 'none'
    fp.style.transform = 'none'

    if (turnMode.value === 'SIMULATION') {
      // 3D flip: rotate around left or right edge
      fp.style.transformOrigin = dir > 0 ? 'left center' : 'right center'
      fp.style.transform = 'rotateY(0deg)'
      fp.style.zIndex = 10
      // Force initial layout so browser paints the starting frame
      void fp.offsetHeight
      // Start animation in next frame for compositor sync
      requestAnimationFrame(() => {
        fp.style.transition = 'transform 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)'
        fp.style.transform = `rotateY(${dir > 0 ? -180 : 180}deg)`
      })
    } else if (turnMode.value === 'COVER') {
      // Cover: new page slides over current
      fp.style.transform = `translateX(${dir > 0 ? '100%' : '-100%'})`
      fp.style.transformOrigin = 'center center'
      fp.style.zIndex = 10
      void fp.offsetHeight
      requestAnimationFrame(() => {
        fp.style.transition = 'transform 0.3s ease'
        fp.style.transform = 'translateX(0)'
      })
    } else if (turnMode.value === 'SLIDE') {
      // Slide: both pages move together
      fp.style.transform = `translateX(${dir > 0 ? '100%' : '-100%'})`
      fp.style.transformOrigin = 'center center'
      fp.style.zIndex = 10
      const ff = $el(frontPageRef.value)
      if (ff) ff.style.transform = 'translateX(0)'
      void fp.offsetHeight
      requestAnimationFrame(() => {
        fp.style.transition = 'transform 0.3s ease'
        if (ff) {
          ff.style.transition = 'transform 0.3s ease'
          ff.style.transform = `translateX(${dir > 0 ? '-30%' : '30%'})`
        }
        fp.style.transform = 'translateX(0)'
      })
    } else {
      // NONE / SCROLL: instant switch
      onFlipComplete()
    }
  })
}

function onFlipTransitionEnd() {
  if (!isFlipping.value) return
  onFlipComplete()
}

function onFlipComplete() {
  const dir = flipDirection.value
  currentPage.value += dir
  currentPage.value = Math.max(0, Math.min(currentPage.value, totalPages.value - 1))
  isFlipping.value = false

  // Update front page content before hiding flip element
  const bodyEl = $el(frontBodyRef.value)
  const titleEl = $el(frontTitleRef.value)
  if (bodyEl) bodyEl.innerHTML = pages.value[currentPage.value] ?? ''
  if (titleEl) {
    titleEl.textContent = chapterTitle.value
    titleEl.style.display = currentPage.value === 0 ? '' : 'none'
  }
  // Force layout so content is painted before flip element is removed
  void (bodyEl?.offsetHeight)

  // Hide flip element instantly (visibility avoids layout thrash)
  const fp = $el(flipPageRef.value)
  if (fp) {
    fp.style.visibility = 'hidden'
    fp.style.zIndex = '1'
  }

  // Reset front page (for SLIDE mode)
  const ff = $el(frontPageRef.value)
  if (ff) {
    ff.style.transition = 'none'
    ff.style.transform = 'none'
  }

  // Hide back page
  const bp = $el(backPageRef.value)
  if (bp) bp.style.display = 'none'

  // Fully clean up flip element state after paint
  requestAnimationFrame(() => {
    if (fp) {
      fp.style.display = 'none'
      fp.style.visibility = ''
      fp.style.transition = 'none'
      fp.style.transform = 'none'
      fp.style.zIndex = '10'
    }
  })

  nextTick(applyHighlightsToDOM)
}

// ===================== TOUCH HANDLING =====================
function onTouchStart(e) {
  if (isFlipping.value) return
  const t = e.touches?.[0]
  if (!t) return
  touchStartX = t.clientX
  touchStartY = t.clientY
  touchTimestamp = Date.now()
  isDragging = true
}

function onTouchMove(e) {
  if (!isDragging) return
  const t = e.touches?.[0]
  if (!t) return
  const dx = t.clientX - touchStartX
  const dy = Math.abs(t.clientY - touchStartY)
  if (dy > Math.abs(dx) * 0.5) { isDragging = false; return }
  if (Math.abs(dx) > 50) {
    isDragging = false
    if (dx < 0) nextPage()
    else prevPage()
  }
}

function onTouchEnd() {
  isDragging = false
}

// ===================== TOOLBAR =====================
function toggleToolbar() {
  toolbarVisible.value = !toolbarVisible.value
  if (toolbarVisible.value) startAutoHideTimer()
  else clearAutoHideTimer()
}

function onDocClick(e) {
  if (!toolbarVisible.value) return
  // Hide toolbar if clicking outside our UI
  const root = $el(readerAreaRef.value)?.closest('.reader-root')
  if (root && !root.contains(e.target)) return
  // Don't auto-hide if click is on toolbar or its children
  const target = e.target
  if (target.closest('.top-bar') || target.closest('.bottom-panel') ||
      target.closest('.listen-fab') ||
      target.closest('.settings-sheet') || target.closest('.settings-overlay') ||
      target.closest('.selection-menu') || target.closest('.modal-overlay')) {
    startAutoHideTimer()
    return
  }
}

function startAutoHideTimer() {
  clearAutoHideTimer()
  autoHideTimer = setTimeout(() => { toolbarVisible.value = false }, 5000)
}

function clearAutoHideTimer() {
  if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null }
}

// ===================== TEXT SELECTION =====================
function onSelectionChange() {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return

  const range = sel.getRangeAt(0)
  const text = sel.toString().trim()
  if (!text || text.length < 2) { hideSelectionMenu(); return }

  // Ensure selection is inside reader area
  const ra = $el(readerAreaRef.value)
  if (!ra || !ra.contains(range.commonAncestorContainer)) { hideSelectionMenu(); return }

  selectionText.value = text
  selectedTextForShare.value = text

  const rect = range.getBoundingClientRect()
  const menuW = Math.min(360, window.innerWidth - 16)
  let mx = rect.left + rect.width / 2 - menuW / 2
  mx = Math.max(8, Math.min(mx, window.innerWidth - menuW - 8))
  menuX.value = mx

  let my = rect.top - 108
  if (my < 50) my = rect.bottom + 12
  menuY.value = my

  selectionVisible.value = true
}

function hideSelectionMenu() {
  selectionVisible.value = false
  selectionText.value = ''
}

// Selection actions
function listenSelection()        { hideSelectionMenu(); uni.showToast({ title: '朗读功能开发中', icon: 'none' }) }
function lookupDictionary()       { hideSelectionMenu(); uni.showToast({ title: '词典功能开发中', icon: 'none' }) }
function tagSelection(tag)        { hideSelectionMenu(); uni.showToast({ title: `已标记为「${tag}」`, icon: 'none' }) }
function shareSelection()         { hideSelectionMenu(); selectedTextForShare.value = selectionText.value; shareVisible.value = true }
function reportTypo()             { openCommentEditor() }

function copySelection() {
  if (!selectionText.value) return
  uni.setClipboardData({
    data: selectionText.value,
    success: () => { uni.showToast({ title: '已复制', icon: 'success' }); hideSelectionMenu() },
  })
}

function openCommentEditor() {
  hideSelectionMenu()
  commentText.value = ''
  commentWriterVisible.value = true
  nextTick(() => {
    const ta = $el(commentTextareaRef.value)
    if (ta) ta.value = ''
    const input = ta?.querySelector?.('textarea') ?? ta
    input?.focus?.()
  })
}

// ===================== HIGHLIGHTS =====================
function toggleHighlight() {
  if (!selectionText.value) return
  if (hasCurrentHighlight.value) {
    highlights.value = highlights.value.filter(
      h => !(h.text === selectionText.value && h.chapterNo === chapterNo.value)
    )
    uni.showToast({ title: '已取消划线', icon: 'success' })
  } else {
    highlights.value.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      bookId: bookId.value,
      chapterNo: chapterNo.value,
      text: selectionText.value,
      color: 'rgba(255, 235, 59, 0.5)',
      createdAt: Date.now(),
    })
    uni.showToast({ title: '已划线', icon: 'success' })
  }
  uni.setStorageSync('readerHighlights', highlights.value)
  applyHighlightsToDOM()
  hideSelectionMenu()
}

function applyHighlightsToDOM() {
  const ra = $el(readerAreaRef.value)
  if (!ra) return

  // Remove existing highlight spans
  ra.querySelectorAll('.hl-mark').forEach(el => {
    const p = el.parentNode
    if (p) { p.replaceChild(document.createTextNode(el.textContent), el); p.normalize() }
  })

  const chHighlights = highlights.value.filter(h => h.chapterNo === chapterNo.value)
  for (const h of chHighlights) {
    try {
      const walker = document.createTreeWalker(ra, NodeFilter.SHOW_TEXT, null, false)
      let node
      while ((node = walker.nextNode())) {
        const idx = node.textContent.indexOf(h.text)
        if (idx === -1) continue
        const range = document.createRange()
        range.setStart(node, idx)
        range.setEnd(node, idx + h.text.length)
        const span = document.createElement('span')
        span.className = 'hl-mark'
        span.style.cssText = `background-color:${h.color};border-radius:2px;padding:0 1px`
        range.surroundContents(span)
        break
      }
    } catch (_) {}
  }
}

// ===================== TOP BAR ACTIONS =====================
function goBack()             { uni.navigateBack() }
function addToBookshelf()      { uni.showToast({ title: '已加入书架', icon: 'success' }) }
function downloadChapter()     { uni.showToast({ title: '下载功能开发中', icon: 'none' }) }
function showMoreMenu()        { uni.showToast({ title: '更多功能开发中', icon: 'none' }) }
function openComments()        { toolbarVisible.value = false; uni.showToast({ title: '评论区开发中', icon: 'none' }) }

// ===================== BOTTOM NAV ACTIONS =====================
function openCatalog()         { toolbarVisible.value = false; uni.showToast({ title: '目录功能开发中', icon: 'none' }) }
function showMoreAdaptations()  { uni.showToast({ title: '更多改编开发中', icon: 'none' }) }
function startListening()       { uni.showToast({ title: '朗读功能开发中', icon: 'none' }) }

function toggleNightMode() {
  theme.value = theme.value === 'NIGHT' ? 'PARCHMENT' : 'NIGHT'
  nightOverride.value = false
  // Update nav icons (text interpolation should handle this, but do it manually for safety)
  const ie = $el(nightIconRef.value)
  const le = $el(nightLabelRef.value)
  if (ie) ie.textContent = isNight.value ? '☀️' : '🌙'
  if (le) le.textContent = isNight.value ? '日间' : '夜间'
}

function openSettings() {
  toolbarVisible.value = false
  settingsVisible.value = true
}
function closeSettings() {
  settingsVisible.value = false
}

// ===================== SETTINGS ACTIONS =====================
function onBrightnessChange(e)    { brightness.value = Number(e.detail?.value ?? e.detail ?? 80) }
function onEyeProtectionChange(e) { eyeProtection.value = !!(e.detail?.value ?? e.detail) }
function onParagraphBreakChange(e){ paragraphBreak.value = !!(e.detail?.value ?? e.detail) }
function onInlineCommentsChange(e){ showInlineComments.value = !!(e.detail?.value ?? e.detail) }

function adjustFontSize(dir) {
  fontSize.value = Math.max(14, Math.min(36, fontSize.value + dir))
}
function adjustSpacing(dir) {
  paragraphSpacing.value = Math.max(0, Math.min(20, paragraphSpacing.value + dir))
}

function selectFont(val)     { fontFamily.value = val; applyActiveStates(); saveSettings() }
function selectTheme(key)    {
  theme.value = key
  nightOverride.value = false
  applyActiveStates()
  applyReaderTheme()
  saveSettings()
}
function selectWallpaper(idx) { currentWallpaper.value = idx; applyActiveStates(); saveSettings() }
function selectTurnMode(val) { turnMode.value = val; applyActiveStates(); saveSettings() }
function uploadWallpaper()    { uni.showToast({ title: '上传壁纸开发中', icon: 'none' }) }
function showAllSettings()    { uni.showToast({ title: '更多设置即将上线', icon: 'none' }) }

// ===================== SHARE =====================
function shareToChannel(channel) {
  shareVisible.value = false
  uni.showToast({ title: `已分享至${channel}`, icon: 'success' })
}
function showShareCard() {
  toolbarVisible.value = false
  const bodyEl = $el(frontBodyRef.value)
  selectedTextForShare.value = bodyEl?.textContent?.trim()?.slice(0, 120) ?? ''
  shareVisible.value = true
}
function closeShare() { shareVisible.value = false; applyModals() }

// ===================== COMMENT =====================
function closeCommentEditor() {
  commentWriterVisible.value = false
  applyModals()
}
function submitComment() {
  // Read textarea value directly (v-model won't react)
  const ta = $el(commentTextareaRef.value)
  const val = ta?.value ?? ta?.querySelector?.('textarea')?.value ?? ''
  if (!val.trim()) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  commentWriterVisible.value = false
  applyModals()
  uni.showToast({ title: '段评已发布', icon: 'success' })
}
</script>

<style>
/* ================================================================
   ROOT & READER AREA
   ================================================================ */
.reader-root {
  position: relative;
  width: 100%;
  height: 100vh; height: 100dvh;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}
.reader-area {
  position: absolute;
  inset: 0;
  overflow: hidden;
  padding: 44px 16px 0;
  box-sizing: border-box;
}
.back-indicator {
  position: fixed;
  z-index: 6;
  top: 0; left: 0; right: 0;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  color: inherit;
  cursor: pointer;
  max-width: 100vw;
  overflow: hidden;
}
.back-arrow {
  font-size: 16px;
  line-height: 40px;
  opacity: 0.6;
  flex-shrink: 0;
}
.back-label {
  font-size: 14px;
  line-height: 40px;
  opacity: 0.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.back-indicator:active { opacity: 0.85; }
.chapter-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
  line-height: 1.4;
  text-align: center;
  padding-top: 4px;
}
.page-body {
  font-size: inherit;
  line-height: inherit;
  word-break: break-word;
  overflow-wrap: break-word;
  text-align: justify;
}
.page-body p {
  margin: 0;
  text-indent: 2em;
  line-height: inherit;
}
.page-body .hl-mark {
  background-color: rgba(255, 235, 59, 0.5);
  border-radius: 2px;
  padding: 0 1px;
}

/* ================================================================
   3D PAGE STAGE
   ================================================================ */
.page-stage {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}
.front-page,
.back-page {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
  padding: 0 16px 24px;
  box-sizing: border-box;
}
.back-page { z-index: 1; }
.front-page { z-index: 2; }

.flipping-page {
  position: absolute;
  inset: 0;
  display: none;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
  z-index: 10;
}
.flip-front,
.flip-back {
  position: absolute;
  inset: 0;
  overflow: hidden;
  padding: 0 16px 24px;
  box-sizing: border-box;
  background-color: inherit;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
}
.flip-front { z-index: 2; }
.flip-back {
  z-index: 1;
  transform: rotateY(180deg);
}

/* ================================================================
   TAP ZONES
   ================================================================ */
.tap-zone {
  position: absolute;
  top: 0; bottom: 0;
  z-index: 5;
  background: transparent;
}
.tap-left  { left: 0;   width: 33.33%; }
.tap-center{ left: 33.33%; width: 33.34%; }
.tap-right { right: 0;  width: 33.33%; }

/* ================================================================
   TOP BAR
   ================================================================ */
.top-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 20;
  transform: translateY(-100%);
  transition: transform 0.32s ease;
  background: rgba(255,255,255,0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 0.5px solid rgba(0,0,0,0.08);
}
.top-bar.visible { transform: translateY(0); }

.top-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 10px;
  padding-top: env(safe-area-inset-top, 0);
  box-sizing: content-box;
}
.top-btn {
  white-space: nowrap;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}
.top-btn:active { opacity: 0.55; }
.top-back { font-size: 22px; font-weight: 700; min-width: 32px; }
.top-shelf { font-size: 13px; }
.top-download { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #8C7B62; }
.free-badge {
  background: #E8A030; color: #fff; font-size: 10px;
  padding: 1px 5px; border-radius: 3px; line-height: 1.3;
}
.top-comments { position: relative; }
.comment-badge {
  position: absolute; top: -8px; right: -10px;
  min-width: 18px; height: 18px; line-height: 18px;
  border-radius: 9px; background: #E84C4C; color: #fff;
  font-size: 10px; text-align: center; padding: 0 4px;
  box-sizing: border-box;
}
.top-more { font-size: 20px; letter-spacing: 2px; }

/* ================================================================
   BOTTOM PANEL (unified)
   ================================================================ */
.bottom-panel {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 20;
  transform: translateY(100%);
  transition: transform 0.32s ease;
}
.bottom-panel.visible { transform: translateY(0); }

.bottom-panel-inner {
  background: rgba(248, 248, 246, 0.96);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 18px 18px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
}

.bp-row {
  padding: 0 16px;
}
.bp-progress-row {
  display: grid;
  grid-template-columns: 64px 1fr 64px;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.chapter-nav-btn {
  height: 30px; line-height: 30px; text-align: center;
  border-radius: 15px; background: rgba(0,0,0,0.05);
  color: #555; font-size: 13px; cursor: pointer;
}
.chapter-nav-btn:active { background: rgba(0,0,0,0.12); }

.progress-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.progress-page-label {
  font-size: 11px;
  color: #999;
}
.progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(0,0,0,0.08);
  overflow: visible;
}
.progress-fill {
  position: absolute;
  left: 0; top: 0;
  height: 100%;
  border-radius: 2px;
  background: #C4A882;
  transition: width 0.25s ease;
}
.progress-thumb {
  position: absolute;
  top: 50%; transform: translate(-50%, -50%);
  width: 12px; height: 12px;
  border-radius: 50%;
  background: #C4A882;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: left 0.25s ease;
}

.bp-actions-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.bp-action {
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  border-radius: 10px;
  color: #5A5A5A;
}
.bp-action:active {
  background: rgba(0, 0, 0, 0.06);
  color: #1F1F1F;
}
.bp-action-icon {
  font-size: 19px;
  line-height: 21px;
}
.bp-action-label {
  font-size: 11px;
}

/* ================================================================
   LISTEN FAB
   ================================================================ */
.listen-fab {
  position: fixed;
  right: 20px; bottom: 120px;
  z-index: 19;
  width: 46px; height: 46px;
  border-radius: 50%;
  background: #C4A882;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(196,168,130,0.45);
  transform: scale(0);
  transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}
.listen-fab.visible { transform: scale(1); }
.listen-fab:active { transform: scale(0.88); }
.listen-icon { font-size: 20px; }

/* ================================================================
   SELECTION FLOATING MENU
   ================================================================ */
.selection-menu {
  position: fixed;
  z-index: 50;
  display: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}
.selection-menu-body {
  background: #2D2D2D;
  border-radius: 12px;
  padding: 6px 10px;
  box-shadow: 0 6px 28px rgba(0,0,0,0.4);
  max-width: 360px;
}
.sel-row {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}
.sel-row-tags {
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.sel-action {
  padding: 5px 9px;
  font-size: 12px;
  color: #e4e4e4;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
}
.sel-action:active { background: rgba(255,255,255,0.12); }
.sel-action-typo { color: #F0A070; }
.sel-tag {
  padding: 4px 10px;
  font-size: 11px;
  color: #C0B0A0;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.14);
  cursor: pointer;
}
.sel-tag:active { background: rgba(255,255,255,0.08); }
.sel-arrow {
  width: 0; height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #2D2D2D;
  margin-left: 20px;
}

/* ================================================================
   MODAL OVERLAY
   ================================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 45;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* ================================================================
   SHARE CARD
   ================================================================ */
.share-card {
  width: min(92vw, 420px);
  margin-bottom: 10vh;
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 50px rgba(0,0,0,0.25);
}
.share-card-head { margin-bottom: 12px; }
.share-book-name { font-size: 18px; font-weight: 700; color: #1F1F1F; }
.share-card-quote {
  padding: 12px;
  background: #F8F8F6;
  border-left: 3px solid #C4A882;
  border-radius: 0 8px 8px 0;
  color: #5A5A5A;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  max-height: 120px;
  overflow-y: auto;
}
.share-card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #999;
  font-size: 12px;
  margin-bottom: 16px;
}
.share-card-tagline { color: #999; }
.share-card-qr {
  width: 48px; height: 48px;
  background: #F0F0ED;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #B0B0B0;
}
.share-card-channels {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.share-channel {
  height: 38px; line-height: 38px; text-align: center;
  border-radius: 8px;
  background: #F0F0ED;
  color: #555;
  font-size: 13px;
  cursor: pointer;
}
.share-channel:active { background: #E0E0DD; }
.share-card-close {
  display: block; text-align: center;
  color: #999;
  font-size: 14px;
  cursor: pointer;
}

/* ================================================================
   COMMENT EDITOR
   ================================================================ */
.comment-editor {
  width: 100%;
  max-height: 55vh;
  overflow-y: auto;
  background: #F8F8F6;
  border-radius: 16px 16px 0 0;
  padding: 16px 18px calc(18px + env(safe-area-inset-bottom));
}
.comment-editor-title {
  font-size: 17px; font-weight: 700; color: #1F1F1F;
}
.comment-editor-quote {
  margin-top: 10px;
  padding: 10px;
  background: #F0F0ED;
  border-left: 3px solid #333;
  color: #5A5A5A;
  font-size: 14px;
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
}
.comment-editor-input {
  width: 100%;
  min-height: 80px;
  margin-top: 12px;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 8px;
  background: #fff;
  color: #1F1F1F;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #ddd;
  resize: none;
}
.comment-editor-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.comment-btn {
  flex: 1;
  height: 40px; line-height: 40px;
  text-align: center;
  border-radius: 8px;
  font-size: 15px;
  cursor: pointer;
}
.comment-btn-cancel { background: #F0F0ED; color: #888; }
.comment-btn-submit { background: #333; color: #fff; }
.comment-btn:active { opacity: 0.8; }

/* ================================================================
   SETTINGS PANEL
   ================================================================ */
.settings-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  background: rgba(0,0,0,0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.settings-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}
.settings-sheet {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  max-height: min(80vh, 600px);
  overflow-y: auto;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding: 10px 18px calc(18px + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}
.settings-sheet.visible { transform: translateY(0); }
.sheet-handle {
  width: 36px; height: 4px;
  margin: 0 auto 16px;
  border-radius: 2px;
  background: rgba(0,0,0,0.15);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  padding: 6px 0;
}
.setting-row + .setting-row {
  border-top: 1px solid rgba(0,0,0,0.04);
}
.setting-label {
  color: #333;
  font-size: 14px;
  min-width: 56px;
}

/* Brightness */
.brightness-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  max-width: 170px;
}
.brightness-icon { font-size: 14px; }
.brightness-icon-big { font-size: 17px; }
.brightness-slider { flex: 1; }

/* Switches */
.setting-switch { transform: scale(0.82); }

/* Font family */
.font-options {
  display: flex;
  gap: 8px;
}
.font-option {
  padding: 4px 14px;
  border-radius: 14px;
  border: 1px solid #ddd;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}
.font-option.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

/* Theme chips */
.theme-chips {
  display: flex;
  gap: 8px;
}
.theme-chip {
  position: relative;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s;
}
.theme-chip.active {
  border-color: #333;
  transform: scale(1.15);
  box-shadow: 0 0 0 2px #333;
}
.theme-chip-swatch {
  width: 22px; height: 22px; border-radius: 50%;
}
.theme-chip-tick {
  position: absolute;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

/* Wallpaper */
.wallpaper-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.wallpaper-chip {
  width: 40px; height: 40px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  background-size: cover;
  cursor: pointer;
}
.wallpaper-chip.active {
  border-color: #333;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.1);
}
.wallpaper-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #999;
  background: #F0F0ED;
}

/* Turn mode */
.turn-mode-row {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #ddd;
}
.turn-mode-item {
  padding: 5px 10px;
  font-size: 12px;
  color: #666;
  background: #fafafa;
  cursor: pointer;
  border-right: 1px solid #ddd;
}
.turn-mode-item:last-child { border-right: none; }
.turn-mode-item.active {
  background: #333;
  color: #fff;
}

/* Stepper (font size & spacing) */
.stepper-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stepper-btn {
  width: 34px; height: 30px;
  line-height: 30px; text-align: center;
  border-radius: 6px;
  background: #F0F0ED;
  color: #333;
  font-size: 14px;
  cursor: pointer;
}
.stepper-btn:active { background: #E0E0DD; }
.stepper-value {
  font-size: 15px;
  color: #333;
  min-width: 28px;
  text-align: center;
}

.setting-more-row {
  margin-top: 8px;
  padding: 10px 0;
  text-align: center;
  color: #888;
  font-size: 13px;
  cursor: pointer;
}
</style>
