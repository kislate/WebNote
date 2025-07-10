/**
 * 本地存储服务，用于笔记的本地暂存
 */
import localForage from 'localforage';

// 创建一个专门用于笔记的 localForage 实例
const noteStore = localForage.createInstance({
  name: 'web-note-storage',
  storeName: 'notes'
});

// 草稿版本的存储 key 前缀
const DRAFT_PREFIX = 'draft_';

export default {
  /**
   * 保存笔记草稿
   * @param {string} path 笔记路径
   * @param {string} content 笔记内容
   * @param {Object} metadata 元数据(如最后编辑时间等)
   */
  async saveDraft(path, content, metadata = {}) {
    try {
      const key = `${DRAFT_PREFIX}${path}`;
      const draft = {
        content,
        lastModified: new Date().toISOString(),
        ...metadata
      };
      
      await noteStore.setItem(key, draft);
      return true;
    } catch (error) {
      console.error('保存草稿失败:', error);
      return false;
    }
  },

  /**
   * 获取笔记草稿
   * @param {string} path 笔记路径
   */
  async getDraft(path) {
    try {
      const key = `${DRAFT_PREFIX}${path}`;
      const draft = await noteStore.getItem(key);
      return draft;
    } catch (error) {
      console.error('获取草稿失败:', error);
      return null;
    }
  },

  /**
   * 删除笔记草稿
   * @param {string} path 笔记路径
   */
  async removeDraft(path) {
    try {
      const key = `${DRAFT_PREFIX}${path}`;
      await noteStore.removeItem(key);
      return true;
    } catch (error) {
      console.error('删除草稿失败:', error);
      return false;
    }
  },

  /**
   * 获取所有保存的草稿
   * @returns {Array} 草稿列表
   */
  async getAllDrafts() {
    try {
      const drafts = [];
      await noteStore.iterate((value, key) => {
        if (key.startsWith(DRAFT_PREFIX)) {
          const path = key.replace(DRAFT_PREFIX, '');
          drafts.push({
            path,
            ...value
          });
        }
      });
      
      // 按最后修改时间排序
      return drafts.sort((a, b) => 
        new Date(b.lastModified) - new Date(a.lastModified)
      );
    } catch (error) {
      console.error('获取所有草稿失败:', error);
      return [];
    }
  },

  /**
   * 保存最近打开的文件列表
   * @param {Array} files 最近打开的文件列表
   */
  async saveRecentFiles(files) {
    try {
      await noteStore.setItem('recentFiles', files);
      return true;
    } catch (error) {
      console.error('保存最近文件列表失败:', error);
      return false;
    }
  },

  /**
   * 获取最近打开的文件列表
   */
  async getRecentFiles() {
    try {
      const files = await noteStore.getItem('recentFiles');
      return files || [];
    } catch (error) {
      console.error('获取最近文件列表失败:', error);
      return [];
    }
  },

  /**
   * 添加一个文件到最近打开列表
   * @param {Object} file 文件信息
   */
  async addToRecentFiles(file) {
    try {
      let recentFiles = await this.getRecentFiles();
      
      // 移除重复项
      recentFiles = recentFiles.filter(f => f.path !== file.path);
      
      // 添加到列表头部
      recentFiles.unshift({
        ...file,
        lastAccessed: new Date().toISOString()
      });
      
      // 限制列表长度为10个
      if (recentFiles.length > 10) {
        recentFiles = recentFiles.slice(0, 10);
      }
      
      await this.saveRecentFiles(recentFiles);
      return true;
    } catch (error) {
      console.error('添加到最近文件列表失败:', error);
      return false;
    }
  }
};
