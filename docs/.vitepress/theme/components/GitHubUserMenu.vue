<template>
  <div class="github-user-menu" 
    @mouseenter="showMenu = true" 
    @mouseleave="showMenu = false"
    @click="showMenu = !showMenu">
    <!-- GitHub 图标 -->
    <div class="github-icon" tabindex="0">
      <svg height="24" width="24" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
    </div>

    <!-- 下拉菜单 -->
    <div class="dropdown-menu" v-if="showMenu" :class="{ 'is-authenticated': isAuthenticated }">
      <div class="menu-header" v-if="isAuthenticated">
        <div class="user-info">
          <div class="username">{{ githubUsername }}</div>
          <div class="repo">{{ githubRepo }}</div>
        </div>
      </div>

      <div class="menu-items">
        <a v-if="!isAuthenticated" class="menu-item" @click.prevent="showLoginForm = true">
          <span class="item-icon">🔑</span> GitHub 登录
        </a>
        <a v-else class="menu-item" @click.prevent="logout">
          <span class="item-icon">🚪</span> 退出登录
        </a>
        
        <a class="menu-item" :href="repoUrl" target="_blank">
          <span class="item-icon">📂</span> 查看仓库
        </a>

        <a v-if="isAuthenticated" class="menu-item" @click.prevent="syncWithGitHub">
          <span class="item-icon">🔄</span> 同步更改
        </a>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';

// 注入服务
const githubService = inject('githubService');

// 状态变量
const showMenu = ref(false);
const showLoginForm = ref(false);
const isAuthenticated = ref(false);
const githubUsername = ref('');
const githubRepo = ref('');
const githubToken = ref('');

// 仓库 URL
const repoUrl = computed(() => {
  if (githubUsername.value && githubRepo.value) {
    return `https://github.com/${githubUsername.value}/${githubRepo.value}`;
  }
  return '#';
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
    showMenu.value = false;
  } catch (error) {
    console.error('同步失败:', error);
    alert('同步失败，请稍后再试');
  }
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
.github-user-menu {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  cursor: pointer;
  z-index: 101;
}

.github-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2);
  transition: color 0.2s;
  cursor: pointer;
  position: relative;
  z-index: 100;
}

.github-user-menu:hover .github-icon {
  color: var(--vp-c-brand);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 200px;
  background-color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  z-index: 100;
  overflow: hidden;
  margin-top: 4px;
  visibility: visible;
  opacity: 1;
  transition: opacity 0.2s, visibility 0.2s;
}

.menu-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}

.user-info .username {
  font-weight: bold;
  color: var(--vp-c-text-1);
}

.user-info .repo {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.menu-items {
  padding: 8px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: var(--vp-c-bg-soft);
}

.item-icon {
  margin-right: 8px;
  font-size: 14px;
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

/* 暗黑模式适配 */
.dark .github-icon {
  color: var(--vp-c-text-1);
}

/* 响应式适配 */
@media (max-width: 768px) {
  .dropdown-menu {
    width: 250px;
    right: -75px;
  }
  
  .dropdown-menu::after {
    right: 90px;
  }
}
</style>
