<template>
  <div class="sidebar-actions-bar">
    <div class="action-buttons">
      <button class="action-button text-button" title="新建文件" @click="createNewFile">
        新建文件
      </button>
      <button class="action-button text-button" title="新建文件夹" @click="createNewFolder">
        新建文件夹
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

// 注入服务
const sidebarService = inject('sidebarService');

// 创建新文件
function createNewFile() {
  document.dispatchEvent(new CustomEvent('webnote:create-file', { 
    detail: { parentPath: 'docs' },
    bubbles: true
  }));
}

// 创建新文件夹
function createNewFolder() {
  document.dispatchEvent(new CustomEvent('webnote:create-folder', { 
    detail: { parentPath: 'docs' },
    bubbles: true
  }));
}

// 刷新侧边栏
async function refreshSidebar() {
  try {
    // 触发侧边栏刷新事件
    document.dispatchEvent(new CustomEvent('webnote:refresh-sidebar'));
    
    // 如果有 sidebarService，直接调用
    if (sidebarService && sidebarService.mergeSidebars) {
      await sidebarService.mergeSidebars();
    }
  } catch (error) {
    console.error('刷新侧边栏失败:', error);
  }
}

// 折叠所有菜单
function collapseAll() {
  document.dispatchEvent(new CustomEvent('webnote:collapse-all'));
}
</script>

<style>
.sidebar-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 6px;
  border-bottom: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}

.action-buttons {
  display: flex;
  width: 100%;
  gap: 8px;
  justify-content: space-around;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
  font-size: 12px;
}

.action-button.text-button {
  white-space: nowrap;
  flex: 1;
  text-align: center;
  max-width: 50%;
}

.action-button:hover {
  background-color: var(--vp-c-bg-mute);
  color: var(--vp-c-brand);
}

.action-button .icon {
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .sidebar-actions-bar {
    padding: 2px 4px;
  }
  
  .action-button.small-button {
    width: 22px;
    height: 22px;
  }
  
  .action-button .icon {
    font-size: 12px;
  }
}
</style>
