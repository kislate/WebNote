// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import './style.css'

export default {
  extends: DefaultTheme,
  setup() {
    // 这里可以添加全局设置
  },
  enhanceApp({ app, router, siteData }) {
    // 注册全局组件或进行其他设置
  }
}
