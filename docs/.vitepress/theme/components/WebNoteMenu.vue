<template>
  <div class="webnote-menu">
    <!-- 汉堡按钮 -->
    <button class="menu-toggle" @click="toggleMenu" title="WebNote菜单">
      <div class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
    
    <!-- 下拉菜单 -->
    <div v-if="isMenuOpen" class="menu-dropdown">
      <!-- 登录/用户信息 -->
      <div class="menu-header">
        <div v-if="!isAuthenticated">
          <h4>未登录</h4>
          <p>登录后可同步至GitHub</p>
        </div>
        <div v-else class="user-info">
          <h4>{{ githubUsername }}</h4>
          <p>{{ githubRepo }}</p>
        </div>
      </div>
      
      <!-- 菜单项 -->
      <div class="menu-items">
        <!-- 登录/退出 -->
        <button v-if="!isAuthenticated" class="menu-item" @click="showLoginForm = true">
          <span class="menu-icon">🔑</span> GitHub 登录
        </button>
        <button v-else class="menu-item" @click="logout">
          <span class="menu-icon">🚪</span> 退出登录
        </button>
        
        <!-- 文件操作 - 登录后才显示 -->
        <template v-if="isAuthenticated && !isHomePage">
          <button class="menu-item" @click="createNewFile">
            <span class="menu-icon">📄</span> 新建文件
          </button>
          <button class="menu-item" @click="createNewFolder">
            <span class="menu-icon">📁</span> 新建文件夹
          </button>
        </template>
        
        <!-- 同步 - 登录后才显示 -->
        <button v-if="isAuthenticated" class="menu-item" @click="syncWithGitHub">
          <span class="menu-icon">🔄</span> 同步更改
        </button>
      </div>
    </div>
    
    <!-- GitHub 登录表单 -->
    <div class="modal" v-if="showLoginForm" @click.self="showLoginForm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>GitHub 登录</h3>
          <button class="close-button" @click="showLoginForm = false">×</button>
        </div>
        
        <div class="modal-body">
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
              <button type="submit" class="submit-button">登录</button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- 调试信息窗口 -->
    <div v-if="showDebug" class="debug-panel">
      <div class="debug-header">
        <h4>调试信息</h4>
        <button @click="showDebug = false" class="close-button">×</button>
      </div>
      <div class="debug-content">
        <pre>{{ debugInfo }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue';
import { useData, useRoute } from 'vitepress';

// 注入服务
const githubService = inject('githubService');

// 状态变量
const isMenuOpen = ref(false);
const showLoginForm = ref(false);
const isAuthenticated = ref(false);
const githubUsername = ref('');
const githubRepo = ref('');
const githubToken = ref('');
const showDebug = ref(false);
const debugInfo = ref('');

// 获取当前页面数据
const { page, frontmatter } = useData();
const route = useRoute();

// 判断当前是否是首页
const isHomePage = computed(() => {
  return page.value.relativePath === 'index.md' || 
         frontmatter.value.layout === 'home' ||
         route.path === '/' || 
         route.path === '/index.html';
});

// 切换菜单显示/隐藏
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

// 监听点击事件，如果点击菜单外部，则关闭菜单
onMounted(() => {
  document.addEventListener('click', (event) => {
    const menu = document.querySelector('.webnote-menu');
    if (menu && !menu.contains(event.target)) {
      isMenuOpen.value = false;
    }
  });
});

// 添加调试日志
function addDebugLog(message, data = null) {
  const timestamp = new Date().toLocaleTimeString();
  let logMessage = `[${timestamp}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      logMessage += '\n' + JSON.stringify(data, null, 2);
    } else {
      logMessage += '\n' + data;
    }
  }
  
  debugInfo.value = logMessage + '\n\n' + debugInfo.value;
  console.log(message, data);
}

// 登录方法
async function login() {
  addDebugLog('尝试登录GitHub');
  
  try {
    await githubService.saveGitHubCredentials(
      githubToken.value,
      githubUsername.value,
      githubRepo.value
    );
    
    // 测试连接
    addDebugLog('测试GitHub连接');
    const files = await githubService.getRepoFiles();
    addDebugLog('获取到仓库文件列表', files.length > 0 ? `共${files.length}个文件` : '无文件');
    
    // 登录成功
    isAuthenticated.value = true;
    showLoginForm.value = false;
    
    // 清空令牌（安全起见）
    githubToken.value = '';
    
    addDebugLog('GitHub 登录成功！');
    alert('GitHub 登录成功！');
    
    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('webnote:login-success'));
  } catch (error) {
    addDebugLog('GitHub 登录失败', error.message);
    console.error('GitHub 登录失败:', error);
    alert(`登录失败: ${error.message || '请检查您的凭据'}`);
  }
}

// 退出登录
async function logout() {
  addDebugLog('退出登录');
  
  await githubService.clearGitHubCredentials();
  isAuthenticated.value = false;
  githubUsername.value = '';
  githubRepo.value = '';
  
  addDebugLog('已退出登录');
  alert('已退出登录');
  
  // 触发自定义事件
  document.dispatchEvent(new CustomEvent('webnote:logout'));
  
  // 关闭菜单
  isMenuOpen.value = false;
}

// 创建新文件
function createNewFile() {
  addDebugLog('创建新文件');
  
  // 创建自定义事件并确保它能够冒泡
  const event = new CustomEvent('webnote:create-file', { 
    detail: { 
      parentPath: 'docs',
      debug: true 
    },
    bubbles: true,
    cancelable: true
  });
  
  // 使用window.document确保事件在全局范围内触发
  window.document.dispatchEvent(event);
  
  // 关闭菜单
  isMenuOpen.value = false;
  
  // 显示调试面板
  showDebug.value = true;
}

// 创建新文件夹
function createNewFolder() {
  addDebugLog('创建新文件夹');
  
  // 创建自定义事件并确保它能够冒泡
  const event = new CustomEvent('webnote:create-folder', { 
    detail: { 
      parentPath: 'docs',
      debug: true 
    },
    bubbles: true,
    cancelable: true
  });
  
  // 使用window.document确保事件在全局范围内触发
  window.document.dispatchEvent(event);
  
  // 关闭菜单
  isMenuOpen.value = false;
  
  // 显示调试面板
  showDebug.value = true;
}

// 同步 GitHub
async function syncWithGitHub() {
  addDebugLog('开始同步GitHub');
  
  if (!isAuthenticated.value) {
    alert('请先登录 GitHub');
    return;
  }
  
  try {
    // 创建事件
    const event = new CustomEvent('webnote:sync', {
      detail: { debug: true },
      bubbles: true
    });
    
    // 触发事件
    window.document.dispatchEvent(event);
    
    // 关闭菜单
    isMenuOpen.value = false;
    
    // 显示调试面板
    showDebug.value = true;
    
    addDebugLog('已触发同步事件');
  } catch (error) {
    addDebugLog('同步失败', error.message);
    console.error('同步失败:', error);
    alert('同步失败，请稍后再试');
  }
}

// 初始化
onMounted(async () => {
  addDebugLog('初始化WebNoteMenu');
  
  try {
    // 获取GitHub凭据
    const credentials = await githubService.getGitHubCredentials();
    addDebugLog('获取GitHub凭据', credentials.isAuthenticated ? '已登录' : '未登录');
    
    isAuthenticated.value = credentials.isAuthenticated;
    
    if (isAuthenticated.value) {
      githubUsername.value = credentials.username;
      githubRepo.value = credentials.repo;
      
      // 尝试验证凭据有效性
      try {
        addDebugLog('验证GitHub凭据');
        await githubService.verifyCredentials();
        addDebugLog('GitHub凭据有效');
      } catch (error) {
        addDebugLog('GitHub凭据无效', error.message);
        isAuthenticated.value = false;
        await githubService.clearGitHubCredentials();
        alert('GitHub登录已过期，请重新登录');
      }
    }
  } catch (error) {
    addDebugLog('初始化失败', error.message);
    console.error('初始化失败:', error);
  }
  
  // 监听事件响应
  document.addEventListener('webnote:debug', (event) => {
    if (event.detail) {
      addDebugLog('收到调试事件', event.detail);
      showDebug.value = true;
    }
  });
});
</script>

<style>
.webnote-menu {
  position: relative;
  z-index: 100;
}

/* 汉堡按钮样式 */
.menu-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
}

.menu-toggle:hover {
  background-color: var(--vp-c-bg-soft);
}

.hamburger-icon {
  width: 18px;
  height: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger-icon span {
  display: block;
  height: 2px;
  width: 100%;
  background-color: var(--vp-c-text-1);
  transition: all 0.2s;
  border-radius: 2px;
}

/* 下拉菜单样式 */
.menu-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 240px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 200;
}

/* 菜单头部样式 */
.menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}

.menu-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.menu-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

/* 菜单项样式 */
.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 16px;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--vp-c-text-1);
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: var(--vp-c-bg-soft);
}

.menu-icon {
  margin-right: 8px;
  font-size: 16px;
  line-height: 1;
}

/* 登录表单样式 */
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
  width: 90%;
  max-width: 400px;
  background-color: var(--vp-c-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--vp-c-text-1);
}

.modal-body {
  padding: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
}

.form-group small {
  display: block;
  margin-top: 6px;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.close-button {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.close-button:hover {
  color: var(--vp-c-text-1);
}

.submit-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: var(--vp-c-brand);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover {
  background-color: var(--vp-c-brand-dark);
}

/* 调试面板样式 */
.debug-panel {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 400px;
  max-height: 300px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px 0 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.debug-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: var(--vp-c-brand-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.debug-header h4 {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-brand-dark);
}

.debug-content {
  overflow-y: auto;
  padding: 8px;
  max-height: 250px;
  font-family: monospace;
  font-size: 12px;
}

.debug-content pre {
  margin: 0;
  white-space: pre-wrap;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .menu-dropdown {
    width: 100%;
    right: 0;
  }
  
  .debug-panel {
    width: 100%;
    max-height: 200px;
  }
}
</style>
