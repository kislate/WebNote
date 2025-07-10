// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  setup() {
    // 这里可以添加全局设置
  },
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件或进行其他设置
    if (typeof window !== 'undefined') {
      // 监听窗口大小变化，处理响应式布局
      window.addEventListener('resize', () => {
        const isMobile = window.innerWidth <= 768
        const sidebarHidden = document.body.classList.contains('sidebar-hidden')
        
        if (isMobile && !sidebarHidden) {
          // 移动端默认收起侧边栏
          document.documentElement.style.setProperty('--vp-sidebar-width', '0px')
          document.documentElement.style.setProperty('--vp-sidebar-width-mobile', '0px')
          document.body.classList.add('sidebar-hidden')
        }
      })
      
      // 在页面加载完成后处理侧边栏折叠效果
      window.addEventListener('DOMContentLoaded', () => {
        // 增强侧边栏折叠动画
        const enhanceSidebarFolders = () => {
          setTimeout(() => {
            const sidebarItems = document.querySelectorAll('.VPSidebarItem')
            
            sidebarItems.forEach(item => {
              // 添加一个小的动画延迟
              if (!item.classList.contains('enhanced')) {
                item.classList.add('enhanced')
              }
            })
          }, 100)
        }
        
        enhanceSidebarFolders()
        
        // 路由变化时重新增强侧边栏
        router.onAfterRouteChanged = () => {
          enhanceSidebarFolders()
        }
      })
    }
  }
}
