<script setup lang="ts">
import { Icon } from '@iconify/vue'

const props = withDefaults(
  defineProps<{
    file: File
    icon?: string
    color?: string
    showRemove?: boolean
  }>(),
  {
    showRemove: true,
  }
)

defineEmits<{
  remove: []
}>()
</script>

<template>
  <div
    class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-md group relative"
    :class="
      color === 'blue' ? 'hover:border-blue-200' : 'hover:border-violet-200'
    "
  >
    <div
      class="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 transition-transform group-hover:scale-110"
      :style="{
        background: `var(--page-accent-light)`,
        color: `var(--page-accent)`,
      }"
    >
      <Icon :icon="icon || 'solar:music-note-bold-duotone'" />
    </div>
    <div class="flex-1 min-w-0 text-left">
      <p
        class="text-sm font-bold text-slate-700 truncate leading-tight mb-1"
        :title="file.name"
      >
        {{ file.name }}
      </p>
      <div class="flex items-center gap-3">
        <span
          class="text-[10px] text-slate-400 font-medium flex items-center gap-1"
        >
          <Icon icon="solar:file-linear" class="text-[11px]" />
          {{ (file.size / 1024 / 1024).toFixed(2) }} MB
        </span>
        <span
          v-if="(file as any).durationText"
          class="text-[10px] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded-md"
          :class="
            color === 'blue'
              ? 'text-blue-500/80 bg-blue-50'
              : 'text-violet-500/80 bg-violet-50'
          "
        >
          <Icon icon="solar:clock-circle-bold" class="text-[11px]" />
          {{ (file as any).durationText }}
        </span>
      </div>
    </div>
    <!-- 优化后的轻量化删除按钮 -->
    <button
      v-if="showRemove !== false"
      class="w-8 h-8 rounded-full border border-rose-100 bg-rose-50 text-rose-500 flex items-center justify-center transition-all hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:scale-110 active:scale-95 shadow-sm ml-auto flex-shrink-0"
      title="移除文件"
      @click.stop="$emit('remove')"
    >
      <Icon icon="solar:trash-bin-trash-bold" class="text-base" />
    </button>
  </div>
</template>
