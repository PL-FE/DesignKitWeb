<script setup lang="ts">
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import BoardLayoutIcon from './BoardLayoutIcon.vue'

const props = defineProps<{
  modelValue: string
  layouts: Array<{ label: string; value: string }>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const dialogVisible = ref(false)

const currentLayout = computed(() => {
  return (
    props.layouts.find((l) => l.value === props.modelValue) ||
    props.layouts[0] || { label: '', value: '' }
  )
})

const selectLayout = (val: string) => {
  emit('update:modelValue', val)
  dialogVisible.value = false
}
</script>

<template>
  <div>
    <!-- 触发器（看起来像下拉框） -->
    <div
      @click="dialogVisible = true"
      class="flex items-center w-full min-h-[40px] px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-400 transition-colors bg-white group select-none"
    >
      <div class="w-[28px] h-[20px] text-emerald-500 flex-shrink-0 mr-3">
        <BoardLayoutIcon :layout="currentLayout.value" />
      </div>
      <span
        class="text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors flex-1"
        >{{ currentLayout.label }}</span
      >
      <Icon
        icon="solar:alt-arrow-down-linear"
        class="text-slate-400 group-hover:text-emerald-500 transition-colors ml-2 flex-shrink-0 text-lg"
      />
    </div>

    <!-- 弹窗部分 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择排版布局"
      width="720px"
      class="rounded-2xl overflow-hidden custom-dialog"
      :show-close="false"
      append-to-body
    >
      <!-- 弹窗标题栏自定义 -->
      <template #header="{ close, titleId, titleClass }">
        <div
          class="flex justify-between items-center pb-3 border-b border-slate-100"
        >
          <h4
            :id="titleId"
            :class="[
              titleClass,
              'm-0 font-bold text-slate-800 text-lg flex items-center gap-2',
            ]"
          >
            <Icon
              icon="solar:gallery-wide-bold-duotone"
              class="text-emerald-500 text-xl"
            />
            选择排版布局
          </h4>
          <!-- 移除所有边框和背景hover，只保留颜色变化以保证纯净视觉 -->
          <button
            @click="close"
            class="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer outline-none border-none bg-transparent"
          >
            <Icon icon="solar:close-circle-bold" class="text-2xl" />
          </button>
        </div>
      </template>

      <!-- 选择列表 - 添加 box-border 解决滚动条挤占宽度带来的布局偏移问题，增加为4列更适合大弹窗 -->
      <div
        class="grid grid-cols-4 gap-5 pt-4 max-h-[65vh] overflow-y-auto custom-scrollbar px-3 pb-4 box-border"
      >
        <div
          v-for="item in layouts"
          :key="item.value"
          @click="selectLayout(item.value)"
          class="relative cursor-pointer group flex flex-col items-center gap-3"
        >
          <!-- 图标容器 -->
          <div
            class="w-full aspect-[4/3] rounded-[14px] border-2 transition-all duration-300 p-3 flex items-center justify-center"
            :class="
              modelValue === item.value
                ? 'border-emerald-500 bg-emerald-50 text-emerald-500 shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-300 hover:border-emerald-300 hover:text-emerald-400 hover:bg-emerald-50/50 hover:shadow-sm hover:-translate-y-0.5'
            "
          >
            <BoardLayoutIcon :layout="item.value" />
          </div>
          <!-- 选中状态指示器 -->
          <transition name="el-zoom-in-center">
            <div
              v-if="modelValue === item.value"
              class="absolute -top-2 -right-2 w-[24px] h-[24px] bg-emerald-500 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm z-10"
            >
              <Icon icon="solar:check-bold" class="text-[12px]" />
            </div>
          </transition>
          <!-- 文字说明 -->
          <span
            class="text-[13px] font-semibold text-center leading-tight transition-colors duration-300"
            :class="
              modelValue === item.value
                ? 'text-emerald-600'
                : 'text-slate-500 group-hover:text-slate-700'
            "
          >
            {{ item.label }}
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}

:deep(.custom-dialog .el-dialog__header) {
  padding-bottom: 0px !important;
  margin-right: 0px !important;
}

:deep(.custom-dialog .el-dialog__body) {
  padding-top: 5px !important;
}
</style>
