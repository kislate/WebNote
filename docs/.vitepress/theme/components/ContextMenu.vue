<template>
  <div 
    class="context-menu" 
    v-if="isVisible" 
    :style="{ 
      top: `${position.y}px`, 
      left: `${position.x}px`
    }"
  >
    <!-- 菜单项 -->
    <div class="menu-items">
      <slot name="default"></slot>
      
      <!-- 默认操作 -->
      <div v-if="showDefaultItems">
        <div class="menu-item" @click="handleMenuAction('new-file')" v-if="allowCreateFile">
          <span class="item-icon">📄</span> 新建笔记
        </div>
        <div class="menu-item" @click="handleMenuAction('new-folder')" v-if="allowCreateFolder">
          <span class="item-icon">📁</span> 新建文件夹
        </div>
        <div class="menu-item" @click="handleMenuAction('rename')" v-if="allowRename">
          <span class="item-icon">✏️</span> 重命名
        </div>
        <div class="menu-item" @click="handleMenuAction('delete')" v-if="allowDelete">
          <span class="item-icon danger">🗑️</span> 删除
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineProps, defineEmits, watchEffect } from 'vue';

const props = defineProps({
  target: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  isFolder: {
    type: Boolean,
    default: false
  },
  showDefaultItems: {
    type: Boolean,
    default: true
  },
  allowCreateFile: {
    type: Boolean,
    default: true
  },
  allowCreateFolder: {
    type: Boolean,
    default: true
  },
  allowRename: {
    type: Boolean,
    default: true
  },
  allowDelete: {
    type: Boolean,
    default: true
  }
});

const emits = defineEmits(['action', 'close']);

// 菜单状态
const isVisible = ref(false);
const position = ref({ x: 0, y: 0 });

// 显示上下文菜单
function showMenu(event) {
  // 阻止默认右键菜单
  event.preventDefault();
  
  // 设置菜单位置，考虑视口边界
  let x = event.clientX;
  let y = event.clientY;
  
  // 边界检查，确保菜单不会超出屏幕
  const menuWidth = 200; // 预估菜单宽度
  const menuHeight = 150; // 预估菜单高度
  
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 5;
  }
  
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 5;
  }
  
  position.value = { x, y };
  isVisible.value = true;
}

// 处理菜单项点击
function handleMenuAction(action) {
  emits('action', {
    action,
    path: props.path,
    isFolder: props.isFolder
  });
  closeMenu();
}

// 关闭菜单
function closeMenu() {
  isVisible.value = false;
  emits('close');
}

// 点击其他区域时关闭菜单
function handleClickOutside(event) {
  if (isVisible.value) {
    closeMenu();
  }
}

// 监听目标元素的右键点击事件
onMounted(() => {
  if (props.target && typeof document !== 'undefined') {
    // 找到目标元素
    const targetElements = document.querySelectorAll(props.target);
    
    // 为每个目标元素添加右键点击事件
    targetElements.forEach(el => {
      el.addEventListener('contextmenu', showMenu);
    });
    
    // 添加全局点击事件用于关闭菜单
    document.addEventListener('click', handleClickOutside);
    
    // ESC 键关闭菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isVisible.value) {
        closeMenu();
      }
    });
  }
});

// 组件卸载时清理事件监听
onUnmounted(() => {
  if (props.target && typeof document !== 'undefined') {
    const targetElements = document.querySelectorAll(props.target);
    targetElements.forEach(el => {
      el.removeEventListener('contextmenu', showMenu);
    });
    document.removeEventListener('click', handleClickOutside);
  }
});
</script>

<style>
.context-menu {
  position: fixed;
  z-index: 1000;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
  max-width: 250px;
  font-size: 14px;
  user-select: none;
}

.menu-items {
  overflow-y: auto;
  max-height: 300px;
}

.menu-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: var(--vp-c-bg-soft);
}

.menu-item .item-icon {
  margin-right: 8px;
  font-size: 14px;
}

.menu-item .danger {
  color: var(--vp-c-danger);
}

/* 分隔线 */
.menu-item.separator {
  height: 1px;
  margin: 4px 0;
  background-color: var(--vp-c-divider);
  padding: 0;
}

/* 适配深色模式 */
.dark .context-menu {
  background-color: var(--vp-c-bg);
  border-color: var(--vp-c-divider-dark);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dark .menu-item:hover {
  background-color: var(--vp-c-bg-soft-dark);
}
</style>
