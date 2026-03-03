<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div
    class="min-h-screen bg-[#F8F9FB] flex flex-col font-sans relative overflow-x-hidden transition-colors selection:bg-violet-500/20 selection:text-violet-700"
  >
    <!-- 全局背景艺术氛围（光晕特效） -->
    <div
      class="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-400/20 rounded-full blur-[120px] pointer-events-none z-0"
    ></div>
    <div
      class="fixed bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-pink-400/20 rounded-full blur-[100px] pointer-events-none z-0"
    ></div>

    <!-- Header 响应式 -->
    <AppHeader />

    <!-- Main View -->
    <main
      class="flex-1 w-full max-w-7xl mx-auto flex flex-col relative z-10 w-full pb-8"
    >
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer -->
    <AppFooter />
  </div>
</template>

<style>
/* 全局基础重置与现代化设置 */
body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: #1e293b;
  -webkit-font-smoothing: antialiased;
  background-color: #f8f9fb;
}

/* 页面切换过渡效果 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 隐藏部分浏览器的滚动条样式并保持优美 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
