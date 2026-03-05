<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  title: string
  description: string
  icon: string
  gradient?: string
}>()
</script>

<template>
  <div class="flex items-center gap-4 mb-8">
    <div
      class="w-12 h-12 rounded-xl shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      :class="gradient ? gradient : 'bg-gradient-to-tr'"
      :style="
        gradient
          ? {}
          : {
              backgroundImage:
                'linear-gradient(to top right, var(--el-color-primary-dark-2), var(--el-color-primary-light-3))',
            }
      "
    >
      <Icon :icon="icon" />
    </div>
    <div class="overflow-hidden">
      <h2
        class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
      >
        {{ title }}
      </h2>
      <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
        {{ description }}
      </p>
    </div>
  </div>
</template>
