<template>
  <div class="mobile-keyboard-handler">
    <slot></slot>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';

const props = defineProps({
  active: {
    type: Boolean,
    default: false
  }
});

const emits = defineEmits(['keyboard-open', 'keyboard-close']);

// 记录视口高度以检测软键盘
const viewportHeight = ref(0);
const isKeyboardOpen = ref(false);

// 监听视口大小变化
function checkKeyboardStatus() {
  if (!props.active || typeof window === 'undefined') return;
  
  const currentHeight = window.visualViewport?.height || window.innerHeight;
  
  // 软键盘弹出通常会显著减小视口高度
  // 如果当前高度比记录的初始高度小 15% 以上，认为键盘已打开
  if (viewportHeight.value > 0 && currentHeight < viewportHeight.value * 0.85) {
    if (!isKeyboardOpen.value) {
      isKeyboardOpen.value = true;
      emits('keyboard-open', { height: viewportHeight.value - currentHeight });
      
      // 设置视口相关样式以防止布局跳动
      document.documentElement.style.setProperty('--keyboard-height', `${viewportHeight.value - currentHeight}px`);
      document.body.classList.add('keyboard-open');
    }
  } else if (isKeyboardOpen.value) {
    isKeyboardOpen.value = false;
    emits('keyboard-close');
    
    // 恢复样式
    document.documentElement.style.setProperty('--keyboard-height', '0px');
    document.body.classList.remove('keyboard-open');
  }
}

// 初始化
onMounted(() => {
  if (typeof window !== 'undefined') {
    // 记录初始视口高度
    viewportHeight.value = window.visualViewport?.height || window.innerHeight;
    
    // 监听视口调整
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboardStatus);
    } else {
      window.addEventListener('resize', checkKeyboardStatus);
    }
  }
});

// 组件销毁时清理
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', checkKeyboardStatus);
    } else {
      window.removeEventListener('resize', checkKeyboardStatus);
    }
    
    // 确保移除所有添加的样式
    document.documentElement.style.removeProperty('--keyboard-height');
    document.body.classList.remove('keyboard-open');
  }
});

// 监听 active 属性变化
watch(() => props.active, (newValue) => {
  if (!newValue && isKeyboardOpen.value) {
    // 如果组件变为非活动状态但键盘仍打开，重置键盘状态
    isKeyboardOpen.value = false;
    emits('keyboard-close');
    
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-open');
    }
  }
});
</script>

<style>
/* 移动设备上软键盘弹出时的样式调整 */
body.keyboard-open .note-manager,
body.keyboard-open .modal-content {
  /* 设置内容区最大高度，避免软键盘挤压内容 */
  max-height: calc(100vh - var(--keyboard-height, 0px) - 60px); /* 减去顶部工具栏高度 */
  overflow-y: auto;
  transition: max-height 0.2s;
}

/* 确保编辑器区域在键盘弹出时不被挤压 */
body.keyboard-open .editor-container {
  height: calc(100vh - var(--keyboard-height, 0px) - 120px);
  transition: height 0.2s;
}

/* 让工具栏在键盘弹出时保持固定 */
body.keyboard-open .note-toolbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: var(--vp-c-bg);
}

/* 输入区域在移动端的优化 */
@media (max-width: 768px) {
  input, textarea {
    font-size: 16px; /* iOS 会自动缩放小于 16px 的输入字段 */
  }
  
  .modal-content {
    max-height: 80vh; /* 在移动设备上限制模态框高度 */
    margin: 10px;
    width: calc(100% - 20px);
  }
}
</style>
