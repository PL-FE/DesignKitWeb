<script setup lang="ts">
import { ref } from 'vue'
import { editVideo } from '@/api/video'
import type { UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)

// 剪辑参数状态
const trimStart = ref('')
const trimEnd = ref('')
const crop = ref('')
const removeAudio = ref(false)
const speed = ref(1.0)

const speedOptions = [
  { label: '0.5x 极致慢放', value: 0.5 },
  { label: '0.75x 轻微降速', value: 0.75 },
  { label: '1.0x 正常速度', value: 1.0 },
  { label: '1.25x 丝滑微快', value: 1.25 },
  { label: '1.5x 节奏提速', value: 1.5 },
  { label: '2.0x 鬼畜快播', value: 2.0 },
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
    ElMessage.warning('请先上传所需剪辑的视频文件')
    return
  }

  isProcessing.value = true

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('trim_start', trimStart.value || '0')
    formData.append('trim_end', trimEnd.value || '0')
    formData.append('crop', crop.value || '')
    formData.append('remove_audio', String(removeAudio.value))
    formData.append('speed', String(speed.value))

    const blob = await editVideo(formData)

    // 生成下载文件名
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    const downloadName = `${baseName}_edited.mp4`

    handleDownload(blob, downloadName)
    ElMessage.success('剪辑处理成功！文件已开始流式下载')
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
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-pink-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:scissors-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2
          class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
        >
          快捷轻剪辑引擎
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
          去除音轨、精准截取与速度调节的高级操作集合
        </p>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：上传区 -->
      <el-col :xs="24" :lg="12" class="mb-6 lg:mb-0">
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
                icon="solar:video-library-bold-duotone"
                class="text-6xl text-rose-400 mb-4 inline-block"
              />
              <div class="text-lg font-bold text-slate-700 mb-2">
                拖拽需处理的视频，或<em class="text-rose-500 not-italic"
                  >点击浏览</em
                >
              </div>
            </div>

            <div
              v-else
              class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 md:p-8 w-full h-full relative z-10 text-left cursor-default"
            >
              <div
                class="w-20 h-20 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-4xl shadow-sm border border-rose-100 flex-shrink-0"
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
      <el-col :xs="24" :lg="12">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col relative"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:settings-bold-duotone"
                class="text-rose-500 text-lg"
              />
              剪辑动作面板
            </div>
          </template>

          <el-form label-position="top" class="flex-1 flex flex-col">
            <div class="grid grid-cols-2 gap-4">
              <el-form-item label="起始丢弃 (秒) / 不填跳过">
                <el-input
                  v-model="trimStart"
                  size="large"
                  type="number"
                  placeholder="0"
                >
                  <template #append>s</template>
                </el-input>
              </el-form-item>

              <el-form-item label="结尾保留 (秒) / 不填跳过">
                <el-input
                  v-model="trimEnd"
                  size="large"
                  type="number"
                  placeholder="留空不处理"
                >
                  <template #append>s</template>
                </el-input>
              </el-form-item>
            </div>

            <el-form-item label="播放倍速调节">
              <el-select
                v-model="speed"
                placeholder="播放倍速"
                size="large"
                class="w-full"
              >
                <el-option
                  v-for="opt in speedOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="画面裁剪指令 (进阶)">
              <el-input
                v-model="crop"
                size="large"
                placeholder="例如: iw/2:ih:0:0 (宽度切一半)"
                clearable
              />
              <p class="text-[11px] text-slate-400 mt-1 leading-tight">
                格式为 w:h:x:y，使用 FFmpeg 裁切滤镜。例如 `iw*0.8:ih*0.8`
                为中心裁剪 80%。
              </p>
            </el-form-item>

            <div
              class="p-4 bg-rose-50 rounded-xl border border-rose-100/50 mb-auto mt-2 flex items-center justify-between"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-full bg-white text-rose-500 shadow-sm flex items-center justify-center flex-shrink-0"
                >
                  <Icon
                    icon="solar:volume-cross-bold-duotone"
                    class="text-xl"
                  />
                </div>
                <div>
                  <div class="font-bold text-slate-700 text-sm">
                    硬核静音模式
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">
                    彻底剥离媒体文件内的所有声音轨道
                  </div>
                </div>
              </div>
              <el-switch v-model="removeAudio" active-color="#f43f5e" />
            </div>

            <div class="mt-8">
              <el-button
                type="primary"
                size="large"
                class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
                :class="
                  !isProcessing && selectedFile
                    ? 'shadow-lg shadow-rose-500/30'
                    : ''
                "
                color="#f43f5e"
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
                {{ isProcessing ? '光速剪辑拼接中...' : '提交剪辑任务' }}
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
