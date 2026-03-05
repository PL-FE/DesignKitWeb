<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { getVideoInfo } from '@/api/video'
import type { MediaInfoResponse } from '@/api/video'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)
const mediaInfo = ref<MediaInfoResponse | null>(null)

const handleAction = async () => {
  if (!selectedFile.value) return
  isProcessing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    mediaInfo.value = await getVideoInfo(formData)
  } catch (err) {
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const parseFps = (val: string) => {
  if (!val) return 'N/A'
  try {
    const parts = val.split('/')
    if (parts.length === 2)
      return (Number(parts[0]) / Number(parts[1])).toFixed(2)
    return Number(val).toFixed(2)
  } catch {
    return val
  }
}
</script>

<template>
  <ToolPageLayout
    title="媒体信息查看"
    description="查看视频或音频文件的编码、分辨率、帧率、码率等详细参数"
    icon="solar:info-square-bold-duotone"
    gradient="from-emerald-500 to-teal-500"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFile"
        empty-icon="solar:video-frame-bold-duotone"
        empty-icon-class="text-teal-400"
        empty-text="拖拽音视频文件"
        accent-class="text-teal-500"
        hint="支持 MP4 · MOV · MKV · AVI · FLV · WebM · MP3 · AAC · WAV 等"
        accept="video/*,audio/*,.mkv,.flv,.ts,.m2ts,.rmvb"
        selected-icon="solar:clapperboard-play-bold-duotone"
        selected-bg-class="bg-teal-50"
        selected-icon-class="text-teal-500 border-teal-100"
      >
        <!-- 已选状态使用垂直居中展示 -->
        <template #selected="{ file, remove }">
          <div
            class="flex flex-col items-center p-4 w-full h-full relative z-10 text-center cursor-default bg-teal-50/50 rounded-xl border border-teal-100/50"
          >
            <div
              class="w-16 h-16 rounded-xl bg-teal-100 text-teal-500 flex items-center justify-center text-3xl shadow-sm border border-teal-200"
            >
              <Icon icon="solar:clapperboard-play-bold-duotone" />
            </div>
            <p
              class="font-bold text-slate-800 text-sm mt-3 w-full truncate px-4"
              :title="file.name"
            >
              {{ file.name }}
            </p>
            <el-tag
              size="small"
              type="success"
              effect="plain"
              class="mt-2 !font-bold"
            >
              {{ formatBytes(file.size) }}
            </el-tag>
            <el-button
              type="danger"
              circle
              plain
              size="small"
              class="absolute top-2 right-2"
              @click.stop="remove"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </el-button>
          </div>
        </template>
      </ToolUploader>
    </template>

    <!-- 右侧：结果展示 + 分析按钮 -->
    <template #panel>
      <ToolSettingsCard
        card-title="参数详情"
        card-title-icon="solar:code-scan-bold-duotone"
        card-title-icon-class="text-teal-500"
      >
        <!-- 空状态 -->
        <div
          v-if="!mediaInfo"
          class="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[200px]"
        >
          <Icon
            icon="solar:ghost-line-duotone"
            class="text-6xl mb-4 text-slate-200"
          />
          <p class="text-sm">上传文件后点击分析</p>
        </div>

        <!-- 结果详情 -->
        <div
          v-else
          class="flex-1 w-full overflow-y-auto pr-1 custom-scrollbar max-h-[460px]"
        >
          <!-- 容器信息 -->
          <el-descriptions
            title="容器信息 (Format)"
            :column="2"
            border
            size="small"
            class="mb-6"
          >
            <el-descriptions-item label="格式名称" label-align="right">{{
              mediaInfo.format.format_name
            }}</el-descriptions-item>
            <el-descriptions-item label="详细名称" label-align="right">{{
              mediaInfo.format.format_long_name
            }}</el-descriptions-item>
            <el-descriptions-item label="时长 (秒)" label-align="right">
              <el-tag size="small" type="info"
                >{{
                  parseFloat(mediaInfo.format.duration).toFixed(3)
                }}
                s</el-tag
              >
            </el-descriptions-item>
            <el-descriptions-item label="媒体大小" label-align="right">{{
              formatBytes(parseInt(mediaInfo.format.size))
            }}</el-descriptions-item>
            <el-descriptions-item label="整体比特率" label-align="right"
              >{{
                Math.round(mediaInfo.format.bit_rate / 1000)
              }}
              kbps</el-descriptions-item
            >
            <el-descriptions-item label="流数量" label-align="right">{{
              mediaInfo.format.nb_streams
            }}</el-descriptions-item>
          </el-descriptions>

          <!-- 轨道信息 -->
          <template v-for="(stream, idx) in mediaInfo.streams" :key="idx">
            <el-descriptions
              :title="`轨道 ${stream.index} : ${
                stream.codec_type === 'video'
                  ? '视频流'
                  : stream.codec_type === 'audio'
                  ? '音频流'
                  : '其他轨'
              }`"
              :column="2"
              border
              size="small"
              class="mb-6"
            >
              <el-descriptions-item label="编码器" label-align="right">
                <span class="font-bold text-teal-600">{{
                  stream.codec_name
                }}</span>
                ({{ stream.codec_long_name }})
              </el-descriptions-item>
              <template v-if="stream.codec_type === 'video'">
                <el-descriptions-item label="分辨率" label-align="right">
                  <el-tag type="primary" size="small" class="!font-bold"
                    >{{ stream.width }} x {{ stream.height }}</el-tag
                  >
                </el-descriptions-item>
                <el-descriptions-item label="色彩空间" label-align="right">{{
                  stream.pix_fmt
                }}</el-descriptions-item>
                <el-descriptions-item label="画面比例" label-align="right">{{
                  stream.display_aspect_ratio ||
                  stream.sample_aspect_ratio ||
                  'N/A'
                }}</el-descriptions-item>
                <el-descriptions-item label="帧率 (FPS)" label-align="right">
                  {{
                    stream.r_frame_rate ? parseFps(stream.r_frame_rate) : 'N/A'
                  }}
                  fps
                </el-descriptions-item>
              </template>
              <template v-if="stream.codec_type === 'audio'">
                <el-descriptions-item label="采样率" label-align="right">
                  {{ stream.sample_rate }} Hz
                </el-descriptions-item>
                <el-descriptions-item label="声道数" label-align="right">
                  {{ stream.channels }} ({{ stream.channel_layout }})
                </el-descriptions-item>
              </template>
            </el-descriptions>
          </template>
        </div>

        <!-- 底部：分析按钮 -->
        <template #action>
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :class="
              !isProcessing && selectedFile
                ? 'shadow-lg shadow-teal-500/30'
                : ''
            "
            color="#14b8a6"
            :disabled="!selectedFile || isProcessing"
            :loading="isProcessing"
            @click="handleAction"
          >
            <template #icon>
              <Icon
                v-if="!isProcessing"
                icon="solar:magnifer-zoom-in-bold-duotone"
                class="text-xl"
              />
            </template>
            {{ isProcessing ? '分析中...' : '开始分析' }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 10px;
}
</style>
