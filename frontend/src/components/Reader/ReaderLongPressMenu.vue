<template>
  <view
    class="nr-longpress"
    :class="{ 'nr-longpress-visible': visible }"
    :style="menuStyle"
    @click.stop
  >
    <view class="nr-longpress-body">
      <text
        v-for="item in actions"
        :key="item.id"
        class="nr-longpress-item"
        @click="onAction(item)"
      >
        {{ item.label }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'

export interface LongPressActionItem {
  id: string
  label: string
  action: string
}

const props = withDefaults(defineProps<{
  visible: boolean
  x: number
  y: number
  actions?: LongPressActionItem[]
}>(), {
  visible: false,
  x: 0,
  y: 0,
  actions: () => [
    { id: 'copy', label: '复制', action: 'copy' },
    { id: 'share', label: '分享', action: 'share' },
    { id: 'comment', label: '写段评', action: 'comment' },
    { id: 'highlight', label: '划线', action: 'highlight' },
    { id: 'listen', label: '从本段听', action: 'listen' },
    { id: 'dictionary', label: '词典', action: 'dictionary' },
    { id: 'typo', label: '错字反馈', action: 'typo' },
  ],
})

const emit = defineEmits<{
  (e: 'action', actionId: string): void
}>()

const menuStyle = computed(() => {
  if (!props.visible) return { display: 'none' }
  return {
    display: 'block',
    left: `${Math.max(8, Math.min(props.x, window.innerWidth - 120))}px`,
    top: `${Math.max(8, props.y - 48)}px`,
  }
})

function onAction(item: LongPressActionItem): void {
  emit('action', item.id)
}
</script>

<style scoped>
.nr-longpress {
  position: fixed;
  z-index: 300;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
}
.nr-longpress-visible {
  pointer-events: auto;
  opacity: 1;
}

.nr-longpress-body {
  display: flex;
  gap: 1px;
  background: #333;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
}

.nr-longpress-item {
  font-size: 13px;
  color: #fff;
  padding: 8px 12px;
  background: #333;
  white-space: nowrap;
}
.nr-longpress-item:active {
  background: #555;
}
</style>
