<script setup lang="ts">
import { ref } from 'vue'
import { mergeAudio } from '@/api/audio'
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import AudioFileCard from '@/components/AudioFileCard.vue'

const isProcessing = ref(false)
const fileList = ref<{ id: string; file: File }[]>([])
const fileInput = ref<HTMLInputElement | null>(null)

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

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    for (let i = 0; i < target.files.length; i++) {
      const file = target.files[i] as File
      const duration = await getAudioDuration(file)
      ;(file as any).durationText = duration

      fileList.value.push({
        id: Math.random().toString(36).slice(2),
        file: file,
      })
    }
  }
  // reset input
  target.value = ''
}

const removeFile = (id: string) => {
  fileList.value = fileList.value.filter((item) => item.id !== id)
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

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (files) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as File
      if (file.type.startsWith('audio/')) {
        const duration = await getAudioDuration(file)
        ;(file as any).durationText = duration

        fileList.value.push({
          id: Math.random().toString(36).slice(2),
          file: file,
        })
      }
    }
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const handleAction = async () => {
  if (fileList.value.length < 2) {
    ElMessage.warning('请至少上传两个音乐文件以进行合并')
    return
  }
  isProcessing.value = true
  try {
    const formData = new FormData()
    fileList.value.forEach((item) => {
      formData.append('files', item.file)
    })
    // 发送按照列表顺序排列的索引。后端接收到 files 数组后，会根据 order 挑选路径。
    formData.append('order', JSON.stringify(fileList.value.map((_, i) => i)))

    const blob = await mergeAudio(formData)
    handleDownload(blob, `merged_audio_${Date.now()}.mp3`)
    ElMessage.success('合并成功！')
  } catch (err) {
    console.error(err)
    ElMessage.error('合并失败，请检查文件格式')
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <ToolPageLayout
    title="音频合并"
    description="支持多文件拼合，可自由调整拼接顺序"
    icon="solar:link-bold-duotone"
    color="blue"
  >
    <!-- 左侧：文件管理区 -->
    <template #upload>
      <div
        class="flex flex-col h-full bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 transition-all"
        @drop="handleDrop"
        @dragover="handleDragOver"
      >
        <!-- 拖拽列表 -->
        <draggable
          v-model="fileList"
          item-key="id"
          class="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar"
          ghost-class="opacity-50"
        >
          <template #item="{ element }">
            <AudioFileCard
              :file="element.file"
              color="blue"
              class="cursor-move"
              @remove="removeFile(element.id)"
            />
          </template>
        </draggable>

        <!-- 添加按钮/区域 -->
        <div class="mt-4">
          <input
            ref="fileInput"
            type="file"
            multiple
            accept="audio/*"
            class="hidden"
            @change="handleFileChange"
          />
          <div
            @click="triggerUpload"
            class="group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl py-10 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-300 bg-white"
          >
            <div
              class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-100/50 group-hover:scale-110 transition-all duration-300 mb-3"
            >
              <Icon
                icon="solar:add-circle-bold-duotone"
                class="text-4xl text-slate-300 group-hover:text-blue-500"
              />
            </div>
            <span
              class="text-base font-bold text-slate-500 group-hover:text-blue-600 mb-1"
              >点击或拖拽文件到这里</span
            >
            <span class="text-xs text-slate-400">支持批量选择音频文件</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="合并参数"
        card-title-icon="solar:settings-minimalistic-bold-duotone"
      >
        <div class="space-y-6">
          <div class="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <h4
              class="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2"
            >
              <Icon icon="solar:shield-check-bold" />
              由于顺序调整
            </h4>
            <p class="text-xs text-blue-700 leading-relaxed font-medium">
              左侧列表由上至下代表音频播放的先后顺序。您可以按住音频卡片自由拖动调整。
            </p>
          </div>

          <div class="space-y-2">
            <p
              class="text-xs font-bold text-slate-400 uppercase tracking-wider"
            >
              输出格式
            </p>
            <div
              class="flex items-center gap-2 text-slate-700 font-bold bg-slate-50 p-3 rounded-lg border border-slate-200"
            >
              <Icon icon="solar:music-note-bold" class="text-blue-500" />
              <span>MP3 (320kbps 高质量)</span>
            </div>
          </div>
        </div>

        <template #action>
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :disabled="fileList.length < 2 || isProcessing"
            :loading="isProcessing"
            @click="handleAction"
          >
            <template #icon>
              <Icon
                v-if="!isProcessing"
                icon="solar:link-bold"
                class="text-xl"
              />
            </template>
            {{ isProcessing ? '合并中...' : '开始合并音乐' }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>
