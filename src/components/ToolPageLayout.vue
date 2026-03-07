<script setup lang="ts">
import PageHeader from './PageHeader.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    icon: string
    gradient?: string
    /** 页面主题色 */
    color?:
      | 'cyan'
      | 'orange'
      | 'pink'
      | 'violet'
      | 'blue'
      | 'green'
      | 'amber'
      | 'fuchsia'
      | 'emerald'
    /** 左侧列宽，默认 14（el-col :lg） */
    leftSpan?: number
    /** 右侧列宽，默认 10（el-col :lg） */
    rightSpan?: number
  }>(),
  {
    leftSpan: 14,
    rightSpan: 10,
    color: 'blue',
  }
)
</script>

<template>
  <div
    class="page-theme-wrap px-4 py-6 md:py-10 mx-auto max-w-6xl w-full box-border overflow-x-hidden animate-fade-in"
    :data-color="color"
  >
    <!-- 标题区（PageHeader 已有组件） -->
    <PageHeader
      :title="title"
      :description="description"
      :icon="icon"
      :gradient="gradient"
    />

    <!-- 全局横向插入槽 -->
    <slot name="top-panel" />

    <!-- 左右双栏布局 -->
    <el-row :gutter="24">
      <!-- 左侧：上传区 -->
      <el-col :xs="24" :lg="leftSpan" class="mb-6 lg:mb-0">
        <slot name="upload" />
      </el-col>

      <!-- 右侧：功能面板 -->
      <el-col :xs="24" :lg="rightSpan">
        <slot name="panel" />
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 
  主题色配置
  在这里定义 Element Plus 的 primary 变量，子组件会自动跟随。
  此外还定义一套用于自定义样式的变量 (如 --page-accent, --page-accent-light 等)
*/

.page-theme-wrap[data-color='cyan'] {
  --el-color-primary: #0ea5e9;
  --el-color-primary-light-3: #38bdf8;
  --el-color-primary-light-5: #7dd3fc;
  --el-color-primary-light-7: #bae6fd;
  --el-color-primary-light-9: #e0f2fe;
  --el-color-primary-dark-2: #0284c7;

  --page-accent: #0ea5e9;
  --page-accent-light: #ecfeff;
  --page-accent-border: #cffafe;
}

.page-theme-wrap[data-color='orange'] {
  --el-color-primary: #f97316;
  --el-color-primary-light-3: #fb923c;
  --el-color-primary-light-5: #fdba74;
  --el-color-primary-light-7: #fed7aa;
  --el-color-primary-light-9: #ffedd5;
  --el-color-primary-dark-2: #ea580c;

  --page-accent: #f97316;
  --page-accent-light: #fff7ed;
  --page-accent-border: #ffedd5;
}

.page-theme-wrap[data-color='pink'] {
  --el-color-primary: #ec4899;
  --el-color-primary-light-3: #f472b6;
  --el-color-primary-light-5: #f9a8d4;
  --el-color-primary-light-7: #fbcfe8;
  --el-color-primary-light-9: #fce7f3;
  --el-color-primary-dark-2: #db2777;

  --page-accent: #ec4899;
  --page-accent-light: #fdf2f8;
  --page-accent-border: #fce7f3;
}

.page-theme-wrap[data-color='violet'] {
  --el-color-primary: #8b5cf6;
  --el-color-primary-light-3: #a78bfa;
  --el-color-primary-light-5: #c4b5fd;
  --el-color-primary-light-7: #ddd6fe;
  --el-color-primary-light-9: #ede9fe;
  --el-color-primary-dark-2: #7c3aed;

  --page-accent: #8b5cf6;
  --page-accent-light: #f5f3ff;
  --page-accent-border: #ede9fe;
}

.page-theme-wrap[data-color='blue'] {
  --el-color-primary: #3b82f6;
  --el-color-primary-light-3: #60a5fa;
  --el-color-primary-light-5: #93c5fd;
  --el-color-primary-light-7: #bfdbfe;
  --el-color-primary-light-9: #eff6ff;
  --el-color-primary-dark-2: #2563eb;

  --page-accent: #3b82f6;
  --page-accent-light: #eff6ff;
  --page-accent-border: #dbeafe;
}

.page-theme-wrap[data-color='green'] {
  --el-color-primary: #22c55e;
  --el-color-primary-light-3: #4ade80;
  --el-color-primary-light-5: #86efac;
  --el-color-primary-light-7: #bbf7d0;
  --el-color-primary-light-9: #dcfce7;
  --el-color-primary-dark-2: #16a34a;

  --page-accent: #22c55e;
  --page-accent-light: #f0fdf4;
  --page-accent-border: #dcfce7;
}

.page-theme-wrap[data-color='amber'] {
  --el-color-primary: #f59e0b;
  --el-color-primary-light-3: #fbbf24;
  --el-color-primary-light-5: #fcd34d;
  --el-color-primary-light-7: #fde68a;
  --el-color-primary-light-9: #fef3c7;
  --el-color-primary-dark-2: #d97706;

  --page-accent: #f59e0b;
  --page-accent-light: #fffbeb;
  --page-accent-border: #fef3c7;
}

.page-theme-wrap[data-color='fuchsia'] {
  --el-color-primary: #d946ef;
  --el-color-primary-light-3: #e879f9;
  --el-color-primary-light-5: #f0abfc;
  --el-color-primary-light-7: #f5d0fe;
  --el-color-primary-light-9: #fae8ff;
  --el-color-primary-dark-2: #c026d3;

  --page-accent: #d946ef;
  --page-accent-light: #fdf4ff;
  --page-accent-border: #fae8ff;
}

.page-theme-wrap[data-color='emerald'] {
  --el-color-primary: #10b981;
  --el-color-primary-light-3: #34d399;
  --el-color-primary-light-5: #6ee7b7;
  --el-color-primary-light-7: #a7f3d0;
  --el-color-primary-light-9: #ecfdf5;
  --el-color-primary-dark-2: #059669;

  --page-accent: #10b981;
  --page-accent-light: #f0fdf4;
  --page-accent-border: #d1fae5;
}
</style>
