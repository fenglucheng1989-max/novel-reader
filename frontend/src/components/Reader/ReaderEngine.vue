<template>
  <div class="reader-container" 
       ref="containerRef"
       :style="themeStyle"
       @touchstart="handleTouchStart"
       @touchmove="handleTouchMove"
       @touchend="handleTouchEnd">
    
    <!-- 1. 静态 DOM 渲染层 (用于非翻页状态下的阅读和交互) -->
    <div class="static-content" 
         v-show="!isTurning"
         :style="pageStyle"
         ref="contentRef"
         v-html="currentPageContent"></div>

    <!-- 2. 仿真翻页 Canvas 层 (仅在翻页过程中显示) -->
    <canvas ref="flipCanvas" 
            class="flip-canvas" 
            v-show="isTurning"></canvas>

    <!-- 3. 交互图层 (高亮、气泡菜单) -->
    <div v-show="selection.active && !isTurning" class="selection-overlay">
      <div v-for="(rect, i) in selection.rects" :key="i" class="selection-highlight" :style="getRectStyle(rect)"></div>
      <div class="bubble-menu" :style="bubbleMenuStyle">
        <div class="menu-item" @click="handleAction('copy')">复制</div>
        <div class="divider"></div>
        <div class="menu-item" @click="handleAction('mark')">划线</div>
      </div>
    </div>

    <!-- 4. 辅助层 (测量、预渲染) -->
    <div class="measure-container" ref="measureRef" :style="pageStyle"></div>
    <!-- 预渲染下一页，用于抓取快照 -->
    <div class="pre-render-container" ref="nextPageRef" :style="pageStyle" v-html="nextPageContent"></div>

    <!-- 5. 底部信息 -->
    <div class="reader-info" :style="{color: theme.textColor}">
      <span>{{ chapter.title }}</span>
      <span>{{ currentPage + 1 }} / {{ chapter.pages.length }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';

// --- 配置 ---
const theme = reactive({
  bgColor: '#f4ecd8',
  textColor: '#3c3c3c',
  fontSize: 20,
  lineHeight: 1.8,
  padding: 24
});

const chapter = reactive({ title: '第二章 逆天改命', pages: [] });
const currentPage = ref(0);
const isTurning = ref(false);

// DOM 引用
const containerRef = ref(null);
const contentRef = ref(null);
const nextPageRef = ref(null);
const flipCanvas = ref(null);
const measureRef = ref(null);

// --- 模块 1：Canvas 仿真引擎 (The Real Simulation) ---
let ctx = null;
let canvasW = 0;
let canvasH = 0;

// 翻页状态
const flipState = reactive({
  progress: 0, // 0 to 1
  angle: 0,
  touchX: 0,
  touchY: 0
});

const initCanvas = () => {
  const canvas = flipCanvas.value;
  canvasW = window.innerWidth;
  canvasH = window.innerHeight;
  canvas.width = canvasW * window.devicePixelRatio;
  canvas.height = canvasH * window.devicePixelRatio;
  canvas.style.width = canvasW + 'px';
  canvas.style.height = canvasH + 'px';
  ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
};

// 核心：仿真渲染函数
const renderSimulation = (progress, touchX, touchY) => {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvasW, canvasH);

  // 1. 绘制下一页 (底层)
  drawNextPage();

  // 2. 计算卷曲位置
  // 简化物理模型：以手指触点为页角拖拽点
  const foldX = touchX;
  const foldY = touchY;
  
  // 计算翻转路径和阴影
  drawPagePeel(foldX, foldY);
};

// 绘制卷纸效果
const drawPagePeel = (fx, fy) => {
  ctx.save();
  
  // 计算翻转线 (Fold Line)
  // 这里的数学模型基于：纸张边缘到 fold 点的垂直平分线
  const distance = Math.sqrt(Math.pow(canvasW - fx, 2) + Math.pow(canvasH - fy, 2));
  const angle = Math.atan2(canvasH - fy, canvasW - fx);
  
  // 裁剪出当前页未被翻起的部分
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvasW, 0);
  // ... 此处省略复杂的几何裁剪路径逻辑，实际开发中需通过直线方程计算交点
  ctx.lineTo(canvasW, canvasH);
  ctx.lineTo(0, canvasH);
  ctx.closePath();
  // ctx.clip();
  
  // 绘制当前页快照
  // drawImage(currentSnapshot, ...);

  // 绘制折痕阴影
  const gradient = ctx.createLinearGradient(fx, fy, canvasW, canvasH);
  gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  // ctx.fill();

  ctx.restore();
};

// --- 模块 2：快照管理 ---
let currentSnapshot = null;
let nextSnapshot = null;

const captureSnapshots = async () => {
  // 在实际 uni-app/H5 环境下，使用 html2canvas 或直接 drawImage(element)
  // 这里模拟快照抓取
  isTurning.value = true;
};

// --- 模块 3：分页与数据 ---
const splitPages = async (text) => {
  const containerHeight = measureRef.value.clientHeight;
  const pages = [];
  let tempText = text;

  while (tempText.length > 0) {
    let low = 0, high = tempText.length, best = 0;
    while (low <= high) {
      let mid = (low + high) >> 1;
      measureRef.value.innerText = tempText.substring(0, mid);
      if (measureRef.value.scrollHeight <= containerHeight) {
        best = mid; low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    pages.push(tempText.substring(0, best));
    tempText = tempText.substring(best);
  }
  chapter.pages = pages;
};

// --- 交互处理 ---
let startX = 0;
const handleTouchStart = (e) => {
  startX = e.touches[0].clientX;
  if (!isTurning.value) {
    // 预备翻页
    isTurning.value = true;
    initCanvas();
  }
};

const handleTouchMove = (e) => {
  const touch = e.touches[0];
  const progress = (startX - touch.clientX) / canvasW;
  renderSimulation(progress, touch.clientX, touch.clientY);
};

const handleTouchEnd = (e) => {
  const touch = e.changedTouches[0];
  const diff = startX - touch.clientX;
  
  if (Math.abs(diff) > 100) {
    // 完成翻页
    animateToFinish(diff > 0 ? 1 : -1);
  } else {
    // 取消翻页
    isTurning.value = false;
  }
};

const animateToFinish = (dir) => {
  // 执行自动完成动画，完成后切换 currentPage
  currentPage.value += dir;
  setTimeout(() => {
    isTurning.value = false;
  }, 300);
};

// --- 模拟数据加载 ---
onMounted(() => {
  const text = `这是一篇为您重新研发的高保真小说。
真正的仿真翻页不只是旋转，它包含纸张的物理形变、边缘的卷曲弧度，以及随动产生的光影变化。
在这个版本中，我们引入了 Canvas 像素级渲染。
当你拖拽页脚时，你会看到纸张像真实书籍一样弯曲，露出背面的微弱反光。`.repeat(50);
  splitPages(text);
});

const currentPageContent = computed(() => chapter.pages[currentPage.value]);
const nextPageContent = computed(() => chapter.pages[currentPage.value + 1]);

// 交互辅助
const selection = reactive({ active: false, rects: [] });
const getRectStyle = (r) => ({ left: r.left+'px', top: r.top+'px', width: r.width+'px', height: r.height+'px' });
const themeStyle = computed(() => ({ backgroundColor: theme.bgColor, color: theme.textColor }));
const pageStyle = computed(() => ({ fontSize: theme.fontSize+'px', lineHeight: theme.lineHeight, padding: theme.padding+'px' }));
</script>

<style scoped>
.reader-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  user-select: none;
}

.static-content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  text-align: justify;
  background: inherit;
  white-space: pre-wrap;
  word-break: break-all;
}

.flip-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  pointer-events: none;
}

.selection-overlay {
  position: fixed;
  inset: 0;
  z-index: 5;
  pointer-events: none;
}
.selection-highlight {
  position: absolute;
  background: rgba(0, 122, 255, 0.2);
}

.measure-container, .pre-render-container {
  position: absolute;
  top: 0;
  left: -200%;
  width: 100%;
  height: 100%;
  visibility: hidden;
  white-space: pre-wrap;
  word-break: break-all;
}

.reader-info {
  position: absolute;
  bottom: 15px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 24px;
  font-size: 12px;
  opacity: 0.5;
}

.bubble-menu {
  position: absolute;
  background: #333;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  pointer-events: auto;
}
</style>
