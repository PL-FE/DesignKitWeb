<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { convertVideo } from '@/api/video'
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const videoStore = useVideoStore()
const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)

const formatOptions = [
  { label: 'MP4 视频 (推荐)', value: 'mp4' },
  { label: 'MOV 视频 (Apple设备)', value: 'mov' },
  { label: 'MKV 视频 (高画质)', value: 'mkv' },
  { label: 'AVI 视频', value: 'avi' },
  { label: 'FLV 视频 (网络推流)', value: 'flv' },
  { label: 'WebM 视频 (网页使用)', value: 'webm' },
  { label: 'MP3 音频 (提取声音)', value: 'mp3' },
  { label: 'AAC 音频', value: 'aac' },
  { label: 'WAV 音频 (无损)', value: 'wav' },
]

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
  if (!selectedFile.value) return
  isProcessing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('target_format', videoStore.preferredFormat)
    const blob = await convertVideo(formData)
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    handleDownload(blob, `${baseName}_converted.${videoStore.preferredFormat}`)
    selectedFile.value = null
  } catch (err) {
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <ToolPageLayout
    title="视频格式转换"
    description="转格式、修兼容性，或者把音轨单独提取出来"
    icon="solar:video-frame-replace-bold-duotone"
    color="cyan"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFile"
        empty-icon="solar:video-library-bold-duotone"
        empty-text="拖拽视频/音频文件"
        hint="支持 MP4 · MOV · MKV · AVI · FLV · WebM · MP3 · AAC · WAV 等 · 最大 2GB"
        accept="video/*,audio/*,.mkv,.flv,.ts,.m2ts,.rmvb"
        selected-icon="solar:video-frame-play-horizontal-bold-duotone"
      />
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="导出参数设定"
        card-title-icon="solar:settings-bold-duotone"
      >
        <el-form label-position="top" class="flex-1 flex flex-col">
          <el-form-item label="选择需要转出的目标格式" class="mb-6">
            <el-select
              v-model="videoStore.preferredFormat"
              placeholder="请选择"
              size="large"
              class="w-full"
            >
              <el-option
                v-for="opt in formatOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              >
                <span style="float: left">{{ opt.label }}</span>
                <span
                  style="
                    float: right;
                    color: var(--el-text-color-secondary);
                    font-size: 13px;
                  "
                  >{{ opt.value.toUpperCase() }}</span
                >
              </el-option>
            </el-select>
          </el-form-item>

          <div
            class="p-3 rounded-xl border mb-auto"
            style="
              background: var(--page-accent-light);
              border-color: var(--page-accent-border);
            "
          >
            <p
              class="text-xs leading-relaxed font-medium"
              style="color: var(--page-accent-text, var(--page-accent))"
            >
              <Icon
                icon="solar:info-circle-bold"
                class="inline relative -top-[1px] mr-1"
                style="color: var(--page-accent)"
              />
              转换完成后自动下载。支持一键将视频分离为纯净 MP3 音频。
            </p>
          </div>
        </el-form>

        <template #action>
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :class="!isProcessing && selectedFile ? 'shadow-lg' : ''"
            :style="
              !isProcessing && selectedFile
                ? 'box-shadow: 0 10px 15px -3px var(--page-shadow, rgba(0,0,0,0.1))'
                : ''
            "
            :disabled="!selectedFile || isProcessing"
            :loading="isProcessing"
            @click="handleAction"
          >
            <template #icon>
              <Icon
                v-if="!isProcessing"
                icon="solar:rocket-bold-duotone"
                class="text-xl"
              />
            </template>
            {{ isProcessing ? '转换中...' : '开始转换' }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>
