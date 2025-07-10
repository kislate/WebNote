<template>
  <div class="folder-actions">
    <!-- 拦截原始侧边栏项并添加操作按钮 -->
    <div 
      class="folder-item" 
      :class="{ 'is-expanded': isExpanded }"
      @mouseenter="showActions = true"
      @mouseleave="showActions = false"
    >
      <!-- 原始文件夹项内容 -->
      <slot></slot>
      
      <!-- 悬停时显示的操作按钮 -->
      <div v-if="showActions && isFolder" class="action-buttons">
        <button 
          class="action-button add-file" 
          title="新建笔记" 
          @click.stop="showNewFileInput"
        >
          <span class="icon">+</span>
        </button>
        <button 
          class="action-button add-folder" 
          title="新建文件夹" 
          @click.stop="showNewFolderInput"
        >
          <span class="icon">📁+</span>
        </button>
      </div>
    </div>
    
    <!-- 新建文件输入框 -->
    <div v-if="isCreatingFile" class="create-input-container">
      <input 
        ref="fileNameInput"
        v-model="newFileName"
        class="create-input"
        placeholder="输入笔记名称..."
        @keydown.enter="createFile"
        @keydown.esc="cancelCreate"
        @blur="cancelCreate"
      />
    </div>
    
    <!-- 新建文件夹输入框 -->
    <div v-if="isCreatingFolder" class="create-input-container">
      <input 
        ref="folderNameInput"
        v-model="newFolderName"
        class="create-input"
        placeholder="输入文件夹名称..."
        @keydown.enter="createFolder"
        @keydown.esc="cancelCreate"
        @blur="cancelCreate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, inject } from 'vue';
import { useData, useRoute } from 'vitepress';

// 注入服务
const githubService = inject('githubService');
const storageService = inject('storageService');

// 组件属性
const props = defineProps({
  path: {
    type: String,
    default: ''
  },
  isFolder: {
    type: Boolean,
    default: false
  },
  isExpanded: {
    type: Boolean,
    default: false
  }
});

// 组件状态
const showActions = ref(false);
const isCreatingFile = ref(false);
const isCreatingFolder = ref(false);
const newFileName = ref('');
const newFolderName = ref('');
const fileNameInput = ref(null);
const folderNameInput = ref(null);

// 显示新建文件输入框
function showNewFileInput(event) {
  event.stopPropagation();
  isCreatingFile.value = true;
  isCreatingFolder.value = false;
  newFileName.value = '';
  
  nextTick(() => {
    fileNameInput.value?.focus();
  });
}

// 显示新建文件夹输入框
function showNewFolderInput(event) {
  event.stopPropagation();
  isCreatingFolder.value = true;
  isCreatingFile.value = false;
  newFolderName.value = '';
  
  nextTick(() => {
    folderNameInput.value?.focus();
  });
}

// 创建新文件
async function createFile() {
  if (!newFileName.value.trim()) {
    cancelCreate();
    return;
  }
  
  try {
    // 构建文件路径
    const basePath = props.path || 'docs';
    const fileName = newFileName.value.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    
    // 添加 .md 后缀（如果没有）
    const fullFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const filePath = `${basePath}/${fullFileName}`;
    
    // 创建初始内容
    const content = `# ${newFileName.value}\n\n添加你的笔记内容...`;
    
    // 检查 GitHub 认证
    const { isAuthenticated } = await githubService.getGitHubCredentials();
    
    if (isAuthenticated) {
      // 直接提交到 GitHub
      const commitMessage = `创建新笔记: ${fullFileName}`;
      await githubService.createOrUpdateFile(filePath, content, commitMessage);
      alert(`笔记 ${newFileName.value} 已创建并提交到 GitHub`);
      
      // 触发侧边栏更新事件并刷新
      refreshAfterUpdate();
    } else {
      // 保存到本地草稿
      await storageService.saveDraft(filePath, content, { isNew: true });
      alert(`笔记 ${newFileName.value} 已保存到本地草稿箱`);
    }
    
    // 重置状态
    cancelCreate();
  } catch (error) {
    console.error('创建文件失败:', error);
    alert('创建文件失败，请重试');
  }
}

// 创建新文件夹
async function createFolder() {
  if (!newFolderName.value.trim()) {
    cancelCreate();
    return;
  }
  
  try {
    // 构建文件夹路径
    const basePath = props.path || 'docs';
    const folderName = newFolderName.value.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    
    const folderPath = `${basePath}/${folderName}/`;
    
    // 检查 GitHub 认证
    const { isAuthenticated } = await githubService.getGitHubCredentials();
    
    if (isAuthenticated) {
      // 直接提交到 GitHub
      const commitMessage = `创建新文件夹: ${folderName}`;
      await githubService.createFolder(folderPath, commitMessage);
      alert(`文件夹 ${newFolderName.value} 已创建并提交到 GitHub`);
      
      // 触发侧边栏更新事件并刷新
      refreshAfterUpdate();
    } else {
      alert('创建文件夹需要登录 GitHub，请先登录');
    }
    
    // 重置状态
    cancelCreate();
  } catch (error) {
    console.error('创建文件夹失败:', error);
    alert('创建文件夹失败，请重试');
  }
}

// 取消创建
function cancelCreate() {
  isCreatingFile.value = false;
  isCreatingFolder.value = false;
  newFileName.value = '';
  newFolderName.value = '';
}

// 发送自定义事件
function emitEvent(eventName, data = null) {
  const event = new CustomEvent(`webnote:${eventName}`, { 
    detail: data,
    bubbles: true 
  });
  document.dispatchEvent(event);
}

// 更新侧边栏后刷新页面
function refreshAfterUpdate() {
  // 设置一个短暂的延迟，确保 GitHub API 同步完成
  setTimeout(() => {
    emitEvent('sidebar-update');
  }, 1000);
}
</script>

<style scoped>
.folder-item {
  position: relative;
  display: flex;
  align-items: center;
}

.action-buttons {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  z-index: 2;
}

.action-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.action-button:hover {
  background-color: var(--vp-c-bg-mute);
}

.action-button .icon {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.create-input-container {
  padding: 8px 16px;
  margin-left: 16px;
}

.create-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.create-input:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}
</style>
