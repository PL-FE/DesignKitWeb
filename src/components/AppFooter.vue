<template>
  <footer
    class="relative z-10 w-full border-t border-slate-200/80 bg-white/60 backdrop-blur-sm mt-auto"
  >
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
    >
      <!-- 版权 -->
      <p class="text-xs text-slate-400 order-2 sm:order-1">
        © {{ year }}
        <span class="font-semibold text-slate-500">DesignKit</span> ·
        面向设计与工程的在线工具引擎
      </p>
      <!-- 联系方式 -->
      <div class="flex items-center gap-4 order-1 sm:order-2">
        <a
          href="mailto:penglianger@qq.com"
          class="contact-link flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-600 transition-colors"
          title="pengliang"
        >
          <Icon icon="solar:letter-linear" class="text-sm" />
          <span>penglianger@qq.com</span>
        </a>
        <a
          href="https://github.com/PL-FE/DesignKitWeb"
          target="_blank"
          rel="noopener noreferrer"
          class="contact-link flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          title="GitHub 仓库"
        >
          <Icon icon="mdi:github" class="text-base" />
          <span class="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const year = new Date().getFullYear()
</script>

<style scoped>
.contact-link {
  text-decoration: none;
}
</style>
