<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { makeVideoGif } from '@/api/video'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const videoStore = useVideoStore()
const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)
const startTime = ref('0')
const duration = ref('5')

const formatOptions = [
  { label: 'GIF 动图 (兼容性好)', value: 'gif' },
  { label: 'WebP 动图 (体积小/高清)', value: 'webp' },
  { label: '单张 JPG (提取特定帧做封面)', value: 'jpg' },
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

  if (videoStore.preferredGifFormat !== 'jpg') {
    if (
      !duration.value ||
      isNaN(Number(duration.value)) ||
      Number(duration.value) <= 0
    ) {
      ElMessage.warning('动图持续时长必须是大于 0 的数字')
      return
    }
  }

  isProcessing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('start_time', startTime.value || '0')
    formData.append('output_fmt', videoStore.preferredGifFormat)
    if (videoStore.preferredGifFormat !== 'jpg') {
      formData.append('duration', duration.value)
      formData.append('fps', String(videoStore.preferredFps))
    }

    const blob = await makeVideoGif(formData)
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    const suffix =
      videoStore.preferredGifFormat === 'jpg' ? '_cover' : '_animated'
    handleDownload(
      blob,
      `${baseName}${suffix}.${videoStore.preferredGifFormat}`
    )
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
    title="截帧 / 转 GIF"
    description="截取某段视频画面，或导出为 GIF / WebP 动图"
    icon="solar:camera-bold-duotone"
    gradient="from-amber-400 to-orange-500"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFile"
        empty-icon="solar:clapperboard-play-bold-duotone"
        empty-icon-class="text-amber-400"
        empty-text="拖拽所需处理的视频"
        accent-class="text-amber-500"
        hint="支持 MP4 · MOV · MKV · AVI · WebM 等常见视频格式 · 最大 2GB"
        accept="video/*,.mkv,.flv,.ts,.m2ts,.rmvb"
        selected-icon="solar:video-library-bold-duotone"
        selected-bg-class="bg-amber-50"
        selected-icon-class="text-amber-500 border-amber-100"
      />
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="参数配置"
        card-title-icon="solar:settings-bold-duotone"
        card-title-icon-class="text-amber-500"
      >
        <el-form label-position="top" class="flex-1 flex flex-col">
          <el-form-item label="输出类型">
            <el-select
              v-model="videoStore.preferredGifFormat"
              placeholder="请选择"
              size="large"
              class="w-full"
            >
              <el-option
                v-for="opt in formatOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="起始时间 (秒)">
                <el-input
                  v-model="startTime"
                  size="large"
                  type="number"
                  placeholder="0"
                >
                  <template #append>s</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                v-if="videoStore.preferredGifFormat !== 'jpg'"
                label="截取时长 (秒)"
              >
                <el-input
                  v-model="duration"
                  size="large"
                  type="number"
                  placeholder="5"
                >
                  <template #append>s</template>
                </el-input>
              </el-form-item>
              <el-form-item v-else label="说明">
                <div
                  class="w-full h-10 flex items-center text-xs text-amber-600 bg-amber-50 rounded px-3 border border-amber-100"
                >
                  仅提取单张图片
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item
            v-if="videoStore.preferredGifFormat !== 'jpg'"
            label="流畅度 (FPS 帧率)"
          >
            <div class="flex items-center gap-4 w-full px-2">
              <el-slider
                v-model="videoStore.preferredFps"
                :min="5"
                :max="30"
                :step="1"
                class="flex-1"
              />
              <span class="font-bold text-amber-600 w-8">{{
                videoStore.preferredFps
              }}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1 leading-tight">
              建议设为 10-15。过高的 FPS 会显著增加 GIF 与 WebP 的文件体积。
            </p>
          </el-form-item>
        </el-form>

        <template #action>
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :class="
              !isProcessing && selectedFile
                ? 'shadow-lg shadow-amber-500/30'
                : ''
            "
            color="#f59e0b"
            :disabled="!selectedFile || isProcessing"
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
                ? '处理中...'
                : videoStore.preferredGifFormat === 'jpg'
                ? '提取封面'
                : '生成动图'
            }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>

<style scoped>
:deep(.el-slider__bar) {
  background-color: #f59e0b;
}
:deep(.el-slider__button) {
  border-color: #f59e0b;
}
</style>
