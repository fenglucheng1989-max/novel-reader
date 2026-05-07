<template>
  <view class="section-head">
    <text class="section-title">{{ title }}</text>
    <view v-if="actionText" class="section-action" @tap="emit('action')">
      <text>{{ actionText }}</text>
      <text class="action-arrow">></text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  actionText: { type: String, default: '' }
})

const emit = defineEmits(['action'])
</script>

<style scoped>
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title {
  color: #1f2a26;
  font-size: 17px;
  font-weight: 900;
}

.section-action {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8d8175;
  font-size: 13px;
  font-weight: 800;
}

.action-arrow {
  font-size: 14px;
}
</style>
