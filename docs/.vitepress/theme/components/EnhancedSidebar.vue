<template>
  <div class="enhanced-sidebar">
    <slot name="nav-bar-title-before" />
    <slot name="nav-bar-title" />
    <slot name="nav-bar-title-after" />
    <slot name="nav-bar-content-before" />
    
    <!-- 增强的侧边栏内容 -->
    <div class="enhanced-sidebar-items">
      <slot name="nav-screen-content-before" />
      <div class="enhanced-sidebar-links">
        <!-- 侧边栏项目列表 -->
        <template v-for="(item, index) in items" :key="index">
          <div 
            class="enhanced-sidebar-item"
            :class="{
              'is-folder': item.items && item.items.length > 0,
              'is-active': isActiveItem(item),
              'is-expanded': isExpandedItem(item)
            }"
          >
            <!-- 使用 FolderActions 组件包装侧边栏项 -->
            <folder-actions 
              :path="getItemPath(item)"
              :is-folder="item.items && item.items.length > 0"
              :is-expanded="isExpandedItem(item)"
            >
              <!-- 原始的侧边栏链接或文件夹 -->
              <div 
                class="sidebar-item-content"
                @click="onItemClick(item)"
                @contextmenu="handleItemRightClick($event, item)"
              >
                <span class="sidebar-item-text">{{ item.text }}</span>
                <span v-if="item.items && item.items.length > 0" class="sidebar-item-toggle">
                  <svg class="arrow" viewBox="0 0 6 10" :class="{ 'down': isExpandedItem(item) }">
                    <path d="M1.4 8.56L4.67 5M1.4 1.23L4.66 4.7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                  </svg>
                </span>
              </div>
            </folder-actions>
            
            <!-- 递归渲染子项目 -->
            <div v-if="item.items && item.items.length > 0 && isExpandedItem(item)" class="sidebar-children">
              <template v-for="(child, childIndex) in item.items" :key="`${index}-${childIndex}`">
                <div 
                  class="enhanced-sidebar-item child-item"
                  :class="{
                    'is-folder': child.items && child.items.length > 0,
                    'is-active': isActiveItem(child),
                    'is-expanded': isExpandedItem(child)
                  }"
                >
                  <folder-actions 
                    :path="getItemPath(child, item)"
                    :is-folder="child.items && child.items.length > 0"
                    :is-expanded="isExpandedItem(child)"
                  >
                    <div 
                      class="sidebar-item-content"
                      @click="onItemClick(child)"
                      @contextmenu="handleItemRightClick($event, child, item)"
                    >
                      <span class="sidebar-item-text">{{ child.text }}</span>
                      <span v-if="child.items && child.items.length > 0" class="sidebar-item-toggle">
                        <svg class="arrow" viewBox="0 0 6 10" :class="{ 'down': isExpandedItem(child) }">
                          <path d="M1.4 8.56L4.67 5M1.4 1.23L4.66 4.7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                      </span>
                    </div>
                  </folder-actions>
                  
                  <!-- 递归渲染深层子项目 -->
                  <div v-if="child.items && child.items.length > 0 && isExpandedItem(child)" class="sidebar-children nested">
                    <!-- 这里可以继续递归，但为简化我们只展示两层 -->
                    <div 
                      v-for="(grandChild, grandChildIndex) in child.items" 
                      :key="`${index}-${childIndex}-${grandChildIndex}`"
                      class="enhanced-sidebar-item grandchild-item"
                      :class="{ 'is-active': isActiveItem(grandChild) }"
                    >
                      <folder-actions 
                        :path="getItemPath(grandChild, child)"
                        :is-folder="false"
                        :is-expanded="false"
                      >
                        <div 
                          class="sidebar-item-content"
                          @click="navigateTo(grandChild.link)"
                          @contextmenu="handleItemRightClick($event, grandChild, child)"
                        >
                          <span class="sidebar-item-text">{{ grandChild.text }}</span>
                        </div>
                      </folder-actions>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
      <slot name="nav-screen-content-after" />
    </div>
    
    <!-- 上下文菜单 -->
    <context-menu 
      target=".sidebar-item-content" 
      :path="rightClickedItem.path"
      :is-folder="rightClickedItem.isFolder"
      @action="handleContextMenuAction"
      @close="clearRightClickedItem"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue';
import { useData, useRoute } from 'vitepress';
import FolderActions from './FolderActions.vue';
import ContextMenu from './ContextMenu.vue';

const sidebarService = inject('sidebarService');
const props = defineProps({
  // 接收原始侧边栏配置
  originalItems: {
    type: Array,
    default: () => []
  }
});

const route = useRoute();
const { theme } = useData();
const items = ref([]);
const expandedFolders = ref({});

// 上下文菜单相关
const rightClickedItem = ref({ path: '', isFolder: false });

// 初始化加载侧边栏数据
async function loadSidebarData() {
  try {
    // 合并静态和动态侧边栏
    const mergedSidebar = await sidebarService.mergeSidebars();
    items.value = mergedSidebar.length > 0 ? mergedSidebar : props.originalItems;
    
    // 展开当前路径所在的文件夹
    initExpandedState();
  } catch (error) {
    console.error('加载侧边栏失败:', error);
    items.value = props.originalItems;
  }
}

// 初始化展开状态
function initExpandedState() {
  const currentPath = route.path;
  
  // 递归查找并展开当前路径所在的文件夹
  function findAndExpandParent(items, path) {
    for (const item of items) {
      if (item.items && item.items.length > 0) {
        // 检查当前文件夹中是否包含当前路径
        const containsCurrentPath = item.items.some(child => {
          if (child.link === path) return true;
          if (child.items && child.items.length > 0) {
            return findAndExpandParent(child.items, path);
          }
          return false;
        });
        
        if (containsCurrentPath) {
          expandedFolders.value[item.text] = true;
          return true;
        }
      }
    }
    return false;
  }
  
  findAndExpandParent(items.value, currentPath);
}

// 判断项目是否为激活状态
function isActiveItem(item) {
  if (item.link) {
    return route.path === item.link;
  }
  return false;
}

// 判断文件夹是否展开
function isExpandedItem(item) {
  if (!item.items || item.items.length === 0) return false;
  return expandedFolders.value[item.text] === true;
}

// 获取项目路径
function getItemPath(item, parent = null) {
  if (item.link) {
    // 从链接中提取路径
    return item.link.startsWith('/') 
      ? `docs${item.link}` 
      : `docs/${item.link}`;
  }
  
  // 如果是文件夹，使用文本作为路径
  let path = 'docs';
  if (parent && parent.text) {
    path += `/${parent.text.toLowerCase().replace(/\s+/g, '-')}`;
  }
  if (item.text) {
    path += `/${item.text.toLowerCase().replace(/\s+/g, '-')}`;
  }
  
  return path;
}

// 处理项目点击
function onItemClick(item, event) {
  if (event && event.button === 2) {
    return; // 右键点击由 ContextMenu 组件处理
  }
  
  // 原来的逻辑：如果是链接则导航，如果是文件夹则切换展开/折叠状态
  if (item.link) {
    navigateTo(item.link);
  } else if (item.items && item.items.length > 0) {
    toggleItemExpanded(item);
  }
}

// 处理侧边栏项的右键点击
function handleItemRightClick(event, item, parentItem = null) {
  event.preventDefault();
  
  // 记录被右击的项目信息
  const path = getItemPath(item, parentItem);
  const isFolder = item.items && item.items.length > 0;
  
  rightClickedItem.value = { 
    path: path || '', 
    isFolder: isFolder 
  };
}

// 处理上下文菜单动作
async function handleContextMenuAction({ action, path, isFolder }) {
  switch(action) {
    case 'new-file':
      // 触发新建文件事件
      document.dispatchEvent(new CustomEvent('webnote:create-file', { 
        detail: { parentPath: path },
        bubbles: true
      }));
      break;
      
    case 'new-folder':
      // 触发新建文件夹事件
      document.dispatchEvent(new CustomEvent('webnote:create-folder', { 
        detail: { parentPath: path },
        bubbles: true
      }));
      break;
      
    case 'rename':
      // 触发重命名事件
      document.dispatchEvent(new CustomEvent('webnote:rename', { 
        detail: { path, isFolder },
        bubbles: true
      }));
      break;
      
    case 'delete':
      if (confirm(`确定要删除${isFolder ? '文件夹' : '文件'} "${path}" 吗？`)) {
        document.dispatchEvent(new CustomEvent('webnote:delete', { 
          detail: { path, isFolder },
          bubbles: true
        }));
      }
      break;
  }
  
  // 清除右键点击项
  clearRightClickedItem();
}

// 清除右键点击项
function clearRightClickedItem() {
  rightClickedItem.value = { path: '', isFolder: false };
}

// 监听侧边栏更新事件
function handleSidebarUpdate() {
  loadSidebarData();
}

// 组件挂载
onMounted(() => {
  loadSidebarData();
  
  // 监听自定义事件
  document.addEventListener('webnote:sidebar-update', handleSidebarUpdate);
});

// 组件销毁前清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('webnote:sidebar-update', handleSidebarUpdate);
});

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    // 路由变化时更新活动项目
    initExpandedState();
  }
);
</script>

<style scoped>
.enhanced-sidebar {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 16px 0;
}

.enhanced-sidebar-items {
  padding: 0 16px;
}

.enhanced-sidebar-links {
  margin-top: 16px;
}

.enhanced-sidebar-item {
  margin: 6px 0;
  position: relative;
}

.sidebar-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  user-select: none;
}

.sidebar-item-content:hover {
  background-color: var(--vp-c-bg-soft);
}

.is-active > div > .sidebar-item-content {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand);
  font-weight: 500;
}

.sidebar-item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sidebar-item-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.arrow {
  width: 10px;
  height: 10px;
  transition: transform 0.2s;
}

.arrow.down {
  transform: rotate(90deg);
}

.sidebar-children {
  margin-left: 16px;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.sidebar-children.nested {
  margin-left: 8px;
}

/* 子项目样式 */
.child-item .sidebar-item-content {
  padding-left: 12px;
}

.grandchild-item .sidebar-item-content {
  padding-left: 16px;
}

/* 右键菜单相关样式 */
.enhanced-sidebar-item {
  position: relative;
}
</style>
