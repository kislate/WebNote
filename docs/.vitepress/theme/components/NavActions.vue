<template>
  <div class="nav-actions">
    <!-- 登录按钮或用户信息 -->
    <button v-if="!isAuthenticated" class="nav-action-button login-button" @click="showLoginForm = true" title="GitHub登录">
      登录
    </button>
    <div v-else class="user-info-bar">
      <span class="username">{{ githubUsername }}</span>
      <button class="nav-action-button logout-button" @click="logout" title="退出登录">
        退出
      </button>
    </div>
    
    <!-- 新建文件按钮 -->
    <button class="nav-action-button" @click="createNewFile" title="新建文件" v-if="!isHomePage && isAuthenticated">
      新建文件
    </button>
    
    <!-- 新建文件夹按钮 -->
    <button class="nav-action-button" @click="createNewFolder" title="新建文件夹" v-if="!isHomePage && isAuthenticated">
      新建文件夹
    </button>
    
    <!-- 同步按钮 -->
    <button class="nav-action-button sync-button" @click="syncWithGitHub" title="同步更改" v-if="isAuthenticated">
      同步
    </button>
    
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useData, useRoute } from 'vitepress';

// 注入服务
const githubService = inject('githubService');

// 状态变量
const showLoginForm = ref(false);
const isAuthenticated = ref(false);
const githubUsername = ref('');
const githubRepo = ref('');
const githubToken = ref('');

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

// 登录方法
async function login() {
  try {
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
    
    // 清空令牌（安全起见）
    githubToken.value = '';
    
    alert('GitHub 登录成功！');
    
    // 触发自定义事件
    document.dispatchEvent(new CustomEvent('webnote:login-success'));
  } catch (error) {
    console.error('GitHub 登录失败:', error);
    alert('登录失败，请检查您的凭据');
  }
}

// 退出登录
async function logout() {
  await githubService.clearGitHubCredentials();
  isAuthenticated.value = false;
  githubUsername.value = '';
  githubRepo.value = '';
  
  alert('已退出登录');
  
  // 触发自定义事件
  document.dispatchEvent(new CustomEvent('webnote:logout'));
}

// 同步 GitHub
async function syncWithGitHub() {
  if (!isAuthenticated.value) {
    alert('请先登录 GitHub');
    return;
  }
  
  try {
    // 触发同步事件
    document.dispatchEvent(new CustomEvent('webnote:sync'));
  } catch (error) {
    console.error('同步失败:', error);
    alert('同步失败，请稍后再试');
  }
}

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

// 初始化
onMounted(async () => {
  const credentials = await githubService.getGitHubCredentials();
  isAuthenticated.value = credentials.isAuthenticated;
  
  if (isAuthenticated.value) {
    githubUsername.value = credentials.username;
    githubRepo.value = credentials.repo;
  }
});
</script>

<style>
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-action-button {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

.nav-action-button:hover {
  background-color: var(--vp-c-bg-mute);
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand-soft);
}

.login-button {
  background-color: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-dark);
  border-color: var(--vp-c-brand-soft);
}

.login-button:hover {
  background-color: var(--vp-c-brand);
  color: white;
  border-color: var(--vp-c-brand);
}

/* 模态框样式 */
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
  max-width: 500px;
  background-color: var(--vp-c-bg);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
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
  gap: 12px;
  margin-top: 20px;
}

.cancel-button {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background-color: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  cursor: pointer;
}

.submit-button {
  padding: 6px 14px;
  border: 1px solid var(--vp-c-brand);
  border-radius: 4px;
  background-color: var(--vp-c-brand);
  color: white;
  cursor: pointer;
}

/* 用户信息和操作按钮样式 */
.logout-button {
  background-color: var(--vp-c-danger-soft);
  color: var(--vp-c-danger-dark);
  border-color: var(--vp-c-danger-soft);
  padding: 2px 8px;
  font-size: 12px;
}

.logout-button:hover {
  background-color: var(--vp-c-danger);
  color: white;
  border-color: var(--vp-c-danger);
}

.sync-button {
  background-color: var(--vp-c-green-soft);
  color: var(--vp-c-green-dark);
  border-color: var(--vp-c-green-soft);
}

.sync-button:hover {
  background-color: var(--vp-c-green);
  color: white;
  border-color: var(--vp-c-green);
}

.user-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  background-color: var(--vp-c-bg-soft);
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .nav-actions {
    gap: 4px;
  }
  
  .nav-action-button {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .modal-content {
    width: 95%;
    padding: 16px;
  }
}
</style>
