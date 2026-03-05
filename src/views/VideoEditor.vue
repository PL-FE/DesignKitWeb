<script setup lang="ts">
import { ref } from 'vue'
import { editVideo } from '@/api/video'
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)

// 剪辑参数
const trimStart = ref('')
const trimEnd = ref('')
const crop = ref('')
const removeAudio = ref(false)
const speed = ref(1.0)

const speedOptions = [
  { label: '0.5x 慢放', value: 0.5 },
  { label: '0.75x 轻微降速', value: 0.75 },
  { label: '1.0x 正常速度', value: 1.0 },
  { label: '1.25x 略快', value: 1.25 },
  { label: '1.5x 提速', value: 1.5 },
  { label: '2.0x 快播', value: 2.0 },
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
    formData.append('trim_start', trimStart.value || '0')
    formData.append('trim_end', trimEnd.value || '0')
    formData.append('crop', crop.value || '')
    formData.append('remove_audio', String(removeAudio.value))
    formData.append('speed', String(speed.value))
    const blob = await editVideo(formData)
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    handleDownload(blob, `${baseName}_edited.mp4`)
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
    title="视频快速编辑"
    description="静音、变速、裁剪画面比例，常用操作一步搞定"
    icon="solar:scissors-bold-duotone"
    color="pink"
    :left-span="12"
    :right-span="12"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFile"
        empty-icon="solar:video-library-bold-duotone"
        empty-text="拖拽需要编辑的视频"
        hint="支持 MP4 · MOV · MKV · AVI · WebM 等常见视频格式，输出 MP4 · 最大 2GB"
        accept="video/*,.mkv,.flv,.ts,.m2ts,.rmvb"
        selected-icon="solar:video-frame-play-horizontal-bold-duotone"
      />
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="编辑参数"
        card-title-icon="solar:settings-bold-duotone"
      >
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

          <!-- 静音开关 -->
          <div
            class="p-4 rounded-xl border mb-auto mt-2 flex items-center justify-between"
            style="
              background: var(--page-accent-light);
              border-color: var(--page-accent-border);
            "
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0"
                style="color: var(--page-accent)"
              >
                <Icon icon="solar:volume-cross-bold-duotone" class="text-xl" />
              </div>
              <div>
                <div class="font-bold text-slate-700 text-sm">去掉声音</div>
                <div class="text-xs text-slate-500 mt-0.5">
                  移除视频内的所有音轨
                </div>
              </div>
            </div>
            <el-switch v-model="removeAudio" />
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
                icon="solar:magic-stick-3-bold-duotone"
                class="text-xl"
              />
            </template>
            {{ isProcessing ? '处理中...' : '提交编辑' }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>
