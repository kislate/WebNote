<template>
  <div class="note-app">
    <!-- 笔记管理器 - 编辑按钮已移至导航栏 -->
    <note-manager 
      ref="noteManager" 
      v-if="isEditorActive"
      :path="currentPath"
      @exit-editor="deactivateEditor">
      <slot></slot>
    </note-manager>
    
    <!-- 默认内容 -->
    <slot v-else></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useData, useRoute, useRouter } from 'vitepress';
import NoteManager from './NoteManager.vue';

const props = defineProps({
  // 你可以添加任何需要的属性
});

// 状态变量
const isEditorActive = ref(false);
const currentPath = ref('');
const noteManager = ref(null);
const { page } = useData();
const route = useRoute();
const router = useRouter();

// 处理编辑笔记事件
function handleEditNote(event) {
  const path = event.detail || `docs/${page.value.relativePath}`;
  console.log("编辑笔记:", path);
  
  // 显示调试信息
  document.dispatchEvent(new CustomEvent('webnote:debug', { 
    detail: `收到编辑事件: ${path}`,
    bubbles: true 
  }));
  
  // 先激活编辑器
  activateEditor(path);
  
  // 确保编辑器立即加载内容
  if (noteManager.value) {
    console.log("立即调用loadFileContent");
    document.dispatchEvent(new CustomEvent('webnote:debug', { 
      detail: `NoteManager已准备好，开始加载内容...`,
      bubbles: true 
    }));
    
    // 直接同步调用，不使用延时
    noteManager.value.loadFileContent(path);
  } else {
    console.warn("无法获取noteManager引用");
    document.dispatchEvent(new CustomEvent('webnote:debug', { 
      detail: `警告: 无法获取noteManager引用，尝试延迟加载...`,
      bubbles: true 
    }));
    
    // 确保在组件挂载后仍然能访问
    setTimeout(() => {
      if (noteManager.value) {
        document.dispatchEvent(new CustomEvent('webnote:debug', { 
          detail: `延迟后NoteManager已就绪，开始加载内容...`,
          bubbles: true 
        }));
        noteManager.value.loadFileContent(path);
      } else {
        document.dispatchEvent(new CustomEvent('webnote:debug', { 
          detail: `错误: 延迟后仍无法获取noteManager引用`,
          bubbles: true 
        }));
      }
    }, 500); // 延长等待时间
  }
}

// 处理创建笔记事件
function handleCreateNote() {
  // 显示调试信息
  document.dispatchEvent(new CustomEvent('webnote:debug', { 
    detail: `收到创建笔记事件`,
    bubbles: true 
  }));
  
  // 笔记管理器将处理创建笔记的逻辑
  activateEditor('');
  
  // 立即调用创建笔记方法
  if (noteManager.value) {
    document.dispatchEvent(new CustomEvent('webnote:debug', { 
      detail: `NoteManager已准备好，准备创建笔记...`,
      bubbles: true 
    }));
    
    setTimeout(() => {
      noteManager.value.createNewNote();
    }, 50);
  } else {
    document.dispatchEvent(new CustomEvent('webnote:debug', { 
      detail: `警告: 无法获取noteManager引用`,
      bubbles: true 
    }));
  }
}

// 激活编辑器
function activateEditor(path) {
  // 记住当前路径，以便退出时能返回
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('webnote_previous_path', route.path);
  }
  
  currentPath.value = path;
  isEditorActive.value = true;
  
  // 添加查询参数，表示当前在编辑模式
  if (typeof window !== 'undefined') {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('edit', 'true');
    window.history.pushState({}, '', newUrl.toString());
  }
}

// 停用编辑器，返回正常浏览模式
function deactivateEditor(savedPath = null) {
  isEditorActive.value = false;
  
  // 如果保存了文档，跳转到该文档页面
  if (savedPath) {
    // 将文档路径转换为 VitePress 路由路径
    const routePath = savedPath.replace(/^docs\//, '/').replace(/\.md$/, '');
    // 延迟跳转，确保编辑器已完全退出
    setTimeout(() => {
      router.go(routePath);
    }, 100);
    return;
  }
  
  // 恢复之前的URL状态
  if (typeof window !== 'undefined') {
    const previousPath = sessionStorage.getItem('webnote_previous_path');
    if (previousPath) {
      // 延迟跳转，确保编辑器已完全退出
      setTimeout(() => {
        router.go(previousPath);
      }, 100);
    } else {
      // 如果没有之前的路径，移除编辑参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('edit');
      window.history.pushState({}, '', newUrl.toString());
    }
  }
}

// 监听路由变化，处理导航逻辑
watch(() => route.path, (newPath, oldPath) => {
  if (isEditorActive.value) {
    // 如果在编辑模式中尝试导航，阻止并提示用户
    if (confirm('您正在编辑中，确定要离开吗？未保存的更改将会丢失。')) {
      deactivateEditor();
    } else {
      // 恢复到之前的路径
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', oldPath);
      }
    }
  }
});

// 组件挂载
onMounted(() => {
  // 监听自定义事件
  document.addEventListener('webnote:edit-note', handleEditNote);
  document.addEventListener('webnote:create-note', handleCreateNote);
  document.addEventListener('webnote:exit-editor', (event) => deactivateEditor(event.detail));
  
  // 监听调试事件
  document.addEventListener('webnote:debug', (event) => {
    console.log('NoteApp 调试信息:', event.detail);
  });
  
  // 发送初始化就绪消息
  document.dispatchEvent(new CustomEvent('webnote:debug', { 
    detail: 'NoteApp 已初始化完成',
    bubbles: true 
  }));
  
  // 检查 URL 参数，如果有 edit=true，则自动进入编辑模式
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('edit') === 'true') {
      document.dispatchEvent(new CustomEvent('webnote:debug', { 
        detail: '检测到编辑参数，自动进入编辑模式',
        bubbles: true 
      }));
      activateEditor(`docs/${page.value.relativePath}`);
    }
  }
});

// 组件销毁前清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('webnote:edit-note', handleEditNote);
  document.removeEventListener('webnote:create-note', handleCreateNote);
  document.removeEventListener('webnote:exit-editor', deactivateEditor);
});
</script>

<style scoped>
.note-app {
  position: relative;
  min-height: 100%;
}
</style>
