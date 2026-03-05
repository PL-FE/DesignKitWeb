<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { UploadProps } from 'element-plus'
import { getVideoInfo } from '@/api/video'
import type { MediaInfoResponse } from '@/api/video'

const isProcessing = ref(false)
const selectedFile = ref<File | null>(null)
const mediaInfo = ref<MediaInfoResponse | null>(null)

const handleChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    // 任意媒体文件，不强制后缀，通常为视频或音频
    selectedFile.value = uploadFile.raw
    mediaInfo.value = null // 清空旧数据
  }
}

const handleRemove = () => {
  selectedFile.value = null
  mediaInfo.value = null
}

const handleAction = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传文件')
    return
  }
  isProcessing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    // 调用后端透视接口
    const result = await getVideoInfo(formData)
    mediaInfo.value = result
    ElMessage.success('媒体信息解析成功！')
  } catch (err) {
    // 错误已由 request.ts 拦截处理
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

// Helper to format bytes
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
    if (parts.length === 2) {
      return (Number(parts[0]) / Number(parts[1])).toFixed(2)
    }
    return Number(val).toFixed(2)
  } catch {
    return val
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
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:info-square-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2
          class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
        >
          媒体深度信息透视仪
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
          极速识别视频/音频的编码格式、分辨率、比特率、流轨道等底层硬件参数
        </p>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：上传区 -->
      <el-col :xs="24" :lg="10" class="mb-6 lg:mb-0">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col justify-center min-h-[250px]"
        >
          <el-upload
            ref="uploadRef"
            class="upload-demo w-full h-full flex flex-col justify-center"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleChange"
          >
            <div
              v-if="!selectedFile"
              class="el-upload__text px-4 py-8 md:py-12 flex flex-col items-center"
            >
              <Icon
                icon="solar:video-frame-bold-duotone"
                class="text-4xl text-teal-400 mb-4 inline-block"
              />
              <div class="text-base font-bold text-slate-700 mb-2">
                拖拽音视频文件，或
                <em class="text-teal-500 not-italic">点击浏览</em>
              </div>
            </div>

            <div
              v-else
              class="flex flex-col items-center p-4 w-full h-full relative z-10 text-center cursor-default bg-teal-50/50 rounded-xl border border-teal-100/50"
            >
              <div
                class="w-16 h-16 rounded-xl bg-teal-100 text-teal-500 flex items-center justify-center text-3xl shadow-sm border border-teal-200"
              >
                <Icon icon="solar:clapperboard-play-bold-duotone" />
              </div>
              <p
                class="font-bold text-slate-800 text-sm mt-3 w-full truncate px-4"
                :title="selectedFile.name"
              >
                {{ selectedFile.name }}
              </p>
              <el-tag
                size="small"
                type="success"
                effect="plain"
                class="mt-2 !font-bold"
              >
                {{ formatBytes(selectedFile.size) }}
              </el-tag>

              <el-button
                type="danger"
                circle
                plain
                size="small"
                class="absolute top-2 right-2"
                @click.stop="handleRemove"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </el-button>
            </div>
          </el-upload>

          <el-button
            type="primary"
            size="large"
            class="w-full mt-4 !h-12 !text-base !rounded-xl !font-bold"
            color="#14b8a6"
            :disabled="!selectedFile || isProcessing"
            :loading="isProcessing"
            @click="handleAction"
          >
            {{ isProcessing ? '透视分析中...' : '开始透视分析' }}
          </el-button>
        </el-card>
      </el-col>

      <!-- 右侧：分析结果展示 -->
      <el-col :xs="24" :lg="14">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col relative"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:code-scan-bold-duotone"
                class="text-teal-500 text-lg"
              />
              底层参数详情
            </div>
          </template>

          <div
            v-if="!mediaInfo"
            class="flex-1 flex flex-col items-center justify-center text-slate-400 min-h-[300px]"
          >
            <Icon
              icon="solar:ghost-line-duotone"
              class="text-6xl mb-4 text-slate-200"
            />
            <p>尚未分析任何文件，请先在左侧上传解析</p>
          </div>

          <div
            v-else
            class="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar max-h-[500px]"
          >
            <!-- Format Container Info -->
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

            <!-- Streams Info -->
            <template v-for="(stream, idx) in mediaInfo.streams" :key="idx">
              <el-descriptions
                :title="`轨道 ${stream.index} : ${
                  stream.codec_type === 'video'
                    ? '视频图像流'
                    : stream.codec_type === 'audio'
                    ? '音频流'
                    : '其他轨'
                }`"
                :column="2"
                border
                size="small"
                class="mb-6"
              >
                <!-- 通用信息 -->
                <el-descriptions-item label="编码器" label-align="right">
                  <span class="font-bold text-teal-600">{{
                    stream.codec_name
                  }}</span>
                  ({{ stream.codec_long_name }})
                </el-descriptions-item>

                <!-- 视频特有 -->
                <template v-if="stream.codec_type === 'video'">
                  <el-descriptions-item label="画面分辨率" label-align="right">
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
                      stream.r_frame_rate
                        ? eval(stream.r_frame_rate).toFixed(2)
                        : 'N/A'
                    }}
                    fps
                  </el-descriptions-item>
                </template>

                <!-- 音频特有 -->
                <template v-if="stream.codec_type === 'audio'">
                  <el-descriptions-item label="采样率" label-align="right"
                    >{{ stream.sample_rate }} Hz</el-descriptions-item
                  >
                  <el-descriptions-item label="声道数" label-align="right"
                    >{{ stream.channels }} ({{
                      stream.channel_layout
                    }})</el-descriptions-item
                  >
                </template>
              </el-descriptions>
            </template>
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
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

/* 隐藏原生滚动条并替换为细微样式 */
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
