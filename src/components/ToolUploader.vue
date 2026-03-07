<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { UploadProps, UploadRawFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import AudioFileCard from './AudioFileCard.vue'

const props = withDefaults(
  defineProps<{
    modelValue: File | File[] | null
    /** 空状态大图标 */
    emptyIcon: string
    /** 空状态主提示文字 */
    emptyText: string
    /** 格式/大小提示（可选） */
    hint?: string
    /** el-upload accept 属性 */
    accept?: string
    /** 是否支持多选 */
    multiple?: boolean
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
    multiple: false,
    maxSizeMb: 2000,
    selectedIcon: 'solar:video-library-bold-duotone',
    minHeight: 'min-h-[300px]',
    compact: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [file: File | File[] | null]
}>()

import { computed } from 'vue'
const isEmpty = computed(() => {
  if (!props.modelValue) return true
  if (Array.isArray(props.modelValue)) return props.modelValue.length === 0
  return false
})

const getAudioDuration = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src)
      const minutes = Math.floor(audio.duration / 60)
      const seconds = Math.floor(audio.duration % 60)
      resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`)
    }
    audio.onerror = () => resolve('未知')
  })
}

const processingQueue = ref<File[]>([])
let processingTimer: number | null = null

const handleChange: UploadProps['onChange'] = async (uploadFile) => {
  if (!uploadFile.raw) return

  // 大小校验
  if (uploadFile.size && uploadFile.size > props.maxSizeMb * 1024 * 1024) {
    ElMessage.warning(`文件过大，请控制在 ${props.maxSizeMb}MB 以内`)
    return
  }

  // 自定义扩展校验
  if (props.onValidate) {
    const result = props.onValidate(uploadFile.raw)
    if (result !== true) {
      if (typeof result === 'string') ElMessage.warning(result)
      return
    }
  }

  // 获取时长并注入 raw 对象
  const duration = await getAudioDuration(uploadFile.raw)
  ;(uploadFile.raw as any).durationText = duration

  if (props.multiple) {
    // 关键修复：批量选择时 on-change 会并行触发。
    // 使用缓冲队列并在处理完毕后通过 emit 一次性更新，避免竞态导致的状态覆盖。
    processingQueue.value.push(uploadFile.raw)

    if (processingTimer) window.clearTimeout(processingTimer)
    processingTimer = window.setTimeout(() => {
      const currentFiles = Array.isArray(props.modelValue)
        ? [...props.modelValue]
        : []
      emit('update:modelValue', [...currentFiles, ...processingQueue.value])
      processingQueue.value = []
      processingTimer = null
    }, 100)
  } else {
    emit('update:modelValue', uploadFile.raw)
  }
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
      :multiple="multiple"
      :on-change="handleChange"
    >
      <!-- 空状态 -->
      <div
        v-if="isEmpty"
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
          <!-- 默认已选展示（横向布局，单选模式） -->
          <div
            v-if="!multiple && !Array.isArray(modelValue) && modelValue"
            class="p-6 md:p-8"
          >
            <AudioFileCard
              :file="(modelValue as File)"
              :icon="selectedIcon"
              @remove="handleRemove"
            />
          </div>

          <!-- 多文件简单列表展示 -->
          <div
            v-else
            class="flex flex-col gap-3 p-4 w-full h-full z-10 overflow-y-auto max-h-[400px]"
          >
            <AudioFileCard
              v-for="(f, idx) in Array.isArray(modelValue)
                ? modelValue
                : [modelValue]"
              :key="idx"
              :file="(f as File)"
              :icon="selectedIcon"
              @remove="
                () => {
                  if (Array.isArray(modelValue)) {
                    const newFiles = [...modelValue]
                    newFiles.splice(idx, 1)
                    emit('update:modelValue', newFiles)
                  } else {
                    emit('update:modelValue', null)
                  }
                }
              "
            />
            <div class="text-center pt-2">
              <el-button
                type="primary"
                link
                size="small"
                @click.stop="handleRemove"
              >
                清空全部重新上传
              </el-button>
            </div>
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
