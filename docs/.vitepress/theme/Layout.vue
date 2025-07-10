<template>
  <Layout>
    <template #layout-top>
      <div class="global-theme-switcher" v-if="isHomePage">
        <button @click="triggerThemeSwitch" title="随机切换风格">🔄</button>
      </div>
    </template>
  </Layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'

const { Layout } = DefaultTheme
const route = useRoute()
const isHomePage = ref(false)

// 检查是否为首页
watch(() => route.path, (path) => {
  isHomePage.value = path === '/'
}, { immediate: true })

// 触发切换主题函数
function triggerThemeSwitch() {
  if (typeof window !== 'undefined' && window.switchTheme) {
    window.switchTheme()
  }
}

onMounted(() => {
  isHomePage.value = route.path === '/'
})
</script>

<style>
.global-theme-switcher {
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 100;
}

.global-theme-switcher button {
  background: rgba(100, 108, 255, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.global-theme-switcher button:hover {
  transform: rotate(180deg);
  background: rgba(100, 108, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
