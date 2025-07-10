<template>
  <div class="custom-layout">
    <!-- 侧边栏隐藏时显示的固定按钮 -->
    <button 
      v-if="!isHomePage && !isMobile && !sidebarVisible" 
      class="sidebar-toggle-button fixed" 
      @click="toggleSidebar" 
      title="显示侧边栏">
      <div class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </button>
    
    <!-- 使用 NoteApp 包装 Layout -->
    <note-app>
      <Layout>
        <!-- 在导航栏添加编辑按钮和GitHub用户菜单 -->
        <template #nav-bar-content-after>
          <div class="nav-bar-custom-content">
            <nav-bar-edit />
            <github-user-menu />
          </div>
        </template>
        
        <template #sidebar-nav-before>
          <!-- 侧边栏顶部操作栏 -->
          <sidebar-actions-bar v-if="!isHomePage" />
        </template>
        
        <template #sidebar-nav>
          <!-- 使用增强版侧边栏代替原版侧边栏 -->
          <enhanced-sidebar :original-items="originalSidebar" />
        </template>
        
        <template #sidebar-nav-after>
          <!-- 在侧边栏导航后插入按钮，显示在侧边栏底部 -->
          <button 
            v-if="!isHomePage && !isMobile && sidebarVisible" 
            class="sidebar-toggle-button" 
            @click="toggleSidebar" 
            title="隐藏侧边栏">
            <div class="hamburger-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </template>
      </Layout>
    </note-app>
  </div>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import NoteApp from './components/NoteApp.vue'
import EnhancedSidebar from './components/EnhancedSidebar.vue'
import NavBarEdit from './components/NavBarEdit.vue'
import GitHubUserMenu from './components/GitHubUserMenu.vue'
import SidebarActionsBar from './components/SidebarActionsBar.vue'
import { ref, onMounted, watchEffect, computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { Layout } = DefaultTheme
const sidebarVisible = ref(true)
const isMobile = ref(false)
const route = useRoute()
const { frontmatter, theme } = useData()

// 保存原始侧边栏配置
const originalSidebar = computed(() => {
  if (!theme.value || !theme.value.sidebar) return []
  return theme.value.sidebar
})

// 判断当前是否是首页
const isHomePage = computed(() => {
  return route.path === '/' || route.path === '/index.html' || frontmatter.value.layout === 'home'
})

// 检查是否为移动设备
function checkMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768
  }
}

// 切换侧边栏显示/隐藏
function toggleSidebar() {
  sidebarVisible.value = !sidebarVisible.value
  
  // 更新CSS变量以实现侧边栏的显示/隐藏
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty(
      '--vp-sidebar-width', 
      sidebarVisible.value ? '272px' : '0px'
    )
    
    document.documentElement.style.setProperty(
      '--vp-sidebar-width-mobile', 
      sidebarVisible.value ? '320px' : '0px'
    )
    
    // 添加/移除一个类用于处理过渡效果
    document.body.classList.toggle('sidebar-hidden', !sidebarVisible.value)
  }
}

// 在移动端时路由变化后自动隐藏侧边栏
watchEffect(() => {
  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    if (route.path && document.body.classList.contains('sidebar-open')) {
      toggleSidebar()
    }
  }
})

// 初始化
onMounted(() => {
  // 检查设备类型
  checkMobile()
  
  // 监听窗口大小变化
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkMobile)
  }
  
  // 恢复保存的侧边栏状态
  if (typeof localStorage !== 'undefined' && localStorage.getItem('sidebar-visible') === 'false') {
    sidebarVisible.value = false
    toggleSidebar()
  }
  
  // 保存侧边栏状态
  watchEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebar-visible', sidebarVisible.value.toString())
    }
  })
})
</script>

<style>
/* 侧边栏隐藏后的样式 */
.sidebar-hidden .VPSidebar {
  transform: translateX(-100%);
  box-shadow: none;
}

/* 侧边栏过渡效果 */
.VPSidebar {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 确保侧边栏的z-index足够高 */
.VPSidebar {
  z-index: 20;
}

/* 汉堡包按钮样式 */
.sidebar-toggle-button {
  position: absolute;
  left: 1rem;
  bottom: 1rem; /* 放在侧边栏底部 */
  z-index: 22; /* 确保按钮在侧边栏内部的元素之上 */
  width: 30px; /* 更小的尺寸 */
  height: 30px;
  padding: 4px;
  border-radius: 4px;
  background: transparent; /* 透明背景 */
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: 0.6;
  margin-bottom: 1rem; /* 确保不遮挡底部内容 */
}

.sidebar-toggle-button:hover {
  opacity: 1;
  transform: scale(1.05);
}

/* 汉堡包图标 */
.hamburger-icon {
  width: 16px; /* 更小的图标 */
  height: 12px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hamburger-icon span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: white; /* 保持白色 */
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.3); /* 轻微阴影让白色更容易看见 */
  transition: all 0.3s ease;
}

/* 固定在页面左下角的按钮，用于显示被隐藏的侧边栏 */
.sidebar-toggle-button.fixed {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 30;
  background-color: rgba(125, 125, 125, 0.1); /* 轻微背景色 */
  padding: 6px;
  border-radius: 4px;
  opacity: 0.5;
}

.sidebar-toggle-button.fixed:hover {
  opacity: 1;
  background-color: rgba(125, 125, 125, 0.2);
}

/* 当鼠标悬停在按钮上时显示提示 */
.sidebar-toggle-button:hover::after {
  position: absolute;
  left: 120%;
  top: 50%;
  transform: translateY(-50%);
  white-space: nowrap;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

/* 固定按钮显示"显示侧边栏"提示 */
.sidebar-toggle-button.fixed:hover::after {
  content: "显示侧边栏";
  opacity: 1;
}

/* 侧边栏内按钮显示"隐藏侧边栏"提示 */
.VPSidebar .sidebar-toggle-button:hover::after {
  content: "隐藏侧边栏";
  opacity: 1;
}

/* 导航栏自定义内容样式 */
.nav-bar-custom-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  /* 在移动端隐藏我们自定义的按钮，使用VitePress自带的菜单按钮 */
  .sidebar-toggle-button {
    display: none !important;
  }
  
  /* 在移动端隐藏侧边栏时，保证内容占据整个宽度 */
  body.sidebar-hidden .VPContent {
    padding-left: 0;
  }
}

/* 适配深色模式和浅色模式 */
.dark .hamburger-icon span {
  background-color: rgba(255, 255, 255, 0.87); /* 深色模式下的颜色 */
}

:root:not(.dark) .hamburger-icon span {
  background-color: rgba(60, 60, 60, 0.9); /* 浅色模式下的颜色 */
  box-shadow: none;
}

/* 确保固定按钮在深浅色模式下都清晰可见 */
.dark .sidebar-toggle-button.fixed {
  background-color: rgba(255, 255, 255, 0.1);
}

.dark .sidebar-toggle-button.fixed:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

:root:not(.dark) .sidebar-toggle-button.fixed {
  background-color: rgba(0, 0, 0, 0.05);
}

:root:not(.dark) .sidebar-toggle-button.fixed:hover {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>