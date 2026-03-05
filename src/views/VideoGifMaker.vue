<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { makeVideoGif } from '@/api/video'
import type { UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

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

const handleChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    if (uploadFile.size && uploadFile.size > 2000 * 1024 * 1024) {
      ElMessage.warning('视频文件过大，请控制在 2000MB 以内')
      selectedFile.value = null
      return
    }
    selectedFile.value = uploadFile.raw
  }
}

const handleRemove = () => {
  selectedFile.value = null
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
  if (!selectedFile.value) {
    ElMessage.warning('请先上传视频文件')
    return
  }
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

    // 生成下载文件名
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    const suffix =
      videoStore.preferredGifFormat === 'jpg' ? '_cover' : '_animated'
    const downloadName = `${baseName}${suffix}.${videoStore.preferredGifFormat}`

    handleDownload(blob, downloadName)
    ElMessage.success('处理成功！文件已开始自动下载')
    handleRemove()
  } catch (err) {
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div
    class="px-4 py-6 md:py-10 mx-auto max-w-6xl w-full box-border overflow-x-hidden animate-fade-in"
  >
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:camera-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2
          class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
        >
          动图制造与封面提炼
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
          极速将视频片段转换为丝滑小巧的 GIF/WebP，或一键提取封面无损原图
        </p>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：上传区 -->
      <el-col :xs="24" :lg="14" class="mb-6 lg:mb-0">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col justify-center min-h-[300px]"
        >
          <el-upload
            class="upload-demo w-full h-full flex flex-col justify-center"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept="video/*"
            :on-change="handleChange"
          >
            <div
              v-if="!selectedFile"
              class="el-upload__text px-4 py-12 md:py-20 flex flex-col items-center"
            >
              <Icon
                icon="solar:clapperboard-play-bold-duotone"
                class="text-6xl text-amber-400 mb-4 inline-block"
              />
              <div class="text-lg font-bold text-slate-700 mb-2">
                拖拽所需处理的视频，或<em class="text-amber-500 not-italic"
                  >点击浏览</em
                >
              </div>
            </div>

            <div
              v-else
              class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 md:p-8 w-full h-full relative z-10 text-left cursor-default"
            >
              <div
                class="w-20 h-20 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-4xl shadow-sm border border-amber-100 flex-shrink-0"
              >
                <Icon icon="solar:video-library-bold-duotone" />
              </div>
              <div
                class="flex-1 min-w-0 flex flex-col justify-center w-full mt-2 sm:mt-0"
              >
                <p
                  class="font-bold text-slate-800 text-lg truncate w-full"
                  :title="selectedFile.name"
                >
                  {{ selectedFile.name }}
                </p>
                <div class="flex items-center gap-2 mt-2">
                  <el-tag
                    size="small"
                    type="primary"
                    effect="plain"
                    class="!font-bold"
                  >
                    {{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB
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
          </el-upload>
        </el-card>
      </el-col>

      <!-- 右侧：控制台 -->
      <el-col :xs="24" :lg="10">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col relative"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:settings-bold-duotone"
                class="text-amber-500 text-lg"
              />
              工作流配置
            </div>
          </template>

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

            <div class="mt-auto pt-6 flex flex-col gap-3 justify-end flex-1">
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
                    ? '工作流运转中...'
                    : videoStore.preferredGifFormat === 'jpg'
                    ? '一键提取原画封面'
                    : '立即生成丝滑动图'
                }}
              </el-button>
            </div>
          </el-form>
        </el-card>
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

.custom-card {
  --el-card-padding: 1.25rem;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Override slider handle block for thematic effect */
:deep(.el-slider__bar) {
  background-color: #f59e0b;
}
:deep(.el-slider__button) {
  border-color: #f59e0b;
}
</style>
