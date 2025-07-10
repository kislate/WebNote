<template>
  <div class="edit-button-container" :class="{ 'home-page': isHomePage }">
    <button class="edit-note-button" @click="handleEditClick">
      <span class="edit-icon">✏️</span> {{ isHomePage ? '创建笔记' : '编辑笔记' }}
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useData, useRouter } from 'vitepress';

const { page, frontmatter } = useData();
const router = useRouter();

// 判断当前是否是首页
const isHomePage = computed(() => {
  return page.value.relativePath === 'index.md' || 
         frontmatter.value.layout === 'home';
});

// 处理编辑按钮点击
function handleEditClick() {
  if (isHomePage.value) {
    // 首页点击时，创建新笔记
    // 发送消息给父组件，由父组件处理创建笔记逻辑
    emitEvent('create-note');
  } else {
    // 非首页点击时，进入编辑模式
    emitEvent('edit-note', page.value.relativePath);
  }
}

// 发送自定义事件
function emitEvent(eventName, data = null) {
  const event = new CustomEvent(`webnote:${eventName}`, { 
    detail: data,
    bubbles: true 
  });
  document.dispatchEvent(event);
}

// 监听页面加载
onMounted(() => {
  // 初始化逻辑
});
</script>

<style scoped>
.edit-button-container {
  position: fixed;
  top: 72px; /* 在导航栏下方 */
  right: 20px;
  z-index: 100; /* 增加 z-index 确保按钮总是在最上层 */
  transition: opacity 0.3s ease;
}

/* 避免与大纲目录重叠 - 使用更智能的媒体查询 */
@media (min-width: 1280px) {
  .VPDoc:has(.VPDocAsideOutline) .edit-button-container {
    right: 300px; /* 大纲宽度大约为280px */
  }

  /* 在有侧边栏和大纲时调整位置 */
  .has-sidebar .has-aside .edit-button-container {
    right: 300px;
  }
}

/* 在中等屏幕尺寸下的位置调整 */
@media (min-width: 768px) and (max-width: 1279px) {
  .edit-button-container {
    right: 24px;
    top: 80px; /* 稍微下移避免与页面标题重叠 */
  }
}

/* 在小屏幕上的位置调整 */
@media (max-width: 767px) {
  .edit-button-container {
    top: auto;
    bottom: 20px; /* 移到屏幕底部 */
    right: 20px;
  }
}

.edit-button-container.home-page {
  position: absolute;
  top: 20px;
  right: 20px;
}

.edit-note-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s, transform 0.1s, box-shadow 0.3s;
}

.edit-note-button:hover {
  background-color: var(--vp-c-brand-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.edit-note-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.edit-icon {
  font-size: 14px;
}

/* 移动设备上的特殊样式 */
@media (max-width: 767px) {
  .edit-note-button {
    padding: 10px 16px; /* 更大的触摸区域 */
    border-radius: 24px; /* 圆角按钮，更符合移动端设计 */
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2); /* 更明显的阴影 */
  }
  
  .edit-icon {
    font-size: 16px; /* 更大的图标 */
  }
}

@media (max-width: 768px) {
  .edit-button-container {
    top: auto;
    right: auto;
    bottom: 20px;
    right: 20px;
  }
  
  .edit-note-button {
    padding: 6px 10px;
    font-size: 14px;
  }
}
</style>
