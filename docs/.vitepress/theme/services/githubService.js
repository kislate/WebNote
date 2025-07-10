/**
 * GitHub API 服务，用于处理与 GitHub 仓库的交互
 * 这个服务需要 GitHub 个人访问令牌（PAT）才能工作
 */
import { Octokit } from '@octokit/rest';
import localForage from 'localforage';

// GitHub API 存储相关信息
const GITHUB_TOKEN_KEY = 'github_token';
const GITHUB_USERNAME_KEY = 'github_username';
const GITHUB_REPO_KEY = 'github_repo';
const LAST_SYNC_KEY = 'last_github_sync';

// 创建本地存储实例用于保存 GitHub 认证信息
const authStore = localForage.createInstance({
  name: 'github-auth'
});

export default {
  /**
   * 获取已保存的 GitHub 凭据
   */
  async getGitHubCredentials() {
    try {
      const token = await authStore.getItem(GITHUB_TOKEN_KEY);
      const username = await authStore.getItem(GITHUB_USERNAME_KEY);
      const repo = await authStore.getItem(GITHUB_REPO_KEY);
      
      return {
        token,
        username,
        repo,
        isAuthenticated: !!token && !!username && !!repo
      };
    } catch (error) {
      console.error('获取 GitHub 凭据失败:', error);
      return { isAuthenticated: false };
    }
  },

  /**
   * 保存 GitHub 凭据
   */
  async saveGitHubCredentials(token, username, repo) {
    try {
      await authStore.setItem(GITHUB_TOKEN_KEY, token);
      await authStore.setItem(GITHUB_USERNAME_KEY, username);
      await authStore.setItem(GITHUB_REPO_KEY, repo);
      return true;
    } catch (error) {
      console.error('保存 GitHub 凭据失败:', error);
      return false;
    }
  },

  /**
   * 清除 GitHub 凭据（登出）
   */
  async clearGitHubCredentials() {
    try {
      await authStore.removeItem(GITHUB_TOKEN_KEY);
      await authStore.removeItem(GITHUB_USERNAME_KEY);
      await authStore.removeItem(GITHUB_REPO_KEY);
      return true;
    } catch (error) {
      console.error('清除 GitHub 凭据失败:', error);
      return false;
    }
  },

  /**
   * 获取 Octokit 实例用于 GitHub API 请求
   */
  async getOctokit() {
    const { token, isAuthenticated } = await this.getGitHubCredentials();
    
    if (!isAuthenticated) {
      throw new Error('未登录 GitHub，请先提供有效的访问令牌');
    }
    
    return new Octokit({ auth: token });
  },

  /**
   * 获取仓库文件列表
   */
  async getRepoFiles(path = 'docs') {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      
      const response = await octokit.repos.getContent({
        owner: username,
        repo: repo,
        path: path
      });
      
      return response.data;
    } catch (error) {
      console.error('获取仓库文件列表失败:', error);
      throw error;
    }
  },

  /**
   * 获取文件内容
   */
  async getFileContent(path) {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      
      const response = await octokit.repos.getContent({
        owner: username,
        repo: repo,
        path: path
      });
      
      // GitHub API 返回 base64 编码的内容
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      
      return {
        content,
        sha: response.data.sha, // 保存 SHA 用于后续更新
      };
    } catch (error) {
      console.error('获取文件内容失败:', error);
      throw error;
    }
  },

  /**
   * 创建或更新文件
   */
  async createOrUpdateFile(path, content, commitMessage, sha = null) {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      
      const requestParams = {
        owner: username,
        repo: repo,
        path: path,
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
      };
      
      // 如果有 SHA，说明是更新操作
      if (sha) {
        requestParams.sha = sha;
      }
      
      const response = await octokit.repos.createOrUpdateFileContents(requestParams);
      return response.data;
    } catch (error) {
      console.error('创建或更新文件失败:', error);
      throw error;
    }
  },

  /**
   * 删除文件
   */
  async deleteFile(path, commitMessage) {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      
      // 先获取文件的当前 SHA
      const { sha } = await this.getFileContent(path);
      
      const response = await octokit.repos.deleteFile({
        owner: username,
        repo: repo,
        path: path,
        message: commitMessage,
        sha: sha,
      });
      
      return response.data;
    } catch (error) {
      console.error('删除文件失败:', error);
      throw error;
    }
  },

  /**
   * 创建新文件夹
   * GitHub 不直接支持创建空文件夹，所以我们创建一个 .gitkeep 文件来标识文件夹
   */
  async createFolder(folderPath, commitMessage = '创建新文件夹') {
    const keepFilePath = folderPath.endsWith('/') 
      ? `${folderPath}.gitkeep` 
      : `${folderPath}/.gitkeep`;
      
    try {
      return await this.createOrUpdateFile(keepFilePath, '', commitMessage);
    } catch (error) {
      console.error('创建文件夹失败:', error);
      throw error;
    }
  },

  /**
   * 获取最后同步时间
   */
  async getLastSyncTime() {
    try {
      return await authStore.getItem(LAST_SYNC_KEY) || null;
    } catch (error) {
      console.error('获取同步时间失败:', error);
      return null;
    }
  },

  /**
   * 更新最后同步时间
   */
  async updateLastSyncTime() {
    try {
      const now = new Date().toISOString();
      await authStore.setItem(LAST_SYNC_KEY, now);
      return now;
    } catch (error) {
      console.error('更新同步时间失败:', error);
      return null;
    }
  },

  /**
   * 检查文件是否有远程更新（比对SHA）
   * @param {string} path 文件路径
   * @param {string} localSha 本地SHA值
   * @returns {boolean} 如果有更新返回true
   */
  async checkFileUpdated(path, localSha) {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      
      // 获取远程文件的最新SHA
      const response = await octokit.repos.getContent({
        owner: username,
        repo: repo,
        path: path
      });
      
      const remoteSha = response.data.sha;
      
      // 比较SHA，如果不同则表示文件已更新
      return remoteSha !== localSha;
    } catch (error) {
      // 如果文件不存在，则认为没有更新
      if (error.status === 404) {
        return false;
      }
      console.error('检查文件更新失败:', error);
      throw error;
    }
  },

  /**
   * 拉取远程仓库的最新变更
   * @returns {Array} 更改的文件列表
   */
  async pullLatestChanges() {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      const lastSync = await this.getLastSyncTime();
      
      // 如果没有上次同步记录，默认获取最近10条提交
      const since = lastSync || undefined;
      
      // 获取最近的提交
      const commits = await octokit.repos.listCommits({
        owner: username,
        repo: repo,
        since,
        per_page: 10
      });
      
      // 收集所有更改的文件
      const changedFiles = new Set();
      for (const commit of commits.data) {
        const commitDetails = await octokit.repos.getCommit({
          owner: username,
          repo: repo,
          ref: commit.sha
        });
        
        for (const file of commitDetails.data.files || []) {
          changedFiles.add(file.filename);
        }
      }
      
      // 更新同步时间
      await this.updateLastSyncTime();
      
      return Array.from(changedFiles);
    } catch (error) {
      console.error('拉取最新变更失败:', error);
      throw error;
    }
  },

  /**
   * 检查运行环境
   * 判断当前是否运行在开发/预览模式
   * @returns {Object} 包含环境类型、显示名称和是否允许编辑的对象
   */
  checkEnvironment() {
    if (typeof window === 'undefined') {
      return {
        type: 'unknown', 
        name: '未知环境',
        allowEdit: false
      };
    }
    
    // 检查URL中是否包含特定参数或特征
    const url = window.location.href;
    
    if (url.includes('localhost') || url.includes(':3000') || url.includes(':5173')) {
      return {
        type: 'development', 
        name: '开发环境', 
        allowEdit: true, 
        warning: '当前处于开发环境，更改不会自动同步到 GitHub'
      };
    } else if (url.includes(':4173') || url.includes('preview')) {
      return {
        type: 'preview', 
        name: '预览环境', 
        allowEdit: true, 
        warning: '当前处于预览环境，更改不会自动同步到 GitHub'
      };
    } else {
      return {
        type: 'production', 
        name: '生产环境', 
        allowEdit: true, 
        warning: null
      };
    }
  },

  /**
   * 获取远程仓库状态
   * @returns {Promise<Object>} 包含仓库信息和最新提交的对象
   */
  async getRepositoryStatus() {
    try {
      const octokit = await this.getOctokit();
      const { username, repo } = await this.getGitHubCredentials();
      
      // 获取仓库信息
      const repoInfo = await octokit.repos.get({
        owner: username,
        repo: repo
      });
      
      // 获取最新提交
      const commits = await octokit.repos.listCommits({
        owner: username,
        repo: repo,
        per_page: 1
      });
      
      // 获取最新的工作流运行状态（部署状态）
      let workflowRuns = null;
      try {
        workflowRuns = await octokit.actions.listWorkflowRunsForRepo({
          owner: username,
          repo: repo,
          per_page: 1
        });
      } catch (e) {
        console.error('获取工作流状态失败:', e);
      }
      
      return {
        repository: repoInfo.data,
        latestCommit: commits.data[0] || null,
        latestWorkflowRun: workflowRuns?.data?.workflow_runs?.[0] || null,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('获取仓库状态失败:', error);
      throw error;
    }
  },
};
