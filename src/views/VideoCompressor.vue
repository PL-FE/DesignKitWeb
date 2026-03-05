<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { compressVideo } from '@/api/video'
import type { UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

const videoStore = useVideoStore()
const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)

const handleLevelSelect = (level: string) => {
  videoStore.preferredCompressLevel = level
}

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
    ElMessage.warning('请先上传需要压缩的视频文件')
    return
  }

  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('level', videoStore.preferredCompressLevel)

    const blob = await compressVideo(formData)

    // 生成下载文件名
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    const downloadName = `${baseName}_compress.mp4`

    handleDownload(blob, downloadName)
    ElMessage.success('视频压缩成功！文件已开始下载')
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
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-purple-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:video-frame-cut-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2
          class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
        >
          极客级体积压缩器
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
          H.264 高阶压制算法，兼顾画质极限压缩体积
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
                icon="solar:database-bold-duotone"
                class="text-6xl text-fuchsia-400 mb-4 inline-block"
              />
              <div class="text-lg font-bold text-slate-700 mb-2">
                拖拽需瘦身的视频，或<em class="text-fuchsia-500 not-italic"
                  >点击浏览</em
                >
              </div>
            </div>

            <div
              v-else
              class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 md:p-8 w-full h-full relative z-10 text-left cursor-default"
            >
              <div
                class="w-20 h-20 rounded-xl bg-fuchsia-50 text-fuchsia-500 flex items-center justify-center text-4xl shadow-sm border border-fuchsia-100 flex-shrink-0"
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
                class="text-fuchsia-500 text-lg"
              />
              压缩级别设定
            </div>
          </template>

          <div class="flex-1 flex flex-col">
            <!-- 压缩选项卡 -->
            <div class="grid grid-cols-1 gap-3 mb-6">
              <!-- 轻微 -->
              <div
                class="border-2 rounded-xl p-3 cursor-pointer transition-all flex items-center gap-4"
                :class="
                  videoStore.preferredCompressLevel === 'low'
                    ? 'border-fuchsia-500 bg-fuchsia-50'
                    : 'border-slate-100 hover:border-fuchsia-300 hover:bg-slate-50'
                "
                @click="handleLevelSelect('low')"
              >
                <Icon
                  :icon="
                    videoStore.preferredCompressLevel === 'low'
                      ? 'solar:check-circle-bold'
                      : 'solar:tuning-square-2-bold-duotone'
                  "
                  class="text-2xl flex-shrink-0"
                  :class="
                    videoStore.preferredCompressLevel === 'low'
                      ? 'text-fuchsia-600'
                      : 'text-slate-400'
                  "
                />
                <div>
                  <h4 class="font-bold text-slate-800 m-0">
                    轻微压缩 (原画质)
                  </h4>
                  <p class="text-xs text-slate-500 mt-1">
                    肉眼几乎无损画质，体积减小不明显
                  </p>
                </div>
              </div>

              <!-- 均衡 -->
              <div
                class="border-2 rounded-xl p-3 cursor-pointer transition-all flex items-center gap-4"
                :class="
                  videoStore.preferredCompressLevel === 'medium'
                    ? 'border-fuchsia-500 bg-fuchsia-50'
                    : 'border-slate-100 hover:border-fuchsia-300 hover:bg-slate-50'
                "
                @click="handleLevelSelect('medium')"
              >
                <Icon
                  :icon="
                    videoStore.preferredCompressLevel === 'medium'
                      ? 'solar:check-circle-bold'
                      : 'solar:tuning-square-2-bold-duotone'
                  "
                  class="text-2xl flex-shrink-0"
                  :class="
                    videoStore.preferredCompressLevel === 'medium'
                      ? 'text-fuchsia-600'
                      : 'text-slate-400'
                  "
                />
                <div>
                  <h4 class="font-bold text-slate-800 m-0">均衡压缩 (推荐)</h4>
                  <p class="text-xs text-slate-500 mt-1">
                    在保证清晰度的前提下缩减约 30-50% 体积
                  </p>
                </div>
              </div>

              <!-- 强力 -->
              <div
                class="border-2 rounded-xl p-3 cursor-pointer transition-all flex items-center gap-4"
                :class="
                  videoStore.preferredCompressLevel === 'high'
                    ? 'border-fuchsia-500 bg-fuchsia-50'
                    : 'border-slate-100 hover:border-fuchsia-300 hover:bg-slate-50'
                "
                @click="handleLevelSelect('high')"
              >
                <Icon
                  :icon="
                    videoStore.preferredCompressLevel === 'high'
                      ? 'solar:check-circle-bold'
                      : 'solar:tuning-square-2-bold-duotone'
                  "
                  class="text-2xl flex-shrink-0"
                  :class="
                    videoStore.preferredCompressLevel === 'high'
                      ? 'text-fuchsia-600'
                      : 'text-slate-400'
                  "
                />
                <div>
                  <h4 class="font-bold text-slate-800 m-0">
                    强力压缩 (微信发送)
                  </h4>
                  <p class="text-xs text-slate-500 mt-1">
                    大幅损失画质，甚至降级720P，以求最小体积
                  </p>
                </div>
              </div>
            </div>

            <div class="mt-auto pt-4">
              <el-button
                type="primary"
                size="large"
                class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
                :class="
                  !isProcessing && selectedFile
                    ? 'shadow-lg shadow-fuchsia-500/30'
                    : ''
                "
                color="#c026d3"
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
                {{ isProcessing ? '云端节点处理中...' : '启动压缩引擎' }}
              </el-button>
            </div>
          </div>
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
