<script setup lang="ts">
import PageHeader from './PageHeader.vue'

withDefaults(
  defineProps<{
    title: string
    description: string
    icon: string
    gradient: string
    /** 左侧列宽，默认 14（el-col :lg） */
    leftSpan?: number
    /** 右侧列宽，默认 10（el-col :lg） */
    rightSpan?: number
  }>(),
  {
    leftSpan: 14,
    rightSpan: 10,
  }
)
</script>

<template>
  <div
    class="px-4 py-6 md:py-10 mx-auto max-w-6xl w-full box-border overflow-x-hidden animate-fade-in"
  >
    <!-- 标题区（PageHeader 已有组件） -->
    <PageHeader
      :title="title"
      :description="description"
      :icon="icon"
      :gradient="gradient"
    />

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
</style>
