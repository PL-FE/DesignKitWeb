<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { convertVideo } from '@/api/video'
import type { UploadInstance, UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

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
    ElMessage.warning('请先上传需要转换的视频文件')
    return
  }

  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('target_format', videoStore.preferredFormat)

    const blob = await convertVideo(formData)

    // 生成下载文件名
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    const downloadName = `${baseName}_converted.${videoStore.preferredFormat}`

    handleDownload(blob, downloadName)
    ElMessage.success('转换成功！文件已开始下载')
    handleRemove()
  } catch (err) {
    // 错误处理已经在 API 拦截器完成
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
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:video-frame-replace-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2
          class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
        >
          全能格式转换中心
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
          支持极速转换常用视频格式及纯音频提取
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
            :on-change="handleChange"
          >
            <div
              v-if="!selectedFile"
              class="el-upload__text px-4 py-12 md:py-20 flex flex-col items-center"
            >
              <Icon
                icon="solar:video-library-bold-duotone"
                class="text-6xl text-cyan-400 mb-4 inline-block"
              />
              <div class="text-lg font-bold text-slate-700 mb-2">
                拖拽视频/音频文件，或<em class="text-cyan-500 not-italic"
                  >点击浏览</em
                >
              </div>
              <div class="text-xs text-slate-400 font-medium">
                最高支持 2GB 的单文件极速处理
              </div>
            </div>

            <div
              v-else
              class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 md:p-8 w-full h-full relative z-10 text-left cursor-default"
            >
              <div
                class="w-20 h-20 rounded-xl bg-cyan-50 text-cyan-500 flex items-center justify-center text-4xl shadow-sm border border-cyan-100 flex-shrink-0"
              >
                <Icon icon="solar:video-frame-play-horizontal-bold-duotone" />
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
                class="text-cyan-500 text-lg"
              />
              导出参数设定
            </div>
          </template>

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
              class="p-3 bg-cyan-50 rounded-xl border border-cyan-100/50 mb-auto"
            >
              <p class="text-xs text-cyan-700 leading-relaxed font-medium">
                <Icon
                  icon="solar:info-circle-bold"
                  class="inline text-cyan-500 relative -top-[1px] mr-1"
                />
                所有格式转换均由服务端集群极速完成并为您自动下载。支持一键将视频分离为纯净
                MP3 音频。
              </p>
            </div>

            <div class="mt-6">
              <el-button
                type="primary"
                size="large"
                class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
                :class="
                  !isProcessing && selectedFile
                    ? 'shadow-lg shadow-cyan-500/30'
                    : ''
                "
                color="#0ea5e9"
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
                {{ isProcessing ? '云端混流转换中...' : '开始极速转换' }}
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
</style>
