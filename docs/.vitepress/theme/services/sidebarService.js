/**
 * 侧边栏服务
 * 用于动态生成侧边栏配置并与静态配置合并
 */
import githubService from './githubService';
import { useData } from 'vitepress';

export default {
  /**
   * 根据文件列表生成侧边栏配置
   */
  async generateSidebar(files) {
    // 整理文件结构
    const fileTree = {};
    
    for (const file of files) {
      if (!file.path.endsWith('.md')) continue;
      
      // 去掉docs/前缀和.md后缀
      const relativePath = file.path.replace(/^docs\//, '').replace(/\.md$/, '');
      
      // 分割路径
      const pathParts = relativePath.split('/');
      let currentLevel = fileTree;
      
      // 递归构建树
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        
        // 如果是最后一部分，这是文件名
        if (i === pathParts.length - 1) {
          if (!currentLevel.files) {
            currentLevel.files = [];
          }
          
          // 添加文件
          currentLevel.files.push({
            text: this.formatTitle(part),
            link: `/${relativePath}`
          });
        } else {
          // 这是一个目录
          if (!currentLevel.dirs) {
            currentLevel.dirs = {};
          }
          
          if (!currentLevel.dirs[part]) {
            currentLevel.dirs[part] = {};
          }
          
          currentLevel = currentLevel.dirs[part];
        }
      }
    }
    
    // 将树结构转换为VitePress侧边栏格式
    return this.treeToSidebar(fileTree);
  },
  
  /**
   * 将文件树转换为侧边栏配置
   */
  treeToSidebar(tree) {
    const sidebar = [];
    
    // 处理目录
    if (tree.dirs) {
      for (const [name, content] of Object.entries(tree.dirs)) {
        const item = {
          text: this.formatTitle(name),
          collapsible: true,
          collapsed: false,
          items: []
        };
        
        // 递归处理子目录
        const children = this.treeToSidebar(content);
        item.items.push(...children);
        
        sidebar.push(item);
      }
    }
    
    // 处理文件
    if (tree.files) {
      sidebar.push(...tree.files);
    }
    
    return sidebar;
  },
  
  /**
   * 格式化标题，将连字符和下划线转为空格，首字母大写
   */
  formatTitle(str) {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  },
  
  /**
   * 从GitHub获取文件列表并生成侧边栏
   */
  async fetchAndGenerateSidebar() {
    try {
      const files = await githubService.getRepoFiles('docs');
      return await this.generateSidebar(files);
    } catch (error) {
      console.error('生成侧边栏失败:', error);
      return [];
    }
  },
  
  /**
   * 将动态侧边栏与静态侧边栏合并
   */
  async mergeSidebars() {
    // 获取VitePress配置的静态侧边栏
    const { theme } = useData();
    const staticSidebar = theme.value.sidebar || [];
    
    // 检查是否已登录GitHub
    const { isAuthenticated } = await githubService.getGitHubCredentials();
    if (!isAuthenticated) return staticSidebar;
    
    try {
      // 生成动态侧边栏
      const dynamicSidebar = await this.fetchAndGenerateSidebar();
      
      // 合并侧边栏
      // 策略：保留静态侧边栏中的所有项，并添加动态侧边栏中的新项
      const mergedSidebar = [...staticSidebar];
      
      // 添加动态项
      for (const dynamicItem of dynamicSidebar) {
        // 检查是否已存在
        const exists = staticSidebar.some(item => {
          if (typeof item.text === 'string' && item.text === dynamicItem.text) {
            return true;
          }
          return false;
        });
        
        if (!exists) {
          mergedSidebar.push(dynamicItem);
        }
      }
      
      return mergedSidebar;
    } catch (error) {
      console.error('合并侧边栏失败:', error);
      return staticSidebar;
    }
  }
};
