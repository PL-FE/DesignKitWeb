<script setup lang="ts">
import { Icon } from '@iconify/vue'

withDefaults(
  defineProps<{
    /** 右侧卡片标题文字 */
    cardTitle: string
    /** 标题图标 */
    cardTitleIcon: string
  }>(),
  {}
)
</script>

<template>
  <el-card
    shadow="hover"
    class="border-slate-200 rounded-2xl settings-card h-full flex flex-col"
  >
    <template #header>
      <div class="flex items-center gap-2 font-bold text-slate-800">
        <Icon
          :icon="cardTitleIcon"
          class="text-lg"
          style="color: var(--page-accent)"
        />
        {{ cardTitle }}
      </div>
    </template>

    <!-- 设置内容区 -->
    <div class="flex-1 flex flex-col">
      <slot />
    </div>

    <!-- 底部按钮区（有 action slot 才渲染） -->
    <div
      v-if="$slots.action"
      class="mt-auto pt-6 flex flex-col gap-3 justify-end"
    >
      <slot name="action" />
    </div>
  </el-card>
</template>

<style scoped>
.settings-card {
  --el-card-padding: 1.25rem;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
