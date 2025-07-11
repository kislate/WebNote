<template>
  <div class="note-manager" :class="{ 'is-mobile': isMobile, 'editing-mode': isEditing }">
    <!-- 使用移动键盘处理组件包装整个编辑界面 -->
    <mobile-keyboard-handler :active="isEditing || isCreatingNew || showNewNoteForm || showNewFolderForm" @keyboard-open="handleKeyboardOpen" @keyboard-close="handleKeyboardClose">
      <!-- 编辑模式工具栏 (整合到顶部，避免重叠) -->
      <div v-if="isEditing" class="edit-toolbar">
        <div class="toolbar-left">
          <button class="back-button" @click="cancelEdit" title="返回">
            <span class="icon">←</span>
          </button>
          <h2 class="note-title">{{ pageTitle }}</h2>
        </div>
        
        <div class="toolbar-right">
          <button class="save-button" @click="saveNote" title="保存笔记">
            <span class="icon">💾</span> 保存
          </button>
        </div>
      </div>
      
      <!-- 环境提示信息 -->
      <div v-if="environmentWarning" class="environment-warning">
        <span class="warning-icon">⚠️</span> {{ environmentWarning }}
        <button class="close-warning" @click="dismissWarning">×</button>
      </div>
      
      <!-- 同步状态提示 -->
      <div v-if="syncStatus" class="sync-status" :class="syncStatus.type">
        <span class="status-icon">{{ syncStatus.icon }}</span> {{ syncStatus.message }}
        <button v-if="syncStatus.dismissable" class="close-status" @click="dismissSyncStatus">×</button>
      </div>
      
      <!-- 侧边菜单 -->
      <div class="note-sidebar" :class="{ 'sidebar-open': showMenu }">
        <div class="sidebar-header">
          <h3>笔记管理</h3>
          <button class="close-button" @click="toggleMenu">×</button>
        </div>
        
        <div class="sidebar-actions">
          <button class="action-button" @click="createNewNote">
            <span class="icon">+</span> 新建笔记
          </button>
          <button class="action-button" @click="createNewFolder">
            <span class="icon">📁</span> 新建文件夹
          </button>
          <button v-if="!isAuthenticated" class="action-button" @click="showLoginForm = true">
            <span class="icon">🔑</span> GitHub 登录
          </button>
          <button v-else class="action-button" @click="logout">
            <span class="icon">🚪</span> 退出登录
          </button>
        </div>
        
        <div class="sidebar-section">
          <h4>最近编辑</h4>
          <ul class="note-list">
            <li v-for="file in recentFiles" :key="file.path" @click="openFile(file)">
              {{ file.name || file.path.split('/').pop() }}
              <small>{{ formatTime(file.lastAccessed) }}</small>
            </li>
          </ul>
        </div>
        
        <div class="sidebar-section">
          <h4>草稿箱</h4>
          <ul class="note-list">
            <li v-for="draft in drafts" :key="draft.path" @click="openDraft(draft)">
              {{ draft.path.split('/').pop() }}
              <small>{{ formatTime(draft.lastModified) }}</small>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- GitHub 登录表单 -->
      <div class="modal" v-if="showLoginForm">
        <div class="modal-content">
          <h3>GitHub 登录</h3>
          <p>请输入您的 GitHub 个人访问令牌(PAT)、用户名和仓库名</p>
          
          <form @submit.prevent="login">
            <div class="form-group">
              <label>GitHub 用户名</label>
              <input type="text" v-model="githubUsername" placeholder="如：kislate" required />
            </div>
            
            <div class="form-group">
              <label>仓库名</label>
              <input type="text" v-model="githubRepo" placeholder="如：WebNote" required />
            </div>
            
            <div class="form-group">
              <label>个人访问令牌 (PAT)</label>
              <input type="password" v-model="githubToken" placeholder="ghp_xxxxxxxxxxxxxxxx" required />
              <small>
                需要具有 repo 权限的令牌。
                <a href="https://github.com/settings/tokens/new" target="_blank">创建令牌</a>
              </small>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" @click="showLoginForm = false">取消</button>
              <button type="submit" class="submit-button">登录</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 新建笔记表单 -->
      <div class="modal" v-if="showNewNoteForm">
        <div class="modal-content">
          <h3>新建笔记</h3>
          
          <form @submit.prevent="confirmCreateNote">
            <div class="form-group">
              <label>笔记标题</label>
              <input type="text" v-model="newNoteTitle" placeholder="输入标题" required />
            </div>
            
            <div class="form-group">
              <label>路径</label>
              <div class="path-input">
                <span>docs/</span>
                <input type="text" v-model="newNotePath" placeholder="path/to/file" />
                <span>.md</span>
              </div>
              <small>不填写路径时，文件将保存在 docs 根目录下</small>
            </div>
            
            <div class="form-group">
              <label>模板</label>
              <select v-model="selectedTemplate">
                <option value="blank">空白文档</option>
                <option value="article">文章</option>
                <option value="note">笔记</option>
                <option value="math">数学笔记</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" @click="showNewNoteForm = false">取消</button>
              <button type="submit" class="submit-button">创建</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 新建文件夹表单 -->
      <div class="modal" v-if="showNewFolderForm">
        <div class="modal-content">
          <h3>新建文件夹</h3>
          
          <form @submit.prevent="confirmCreateFolder">
            <div class="form-group">
              <label>文件夹名称</label>
              <input type="text" v-model="newFolderName" placeholder="输入名称" required />
            </div>
            
            <div class="form-group">
              <label>路径</label>
              <div class="path-input">
                <span>docs/</span>
                <input type="text" v-model="newFolderPath" placeholder="path/to" />
              </div>
              <small>不填写路径时，文件夹将创建在 docs 根目录下</small>
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" @click="showNewFolderForm = false">取消</button>
              <button type="submit" class="submit-button">创建</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 提交表单 -->
      <div class="modal" v-if="showCommitForm">
        <div class="modal-content">
          <h3>提交更改到 GitHub</h3>
          
          <form @submit.prevent="confirmCommit">
            <div class="form-group">
              <label>提交消息</label>
              <input type="text" v-model="commitMessage" placeholder="描述您所做的更改" required />
            </div>
            
            <div class="form-actions">
              <button type="button" class="cancel-button" @click="showCommitForm = false">仅本地保存</button>
              <button type="submit" class="submit-button">提交到 GitHub</button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- 文件冲突解析器 -->
      <conflict-resolver
        :is-visible="showConflictResolver"
        :local-content="conflictData.localContent"
        :remote-content="conflictData.remoteContent"
        :file-path="conflictData.filePath"
        @use-local="handleUseLocalVersion"
        @use-remote="handleUseRemoteVersion"
        @cancel="handleCancelConflictResolve"
      />
      
      <!-- 内容区域 -->
      <div class="note-content">
        <!-- 编辑模式 -->
        <template v-if="isEditing || isCreatingNew">
          <markdown-editor 
            ref="editor"
            v-model="noteContent"
            :path="currentPath"
          ></markdown-editor>
        </template>
        
        <!-- 查看模式（在这里使用 VitePress 的默认渲染） -->
        <template v-else>
          <slot></slot>
        </template>
      </div>
    </mobile-keyboard-handler>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useData, useRoute } from 'vitepress';
import MobileKeyboardHandler from './MobileKeyboardHandler.vue';
import MarkdownEditor from './MarkdownEditor.vue';
import ConflictResolver from './ConflictResolver.vue';
import githubService from '../services/githubService';
import storageService from '../services/storageService';
import sidebarService from '../services/sidebarService';

// 组件属性
const props = defineProps({
  path: {
    type: String,
    default: ''
  }
});

// 定义组件事件
const emit = defineEmits(['exit-editor']);

// 组件状态
const isEditing = ref(false);
const isCreatingNew = ref(false);
const showMenu = ref(false);
const isMobile = ref(false);
const currentPath = ref(props.path);
const noteContent = ref('');
const originalContent = ref('');
const isAuthenticated = ref(false);
const showLoginForm = ref(false);
const showNewNoteForm = ref(false);
const showNewFolderForm = ref(false);
const showCommitForm = ref(false);
const showBackButton = ref(false);
const recentFiles = ref([]);
const drafts = ref([]);
const environmentWarning = ref('');
const syncStatus = ref(null);
const currentFileSha = ref(null);
const showConflictResolver = ref(false);
const conflictData = ref({});

// GitHub 登录表单
const githubUsername = ref('');
const githubRepo = ref('');
const githubToken = ref('');

// 新建笔记表单
const newNoteTitle = ref('');
const newNotePath = ref('');
const selectedTemplate = ref('blank');

// 新建文件夹表单
const newFolderName = ref('');
const newFolderPath = ref('');

// 提交表单
const commitMessage = ref('');

// 编辑器引用
const editor = ref(null);

// VitePress 相关
const { page, frontmatter } = useData();
const router = useRoute();

// 计算属性
const pageTitle = computed(() => {
  if (isCreatingNew.value) {
    return '新建笔记';
  } else if (isEditing.value) {
    return `编辑: ${page.value.title || currentPath.value.split('/').pop()}`;
  } else {
    return page.value.title || currentPath.value.split('/').pop();
  }
});

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60 * 1000) {
    return '刚刚';
  } else if (diff < 3600 * 1000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 24 * 3600 * 1000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString();
  }
}

// 检查屏幕宽度
function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768;
  }
}

// 处理软键盘弹出
function handleKeyboardOpen(event) {
  // 软键盘弹出时，确保编辑区域可见
  if (typeof window !== 'undefined' && isMobile.value) {
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}

// 处理软键盘关闭
function handleKeyboardClose() {
  // 软键盘关闭时，可以执行一些恢复操作
}

// 切换菜单显示
function toggleMenu() {
  showMenu.value = !showMenu.value;
}

// 关闭环境警告
function dismissWarning() {
  environmentWarning.value = '';
}

// 关闭同步状态提示
function dismissSyncStatus() {
  syncStatus.value = null;
}

// 设置同步状态
function setSyncStatus(message, type = 'info', icon = 'ℹ️', dismissable = true) {
  syncStatus.value = { message, type, icon, dismissable };
  
  if (dismissable) {
    setTimeout(() => {
      if (syncStatus.value && syncStatus.value.message === message) {
        syncStatus.value = null;
      }
    }, 5000); // 5秒后自动消失
  }
}

// 与GitHub同步
async function syncWithGitHub() {
  if (!isAuthenticated.value) {
    alert('请先登录 GitHub');
    return;
  }
  
  try {
    setSyncStatus('正在同步...', 'info', '🔄', false);
    
    // 拉取最新更改
    const changedFiles = await githubService.pullLatestChanges();
    
    // 如果当前文件有更新，提示用户
    if (currentPath.value && changedFiles.includes(currentPath.value)) {
      setSyncStatus('当前文件有远程更新，请刷新页面获取最新内容', 'warning', '⚠️');
    } else if (changedFiles.length > 0) {
      setSyncStatus(`同步完成，${changedFiles.length}个文件有更新`, 'success', '✅');
      
      // 更新侧边栏
      await sidebarService.mergeSidebars();
    } else {
      setSyncStatus('已是最新状态', 'success', '✅');
    }
  } catch (error) {
    console.error('同步失败:', error);
    setSyncStatus('同步失败，请重试', 'error', '❌');
  }
}

// 检查运行环境并显示适当的警告
function checkEnvironment() {
  const env = githubService.checkEnvironment();
  
  if (env === 'development') {
    environmentWarning.value = '您正在开发模式下运行，更改不会自动部署到生产环境。';
  } else if (env === 'preview') {
    environmentWarning.value = '您正在预览模式下运行，更改不会自动部署到生产环境。';
  } else {
    environmentWarning.value = '';
  }
}

// 开始编辑之前检查文件是否有更新
async function checkFileUpdates() {
  if (!isAuthenticated.value || !currentFileSha.value || !currentPath.value) return true;
  
  try {
    const isUpdated = await githubService.checkFileUpdated(currentPath.value, currentFileSha.value);
    
    if (isUpdated) {
      // 获取远程文件的最新内容
      const { content: remoteContent } = await githubService.getFileContent(currentPath.value);
      
      // 设置冲突解析器的数据
      conflictData.value = {
        localContent: noteContent.value || originalContent.value,
        remoteContent: remoteContent,
        filePath: currentPath.value
      };
      
      // 显示冲突解析器
      showConflictResolver.value = true;
      
      // 返回 false 暂停编辑流程，等待冲突解析
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('检查文件更新失败:', error);
    return true; // 出错时也允许继续
  }
}

// 开始编辑当前笔记
async function startEdit() {
  if (!currentPath.value) return;
  
  // 检查文件是否有更新
  const canEdit = await checkFileUpdates();
  if (!canEdit) return;
  
  try {
    // 首先检查是否有本地草稿
    const draft = await storageService.getDraft(currentPath.value);
    
    if (draft && draft.content) {
      // 发现草稿，询问是否使用
      const useDraft = confirm('发现本地草稿，是否使用？');
      if (useDraft) {
        noteContent.value = draft.content;
        originalContent.value = draft.content;
      } else if (isAuthenticated.value) {
        // 不使用草稿，从GitHub加载
        await loadContentFromGitHub();
      } else {
        // 未登录，无法获取远程内容
        noteContent.value = page.value.html || '';
        originalContent.value = noteContent.value;
      }
    } else if (isAuthenticated.value) {
      // 没有草稿，尝试从GitHub获取
      await loadContentFromGitHub();
    } else {
      // 未登录，使用页面内容
      noteContent.value = page.value.html || '';
      originalContent.value = noteContent.value;
    }
    
    isEditing.value = true;
    
    // 将此文件添加到最近文件列表
    await storageService.addToRecentFiles({
      path: currentPath.value,
      name: page.value.title
    });
    
    // 更新最近文件列表
    await loadRecentFiles();
  } catch (error) {
    console.error('启动编辑失败:', error);
    alert('无法加载文件内容，请稍后再试');
  }
}

// 取消编辑
function cancelEdit() {
  if (noteContent.value !== originalContent.value) {
    const confirmed = confirm('您有未保存的更改，确定要取消吗？');
    if (!confirmed) return;
  }
  
  // 重置状态
  isEditing.value = false;
  isCreatingNew.value = false;
  noteContent.value = originalContent.value;
  
  // 退出编辑器模式
  emitExitEditor();
}

// 退出编辑器并返回到原页面
function emitExitEditor(savedPath = null) {
  const event = new CustomEvent('webnote:exit-editor', { 
    detail: savedPath,
    bubbles: true 
  });
  document.dispatchEvent(event);
  
  // 同时触发组件事件
  emit('exit-editor', savedPath);
}

// 保存笔记
async function saveNote() {
  // 首先保存到本地草稿
  await storageService.saveDraft(currentPath.value, noteContent.value);
  
  // 如果已登录 GitHub，显示提交表单
  if (isAuthenticated.value) {
    commitMessage.value = isCreatingNew.value 
      ? `创建笔记: ${currentPath.value.split('/').pop()}`
      : `更新笔记: ${currentPath.value.split('/').pop()}`;
    
    showCommitForm.value = true;
  } else {
    // 未登录，只保存草稿
    alert('笔记已保存到本地草稿箱');
    if (!isCreatingNew.value) {
      isEditing.value = false;
    }
  }
  
  // 更新草稿列表
  await loadDrafts();
}

// 确认提交到 GitHub
async function confirmCommit() {
  if (!isAuthenticated.value) {
    alert('请先登录 GitHub');
    showCommitForm.value = false;
    return;
  }
  
  try {
    showCommitForm.value = false;
    
    // 提交到 GitHub
    const sha = isCreatingNew.value ? null : await getFileSha();
    await githubService.createOrUpdateFile(
      currentPath.value,
      noteContent.value,
      commitMessage.value,
      sha
    );
    
    // 提交成功后清除草稿
    await storageService.removeDraft(currentPath.value);
    
    // 记录保存前的状态
    const wasNewNote = isCreatingNew.value;
    const savedPath = currentPath.value;
    
    // 更新状态
    isEditing.value = false;
    isCreatingNew.value = false;
    
    // 更新草稿列表
    await loadDrafts();
    
    // 显示成功消息
    alert('笔记已成功提交到 GitHub');
    
    // 退出编辑模式，传递保存的文件路径
    emitExitEditor(savedPath);
  } catch (error) {
    console.error('提交到 GitHub 失败:', error);
    alert('提交到 GitHub 失败，请重试');
  }
}

// 获取文件的当前 SHA
async function getFileSha() {
  try {
    const result = await githubService.getFileContent(currentPath.value);
    return result.sha;
  } catch (error) {
    return null; // 如果文件不存在，返回 null
  }
}

// GitHub 登录
async function login() {
  try {
    // 保存 GitHub 凭据
    await githubService.saveGitHubCredentials(
      githubToken.value,
      githubUsername.value,
      githubRepo.value
    );
    
    // 测试连接
    await githubService.getRepoFiles();
    
    // 登录成功
    isAuthenticated.value = true;
    showLoginForm.value = false;
    
    // 清空表单
    githubToken.value = '';
    
    alert('GitHub 登录成功！');
  } catch (error) {
    console.error('GitHub 登录失败:', error);
    alert('登录失败，请检查您的凭据');
  }
}

// 退出登录
async function logout() {
  await githubService.clearGitHubCredentials();
  isAuthenticated.value = false;
  alert('已退出 GitHub 登录');
}

// 新建笔记
function createNewNote() {
  newNoteTitle.value = '';
  newNotePath.value = '';
  selectedTemplate.value = 'blank';
  showNewNoteForm.value = true;
  showMenu.value = false;
}

// 确认创建新笔记
async function confirmCreateNote() {
  // 构建文件路径
  let filename = newNoteTitle.value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
    
  if (!filename) {
    alert('请输入有效的标题');
    return;
  }
  
  // 组合完整路径
  let fullPath = 'docs/';
  if (newNotePath.value) {
    fullPath += newNotePath.value.replace(/^\/+|\/+$/g, '') + '/';
  }
  fullPath += filename + '.md';
  
  // 生成笔记内容
  let content = '';
  switch (selectedTemplate.value) {
    case 'article':
      content = `# ${newNoteTitle.value}\n\n日期: ${new Date().toLocaleDateString()}\n\n## 简介\n\n在此处编写文章简介\n\n## 内容\n\n在此处编写正文内容\n`;
      break;
    case 'note':
      content = `# ${newNoteTitle.value}\n\n- **创建日期**: ${new Date().toLocaleDateString()}\n- **标签**: \n\n## 笔记内容\n\n在此处编写笔记内容\n\n## 参考资料\n\n- [链接标题](URL)\n`;
      break;
    case 'math':
      content = `# ${newNoteTitle.value}\n\n## 数学公式示例\n\n行内公式: $E = mc^2$\n\n独立公式:\n\n$$\n\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)\n$$\n\n## 笔记内容\n\n在此处编写带有数学公式的内容\n`;
      break;
    default:
      content = `# ${newNoteTitle.value}\n\n在此处编写内容\n`;
  }
  
  // 保存路径和内容
  currentPath.value = fullPath;
  noteContent.value = content;
  originalContent.value = content;
  
  // 关闭表单并进入创建模式
  showNewNoteForm.value = false;
  isCreatingNew.value = true;
  isEditing.value = true;
  showBackButton.value = true;
}

// 新建文件夹
function createNewFolder() {
  newFolderName.value = '';
  newFolderPath.value = '';
  showNewFolderForm.value = true;
  showMenu.value = false;
}

// 确认创建文件夹
async function confirmCreateFolder() {
  if (!isAuthenticated.value) {
    alert('请先登录 GitHub 以创建文件夹');
    return;
  }
  
  // 构建文件夹路径
  let folderPath = 'docs/';
  if (newFolderPath.value) {
    folderPath += newFolderPath.value.replace(/^\/+|\/+$/g, '') + '/';
  }
  folderPath += newFolderName.value.replace(/\s+/g, '-').toLowerCase() + '/';
  
  try {
    // 创建文件夹
    await githubService.createFolder(folderPath, `创建文件夹: ${newFolderName.value}`);
    
    // 关闭表单
    showNewFolderForm.value = false;
    
    // 显示成功消息
    alert(`文件夹 ${newFolderName.value} 已成功创建`);
  } catch (error) {
    console.error('创建文件夹失败:', error);
    alert('创建文件夹失败，请重试');
  }
}

// 从 GitHub 获取文件内容
async function loadFileFromGitHub() {
  if (!currentPath.value || !isAuthenticated.value) return;
  
  try {
    setSyncStatus('正在从 GitHub 获取文件...', 'info', '🔄', false);
    const { content, sha } = await githubService.getFileContent(currentPath.value);
    
    // 保存文件内容和 SHA
    noteContent.value = content;
    originalContent.value = content;
    currentFileSha.value = sha;
    
    // 更新状态
    setSyncStatus('文件已加载', 'success', '✅');
    
    // 将文件添加到最近文件列表
    await storageService.addRecentFile(currentPath.value);
    await loadRecentFiles();
    
    return true;
  } catch (error) {
    console.error('加载文件失败:', error);
    if (error.status === 404) {
      setSyncStatus('文件不存在', 'error', '❌');
      return false;
    }
    setSyncStatus('加载文件失败', 'error', '❌');
    return false;
  }
}

// 从GitHub加载内容
async function loadContentFromGitHub() {
  try {
    setSyncStatus('正在从GitHub获取文件...', 'info', '🔄', false);
    const result = await githubService.getFileContent(currentPath.value);
    noteContent.value = result.content;
    originalContent.value = result.content;
    currentFileSha.value = result.sha; // 保存SHA用于后续检查
    setSyncStatus('文件已从GitHub加载', 'success', '✅');
  } catch (error) {
    console.error('从GitHub加载内容失败:', error);
    if (error.status === 404) {
      // 文件不存在，创建新文件
      const filename = currentPath.value.split('/').pop().replace('.md', '');
      noteContent.value = `# ${filename}\n\n添加你的笔记内容...\n`;
      originalContent.value = noteContent.value;
      isCreatingNew.value = true;
      setSyncStatus('正在创建新文件', 'info', '📝');
    } else {
      setSyncStatus('加载失败，使用本地内容', 'error', '❌');
      noteContent.value = page.value.html || '';
      originalContent.value = noteContent.value;
      throw error;
    }
  }
}

// 打开文件
async function openFile(file) {
  if (!file.path) return;
  
  // 如果是 markdown 文件，跳转到对应页面
  if (file.path.endsWith('.md')) {
    // 从路径中提取相对 URL
    const relativeUrl = file.path.replace(/^docs\//, '/').replace(/\.md$/, '');
    router.go(relativeUrl);
  } else {
    alert('无法打开非 Markdown 文件');
  }
  
  // 关闭菜单
  showMenu.value = false;
}

// 打开草稿
async function openDraft(draft) {
  if (!draft.path) return;
  
  // 从路径中提取相对 URL
  const relativeUrl = draft.path.replace(/^docs\//, '/').replace(/\.md$/, '');
  
  // 存储草稿路径和内容
  currentPath.value = draft.path;
  noteContent.value = draft.content;
  originalContent.value = draft.content;
  
  // 进入编辑模式
  isEditing.value = true;
  isCreatingNew.value = draft.isNew || false;
  
  // 导航到对应页面
  router.go(relativeUrl);
  
  // 关闭菜单
  showMenu.value = false;
}

// 返回
function goBack() {
  router.go('/');
}

// 加载最近文件列表
async function loadRecentFiles() {
  recentFiles.value = await storageService.getRecentFiles();
}

// 加载草稿列表
async function loadDrafts() {
  drafts.value = await storageService.getAllDrafts();
}

// 检查 GitHub 登录状态
async function checkAuth() {
  const credentials = await githubService.getGitHubCredentials();
  isAuthenticated.value = credentials.isAuthenticated;
  
  if (isAuthenticated.value) {
    githubUsername.value = credentials.username;
    githubRepo.value = credentials.repo;
  }
}

// 组件挂载
onMounted(async () => {
  // 检查设备类型
  checkMobile();
  
  // 检查运行环境
  checkEnvironment();
  
  // 检查登录状态
  await checkAuth();
  
  // 加载最近文件和草稿
  await loadRecentFiles();
  await loadDrafts();
  
  // 设置当前路径
  if (props.path) {
    currentPath.value = props.path;
  }
  
  // 监听窗口大小变化
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile);
  }
  
  // 监听右键菜单自定义事件
  document.addEventListener('webnote:create-file', handleCreateFileEvent);
  document.addEventListener('webnote:create-folder', handleCreateFolderEvent);
  document.addEventListener('webnote:rename', handleRenameEvent);
  document.addEventListener('webnote:delete', handleDeleteEvent);
});

// 组件卸载前清理事件
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkMobile);
  }
  
  // 移除自定义事件监听器
  document.removeEventListener('webnote:create-file', handleCreateFileEvent);
  document.removeEventListener('webnote:create-folder', handleCreateFolderEvent);
  document.removeEventListener('webnote:rename', handleRenameEvent);
  document.removeEventListener('webnote:delete', handleDeleteEvent);
});

// 监听路径变化
watch(() => props.path, (newPath) => {
  if (newPath) {
    currentPath.value = newPath;
    isEditing.value = false;
    isCreatingNew.value = false;
  }
});

// 加载文件内容并开始编辑 - 供外部组件调用
async function loadFileContent(path) {
  if (!path) return;
  
  try {
    console.log("直接加载文件内容:", path);
    currentPath.value = path;
    
    // 尝试先从本地草稿获取内容
    const draft = await storageService.getDraft(path);
    
    if (draft && draft.content) {
      noteContent.value = draft.content;
      originalContent.value = draft.content;
    } else if (isAuthenticated.value) {
      // 从GitHub获取内容
      try {
        const result = await githubService.getFileContent(path);
        noteContent.value = result.content;
        originalContent.value = result.content;
        currentFileSha.value = result.sha;
      } catch (error) {
        console.error("从GitHub获取内容失败:", error);
        // 尝试从页面获取内容
        noteContent.value = page.value.html || '';
        originalContent.value = noteContent.value;
      }
    } else {
      // 未登录时使用页面内容
      noteContent.value = page.value.html || '';
      originalContent.value = noteContent.value;
    }
    
    // 强制进入编辑模式
    isEditing.value = true;
    isCreatingNew.value = false;
    
    // 添加到最近文件
    await storageService.addToRecentFiles({
      path: path,
      name: page.value.title || path.split('/').pop()
    });
    
    // 更新最近文件列表
    await loadRecentFiles();
  } catch (error) {
    console.error("加载文件内容失败:", error);
    alert("无法加载文件内容，请稍后再试");
  }
}

// 对外暴露方法
defineExpose({
  loadFileContent,
  createNewNote,
  isEditing
});

// 右键菜单 - 创建文件事件处理
function handleCreateFileEvent(event) {
  const { parentPath } = event.detail || {};
  
  // 设置新笔记的父路径
  if (parentPath) {
    newNotePath.value = parentPath.replace(/^docs\//, '');
  }
  
  // 显示新建笔记表单
  showNewNoteForm.value = true;
}

// 右键菜单 - 创建文件夹事件处理
function handleCreateFolderEvent(event) {
  const { parentPath } = event.detail || {};
  
  // 设置新文件夹的父路径
  if (parentPath) {
    newFolderPath.value = parentPath.replace(/^docs\//, '');
  }
  
  // 显示新建文件夹表单
  showNewFolderForm.value = true;
}

// 右键菜单 - 重命名事件处理
async function handleRenameEvent(event) {
  const { path, isFolder } = event.detail || {};
  
  if (!path) return;
  
  const newName = prompt(`输入新的${isFolder ? '文件夹' : '文件'}名称:`, path.split('/').pop());
  
  if (!newName || newName === path.split('/').pop()) return;
  
  try {
    const { isAuthenticated } = await githubService.getGitHubCredentials();
    
    if (!isAuthenticated) {
      alert('需要 GitHub 授权才能执行此操作');
      return;
    }
    
    // 构建新路径
    const pathParts = path.split('/');
    pathParts.pop();
    const newPath = [...pathParts, newName].join('/');
    
    // 显示进度提示
    setSyncStatus(`正在重命名...`, 'info', '🔄', false);
    
    // 执行重命名操作
    await githubService.renameFile(path, newPath, isFolder);
    
    // 成功提示
    setSyncStatus(`已成功重命名为 ${newName}`, 'success', '✅');
    
    // 更新侧边栏
    await sidebarService.mergeSidebars();
  } catch (error) {
    console.error('重命名失败:', error);
    setSyncStatus(`重命名失败: ${error.message}`, 'error', '❌');
  }
}

// 右键菜单 - 删除事件处理
async function handleDeleteEvent(event) {
  const { path, isFolder } = event.detail || {};
  
  if (!path) return;
  
  try {
    const { isAuthenticated } = await githubService.getGitHubCredentials();
    
    if (!isAuthenticated) {
      alert('需要 GitHub 授权才能执行此操作');
      return;
    }
    
    // 显示进度提示
    setSyncStatus(`正在删除...`, 'info', '🔄', false);
    
    // 执行删除操作
    if (isFolder) {
      await githubService.deleteFolder(path);
    } else {
      await githubService.deleteFile(path);
    }
    
    // 成功提示
    setSyncStatus(`已成功删除 ${path.split('/').pop()}`, 'success', '✅');
    
    // 更新侧边栏
    await sidebarService.mergeSidebars();
  } catch (error) {
    console.error('删除失败:', error);
    setSyncStatus(`删除失败: ${error.message}`, 'error', '❌');
  }
}

// 处理冲突解决 - 使用本地版本
async function handleUseLocalVersion() {
  // 保持使用本地内容
  noteContent.value = conflictData.localContent;
  
  // 隐藏冲突解析器
  showConflictResolver.value = false;
  
  // 开始编辑
  isEditing.value = true;
  
  // 记录进行了冲突解决
  setSyncStatus('已选择使用本地版本', 'success', '✅');
}

// 处理冲突解决 - 使用远程版本
async function handleUseRemoteVersion() {
  // 使用远程内容
  noteContent.value = conflictData.remoteContent;
  originalContent.value = conflictData.remoteContent;
  
  // 更新本地存储的草稿
  await storageService.saveDraft(currentPath.value, conflictData.remoteContent);
  
  // 隐藏冲突解析器
  showConflictResolver.value = false;
  
  // 开始编辑
  isEditing.value = true;
  
  // 记录进行了冲突解决
  setSyncStatus('已选择使用远程版本', 'info', '🔄');
}

// 处理冲突解决 - 取消
function handleCancelConflictResolve() {
  // 隐藏冲突解析器
  showConflictResolver.value = false;
  
  // 取消编辑
  isEditing.value = false;
  
  setSyncStatus('已取消冲突解决', 'info', '⚠️');
}
</script>

<style scoped>
.note-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
}

.note-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.toolbar-left, .toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.note-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
}

button {
  padding: 6px 12px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

button:hover {
  background-color: var(--vp-c-bg-mute);
}

.save-button {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand-dark);
}

.save-button:hover {
  background-color: var(--vp-c-brand-dark);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.back-button:hover {
  background-color: var(--vp-c-bg-mute);
}

.menu-button {
  width: 36px;
  height: 36px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.note-sidebar {
  position: fixed;
  top: 0;
  right: -300px;
  width: 300px;
  height: 100vh;
  background-color: var(--vp-c-bg);
  border-left: 1px solid var(--vp-c-divider);
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: right 0.3s ease;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.sidebar-open {
  right: 0;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.sidebar-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--vp-c-text-2);
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-actions {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.action-button {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.sidebar-section h4 {
  margin: 0 0 8px 0;
}

.note-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.note-list li {
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-list li:hover {
  background-color: var(--vp-c-bg-soft);
}

.note-list li small {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.note-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--vp-c-bg);
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.path-input {
  display: flex;
  align-items: center;
}

.path-input span {
  padding: 8px 4px;
  color: var(--vp-c-text-2);
}

.path-input input {
  flex: 1;
  border-radius: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}

.submit-button {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand-dark);
}

.submit-button:hover {
  background-color: var(--vp-c-brand-dark);
}

.sidebar-toggle-button.fixed {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 99;
}

/* 移动端样式 */
.is-mobile .note-toolbar {
  padding: 8px;
}

.is-mobile .note-sidebar {
  width: 85%;
  right: -85%;
}

.is-mobile .note-title {
  font-size: 16px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-mobile button {
  padding: 4px 8px;
  font-size: 12px;
}

.note-manager.editing-mode {
  /* 编辑模式下隐藏原始VitePress顶栏，避免重叠 */
  --vp-nav-height-desktop: 0px;
  --vp-nav-height-mobile: 0px;
  padding-top: 0;
}

.edit-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  position: sticky;
  top: 0;
  z-index: 100;
  height: 56px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.back-button:hover {
  background-color: var(--vp-c-bg-mute);
}

.note-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--vp-c-brand);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-button:hover {
  background-color: var(--vp-c-brand-dark);
}

@media (max-width: 768px) {
  .toolbar-left, .toolbar-right {
    gap: 4px;
  }
  
  .note-content {
    padding: 8px;
  }
}
</style>
