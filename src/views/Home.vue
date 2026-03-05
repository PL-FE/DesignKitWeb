<template>
  <div
    class="max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6 lg:px-8 w-full box-border overflow-hidden"
  >
    <!-- Hero Header -->
    <div class="text-center mb-8 sm:mb-10 animate-fade-in-up">
      <el-tag
        effect="light"
        round
        class="mb-4 !border-slate-200 !text-slate-600 !bg-slate-100 font-semibold tracking-widest px-4"
      >
        All-in-one Toolkit
      </el-tag>
      <h2
        class="text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-3 leading-tight"
      >
        探索
        <span
          class="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-blue-600"
          >DesignKit</span
        >
        的极简体验
      </h2>
      <p
        class="text-slate-500 max-w-2xl mx-auto text-base sm:text-lg font-medium leading-relaxed px-4"
      >
        面向设计与工程领域的现代化超轻量在线工具引擎。
      </p>
    </div>

    <!-- 隐私保障说明 -->
    <div
      class="mb-6 sm:mb-8 privacy-banner rounded-2xl px-6 py-4 animate-fade-in-up flex items-center gap-4"
      style="animation-delay: 100ms"
    >
      <div
        class="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 flex-shrink-0"
      >
        <Icon
          icon="solar:shield-check-bold-duotone"
          class="text-xl text-emerald-600"
        />
      </div>
      <div>
        <p class="text-sm font-bold text-slate-800">
          零隐私风险，服务器不存储任何文件
        </p>
        <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
          所有文件仅在处理期间短暂使用，完成后立即释放或删除，不留存任何副本。
        </p>
      </div>
    </div>

    <!-- Tools Grid -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full z-10 relative"
    >
      <div
        v-for="(tool, index) in tools"
        :key="tool.id"
        class="group relative bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-violet-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4"
        :style="{ animationDelay: `${index * 50}ms` }"
        style="animation: fadeInUp 0.5s ease backwards"
        @click="router.push(tool.route)"
      >
        <div
          class="w-12 h-12 rounded-lg text-white flex items-center justify-center text-2xl shadow-sm bg-gradient-to-br flex-shrink-0"
          :class="tool.color"
        >
          <Icon :icon="tool.icon" />
        </div>

        <div class="flex-1 min-w-0 flex flex-col justify-center">
          <h3
            class="text-base sm:text-lg font-bold text-slate-800 mb-1 tracking-tight truncate group-hover:text-violet-600 transition-colors"
          >
            {{ tool.name }}
          </h3>
          <p
            class="text-slate-500 text-xs sm:text-sm leading-snug font-medium line-clamp-2"
          >
            {{ tool.description }}
          </p>
        </div>

        <div
          class="hidden sm:flex w-8 h-8 rounded-full bg-slate-50 items-center justify-center text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors flex-shrink-0"
        >
          <Icon icon="solar:alt-arrow-right-linear" class="text-lg" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

const router = useRouter()

const tools = [
  {
    id: 'cad-converter',
    name: 'CAD 版本转换',
    description: '无需安装专业软件，在线将 DWG、DXF 文件转换至低版本或其他格式',
    icon: 'solar:document-bold-duotone',
    route: '/cad-converter',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'image-compressor',
    name: '图片压缩',
    description:
      '指定压缩到目标大小，支持格式转换（JPEG / PNG / WebP）及 EXIF 清除',
    icon: 'solar:gallery-minimalistic-bold-duotone',
    route: '/image-compressor',
    color: 'from-violet-500 to-pink-500',
  },
]
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}

.privacy-banner {
  background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%);
  border: 1px solid #bbf7d0;
}
</style>
