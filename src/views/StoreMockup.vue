<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'
import ToolUploader from '@/components/ToolUploader.vue'

const PRESET_SIZES = [
  { name: 'iOS iPhone (6.7")', width: 1290, height: 2796 },
  { name: 'iOS iPhone (6.5")', width: 1242, height: 2688 },
  { name: 'iOS iPad Pro (12.9")', width: 2048, height: 2732 },
  { name: 'Android Phone', width: 1080, height: 1920 },
  { name: 'Android Tablet', width: 1600, height: 2560 },
]

const PRESET_COLORS = [
  '#4F46E5',
  '#7C3AED',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#D946EF',
  '#F43F5E',
  '#FB923C',
  '#22C55E',
  '#06B6D4',
  '#000000',
  '#FFFFFF',
  '#334155',
  '#94A3B8',
]

const STORAGE_KEY = 'designkit_store_mockup_data'

interface MockupItem {
  id: string
  screenshotFile: File | null
  screenshotUrl: string | null
  headline: string
  subheadline: string
}

const mockupList = ref<MockupItem[]>([])
const backgroundFile = ref<File | null>(null)
const backgroundUrl = ref<string | null>(null)

const canvasWidth = ref(1290)
const canvasHeight = ref(2796)
const backgroundColor = ref('#4F46E5')
const textColor = ref('#FFFFFF')
const fontSize = ref(80)
const subFontSize = ref(40)
const imageScale = ref(0.8)
const imageMaxHeightPercent = ref(65)
const imageOffsetY = ref(0)

const completedMockupCount = computed(
  () => mockupList.value.filter((item) => Boolean(item.screenshotUrl)).length
)

const currentPresetName = computed(() => {
  const matchedPreset = PRESET_SIZES.find(
    (preset) =>
      preset.width === canvasWidth.value && preset.height === canvasHeight.value
  )
  return matchedPreset?.name || '自定义尺寸'
})

const backgroundModeText = computed(() =>
  backgroundUrl.value ? '背景图模式' : '纯色背景模式'
)

const saveToLocal = () => {
  const data = {
    canvasWidth: canvasWidth.value,
    canvasHeight: canvasHeight.value,
    backgroundColor: backgroundColor.value,
    textColor: textColor.value,
    fontSize: fontSize.value,
    subFontSize: subFontSize.value,
    imageScale: imageScale.value,
    imageMaxHeightPercent: imageMaxHeightPercent.value,
    imageOffsetY: imageOffsetY.value,
    mockups: mockupList.value.map((item) => ({
      headline: item.headline,
      subheadline: item.subheadline,
    })),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const loadFromLocal = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return

  try {
    const data = JSON.parse(saved)
    canvasWidth.value = data.canvasWidth || 1290
    canvasHeight.value = data.canvasHeight || 2796
    backgroundColor.value = data.backgroundColor || '#4F46E5'
    textColor.value = data.textColor || '#FFFFFF'
    fontSize.value = data.fontSize || 80
    subFontSize.value = data.subFontSize || 40
    imageScale.value = data.imageScale || 0.8
    imageMaxHeightPercent.value = data.imageMaxHeightPercent || 65
    imageOffsetY.value = data.imageOffsetY || 0

    if (data.mockups) {
      mockupList.value = data.mockups.map((item: any, idx: number) => ({
        id: `${Date.now()}_${idx}`,
        screenshotFile: null,
        screenshotUrl: null,
        headline: item.headline,
        subheadline: item.subheadline,
      }))
    }
  } catch (error) {
    console.error('Load fail', error)
  }
}

const resetAll = () => {
  mockupList.value.forEach((item) => {
    if (item.screenshotUrl) URL.revokeObjectURL(item.screenshotUrl)
  })

  mockupList.value = []
  backgroundFile.value = null

  if (backgroundUrl.value) URL.revokeObjectURL(backgroundUrl.value)

  backgroundUrl.value = null
  backgroundColor.value = '#4F46E5'
  textColor.value = '#FFFFFF'
  localStorage.removeItem(STORAGE_KEY)
  ElMessage.success('已重置所有数据')
}

const canvasRefs = ref<(HTMLCanvasElement | null)[]>([])

const setCanvasRef = (el: any, index: number) => {
  if (el) canvasRefs.value[index] = el
}

const isExporting = ref(false)

const handleBackgroundUpdate = (files: File | File[] | null) => {
  const file = Array.isArray(files) ? files[0] : files

  if (backgroundUrl.value) URL.revokeObjectURL(backgroundUrl.value)

  if (file) {
    backgroundFile.value = file
    backgroundUrl.value = URL.createObjectURL(file)
  } else {
    backgroundFile.value = null
    backgroundUrl.value = null
  }
}

const handleBatchImport = async (
  filesValue: File | File[] | null | undefined
) => {
  if (!filesValue) return

  const files = Array.isArray(filesValue) ? filesValue : [filesValue]
  if (files.length === 0) return

  const newList: MockupItem[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file) continue

    newList.push({
      id: (Date.now() + Math.random() * 100000).toString(),
      screenshotFile: file,
      screenshotUrl: URL.createObjectURL(file),
      headline: `主标题 ${mockupList.value.length + newList.length + 1}`,
      subheadline: '这里是副标题描写',
    })
  }

  mockupList.value.push(...newList)
  await nextTick()
  drawAll()
  ElMessage.success(`成功导入 ${files.length} 张截图`)
}

const replaceScreenshot = (index: number, file: File) => {
  const item = mockupList.value[index]
  if (!item) return

  if (item.screenshotUrl) URL.revokeObjectURL(item.screenshotUrl)

  item.screenshotFile = file
  item.screenshotUrl = URL.createObjectURL(file)
  drawPage(index)
}

const removeMockup = (index: number) => {
  const item = mockupList.value[index]
  if (item?.screenshotUrl) URL.revokeObjectURL(item.screenshotUrl)
  mockupList.value.splice(index, 1)
}

const applyPreset = (preset: (typeof PRESET_SIZES)[0]) => {
  canvasWidth.value = preset.width
  canvasHeight.value = preset.height
}

const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

const drawPage = async (index: number) => {
  const canvas = canvasRefs.value[index]
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const item = mockupList.value[index]
  if (!item) return

  canvas.width = canvasWidth.value
  canvas.height = canvasHeight.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (backgroundUrl.value) {
    try {
      const bgImg = await loadImage(backgroundUrl.value)
      const scale = Math.max(
        canvas.width / bgImg.width,
        canvas.height / bgImg.height
      )
      const x = canvas.width / 2 - (bgImg.width / 2) * scale
      const y = canvas.height / 2 - (bgImg.height / 2) * scale
      ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale)
    } catch (error) {
      console.error('BG load fail', error)
    }
  } else {
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.fillStyle = textColor.value
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `bold ${fontSize.value}px "Inter", "PingFang SC", sans-serif`
  ctx.fillText(item.headline, canvas.width / 2, 160)

  ctx.font = `${subFontSize.value}px "Inter", "PingFang SC", sans-serif`
  ctx.globalAlpha = 0.8
  ctx.fillText(item.subheadline, canvas.width / 2, 160 + fontSize.value + 40)
  ctx.globalAlpha = 1.0

  if (item.screenshotUrl) {
    try {
      const img = await loadImage(item.screenshotUrl)

      let displayWidth = canvas.width * imageScale.value
      let displayHeight = (img.height / img.width) * displayWidth

      const maxHeight = canvas.height * (imageMaxHeightPercent.value / 100)
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight
        displayWidth = (img.width / img.height) * displayHeight
      }

      const x = (canvas.width - displayWidth) / 2
      const textAreaHeight = 160 + fontSize.value + 40 + subFontSize.value + 60
      const availableHeight = canvas.height - textAreaHeight
      const y =
        textAreaHeight +
        (availableHeight - displayHeight) / 2 +
        imageOffsetY.value

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = 60
      ctx.shadowOffsetY = 30

      const radius = 60
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + displayWidth - radius, y)
      ctx.quadraticCurveTo(x + displayWidth, y, x + displayWidth, y + radius)
      ctx.lineTo(x + displayWidth, y + displayHeight - radius)
      ctx.quadraticCurveTo(
        x + displayWidth,
        y + displayHeight,
        x + displayWidth - radius,
        y + displayHeight
      )
      ctx.lineTo(x + radius, y + displayHeight)
      ctx.quadraticCurveTo(x, y + displayHeight, x, y + displayHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, x, y, displayWidth, displayHeight)
      ctx.restore()
    } catch (error) {
      console.error('Screenshot load fail', error)
    }
  }
}

const drawAll = async () => {
  await nextTick()
  for (let i = 0; i < mockupList.value.length; i++) {
    await drawPage(i)
  }
}

const exportAll = async () => {
  isExporting.value = true

  try {
    for (let i = 0; i < mockupList.value.length; i++) {
      const canvas = canvasRefs.value[i]
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `store-mockup-${i + 1}.png`
        link.href = dataUrl
        link.click()
      }
      await new Promise((resolve) => setTimeout(resolve, 400))
    }

    ElMessage.success('全部导出完成')
  } finally {
    isExporting.value = false
  }
}

watch(
  [
    mockupList,
    canvasWidth,
    canvasHeight,
    backgroundColor,
    textColor,
    fontSize,
    subFontSize,
    imageScale,
    imageMaxHeightPercent,
    imageOffsetY,
    backgroundUrl,
  ],
  async () => {
    await drawAll()
    saveToLocal()
  },
  { deep: true }
)

onMounted(async () => {
  loadFromLocal()
  await nextTick()
  await drawAll()
  setTimeout(drawAll, 100)
})

onUnmounted(() => {
  mockupList.value.forEach((item) => {
    if (item.screenshotUrl) URL.revokeObjectURL(item.screenshotUrl)
  })

  if (backgroundUrl.value) URL.revokeObjectURL(backgroundUrl.value)
})
</script>

<template>
  <div
    class="store-mockup-page px-4 sm:px-6 lg:px-8 xl:px-12 py-6 md:py-10 mx-auto w-full box-border"
  >
    <PageHeader
      title="上架图快速生成"
      description="批量导入截图，统一设置画布与文字样式，快速导出整套应用商店展示图。"
      icon="solar:gallery-edit-bold-duotone"
      class="!mb-6"
    />

    <div
      class="mb-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4 text-sm text-blue-700"
    >
      <Icon
        icon="solar:lightbulb-bold-duotone"
        class="text-xl shrink-0 text-amber-500"
      />
      <div class="leading-relaxed">
        可以先将截图带壳，更好看。在线转换：
        <a
          href="https://mockuphone.com/type/all/"
          target="_blank"
          class="font-bold text-blue-600 underline hover:text-blue-700 transition-colors"
        >
          https://mockuphone.com/type/all/
        </a>
      </div>
    </div>

    <div
      v-if="mockupList.length === 0"
      class="init-container rounded-[36px] border border-slate-200/80 bg-white/90 shadow-[0_24px_80px_rgba(15,23,42,0.08)] overflow-hidden animate-fade-in"
    >
      <div class="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div class="relative px-6 py-10 md:px-10 md:py-14 lg:px-12">
          <div
            class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.14),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_42%)] pointer-events-none"
          ></div>
          <div class="relative z-10 max-w-2xl">
            <h2
              class="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight mb-4"
            >
              先导入截图，
              <span
                class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600"
              >
                再统一生成整套上架图
              </span>
            </h2>
            <p
              class="max-w-xl text-sm md:text-base leading-7 text-slate-500 mb-8"
            >
              支持一次拖入多张截图，统一控制尺寸、配色、字号、背景和图片缩放，减少来回修图与重复排版时间。
            </p>

            <div class="mb-8 grid gap-4 sm:grid-cols-3">
              <div
                class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div
                  class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <Icon
                    icon="solar:layers-bold-duotone"
                    class="text-lg text-blue-500"
                  />
                  批量导入
                </div>
                <p class="text-xs leading-6 text-slate-500">
                  一次上传多张截图，自动生成多页卡片。
                </p>
              </div>
              <div
                class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div
                  class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <Icon
                    icon="solar:palette-round-bold-duotone"
                    class="text-lg text-violet-500"
                  />
                  全局样式
                </div>
                <p class="text-xs leading-6 text-slate-500">
                  一处调色、一处改字号，所有页面同步更新。
                </p>
              </div>
              <div
                class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
              >
                <div
                  class="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <Icon
                    icon="solar:download-bold-duotone"
                    class="text-lg text-emerald-500"
                  />
                  批量导出
                </div>
                <p class="text-xs leading-6 text-slate-500">
                  按页面顺序连续导出 PNG，适合直接交付。
                </p>
              </div>
            </div>

            <ToolUploader
              :modelValue="null"
              multiple
              accept="image/*"
              empty-icon="solar:upload-minimalistic-bold-duotone"
              empty-text="点击或拖拽上传多张截图"
              hint="支持多份 JPG / PNG / WebP 格式图片"
              @update:modelValue="handleBatchImport"
            />
          </div>
        </div>

        <div
          class="border-t border-slate-200 bg-slate-50/80 px-6 py-8 md:px-8 lg:border-l lg:border-t-0 lg:py-12"
        >
          <div class="space-y-4">
            <div class="rounded-2xl border border-slate-200 bg-white p-5">
              <div
                class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800"
              >
                <Icon
                  icon="solar:confetti-minimalistic-bold-duotone"
                  class="text-lg text-amber-500"
                />
                推荐流程
              </div>
              <ol class="space-y-3 text-sm text-slate-500 leading-6">
                <li>1. 批量上传原始截图，自动生成页面卡片。</li>
                <li>2. 选择商店尺寸预设，设置背景和文字样式。</li>
                <li>3. 微调每页标题与截图内容，最后批量导出。</li>
              </ol>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-white p-5">
              <div
                class="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800"
              >
                <Icon
                  icon="solar:smartphone-bold-duotone"
                  class="text-lg text-blue-500"
                />
                常用预设
              </div>
              <div class="flex flex-wrap gap-2">
                <el-tag
                  v-for="preset in PRESET_SIZES"
                  :key="preset.name"
                  effect="plain"
                  round
                  class="!mx-0 cursor-pointer"
                  @click="applyPreset(preset)"
                >
                  {{ preset.name }}
                </el-tag>
              </div>
            </div>

            <div
              class="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 text-sm text-emerald-700"
            >
              <div class="mb-2 flex items-center gap-2 font-bold">
                <Icon icon="solar:shield-check-bold-duotone" class="text-lg" />
                当前页面仅在浏览器本地生成
              </div>
              <p class="leading-6 opacity-90">
                页面会缓存文案与配置，但不会把截图本身写入本地存储；刷新后如需恢复预览，请重新上传对应截图。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6 animate-fade-in">
      <div class="flex flex-col gap-8">
        <!-- 顶部设置区 -->
        <div class="flex flex-col gap-6">
          <!-- 上排：文件与导出区，横向两列 -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ToolSettingsCard
              card-title="截图与页面"
              card-title-icon="solar:documents-bold-duotone"
              class="h-full"
            >
              <div class="space-y-4 h-full flex flex-col">
                <ToolUploader
                  :modelValue="null"
                  multiple
                  compact
                  accept="image/*"
                  empty-icon="solar:upload-minimalistic-bold-duotone"
                  empty-text="继续添加截图"
                  hint="可多选追加，自动生成新的页面卡片"
                  class="flex-1"
                  min-height="min-h-[140px]"
                  @update:modelValue="handleBatchImport"
                />

                <div class="grid grid-cols-2 gap-3 mt-auto">
                  <div
                    class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div class="text-xs font-bold tracking-wide text-slate-500">
                      页面总数
                    </div>
                    <div class="mt-2 text-2xl font-black text-slate-900">
                      {{ mockupList.length }}
                    </div>
                  </div>
                  <div
                    class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div class="text-xs font-bold tracking-wide text-slate-500">
                      待补截图
                    </div>
                    <div class="mt-2 text-2xl font-black text-slate-900">
                      {{ mockupList.length - completedMockupCount }}
                    </div>
                  </div>
                </div>
              </div>
            </ToolSettingsCard>

            <ToolSettingsCard
              card-title="背景与导出"
              card-title-icon="solar:gallery-wide-bold-duotone"
              class="h-full"
            >
              <div class="space-y-4 h-full flex flex-col">
                <div
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-sm font-bold text-slate-800"
                      >当前模式</span
                    >
                    <el-tag round effect="light" size="small">
                      {{ backgroundModeText }}
                    </el-tag>
                  </div>
                  <p class="text-xs leading-6 text-slate-500">
                    上传背景图后将覆盖纯色背景；不上传时使用左侧选中的背景色。
                  </p>
                </div>

                <ToolUploader
                  :modelValue="backgroundFile"
                  compact
                  empty-icon="solar:gallery-add-bold"
                  empty-text="上传背景图"
                  hint="建议使用大图，避免导出后模糊"
                  class="flex-1"
                  min-height="min-h-[140px]"
                  @update:modelValue="handleBackgroundUpdate"
                />
              </div>

              <template #action>
                <div class="grid grid-cols-2 gap-3 w-full">
                  <el-button
                    type="primary"
                    size="large"
                    class="w-full !m-0 !h-12 !rounded-2xl !font-bold shadow-lg shadow-blue-500/20"
                    :loading="isExporting"
                    @click="exportAll"
                  >
                    批量导出全部 {{ mockupList.length }} 张图
                  </el-button>

                  <el-popconfirm
                    title="确定要重置并清空所有页面和配置吗？"
                    @confirm="resetAll"
                    width="200"
                    hide-icon
                  >
                    <template #reference>
                      <el-button
                        size="large"
                        class="w-full !m-0 !h-12 !rounded-2xl !font-bold text-slate-600"
                      >
                        重置配置
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </template>
            </ToolSettingsCard>
          </div>

          <!-- 下排：画布与样式，内部三列横排 -->
          <ToolSettingsCard
            card-title="全局画布与样式"
            card-title-icon="solar:palette-round-bold-duotone"
          >
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- 左侧：尺寸设置 -->
              <div class="space-y-6">
                <div>
                  <div
                    class="mb-3 text-xs font-bold tracking-wide text-slate-500"
                  >
                    商店规格预设
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <el-button
                      v-for="preset in PRESET_SIZES"
                      :key="preset.name"
                      size="small"
                      :type="
                        canvasWidth === preset.width &&
                        canvasHeight === preset.height
                          ? 'primary'
                          : undefined
                      "
                      plain
                      round
                      class="!m-0"
                      @click="applyPreset(preset)"
                    >
                      {{ preset.name }}
                    </el-button>
                  </div>
                </div>

                <div
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div
                    class="mb-4 text-xs font-bold tracking-wide text-slate-500"
                  >
                    自定义画布尺寸
                  </div>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div
                        class="mb-2 text-xs font-bold tracking-wide text-slate-500"
                      >
                        画布宽度
                      </div>
                      <el-input-number
                        v-model="canvasWidth"
                        :min="100"
                        :step="10"
                        controls-position="right"
                        class="!w-full"
                      />
                    </div>
                    <div>
                      <div
                        class="mb-2 text-xs font-bold tracking-wide text-slate-500"
                      >
                        画布高度
                      </div>
                      <el-input-number
                        v-model="canvasHeight"
                        :min="100"
                        :step="10"
                        controls-position="right"
                        class="!w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- 中间：颜色配置 -->
              <div class="space-y-6">
                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <span class="text-xs font-bold tracking-wide text-slate-500"
                      >背景色板</span
                    >
                    <div class="flex items-center gap-2">
                      <el-color-picker v-model="backgroundColor" size="small" />
                      <span class="text-xs font-mono text-slate-400">{{
                        backgroundColor
                      }}</span>
                    </div>
                  </div>
                  <div class="color-grid !gap-2">
                    <button
                      v-for="color in PRESET_COLORS"
                      :key="color"
                      type="button"
                      class="color-dot"
                      :class="backgroundColor === color ? 'is-active' : ''"
                      :style="{ backgroundColor: color }"
                      @click="backgroundColor = color"
                    ></button>
                  </div>
                </div>

                <div class="pt-2">
                  <div class="mb-3 flex items-center justify-between">
                    <span class="text-xs font-bold tracking-wide text-slate-500"
                      >文字颜色</span
                    >
                    <div class="flex items-center gap-2">
                      <el-color-picker v-model="textColor" size="small" />
                      <span class="text-xs font-mono text-slate-400">{{
                        textColor
                      }}</span>
                    </div>
                  </div>
                  <div class="color-grid !gap-2">
                    <button
                      v-for="color in PRESET_COLORS"
                      :key="`text-${color}`"
                      type="button"
                      class="color-dot"
                      :class="textColor === color ? 'is-active' : ''"
                      :style="{ backgroundColor: color }"
                      @click="textColor = color"
                    ></button>
                  </div>
                </div>
              </div>

              <!-- 右侧：各项滑块 -->
              <div
                class="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div>
                  <div
                    class="mb-1 text-xs font-bold tracking-wide text-slate-500"
                  >
                    主标题字号
                  </div>
                  <el-slider
                    v-model="fontSize"
                    :min="40"
                    :max="160"
                    show-input
                  />
                </div>
                <div>
                  <div
                    class="mb-1 text-xs font-bold tracking-wide text-slate-500"
                  >
                    副标题字号
                  </div>
                  <el-slider
                    v-model="subFontSize"
                    :min="20"
                    :max="80"
                    show-input
                  />
                </div>
                <div>
                  <div
                    class="mb-1 text-xs font-bold tracking-wide text-slate-500"
                  >
                    截图缩放
                  </div>
                  <el-slider
                    v-model="imageScale"
                    :min="0.4"
                    :max="0.95"
                    :step="0.01"
                    show-input
                  />
                </div>
                <div>
                  <div
                    class="mb-1 text-xs font-bold tracking-wide text-slate-500"
                  >
                    截图最大高度占比
                  </div>
                  <el-slider
                    v-model="imageMaxHeightPercent"
                    :min="30"
                    :max="85"
                    show-input
                  />
                </div>
                <div>
                  <div
                    class="mb-1 text-xs font-bold tracking-wide text-slate-500"
                  >
                    截图垂直偏移
                  </div>
                  <el-slider
                    v-model="imageOffsetY"
                    :min="-500"
                    :max="500"
                    show-input
                  />
                </div>
              </div>
            </div>
          </ToolSettingsCard>
        </div>

        <!-- 底部预览区 -->
        <div class="space-y-5">
          <el-card shadow="never" class="!rounded-[28px] !border-slate-200/80">
            <div
              class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div
                  class="flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <Icon
                    icon="solar:widget-5-bold-duotone"
                    class="text-lg text-blue-500"
                  />
                  页面预览与单页编辑
                </div>
                <p class="mt-1 text-sm text-slate-500">
                  每张卡片对应一页上架图。可分别修改标题、副标题，并替换单页截图。
                </p>
              </div>
              <div
                class="flex flex-wrap items-center gap-2 text-xs text-slate-400"
              >
                <span class="rounded-full bg-slate-100 px-3 py-1.5"
                  >共 {{ mockupList.length }} 页</span
                >
                <span class="rounded-full bg-slate-100 px-3 py-1.5"
                  >已完成 {{ completedMockupCount }} 页</span
                >
              </div>
            </div>
          </el-card>

          <div class="preview-grid">
            <el-card
              v-for="(item, idx) in mockupList"
              :key="item.id"
              shadow="hover"
              class="preview-card animate-fade-in-up !rounded-[20px] !border-slate-200/80"
              :style="{ animationDelay: `${idx * 60}ms` }"
            >
              <div class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="min-w-0 pr-2">
                    <div
                      class="text-[10px] font-black tracking-[0.1em] text-blue-600 uppercase"
                    >
                      Page {{ idx + 1 }}
                    </div>
                    <div
                      class="mt-0.5 text-base font-black text-slate-900 whitespace-nowrap"
                    >
                      页面内容编辑
                    </div>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <el-tag
                      size="small"
                      round
                      :type="item.screenshotUrl ? 'success' : 'warning'"
                      effect="light"
                      class="!border-0 whitespace-nowrap"
                    >
                      {{ item.screenshotUrl ? '已传' : '待补' }}
                    </el-tag>
                    <el-button
                      link
                      type="danger"
                      size="small"
                      class="!m-0"
                      @click="removeMockup(idx)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>

                <div
                  class="preview-stage"
                  :style="{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }"
                >
                  <canvas
                    :ref="(el) => setCanvasRef(el, idx)"
                    class="h-full w-full object-contain bg-white"
                  ></canvas>

                  <div
                    v-if="!item.screenshotUrl"
                    class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/58 px-6 text-center text-white"
                  >
                    <Icon
                      icon="solar:camera-rotate-bold-duotone"
                      class="mb-3 text-4xl text-white/60"
                    />
                    <p class="text-sm font-bold">当前页还没有截图</p>
                    <p class="mt-1 text-xs leading-6 text-white/75">
                      由于本地缓存不保存图片文件，如从缓存恢复，请重新上传该页截图。
                    </p>
                  </div>
                </div>

                <div
                  class="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500"
                >
                  当前导出尺寸：{{ canvasWidth }} × {{ canvasHeight }}，
                  {{
                    item.screenshotUrl
                      ? '可直接预览导出效果'
                      : '需补充截图后查看完整效果'
                  }}。
                </div>

                <div class="space-y-3">
                  <el-input
                    v-model="item.headline"
                    placeholder="请输入主标题"
                    size="large"
                  />
                  <el-input
                    v-model="item.subheadline"
                    placeholder="请输入副标题 / 卖点描述"
                    type="textarea"
                    :rows="3"
                  />
                </div>

                <el-upload
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="
                    (file) => {
                      if (file && file.raw) replaceScreenshot(idx, file.raw)
                    }
                  "
                  class="w-full"
                >
                  <el-button
                    class="w-full !m-0 !h-11 !rounded-2xl !border-slate-200 !text-slate-700 !font-bold"
                  >
                    {{ item.screenshotUrl ? '替换当前截图' : '上传当前截图' }}
                  </el-button>
                </el-upload>
              </div>
            </el-card>

            <div class="append-card">
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                multiple
                accept="image/*"
                :on-change="
                  (file) => {
                    if (file && file.raw) handleBatchImport(file.raw)
                  }
                "
                class="h-full w-full flex item-center justify-center"
              >
                <div class="append-card-inner">
                  <div class="append-card-icon">
                    <Icon icon="solar:add-circle-bold-duotone" />
                  </div>
                  <div class="text-lg font-black text-slate-800">
                    继续追加截图
                  </div>
                  <p
                    class="max-w-[220px] text-center text-sm leading-6 text-slate-500"
                  >
                    新增的截图会自动作为新的页面卡片加入工作区。
                  </p>
                </div>
              </el-upload>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-display {
  font-family: 'Inter', sans-serif;
}

.animate-fade-in {
  animation: fadeIn 0.45s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.55s ease-out backwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.init-container {
  height: auto;
}

.store-mockup-page {
  overflow-x: hidden;
  --page-accent: #3b82f6;
}

.summary-metric-card {
  display: flex;
  min-height: 92px;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.9);
  padding: 16px;
}

.summary-metric-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #64748b;
}

.summary-metric-value {
  font-size: 28px;
  line-height: 1;
  font-weight: 900;
  color: #0f172a;
}

.workspace-sidebar {
  position: sticky;
  top: 24px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 10px;
}

.color-dot {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 9999px;
  border: 3px solid #fff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.color-dot:hover {
  transform: translateY(-1px) scale(1.04);
}

.color-dot.is-active {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px #0f172a, 0 10px 24px rgba(15, 23, 42, 0.16);
}

.preview-grid {
  display: grid;
  gap: 16px;
  /* 使用 auto-fill 和 minmax 实现完美自适应，适当减小最小宽度，使卡片更小巧紧凑 */
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  align-items: start;
}

.preview-card {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.96)
  );
}

.preview-stage {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid rgba(226, 232, 240, 0.95);
  background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.8),
      rgba(241, 245, 249, 0.8)
    ),
    linear-gradient(135deg, rgba(148, 163, 184, 0.12), rgba(226, 232, 240, 0.4));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

:deep(.el-upload) {
  display: block;
  width: 100%;
  height: 100%;
}

.append-card {
  min-height: 240px;
  border: 2px dashed #cbd5e1;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.append-card:hover {
  border-color: #60a5fa;
  background: rgba(239, 246, 255, 0.8);
}

.append-card-inner {
  display: flex;
  min-height: 240px;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
}

.append-card-icon {
  display: flex;
  height: 72px;
  width: 72px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: linear-gradient(135deg, #eff6ff, #ede9fe);
  font-size: 36px;
  color: #3b82f6;
}

:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-slider__input) {
  width: 108px;
}

@media (max-width: 640px) {
  .color-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  :deep(.el-card__body) {
    padding: 18px;
  }
}
</style>
