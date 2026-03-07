<script setup lang="ts">
import { ref } from 'vue'
import { removeVocals } from '@/api/audio'
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'
import { ElMessage } from 'element-plus'

const isProcessing = ref(false)
const selectedFiles = ref<File[]>([]) // 升级为数组
const countdown = ref(0)
const timer = ref<number | null>(null)

const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const audio = new Audio()
    audio.src = URL.createObjectURL(file)
    audio.onloadedmetadata = () => {
      if (typeof audio.src === 'string' && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src)
      }
      resolve(audio.duration)
    }
    audio.onerror = () => resolve(0) // 容错
  })
}

const startCountdown = (totalDuration: number) => {
  countdown.value = Math.ceil(totalDuration / 2)
  if (timer.value) window.clearInterval(timer.value)
  timer.value = window.setInterval(() => {
    if (countdown.value > 1) {
      countdown.value--
    } else {
      if (timer.value) window.clearInterval(timer.value)
    }
  }, 1000)
}

const stopCountdown = () => {
  if (timer.value) {
    window.clearInterval(timer.value)
    timer.value = null
  }
  countdown.value = 0
}

const handleDownload = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

const handleAction = async () => {
  if (selectedFiles.value.length === 0) return
  isProcessing.value = true

  try {
    // 估算总时长
    let totalDuration = 0
    for (const f of selectedFiles.value) {
      totalDuration += await getAudioDuration(f as unknown as File)
    }
    startCountdown(totalDuration)

    const formData = new FormData()
    if (Array.isArray(selectedFiles.value)) {
      selectedFiles.value.forEach((file) => {
        formData.append('files', file as unknown as File) // 确保是 File 类型
      })
    } else if (selectedFiles.value) {
      formData.append('files', selectedFiles.value as unknown as File)
    }

    const response = await removeVocals(formData)

    const isMultiple =
      Array.isArray(selectedFiles.value) && selectedFiles.value.length > 1
    const firstFileName = Array.isArray(selectedFiles.value)
      ? (selectedFiles.value[0] as unknown as File)?.name
      : (selectedFiles.value as unknown as File)?.name

    const fileName = isMultiple
      ? 'accompaniments.zip'
      : `${firstFileName?.split('.')[0] || 'audio'}_accompaniment.wav`

    handleDownload(response, fileName)
    selectedFiles.value = [] // 清空已选列表
    ElMessage.success(
      isMultiple ? '所有音频处理完成并已打包下载' : '处理完成，伴奏已下载'
    )
  } catch (err) {
    console.error(err)
    ElMessage.error('处理失败，可能是文件过大或格式不支持')
  } finally {
    isProcessing.value = false
    stopCountdown()
  }
}
</script>

<template>
  <ToolPageLayout
    title="人声去除 / 伴奏提取"
    description="支持多文件批量处理，智能分离人声与背景音乐"
    icon="solar:music-note-bold-duotone"
    color="violet"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFiles"
        empty-icon="solar:music-note-slider-bold-duotone"
        empty-text="点击或拖拽音频文件（支持多选）"
        hint="您可以一次性上传多首歌曲，我们将排队为您分批处理"
        accept="audio/*"
        multiple
        selected-icon="solar:music-note-bold-duotone"
      />
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="处理说明"
        card-title-icon="solar:info-circle-bold-duotone"
      >
        <div class="space-y-4">
          <div class="p-4 rounded-xl border border-violet-100 bg-violet-50/50">
            <p class="text-sm text-violet-700 font-medium leading-relaxed">
              <Icon icon="solar:stars-bold" class="mr-1 inline-block" />
              我们采用 Meta 开源的 Demucs
              混叠解构模型，能提取目前业界最纯净的伴奏。
            </p>
          </div>

          <ul class="text-xs text-slate-500 space-y-2 px-1">
            <li class="flex items-start gap-2">
              <Icon
                icon="solar:check-circle-bold"
                class="text-emerald-500 mt-0.5"
              />
              <span>支持批量上传，完成后将自动打包成 ZIP 压缩包下载。</span>
            </li>
            <li class="flex items-start gap-2">
              <Icon
                icon="solar:check-circle-bold"
                class="text-emerald-500 mt-0.5"
              />
              <span>处理时长预估为文件总长度的一半（视服务器负载而定）。</span>
            </li>
            <li class="flex items-start gap-2">
              <Icon
                icon="solar:check-circle-bold"
                class="text-emerald-500 mt-0.5"
              />
              <span>建议单次上传不超过 5 个音频以获得最佳体验。</span>
            </li>
          </ul>
        </div>

        <template #action>
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :disabled="selectedFiles.length === 0 || isProcessing"
            :loading="isProcessing"
            @click="handleAction"
          >
            <template #icon>
              <Icon
                v-if="!isProcessing"
                icon="solar:magic-stick-3-bold-duotone"
                class="text-xl"
              />
            </template>
            {{
              isProcessing
                ? `排队处理中... (预计剩余 ${countdown}s)`
                : selectedFiles.length > 1
                ? `开始提取伴奏 (${selectedFiles.length} 个文件)`
                : '开始提取伴奏'
            }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>
