<template>
  <div class="markdown-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button title="粗体" @click="insertFormat('**', '**')">
          <span class="icon">B</span>
        </button>
        <button title="斜体" @click="insertFormat('*', '*')">
          <span class="icon italic">I</span>
        </button>
        <button title="标题" @click="insertHeading">
          <span class="icon">#</span>
        </button>
        <button title="链接" @click="insertLink">
          <span class="icon">🔗</span>
        </button>
        <button title="图片" @click="insertImage">
          <span class="icon">🖼️</span>
        </button>
        <button title="代码块" @click="insertCodeBlock">
          <span class="icon">&lt;/&gt;</span>
        </button>
        <button title="列表" @click="insertList">
          <span class="icon">•</span>
        </button>
        <button title="数学公式" @click="insertMath">
          <span class="icon">∑</span>
        </button>
      </div>
      <div class="toolbar-right">
        <button title="预览" @click="togglePreview">
          <span class="icon">👁️</span>
        </button>
        <button 
          :class="{ 'active': autosaveEnabled }" 
          title="自动保存" 
          @click="toggleAutosave">
          <span class="icon">💾</span>
        </button>
      </div>
    </div>

    <div class="editor-container" :class="{ 'split-view': showPreview && !previewOnly }">
      <!-- 编辑器区域 -->
      <div class="editor-area" v-show="!previewOnly" ref="editorArea"></div>
      
      <!-- 预览区域 -->
      <div class="preview-area" v-if="showPreview" ref="previewArea">
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>
    </div>

    <div class="editor-statusbar">
      <div class="statusbar-left">
        <span v-if="autosaveEnabled">自动保存已启用</span>
        <span v-else>自动保存已禁用</span>
        <span v-if="lastSaved">上次保存: {{ formatTime(lastSaved) }}</span>
      </div>
      <div class="statusbar-right">
        <span>{{ wordCount }}字 | {{ lineCount }}行</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import storageService from '../services/storageService';
import markdownIt from 'markdown-it';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    default: ''
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  autosave: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'change']);

// 状态变量
const editorView = ref(null);
const editorArea = ref(null);
const previewArea = ref(null);
const content = ref(props.modelValue);
const showPreview = ref(false);
const previewOnly = ref(false);
const autosaveEnabled = ref(props.autosave);
const lastSaved = ref(null);
const wordCount = ref(0);
const lineCount = ref(0);
const autosaveTimer = ref(null);
const md = ref(new markdownIt({
  html: true,
  linkify: true,
  typographer: true
}));

// 添加数学公式支持
if (typeof window !== 'undefined') {
  import('markdown-it-mathjax3').then(mathjax => {
    md.value.use(mathjax.default);
  });
}

// 计算渲染后的 Markdown 内容
const renderedContent = computed(() => {
  return md.value.render(content.value || '');
});

// 更新编辑器内容
function updateContent(text) {
  content.value = text;
  emit('update:modelValue', text);
  emit('change', text);
  
  // 更新字数和行数统计
  wordCount.value = text.trim().split(/\s+/).length;
  lineCount.value = text.split('\n').length;
  
  // 如果启用了自动保存，设置定时器
  if (autosaveEnabled.value) {
    if (autosaveTimer.value) {
      clearTimeout(autosaveTimer.value);
    }
    
    autosaveTimer.value = setTimeout(() => {
      saveContent();
    }, 2000); // 2秒后自动保存
  }
}

// 保存内容
async function saveContent() {
  if (!props.path) return;
  
  try {
    // 保存到本地存储
    await storageService.saveDraft(props.path, content.value);
    lastSaved.value = new Date();
    emit('save', content.value);
  } catch (error) {
    console.error('保存内容失败:', error);
  }
}

// 切换预览模式
function togglePreview() {
  if (showPreview.value) {
    if (previewOnly.value) {
      previewOnly.value = false;
    } else {
      showPreview.value = false;
    }
  } else {
    showPreview.value = true;
  }
}

// 切换自动保存
function toggleAutosave() {
  autosaveEnabled.value = !autosaveEnabled.value;
  if (autosaveEnabled.value && content.value) {
    saveContent();
  }
}

// 格式化时间显示
function formatTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60 * 1000) {
    return '刚刚';
  } else if (diff < 3600 * 1000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 24 * 3600 * 1000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleString();
  }
}

// 在光标处插入文本
function insertText(before, after = '') {
  const view = editorView.value;
  if (!view) return;
  
  const selection = view.state.selection.main;
  const selectedText = view.state.sliceDoc(selection.from, selection.to);
  
  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: `${before}${selectedText}${after}`
    },
    selection: { anchor: selection.from + before.length + selectedText.length + after.length }
  });
  
  // 插入后聚焦编辑器
  view.focus();
}

// 工具栏功能
function insertFormat(before, after) {
  insertText(before, after);
}

function insertHeading() {
  insertText('## ');
}

function insertLink() {
  insertText('[', '](url)');
}

function insertImage() {
  insertText('![alt text](', ')');
}

function insertCodeBlock() {
  insertText('```\n', '\n```');
}

function insertList() {
  insertText('- ');
}

function insertMath() {
  insertText('$$\n', '\n$$');
}

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
    
    // 如果编辑器已初始化，更新编辑器内容
    if (editorView.value) {
      const currentValue = editorView.value.state.doc.toString();
      if (currentValue !== newValue) {
        editorView.value.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: newValue
          }
        });
      }
    }
  }
});

// 组件挂载时初始化编辑器
onMounted(async () => {
  // 检查是否有本地草稿
  if (props.path) {
    const draft = await storageService.getDraft(props.path);
    if (draft && draft.content) {
      content.value = draft.content;
      emit('update:modelValue', draft.content);
      lastSaved.value = new Date(draft.lastModified);
    }
  }

  // 创建 CodeMirror 编辑器
  if (editorArea.value) {
    const extensions = [
      history(),
      lineNumbers(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      markdown(),
      oneDark,
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          updateContent(newContent);
        }
      })
    ];

    if (props.readOnly) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const startState = EditorState.create({
      doc: content.value,
      extensions
    });

    editorView.value = new EditorView({
      state: startState,
      parent: editorArea.value
    });
  }
});

// 组件销毁前清理
onBeforeUnmount(() => {
  if (editorView.value) {
    editorView.value.destroy();
  }
  
  if (autosaveTimer.value) {
    clearTimeout(autosaveTimer.value);
  }
  
  // 如果有内容且启用了自动保存，确保在离开前保存一次
  if (content.value && autosaveEnabled.value) {
    saveContent();
  }
});

// 公开方法给父组件
defineExpose({
  focus() {
    if (editorView.value) {
      editorView.value.focus();
    }
  },
  getValue() {
    return content.value;
  },
  saveContent
});
</script>

<style scoped>
.markdown-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  overflow: hidden;
  background-color: var(--vp-c-bg);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.toolbar-left, .toolbar-right {
  display: flex;
  gap: 4px;
}

.editor-toolbar button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.editor-toolbar button:hover {
  background-color: var(--vp-c-bg-mute);
  border-color: var(--vp-c-divider);
}

.editor-toolbar button.active {
  background-color: var(--vp-c-brand-dimm);
  color: var(--vp-c-brand);
}

.icon {
  font-size: 14px;
  font-weight: bold;
}

.icon.italic {
  font-style: italic;
}

.editor-container {
  flex: 1;
  overflow: hidden;
  display: flex;
}

.editor-area, .preview-area {
  flex: 1;
  overflow-y: auto;
  height: 100%;
}

.split-view .editor-area,
.split-view .preview-area {
  width: 50%;
}

.editor-area :deep(.cm-editor) {
  height: 100%;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.preview-area {
  padding: 16px;
  border-left: 1px solid var(--vp-c-divider);
}

.markdown-body {
  line-height: 1.6;
}

.editor-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background-color: var(--vp-c-bg-soft);
  border-top: 1px solid var(--vp-c-divider);
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.statusbar-left, .statusbar-right {
  display: flex;
  gap: 16px;
}

/* 自适应样式 */
@media (max-width: 768px) {
  .split-view .editor-area,
  .split-view .preview-area {
    width: 100%;
  }
  
  .split-view {
    flex-direction: column;
  }
  
  .preview-area {
    border-left: none;
    border-top: 1px solid var(--vp-c-divider);
  }
  
  .editor-toolbar button {
    width: 28px;
    height: 28px;
  }
}
</style>
