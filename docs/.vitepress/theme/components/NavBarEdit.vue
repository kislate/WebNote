<template>
  <div class="nav-bar-edit" v-if="!isHomePage">
    <button class="edit-button" @click="handleEditClick" title="编辑当前笔记">
      <span class="icon">✏️</span> <span class="button-text">编辑当前笔记</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useData } from 'vitepress';

const { page, frontmatter } = useData();

// 判断当前是否是首页
const isHomePage = computed(() => {
  return page.value.relativePath === 'index.md' || 
         frontmatter.value.layout === 'home';
});

// 处理编辑按钮点击 - 只进入编辑模式
function handleEditClick() {
  // 非首页点击时，进入编辑模式
  emitEvent('edit-note', page.value.relativePath);
}

// 发送自定义事件
function emitEvent(eventName, data = null) {
  const event = new CustomEvent(`webnote:${eventName}`, { 
    detail: data,
    bubbles: true 
  });
  document.dispatchEvent(event);
}
</script>

<style>
.nav-bar-edit {
  display: flex;
  align-items: center;
  margin-left: 12px;
}

.edit-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.edit-button:hover {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

.icon {
  font-size: 14px;
}

/* 在小屏幕上只显示图标 */
@media (max-width: 768px) {
  .edit-button .button-text {
    display: none;
  }

  .edit-button {
    padding: 6px;
  }
}
</style>
