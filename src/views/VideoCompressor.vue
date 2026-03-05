<script setup lang="ts">
import { ref } from 'vue'
import { useVideoStore } from '@/stores/video'
import { compressVideo } from '@/api/video'
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const videoStore = useVideoStore()
const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)

const handleLevelSelect = (level: string) => {
  videoStore.preferredCompressLevel = level
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
  if (!selectedFile.value) return
  isProcessing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    formData.append('level', videoStore.preferredCompressLevel)
    const blob = await compressVideo(formData)
    const extRegex = /(?:\.([^.]+))?$/
    const ext = extRegex.exec(selectedFile.value.name)?.[1]
    const baseName = ext
      ? selectedFile.value.name.slice(0, -(ext.length + 1))
      : selectedFile.value.name
    handleDownload(blob, `${baseName}_compressed.mp4`)
    selectedFile.value = null
  } catch (err) {
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

const levelItems = [
  {
    key: 'low',
    title: '轻微压缩 (原画质)',
    desc: '肉眼几乎无损画质，体积减小不明显',
  },
  {
    key: 'medium',
    title: '均衡压缩 (推荐)',
    desc: '在保证清晰度的前提下缩减约 30-50% 体积',
  },
  {
    key: 'high',
    title: '强力压缩 (微信发送)',
    desc: '大幅损失画质，甚至降级720P，以求最小体积',
  },
]
</script>

<template>
  <ToolPageLayout
    title="视频压缩"
    description="三档压缩力度，H.264 编码，文件变小但画质还行"
    icon="solar:video-frame-cut-bold-duotone"
    gradient="from-fuchsia-500 to-purple-500"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFile"
        empty-icon="solar:database-bold-duotone"
        empty-icon-class="text-fuchsia-400"
        empty-text="拖拽需要压缩的视频"
        accent-class="text-fuchsia-500"
        hint="支持 MP4 · MOV · MKV · AVI · FLV · WebM 等，输出固定为 MP4 · 最大 2GB"
        accept="video/*,.mkv,.flv,.ts,.m2ts,.rmvb"
        selected-icon="solar:video-library-bold-duotone"
        selected-bg-class="bg-fuchsia-50"
        selected-icon-class="text-fuchsia-500 border-fuchsia-100"
      />
    </template>

    <!-- 右侧：功能面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="压缩级别设定"
        card-title-icon="solar:settings-bold-duotone"
        card-title-icon-class="text-fuchsia-500"
      >
        <!-- 压缩档位选择 -->
        <div class="grid grid-cols-1 gap-3 mb-6">
          <div
            v-for="item in levelItems"
            :key="item.key"
            class="border-2 rounded-xl p-3 cursor-pointer transition-all flex items-center gap-4"
            :class="
              videoStore.preferredCompressLevel === item.key
                ? 'border-fuchsia-500 bg-fuchsia-50'
                : 'border-slate-100 hover:border-fuchsia-300 hover:bg-slate-50'
            "
            @click="handleLevelSelect(item.key)"
          >
            <Icon
              :icon="
                videoStore.preferredCompressLevel === item.key
                  ? 'solar:check-circle-bold'
                  : 'solar:tuning-square-2-bold-duotone'
              "
              class="text-2xl flex-shrink-0"
              :class="
                videoStore.preferredCompressLevel === item.key
                  ? 'text-fuchsia-600'
                  : 'text-slate-400'
              "
            />
            <div>
              <h4 class="font-bold text-slate-800 m-0">{{ item.title }}</h4>
              <p class="text-xs text-slate-500 mt-1">{{ item.desc }}</p>
            </div>
          </div>
        </div>

        <template #action>
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
            {{ isProcessing ? '压缩中...' : '开始压缩' }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>
