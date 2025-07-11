import { DefaultTheme, defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kislate's Note",
  description: "Kislate's web note powered by VitePress",
  base: '/WebNote/', // Ensure the base path matches your GitHub Pages repository name
  
  // 忽略死链接检查，避免构建失败
  ignoreDeadLinks: true,
  
  // 添加数学公式支持 - 使用 markdown-it-mathjax3
  markdown: {
    math: {
      renderer: 'mathjax',
      displayMode: false,
      inlineMathDelimiters: [['$', '$']],
      blockMathDelimiters: [['$$', '$$']],
    },
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '指南', link: '/vitepress-guide' },
      { text: '示例', link: '/markdown-examples' }
    ],
    
    // 启用所有侧边栏分组的折叠功能
    sidebarMenuLabel: '菜单',
    outlineTitle: '本页目录',
    
    // 侧边栏配置
    sidebar: ([
      {
        text: '指南',
        collapsed: false,
        collapsible: true,
        items: [
          { text: 'VitePress 指南', link: '/vitepress-guide' },
          { text: '在线编辑指南', link: '/online-editing-guide' },
          { text: '数学公式', link: '/math-formulas' },
          { text: '测试笔记', link: '/test-note' }
        ]
      },
      {
        text: '示例',
        collapsed: false,
        collapsible: true,
        items: [
          { text: 'Markdown 示例', link: '/markdown-examples' },
          { text: 'API 示例', link: '/api-examples' }
        ]
      },
      {
        text: '笔记',
        collapsed: false,
        collapsible: true,
        items: []
      }
    ] as unknown) as DefaultTheme.Sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kislate/WebNote' }
    ]
  }
})
