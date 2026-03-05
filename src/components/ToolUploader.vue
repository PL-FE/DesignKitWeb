<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { UploadProps, UploadRawFile } from 'element-plus'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    modelValue: File | null
    /** 空状态大图标 */
    emptyIcon: string
    /** 空状态主提示文字 */
    emptyText: string
    /** 格式/大小提示（可选） */
    hint?: string
    /** el-upload accept 属性 */
    accept?: string
    /** 最大文件大小（MB），默认 2000 */
    maxSizeMb?: number
    /** 自定义额外校验函数，返回 true 通过，返回 string 则为错误信息 */
    onValidate?: (file: UploadRawFile) => boolean | string
    /** 选中状态的文件图标 */
    selectedIcon?: string
    /** 卡片最小高度类 */
    minHeight?: string
    /** 紧凑模式：减少空状态 padding，适合高度受限的场景 */
    compact?: boolean
  }>(),
  {
    maxSizeMb: 2000,
    selectedIcon: 'solar:video-library-bold-duotone',
    minHeight: 'min-h-[300px]',
    compact: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [file: File | null]
}>()

const handleChange: UploadProps['onChange'] = (uploadFile) => {
  if (!uploadFile.raw) return

  // 大小校验
  if (uploadFile.size && uploadFile.size > props.maxSizeMb * 1024 * 1024) {
    ElMessage.warning(`文件过大，请控制在 ${props.maxSizeMb}MB 以内`)
    emit('update:modelValue', null)
    return
  }

  // 自定义扩展校验
  if (props.onValidate) {
    const result = props.onValidate(uploadFile.raw)
    if (result !== true) {
      if (typeof result === 'string') ElMessage.warning(result)
      emit('update:modelValue', null)
      return
    }
  }

  emit('update:modelValue', uploadFile.raw)
}

const handleRemove = () => {
  emit('update:modelValue', null)
}
</script>

<template>
  <el-card
    shadow="hover"
    class="border-slate-200 rounded-2xl uploader-card h-full flex flex-col justify-center"
    :class="minHeight"
  >
    <el-upload
      class="w-full h-full flex flex-col justify-center"
      drag
      action="#"
      :auto-upload="false"
      :show-file-list="false"
      :accept="accept"
      :on-change="handleChange"
    >
      <!-- 空状态 -->
      <div
        v-if="!modelValue"
        class="el-upload__text flex flex-col items-center px-4"
        :class="compact ? 'py-6' : 'py-12 md:py-20'"
      >
        <Icon
          :icon="emptyIcon"
          :class="[
            'mb-3 inline-block opacity-70',
            compact ? 'text-4xl' : 'text-6xl',
          ]"
          style="color: var(--page-accent)"
        />
        <div class="text-base font-bold text-slate-700 mb-1">
          {{ emptyText }}，或<em
            class="not-italic"
            style="color: var(--page-accent)"
            >点击浏览</em
          >
        </div>
        <div v-if="hint" class="text-xs text-slate-400 font-medium mt-1">
          {{ hint }}
        </div>
      </div>

      <!-- 已选状态；通过 #selected slot 可完全自定义 -->
      <div v-else class="w-full h-full relative">
        <slot name="selected" :file="modelValue" :remove="handleRemove">
          <!-- 默认已选展示（横向布局，适用于大多数模块） -->
          <div
            class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 md:p-8 w-full h-full z-10 text-left cursor-default"
          >
            <div
              class="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shadow-sm border flex-shrink-0"
              style="
                background: var(--page-accent-light);
                color: var(--page-accent);
                border-color: var(--page-accent-border);
              "
            >
              <Icon :icon="selectedIcon" />
            </div>
            <div
              class="flex-1 min-w-0 flex flex-col justify-center w-full mt-2 sm:mt-0"
            >
              <p
                class="font-bold text-slate-800 text-lg truncate w-full"
                :title="modelValue.name"
              >
                {{ modelValue.name }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <el-tag
                  size="small"
                  type="primary"
                  effect="plain"
                  class="!font-bold"
                >
                  {{ (modelValue.size / 1024 / 1024).toFixed(2) }} MB
                </el-tag>
              </div>
            </div>
            <el-button
              type="danger"
              circle
              plain
              size="small"
              class="absolute top-2 right-2 sm:static mt-2 sm:mt-0"
              @click.stop="handleRemove"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </el-button>
          </div>
        </slot>
      </div>
    </el-upload>
  </el-card>
</template>

<style scoped>
.uploader-card {
  --el-card-padding: 1.25rem;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.el-upload) {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  justify-content: center;
}
:deep(.el-upload-dragger) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
