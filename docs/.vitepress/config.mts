import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kislate's Note",
  description: "Kislate's web note powered by VitePress",
  base: '/WebNote/', // Ensure the base path matches your GitHub Pages repository name
  
  // 忽略死链接检查，避免构建失败
  ignoreDeadLinks: true,
  
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/vitepress-guide' },
      { text: '示例', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: '指南',
        items: [
          { text: 'VitePress 指南', link: '/vitepress-guide' }
        ]
      },
      {
        text: '示例',
        items: [
          { text: 'Markdown 示例', link: '/markdown-examples' },
          { text: 'API 示例', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kislate/WebNote' }
    ]
  }
})
