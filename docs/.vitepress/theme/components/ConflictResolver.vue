<template>
  <div class="conflict-resolver" v-if="isVisible">
    <div class="resolver-overlay" @click="handleCancel"></div>
    <div class="resolver-container">
      <div class="resolver-header">
        <h2>文件冲突</h2>
        <button class="close-button" @click="handleCancel">×</button>
      </div>
      
      <div class="resolver-content">
        <div class="conflict-message">
          <div class="conflict-icon">⚠️</div>
          <div class="conflict-text">
            <p><strong>检测到文件冲突</strong></p>
            <p>远程版本与您的本地版本不同。请选择如何处理：</p>
          </div>
        </div>
        
        <div class="diff-view" v-if="showDiff">
          <div class="diff-header">
            <div class="diff-title">文件差异</div>
            <div class="diff-controls">
              <button 
                class="view-toggle" 
                :class="{ active: diffView === 'split' }" 
                @click="diffView = 'split'"
                title="分割视图"
              >
                分割
              </button>
              <button 
                class="view-toggle" 
                :class="{ active: diffView === 'unified' }" 
                @click="diffView = 'unified'"
                title="统一视图"
              >
                统一
              </button>
            </div>
          </div>
          
          <div class="diff-container" :class="diffView">
            <!-- 分割视图 -->
            <template v-if="diffView === 'split'">
              <div class="diff-panel local">
                <div class="panel-header">本地版本</div>
                <pre class="panel-content"><code v-html="highlightedLocalContent"></code></pre>
              </div>
              <div class="diff-panel remote">
                <div class="panel-header">远程版本</div>
                <pre class="panel-content"><code v-html="highlightedRemoteContent"></code></pre>
              </div>
            </template>
            
            <!-- 统一视图 -->
            <template v-else>
              <div class="diff-unified">
                <pre class="panel-content"><code v-html="unifiedDiff"></code></pre>
              </div>
            </template>
          </div>
        </div>
        
        <div class="resolver-actions">
          <button class="action-button use-local" @click="handleUseLocal">
            使用本地版本
            <span class="button-description">覆盖远程内容，保留您的更改</span>
          </button>
          <button class="action-button use-remote" @click="handleUseRemote">
            使用远程版本
            <span class="button-description">放弃本地更改，使用远程内容</span>
          </button>
          <button class="action-button merge" @click="toggleDiff">
            {{ showDiff ? '隐藏差异' : '查看差异' }}
            <span class="button-description">比较本地与远程版本的差异</span>
          </button>
          <button class="action-button cancel" @click="handleCancel">
            取消
            <span class="button-description">保留本地草稿，稍后再解决冲突</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Diff, createTwoFilesPatch } from 'diff';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  localContent: {
    type: String,
    default: ''
  },
  remoteContent: {
    type: String,
    default: ''
  },
  filePath: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['use-local', 'use-remote', 'cancel']);

// 差异视图状态
const showDiff = ref(false);
const diffView = ref('split'); // split 或 unified

// 切换差异视图
function toggleDiff() {
  showDiff.value = !showDiff.value;
}

// 高亮本地内容
const highlightedLocalContent = computed(() => {
  return highlightContent(props.localContent, props.remoteContent, 'local');
});

// 高亮远程内容
const highlightedRemoteContent = computed(() => {
  return highlightContent(props.localContent, props.remoteContent, 'remote');
});

// 统一差异视图
const unifiedDiff = computed(() => {
  const patch = createTwoFilesPatch(
    '本地版本', 
    '远程版本', 
    props.localContent || '', 
    props.remoteContent || '',
    '', 
    ''
  );
  
  return formatUnifiedDiff(patch);
});

// 高亮差异内容
function highlightContent(localText, remoteText, type) {
  if (!localText || !remoteText) {
    return type === 'local' ? escapeHtml(localText || '') : escapeHtml(remoteText || '');
  }
  
  const diffResult = Diff.diffLines(localText, remoteText);
  let html = '';
  
  diffResult.forEach(part => {
    const value = escapeHtml(part.value);
    
    if (part.added && type === 'remote') {
      html += `<span class="diff-added">${value}</span>`;
    } else if (part.removed && type === 'local') {
      html += `<span class="diff-removed">${value}</span>`;
    } else if (!part.added && !part.removed) {
      html += value;
    }
  });
  
  return html;
}

// 格式化统一差异视图
function formatUnifiedDiff(patch) {
  if (!patch) return '';
  
  return patch
    .split('\n')
    .map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return `<span class="diff-added">${escapeHtml(line)}</span>`;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        return `<span class="diff-removed">${escapeHtml(line)}</span>`;
      } else if (line.startsWith('@@')) {
        return `<span class="diff-info">${escapeHtml(line)}</span>`;
      } else {
        return escapeHtml(line);
      }
    })
    .join('\n');
}

// HTML转义
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 处理选择本地版本
function handleUseLocal() {
  emit('use-local', props.filePath);
}

// 处理选择远程版本
function handleUseRemote() {
  emit('use-remote', props.filePath);
}

// 处理取消
function handleCancel() {
  emit('cancel');
}

// 监听可见性变化，在首次显示时自动展开差异
watch(() => props.isVisible, (newValue) => {
  if (newValue && !showDiff.value) {
    // 有差异时自动展开
    if (props.localContent !== props.remoteContent) {
      showDiff.value = true;
    }
  }
});
</script>

<style>
.conflict-resolver {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resolver-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.resolver-container {
  position: relative;
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  background-color: var(--vp-c-bg);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resolver-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resolver-header h2 {
  margin: 0;
  font-size: 18px;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--vp-c-text-2);
}

.resolver-content {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.conflict-message {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.conflict-icon {
  font-size: 32px;
  margin-right: 16px;
}

.conflict-text p {
  margin: 4px 0;
}

.diff-view {
  margin: 20px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
}

.diff-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.diff-controls {
  display: flex;
}

.view-toggle {
  background: none;
  border: 1px solid var(--vp-c-divider);
  padding: 4px 8px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
}

.view-toggle.active {
  background-color: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
  border-color: var(--vp-c-brand-light);
}

.diff-container {
  display: flex;
  max-height: 400px;
  overflow: auto;
}

.diff-container.split {
  flex-direction: row;
}

.diff-panel {
  flex: 1;
  overflow: auto;
  border-right: 1px solid var(--vp-c-divider);
}

.diff-panel:last-child {
  border-right: none;
}

.panel-header {
  padding: 8px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  font-weight: bold;
  font-size: 14px;
  text-align: center;
}

.panel-content {
  margin: 0;
  padding: 10px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 14px;
  line-height: 1.5;
  font-family: monospace;
  max-height: 350px;
  overflow: auto;
}

.diff-unified .panel-content {
  max-height: none;
}

.diff-added {
  background-color: rgba(80, 200, 120, 0.2);
  color: var(--vp-c-brand-dark);
}

.diff-removed {
  background-color: rgba(255, 100, 100, 0.2);
  color: var(--vp-c-danger);
}

.diff-info {
  color: var(--vp-c-text-2);
  background-color: var(--vp-c-bg-soft);
}

.resolver-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

.action-button {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-button.use-local {
  border-color: var(--vp-c-brand-light);
  background-color: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
}

.action-button.use-remote {
  border-color: var(--vp-c-info-dim);
  background-color: var(--vp-c-info-dimm);
  color: var(--vp-c-info);
}

.action-button.merge {
  border-color: var(--vp-c-warning-dim);
  background-color: var(--vp-c-warning-dimm);
  color: var(--vp-c-warning);
}

.button-description {
  font-size: 12px;
  color: var(--vp-c-text-2);
  margin-top: 4px;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .diff-container.split {
    flex-direction: column;
  }
  
  .diff-panel {
    border-right: none;
    border-bottom: 1px solid var(--vp-c-divider);
  }
  
  .diff-panel:last-child {
    border-bottom: none;
  }
  
  .action-button {
    min-width: 120px;
  }
}
</style>
