<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { generateLyricVideo, parseLrcClient, formatTime } from '@/api/lyricVideo'

// ——— 文件状态（不持久化，每次刷新需重新选择文件）———
const audioFile = ref<File | null>(null)
const lrcFile = ref<File | null>(null)
const lrcLines = ref<Array<{ time: number; text: string }>>([])

// ——— 合成参数（自动持久化到 localStorage）———
const bgColor       = useLocalStorage('lv:bg_color',       '#000000')
const fontSize      = useLocalStorage('lv:font_size',      150)
const sungColor      = useLocalStorage('lv:sung_color',     '#ff4d4d')  // 已唱文字颜色（默认红色）
const unsungColor    = useLocalStorage('lv:unsung_color',   '#ffffff')  // 未唱文字颜色（默认白色）
const strokeColor   = useLocalStorage('lv:stroke_color',   '#000000')
const strokeWidth   = useLocalStorage('lv:stroke_width',   2)
const resolution    = useLocalStorage('lv:resolution',     '1280x720')
const removeVocals  = useLocalStorage('lv:remove_vocals',  false)
const letterSpacing = useLocalStorage('lv:letter_spacing', 0)     // 字符间距（px），0 为默认
const lineGapRatio  = useLocalStorage('lv:line_gap_ratio', 1.5)  // 行间距倍数
const wrapMode      = useLocalStorage('lv:wrap_mode', 'auto')    // 换行模式
const maxCharsPerLine = useLocalStorage('lv:max_chars_per_line', 11) // 手动模式下每行最大字符数
const backgroundMode = useLocalStorage<'video' | 'image' | 'color'>('lv:background_mode', 'video')
const linesMode = useLocalStorage<'3' | '2'>('lv:lines_mode', '3')  // 歌词行数模式：3=三行滚动，2=两行居中

// ——— 封面文字参数（自动持久化到 localStorage）———
const coverTitle = useLocalStorage('lv:cover_title', '')
const coverSubtitle = useLocalStorage('lv:cover_subtitle', '')
const coverTitleFontSize = useLocalStorage('lv:cover_title_font_size', 120)
const coverSubtitleFontSize = useLocalStorage('lv:cover_subtitle_font_size', 80)

// ——— 处理状态 ———
const isLoading = ref(false)
const uploadPercent = ref(0)
const status = ref<'idle' | 'uploading' | 'processing' | 'done'>('idle')
const videoUrl = ref<string | null>(null)
const outputFilename = ref('')

const resolutionOptions = [
  { label: '横屏 1280×720（推荐，性能最佳）', value: '1280x720' },
  { label: '横屏 1920×1080（高负载，容易超时）', value: '1920x1080' },
]

const backgroundModeOptions = [
  { label: '视频背景', value: 'video' },
  { label: '图片背景', value: 'image' },
  { label: '纯色背景', value: 'color' },
]

// ——— LRC 预览分页 ———
const lrcPageSize = 30
const lrcPage = ref(1)
const pagedLrcLines = computed(() => {
  const start = (lrcPage.value - 1) * lrcPageSize
  return lrcLines.value.slice(start, start + lrcPageSize)
})

// ——— 文件处理 ———
function handleAudioChange(file: any) {
  audioFile.value = file.raw as File
  videoUrl.value = null
  status.value = 'idle'
}

async function handleLrcChange(file: any) {
  const raw = file.raw as File
  lrcFile.value = raw
  const text = await raw.text()
  lrcLines.value = parseLrcClient(text)
  lrcPage.value = 1
  if (lrcLines.value.length === 0) {
    ElMessage.warning('未能从该文件中解析到歌词，请检查文件格式')
  } else {
    ElMessage.success(`成功解析 ${lrcLines.value.length} 行歌词`)
  }
}

// ——— 合成 ———
async function handleGenerate() {
  if (!audioFile.value) { ElMessage.warning('请先上传音频文件'); return }
  if (!lrcFile.value) { ElMessage.warning('请先上传 LRC 歌词文件'); return }
  if (lrcLines.value.length === 0) { ElMessage.warning('歌词文件解析失败，请检查格式后重新上传'); return }

  // 调试：打印当前 linesMode 值
  console.log('[DEBUG] linesMode.value:', linesMode.value, typeof linesMode.value)
  console.log('[DEBUG] 所有参数:', {
    lines_mode: linesMode.value,
    wrap_mode: wrapMode.value,
    max_chars_per_line: maxCharsPerLine.value,
  })

  isLoading.value = true
  status.value = 'uploading'
  uploadPercent.value = 0
  videoUrl.value = null

  try {
    const blob = await generateLyricVideo(
      {
        audio: audioFile.value,
        lrc: lrcFile.value,
        bg_color: bgColor.value,
        background_mode: backgroundMode.value,
        font_size: fontSize.value,
        sung_color: sungColor.value,
        unsung_color: unsungColor.value,
        stroke_color: strokeColor.value,
        stroke_width: strokeWidth.value,
        resolution: resolution.value,
        remove_vocals: removeVocals.value,
        letter_spacing: letterSpacing.value,
        line_gap_ratio: lineGapRatio.value,
        wrap_mode: wrapMode.value,
        max_chars_per_line: maxCharsPerLine.value,
        lines_mode: linesMode.value,
        cover_title: coverTitle.value,
        cover_subtitle: coverSubtitle.value,
        cover_title_font_size: coverTitleFontSize.value,
        cover_subtitle_font_size: coverSubtitleFontSize.value,
      },
      (percent) => {
        uploadPercent.value = percent
        if (percent >= 100) status.value = 'processing'
      },
    )
    const base = audioFile.value.name.replace(/\.[^.]+$/, '')
    outputFilename.value = `${base}_lyrics_video.mp4`
    videoUrl.value = URL.createObjectURL(blob)
    status.value = 'done'
    ElMessage.success('歌词视频合成完成！')
    // 滚动到预览区
    setTimeout(() => {
      document.getElementById('video-preview-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  } catch {
    status.value = 'idle'
  } finally {
    isLoading.value = false
  }
}

function downloadVideo() {
  if (!videoUrl.value) return
  const a = document.createElement('a')
  a.href = videoUrl.value
  a.download = outputFilename.value
  a.click()
}

const statusText = computed(() => {
  if (status.value === 'uploading') return `上传中 ${uploadPercent.value}%`
  if (status.value === 'processing') return '正在合成视频，请稍候...'
  return ''
})
</script>

<template>
  <div class="px-4 py-6 md:py-10 mx-auto max-w-6xl w-full box-border overflow-x-hidden animate-fade-in">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:music-note-2-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2 class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate">
          歌词视频合成
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1">
          上传音频 + LRC 歌词，生成带大字幕提词的 MP4 视频 · 支持三行滚动/两行居中
        </p>
      </div>
    </div>

    <!-- ===== 上传 + 设置 两栏布局 ===== -->
    <el-row :gutter="24">
      <!-- 左侧：上传区 + 歌词预览 -->
      <el-col :xs="24" :lg="14" class="mb-6 lg:mb-0">
        <div class="flex flex-col gap-5">
          <!-- 音频上传 -->
          <el-card shadow="hover" class="border-slate-200 rounded-2xl custom-card">
            <template #header>
              <div class="flex items-center gap-2 font-bold text-slate-800">
                <Icon icon="solar:music-notes-bold-duotone" class="text-violet-500 text-lg" />
                音频文件
              </div>
            </template>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="audio/*"
              drag
              @change="handleAudioChange"
            >
              <div class="py-6 flex flex-col items-center gap-3">
                <div
                  v-if="!audioFile"
                  class="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center"
                >
                  <Icon icon="solar:upload-minimalistic-bold-duotone" class="text-3xl text-violet-400" />
                </div>
                <Icon v-else icon="solar:music-note-bold-duotone" class="text-4xl text-violet-500" />
                <div class="text-center">
                  <p class="text-slate-700 font-semibold">
                    {{ audioFile ? audioFile.name : '拖放音频文件或点击上传' }}
                  </p>
                  <p class="text-slate-400 text-xs mt-1">支持 MP3、WAV、FLAC、AAC、OGG 等格式</p>
                </div>
              </div>
            </el-upload>
          </el-card>

          <!-- LRC 上传 -->
          <el-card shadow="hover" class="border-slate-200 rounded-2xl custom-card">
            <template #header>
              <div class="flex items-center gap-2 font-bold text-slate-800">
                <Icon icon="solar:document-text-bold-duotone" class="text-fuchsia-500 text-lg" />
                LRC 歌词文件
              </div>
            </template>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".lrc,.txt"
              drag
              @change="handleLrcChange"
            >
              <div class="py-5 flex flex-col items-center gap-3">
                <div
                  v-if="!lrcFile"
                  class="w-14 h-14 rounded-2xl bg-fuchsia-50 flex items-center justify-center"
                >
                  <Icon icon="solar:document-add-bold-duotone" class="text-3xl text-fuchsia-400" />
                </div>
                <Icon v-else icon="solar:document-text-bold-duotone" class="text-4xl text-fuchsia-500" />
                <div class="text-center">
                  <p class="text-slate-700 font-semibold">
                    {{ lrcFile ? lrcFile.name : '拖放 .lrc 文件或点击上传' }}
                  </p>
                  <p class="text-slate-400 text-xs mt-1">标准 LRC 格式，[mm:ss.xx] 时间标签</p>
                </div>
              </div>
            </el-upload>

            <!-- 歌词预览 -->
            <template v-if="lrcLines.length > 0">
              <el-divider class="!my-3" />
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-bold text-slate-700">
                  <Icon icon="solar:eye-bold-duotone" class="text-fuchsia-400 inline mr-1" />
                  歌词预览（共 {{ lrcLines.length }} 行）
                </span>
              </div>
              <div class="lyric-preview rounded-xl overflow-hidden">
                <div
                  v-for="(line, idx) in pagedLrcLines"
                  :key="idx"
                  class="lyric-row flex items-start gap-3 px-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <span class="text-slate-400 text-xs font-mono w-10 flex-shrink-0 pt-0.5">
                    {{ formatTime(line.time) }}
                  </span>
                  <span class="text-slate-700 text-sm leading-snug">{{ line.text }}</span>
                </div>
              </div>
              <div class="flex justify-center mt-3" v-if="lrcLines.length > lrcPageSize">
                <el-pagination
                  v-model:current-page="lrcPage"
                  :page-size="lrcPageSize"
                  :total="lrcLines.length"
                  layout="prev, pager, next"
                  small
                />
              </div>
            </template>
          </el-card>
        </div>
      </el-col>

      <!-- 右侧：合成设置 -->
      <el-col :xs="24" :lg="10">
        <el-card shadow="hover" class="border-slate-200 rounded-2xl custom-card" style="position: sticky; top: 24px;">
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon icon="solar:settings-bold-duotone" class="text-violet-500 text-lg" />
              合成设置
            </div>
          </template>

          <el-form label-position="top" class="flex flex-col gap-1">
            <!-- 视频分辨率 -->
            <el-form-item label="视频分辨率">
              <el-select v-model="resolution" class="w-full">
                <el-option
                  v-for="opt in resolutionOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="背景类型">
              <el-segmented v-model="backgroundMode" :options="backgroundModeOptions" class="w-full" />
              <p class="text-xs text-slate-400 mt-2">
                <span v-if="backgroundMode === 'video'">优先使用内置背景视频，失败时自动回退到图片或动态光晕</span>
                <span v-else-if="backgroundMode === 'image'">每 10 秒获取一张随机背景图，并加暗化蒙层</span>
                <span v-else>使用你选择的背景颜色生成纯色底图</span>
              </p>
            </el-form-item>

            <!-- 背景颜色 -->
            <el-form-item label="背景颜色">
              <div class="flex items-center gap-3 w-full">
                <el-color-picker v-model="bgColor" />
                <el-input v-model="bgColor" placeholder="#0a0a1a" class="flex-1 font-mono text-sm" />
                <div class="flex gap-1.5">
                  <button
                    type="button"
                    v-for="c in ['#000000', '#1a1a1a', '#1a0533', '#0d1f3c', '#0f2010']"
                    :key="c"
                    class="w-6 h-6 rounded-md border-2 transition-transform hover:scale-110 active:scale-95"
                    :class="bgColor.toLowerCase() === c.toLowerCase() ? 'border-violet-500 scale-110' : 'border-slate-300'"
                    :style="{ background: c }"
                    @click="bgColor = c"
                  />
                </div>
              </div>
            </el-form-item>

            <!-- 字体大小 -->
            <el-form-item>
              <template #label>
                <span>字体大小 <span class="font-bold text-violet-600">{{ fontSize }}px</span></span>
              </template>
              <el-slider v-model="fontSize" :min="40" :max="220" :step="4" class="w-full" />
            </el-form-item>

            <!-- 字符间距 -->
            <el-form-item>
              <template #label>
                <span>字符间距 <span class="font-bold text-violet-600">{{ letterSpacing }}px</span></span>
              </template>
              <el-slider v-model="letterSpacing" :min="0" :max="24" :step="1" class="w-full" />
            </el-form-item>

            <!-- 行间距 -->
            <el-form-item>
              <template #label>
                <span>行间距 <span class="font-bold text-violet-600">{{ lineGapRatio }}×</span></span>
              </template>
              <el-slider v-model="lineGapRatio" :min="1.0" :max="3.0" :step="0.1" class="w-full" />
            </el-form-item>

            <!-- 换行模式 -->
            <el-form-item label="歌词换行">
              <div class="flex items-center gap-3 w-full">
                <el-radio-group v-model="wrapMode" size="small">
                  <el-radio-button value="auto">自动换行</el-radio-button>
                  <el-radio-button value="chars">指定字数</el-radio-button>
                </el-radio-group>
                <el-input-number
                  v-if="wrapMode === 'chars'"
                  v-model="maxCharsPerLine"
                  :min="4"
                  :max="20"
                  :step="1"
                  size="small"
                  class="!w-20"
                  controls-position="right"
                />
                <span v-if="wrapMode === 'chars'" class="text-slate-400 text-sm">字/行</span>
              </div>
              <p v-if="wrapMode === 'auto'" class="text-xs text-slate-400 mt-1">根据视频宽度、字号和间距自动计算每行字符数</p>
              <p v-if="wrapMode === 'chars'" class="text-xs text-slate-400 mt-1">超出指定字数时自动换行，例如 11 字/行</p>
            </el-form-item>

            <!-- 歌词行数模式 -->
            <el-form-item label="歌词显示">
              <div class="flex items-center gap-3 w-full">
                <el-radio-group v-model="linesMode" size="small">
                  <el-radio-button value="3">三行滚动</el-radio-button>
                  <el-radio-button value="2">两行居中</el-radio-button>
                </el-radio-group>
              </div>
              <p v-if="linesMode === '3'" class="text-xs text-slate-400 mt-1">三行滚动显示，上下行灰色淡化，中间行卡拉OK高亮</p>
              <p v-if="linesMode === '2'" class="text-xs text-slate-400 mt-1">两行居中显示，相同大小和颜色，唱完消失后显示下一句</p>
            </el-form-item>

            <!-- 封面文字设置 -->
            <el-form-item>
              <template #label>
                <span class="font-bold text-slate-700">
                  <Icon icon="solar:document-text-bold-duotone" class="text-fuchsia-500 inline mr-1" />
                  封面文字（插入在歌词前面）
                </span>
              </template>
              <div class="cover-text-settings flex flex-col gap-3">
                <!-- 封面标题 -->
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500 flex-shrink-0 w-12">标题</span>
                  <el-input v-model="coverTitle" placeholder="输入封面标题文字" clearable class="flex-1" />
                </div>
                <!-- 封面标题字号 -->
                <div class="flex items-center gap-2" v-if="coverTitle">
                  <span class="text-xs text-slate-500 flex-shrink-0 w-12">标题字号</span>
                  <el-slider v-model="coverTitleFontSize" :min="60" :max="200" :step="4" class="flex-1" />
                  <span class="text-xs text-violet-600 font-mono w-10 text-right">{{ coverTitleFontSize }}px</span>
                </div>
                <!-- 封面副标题 -->
                <div class="flex items-center gap-2">
                  <span class="text-xs text-slate-500 flex-shrink-0 w-12">副标题</span>
                  <el-input v-model="coverSubtitle" placeholder="输入封面副标题文字" clearable class="flex-1" />
                </div>
                <!-- 封面副标题字号 -->
                <div class="flex items-center gap-2" v-if="coverSubtitle">
                  <span class="text-xs text-slate-500 flex-shrink-0 w-12">副标题字号</span>
                  <el-slider v-model="coverSubtitleFontSize" :min="40" :max="160" :step="4" class="flex-1" />
                  <span class="text-xs text-violet-600 font-mono w-10 text-right">{{ coverSubtitleFontSize }}px</span>
                </div>
              </div>
              <p class="text-xs text-slate-400 mt-1">封面文字将显示在视频开头，留空则跳过封面页</p>
            </el-form-item>

            <!-- 歌词颜色：已唱 + 未唱 -->
            <el-form-item label="歌词颜色">
              <div class="flex flex-col gap-3">
                <!-- 已唱颜色 -->
                <div class="flex items-center gap-3">
                  <span class="text-sm text-slate-500 flex-shrink-0 w-14">已唱</span>
                  <el-color-picker v-model="sungColor" />
                  <el-input v-model="sungColor" placeholder="#ff4d4d" class="flex-1 font-mono text-sm" />
                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      v-for="c in ['#ff4d4d', '#ff8533', '#ffe600', '#ff69b4', '#c084fc']"
                      :key="c"
                      class="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                      :class="sungColor === c ? 'border-violet-500 scale-110' : 'border-transparent'"
                      :style="{ background: c, boxShadow: '0 0 0 1px #e2e8f0' }"
                      @click="sungColor = c"
                    />
                  </div>
                </div>
                <!-- 未唱颜色 -->
                <div class="flex items-center gap-3">
                  <span class="text-sm text-slate-500 flex-shrink-0 w-14">未唱</span>
                  <el-color-picker v-model="unsungColor" />
                  <el-input v-model="unsungColor" placeholder="#ffffff" class="flex-1 font-mono text-sm" />
                  <div class="flex gap-1.5">
                    <button
                      type="button"
                      v-for="c in ['#ffffff', '#e0e0e0', '#ffe600', '#74f5b8', '#7eb3ff']"
                      :key="c"
                      class="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                      :class="unsungColor === c ? 'border-violet-500 scale-110' : 'border-transparent'"
                      :style="{ background: c, boxShadow: '0 0 0 1px #e2e8f0' }"
                      @click="unsungColor = c"
                    />
                  </div>
                </div>
              </div>
            </el-form-item>

            <!-- 描边 -->
            <el-form-item label="描边设置">
              <div class="flex items-center gap-3 w-full">
                <el-color-picker v-model="strokeColor" />
                <span class="text-slate-500 text-sm flex-shrink-0">宽度</span>
                <el-input-number
                  v-model="strokeWidth"
                  :min="0" :max="12" :step="1"
                  class="!w-28"
                  controls-position="right"
                />
                <span class="text-slate-400 text-sm">px</span>
              </div>
            </el-form-item>

            <!-- 去除人声（已隐藏开关，改为提示） -->
            <el-form-item>
              <div
                class="w-full rounded-xl p-4 border border-amber-200 bg-amber-50/60"
              >
                <div class="flex items-center gap-2">
                  <Icon
                    icon="solar:info-circle-bold-duotone"
                    class="text-xl text-amber-500"
                  />
                  <div>
                    <p class="font-bold text-sm text-slate-800">需要去除人声？</p>
                    <p class="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      请先前往
                      <a href="https://vocalremover.org/zh/" target="_blank" rel="noopener noreferrer" class="text-violet-600 font-semibold underline underline-offset-2 hover:text-violet-700">vocalremover.org</a>
                      去人声，下载伴奏后再回来合成视频。
                    </p>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-form>

          <!-- 合成按钮 -->
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold mt-2"
            :class="!isLoading ? '!bg-gradient-to-r !from-violet-600 !to-fuchsia-500' : ''"
            :loading="isLoading"
            @click="handleGenerate"
          >
            <template v-if="!isLoading">
              <Icon icon="solar:play-circle-bold-duotone" class="mr-2 text-xl" />
              开始合成
            </template>
            <template v-else>{{ statusText }}</template>
          </el-button>

          <!-- 上传进度 -->
          <transition name="fade">
            <div v-if="isLoading && status === 'uploading'" class="mt-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>上传中...</span><span>{{ uploadPercent }}%</span>
              </div>
              <el-progress :percentage="uploadPercent" :show-text="false" striped striped-flow />
            </div>
          </transition>

          <!-- 合成中（不显示进度百分比，后端无真实进度） -->
          <transition name="fade">
            <div v-if="isLoading && status === 'processing'" class="mt-4">
              <div class="processing-bar rounded-xl p-3 flex items-center gap-3">
                <span class="spinner w-4 h-4 rounded-full border-2 border-violet-300 border-t-violet-600 flex-shrink-0" />
                <div class="flex flex-col">
                  <span class="text-sm text-violet-700 font-medium">正在合成视频...</span>
                  <span class="text-xs text-slate-400">预计需要 30-60 秒，请耐心等待</span>
                </div>
              </div>
            </div>
          </transition>
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 独立视频预览区（合成完成后展示） ===== -->
    <transition name="slide-up">
      <div
        v-if="status === 'done' && videoUrl"
        id="video-preview-section"
        class="mt-8"
      >
        <!-- 分割线标题 -->
        <div class="flex items-center gap-3 mb-5">
          <div class="h-px flex-1 bg-gradient-to-r from-transparent to-emerald-200" />
          <div class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Icon icon="solar:check-circle-bold-duotone" class="text-emerald-500 text-lg" />
            <span class="text-emerald-700 font-bold text-sm">合成完成，即可预览与下载</span>
          </div>
          <div class="h-px flex-1 bg-gradient-to-l from-transparent to-emerald-200" />
        </div>

        <!-- 预览卡片（全宽） -->
        <div class="preview-card rounded-3xl overflow-hidden border border-slate-200 shadow-xl">
          <!-- 顶部工具栏 -->
          <div class="preview-toolbar flex items-center justify-between px-5 py-3">
            <div class="flex items-center gap-2">
              <Icon icon="solar:clapperboard-play-bold-duotone" class="text-white/70 text-lg" />
              <span class="text-white/80 text-sm font-semibold truncate max-w-64">{{ outputFilename }}</span>
            </div>
            <!-- 下载按钮 -->
            <button
              class="download-btn flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
              @click="downloadVideo"
            >
              <Icon icon="solar:download-bold-duotone" class="text-lg" />
              下载视频
            </button>
          </div>

          <!-- 视频播放器 -->
          <div class="video-wrapper flex items-center justify-center bg-black">
            <video
              :src="videoUrl"
              controls
              class="preview-video"
              preload="metadata"
            />
          </div>

          <!-- 底部下载区 -->
          <div class="preview-footer flex items-center justify-between px-5 py-4">
            <div class="text-white/60 text-xs">
              <Icon icon="solar:info-circle-bold-duotone" class="inline mr-1" />
              {{ linesMode === '3' ? '歌词三行滚动 · 中间行高亮 · 上下行淡色' : '歌词两行居中 · 相同大小颜色 · 唱完消失' }}
            </div>
            <button
              class="download-btn-lg flex items-center gap-3 px-8 py-3 rounded-2xl font-bold text-base transition-all hover:scale-105 active:scale-95 shadow-lg"
              @click="downloadVideo"
            >
              <Icon icon="solar:download-minimalistic-bold-duotone" class="text-xl" />
              下载 MP4 视频
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* 页面淡入 */
.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

/* El Card */
.custom-card { --el-card-padding: 1.25rem; }
:deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; }
:deep(.el-upload-dragger) { border-radius: 1rem; border-color: #e2e8f0; background: #f8fafc; }
:deep(.el-upload-dragger:hover) { border-color: #8b5cf6; background: #f5f3ff; }

/* 歌词预览 */
.lyric-preview {
  background: #f8fafc;
  border: 1px solid #e8edf5;
  max-height: 280px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c4b5fd transparent;
}
.lyric-row:nth-child(even) { background: #f0f4ff; }

/* 处理中条 */
.processing-bar { background: linear-gradient(135deg, #f5f3ff, #ede9fe); border: 1px solid #c4b5fd; }
.spinner { display: inline-block; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 视频预览卡片 */
.preview-card {
  background: #0f0f1a;
}
.preview-toolbar {
  background: rgba(139, 92, 246, 0.15);
  border-bottom: 1px solid rgba(139, 92, 246, 0.2);
  backdrop-filter: blur(12px);
}
.preview-footer {
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.video-wrapper {
  min-height: 320px;
  max-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.preview-video {
  display: block;
  max-width: 100%;
  max-height: 70vh;
  width: 100%;
  height: auto;
  object-fit: contain;
  background: #000;
}

/* 下载按钮 */
.download-btn {
  background: linear-gradient(135deg, #8b5cf6, #ec4899);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}
.download-btn:hover {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
}
.download-btn-lg {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
}
.download-btn-lg:hover {
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.6);
}

/* 进度条 */
:deep(.el-progress-bar__inner) {
  background: linear-gradient(90deg, #8b5cf6, #ec4899);
}
/* 颜色选择器 */
:deep(.el-color-picker__trigger) {
  width: 36px !important;
  height: 36px !important;
  border-radius: 10px !important;
}

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-up-enter-from { opacity: 0; transform: translateY(24px); }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.25s ease; overflow: hidden; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; max-height: 80px; }
</style>
