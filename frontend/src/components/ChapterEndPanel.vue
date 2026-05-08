<template>
  <view :class="['end-panel-root', mode === 'overlay' ? 'end-overlay' : 'end-inline']">
    <!-- overlay backdrop -->
    <view v-if="mode === 'overlay'" class="end-backdrop" @tap.stop="$emit('close')" />
    <view :class="['end-sheet', mode === 'overlay' ? 'sheet-fixed' : 'sheet-inline']" @tap.stop>
      <view class="end-handle" />

      <!-- Status card -->
      <view class="end-status-card">
        <view class="end-icon">{{ isLastChapter ? '🎉' : '📖' }}</view>
        <text class="end-status-title">{{ isLastChapter ? '全本已完结' : '本章已读完' }}</text>
        <text class="end-status-sub">{{ isLastChapter ? '感谢阅读，期待下一部作品' : '休息一下，精彩继续' }}</text>
        <view class="end-book-info">
          <text class="end-book-name">{{ bookTitle || '未知书籍' }}</text>
          <text class="end-book-meta">{{ bookAuthor || '佚名' }} · {{ bookStatusText }}</text>
          <view class="end-progress-chip">
            <text>{{ chapterNo }} / {{ maxChapterNo || '?' }} 章</text>
          </view>
        </view>
        <view v-if="isLastChapter" class="end-cta" @tap.stop="$emit('backToDetail')">
          <text>返回详情</text>
        </view>
        <view v-else class="end-cta" @tap.stop="$emit('next')">
          <text>下一章 &#x203A;</text>
        </view>
      </view>

      <!-- Recommendations -->
      <view v-if="recommendations.length" class="end-section">
        <text class="end-section-title">{{ isLastChapter ? '推荐下一本' : '相似推荐' }}</text>
        <view class="rec-list">
          <view
            v-for="rec in recommendations"
            :key="rec.id"
            class="rec-card"
            @tap.stop="$emit('goToBook', rec.id)"
          >
            <view class="rec-cover">
              <text class="rec-cover-text">{{ (rec.title || '书').slice(0, 2) }}</text>
            </view>
            <view class="rec-info">
              <text class="rec-title">{{ rec.title }}</text>
              <text class="rec-meta">{{ rec.author || '佚名' }} · {{ rec.chapterCount || 0 }}章</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Comments -->
      <view v-if="showComments" class="end-section">
        <view class="comment-composer">
          <textarea
            v-model="commentText"
            class="comment-input"
            maxlength="500"
            auto-height
            placeholder="写下这一章的想法"
          />
          <view class="comment-submit-row">
            <text class="comment-count">{{ commentText.length }}/500</text>
            <button class="comment-submit" :disabled="commentSubmitting" @tap.stop="submitChapterComment">
              {{ commentSubmitting ? '发布中' : '发布评论' }}
            </button>
          </view>
        </view>
      </view>
      <view v-if="showComments && comments.length" class="end-section">
        <text class="end-section-title">章节评论</text>
        <view class="comment-list">
          <view v-for="com in comments" :key="com.id" class="comment-card">
            <view class="comment-avatar">{{ (com.username || '?').charAt(0) }}</view>
            <view class="comment-body">
              <view class="comment-head">
                <text class="comment-user">{{ com.username || '匿名' }}</text>
                <text class="comment-time">{{ formatTime(com.createdAt) }}</text>
              </view>
              <text class="comment-text">{{ com.content }}</text>
              <view class="comment-foot">
                <text class="comment-likes">{{ com.likeCount || 0 }} 赞</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-else-if="showComments && !comments.length" class="end-section">
        <text class="end-section-title">章节评论</text>
        <text class="comment-empty">暂无评论，成为第一个评论的人吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useBookStore } from '../store/book'
import { useUserStore } from '../store/user'

const props = defineProps({
  bookId: { type: [String, Number], required: true },
  chapterNo: { type: Number, required: true },
  chapterId: { type: [String, Number], default: null },
  maxChapterNo: { type: Number, default: 10 },
  showComments: { type: Boolean, default: false },
  mode: { type: String, default: 'inline' } // 'inline' | 'overlay'
})

const emit = defineEmits(['next', 'backToDetail', 'close', 'goToBook'])

const bookStore = useBookStore()
const userStore = useUserStore()
const bookTitle = ref('')
const bookAuthor = ref('')
const bookStatus = ref('ONGOING')
const recommendations = ref([])
const comments = ref([])
const commentText = ref('')
const commentSubmitting = ref(false)
const loaded = ref(false)

const isLastChapter = computed(() => {
  return props.maxChapterNo > 0 && props.chapterNo >= props.maxChapterNo
})

const bookStatusText = computed(() => {
  return bookStatus.value === 'COMPLETED' ? '完结' : '连载'
})

async function load() {
  if (loaded.value || !props.bookId) return
  loaded.value = true
  try {
    const [detailRes, recRes] = await Promise.all([
      bookStore.loadDetail(props.bookId),
      bookStore.loadRecommendations(props.bookId, 4)
    ])
    if (detailRes.code === 200 && detailRes.data) {
      const book = detailRes.data.book
      if (book) {
        bookTitle.value = book.title || ''
        bookAuthor.value = book.author || ''
        bookStatus.value = book.status || 'ONGOING'
      }
    }
    if (recRes.code === 200) {
      recommendations.value = recRes.data || []
    }
    if (props.showComments && props.chapterId) {
      const commentRes = await bookStore.loadChapterComments(props.chapterId, 1, 5)
      if (commentRes.code === 200) {
        comments.value = commentRes.data?.records || []
      }
    }
  } catch (e) {
    // silent
  }
}

async function submitChapterComment() {
  const content = commentText.value.trim()
  if (!content) {
    uni.showToast({ title: '请输入评论内容', icon: 'none' })
    return
  }
  if (!userStore.isLoggedIn) {
    uni.showToast({ title: '请先登录后再评论', icon: 'none' })
    setTimeout(() => uni.switchTab({ url: '/pages/mine/mine' }), 800)
    return
  }
  commentSubmitting.value = true
  try {
    const res = await bookStore.createComment({
      bookId: Number(props.bookId),
      chapterId: props.chapterId ? Number(props.chapterId) : null,
      content
    })
    if (res.code === 200) {
      commentText.value = ''
      comments.value = [res.data, ...comments.value]
      uni.showToast({ title: '评论已发布', icon: 'success' })
    }
  } finally {
    commentSubmitting.value = false
  }
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.max(0, now - date)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return `${Math.floor(days / 30)}个月前`
}

watch(() => props.bookId, () => {
  loaded.value = false
  load()
}, { immediate: true })
</script>

<style scoped>
/* --- Inline --- */
.end-inline {
  margin-top: 24px;
  margin-bottom: 16px;
}

.sheet-inline {
  padding: 18px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

/* --- Overlay --- */
.end-overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.end-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.sheet-fixed {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 76vh;
  overflow-y: auto;
  padding: 10px 20px calc(18px + env(safe-area-inset-bottom));
  border-radius: 16px 16px 0 0;
  background: #F8F8F6;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.10);
}

/* --- Shared --- */
.end-handle {
  width: 32px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.18);
}

.end-status-card {
  text-align: center;
  padding: 12px 16px 18px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
  margin-bottom: 14px;
}

.end-icon {
  font-size: 36px;
  margin-bottom: 6px;
}

.end-status-title {
  display: block;
  color: #1F1F1F;
  font-size: 18px;
  font-weight: 900;
  margin-bottom: 2px;
}

.end-status-sub {
  display: block;
  color: #8C8C8C;
  font-size: 13px;
  margin-bottom: 10px;
}

.end-book-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  margin-bottom: 12px;
}

.end-book-name {
  color: #3A3A3A;
  font-size: 15px;
  font-weight: 800;
}

.end-book-meta {
  color: #B0B0B0;
  font-size: 12px;
}

.end-progress-chip {
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: #F0F0ED;
  color: #5A5A5A;
  font-size: 12px;
  font-weight: 700;
}

.end-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 24px;
  border-radius: 19px;
  background: #3A3A3A;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.end-cta:active {
  opacity: 0.8;
}

/* Sections */
.end-section {
  padding: 14px 16px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.end-section-title {
  display: block;
  color: #1F1F1F;
  font-size: 15px;
  font-weight: 900;
  margin-bottom: 10px;
}

/* Recommendations */
.rec-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.rec-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 8px;
  background: #F5F5F2;
}

.rec-cover {
  flex: 0 0 42px;
  width: 42px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: linear-gradient(135deg, #3A3A3A, #5A5A5A);
}

.rec-cover-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 900;
}

.rec-info {
  min-width: 0;
  flex: 1;
}

.rec-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1F1F1F;
  font-size: 13px;
  font-weight: 800;
}

.rec-meta {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #B0B0B0;
  font-size: 11px;
}

/* Comments */
.comment-composer {
  padding: 10px;
  border-radius: 8px;
  background: #F5F5F2;
  border: 1px solid #EBEBE5;
}

.comment-input {
  width: 100%;
  min-height: 68px;
  color: #1F1F1F;
  font-size: 14px;
  line-height: 21px;
}

.comment-submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.comment-count {
  color: #B0B0B0;
  font-size: 12px;
}

.comment-submit {
  width: 92px;
  height: 32px;
  line-height: 32px;
  margin: 0;
  border-radius: 8px;
  background: #3A3A3A;
  color: #fff;
  font-size: 13px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  display: flex;
  gap: 10px;
}

.comment-avatar {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F0F0ED;
  color: #3A3A3A;
  font-size: 14px;
  font-weight: 800;
}

.comment-body {
  min-width: 0;
  flex: 1;
}

.comment-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-user {
  color: #3A3A3A;
  font-size: 13px;
  font-weight: 700;
}

.comment-time {
  color: #bbb;
  font-size: 11px;
}

.comment-text {
  display: block;
  color: #3A3A3A;
  font-size: 14px;
  line-height: 20px;
  word-break: break-all;
  overflow-wrap: anywhere;
}

.comment-foot {
  margin-top: 4px;
}

.comment-likes {
  color: #bbb;
  font-size: 11px;
}

.comment-empty {
  color: #999;
  font-size: 13px;
  display: block;
  text-align: center;
  padding: 14px 0;
}
</style>
