<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import ToolUploader from '@/components/ToolUploader.vue'

// 预设尺寸
const PRESET_SIZES = [
  { name: 'iOS iPhone (6.7")', width: 1290, height: 2796 },
  { name: 'iOS iPhone (6.5")', width: 1242, height: 2688 },
  { name: 'iOS iPad Pro (12.9")', width: 2048, height: 2732 },
  { name: 'Android Phone', width: 1080, height: 1920 },
  { name: 'Android Tablet', width: 1600, height: 2560 },
]

// 预设色板
const PRESET_COLORS = [
  '#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
  '#6366F1', '#8B5CF6', '#D946EF', '#F43F5E', '#FB923C', '#22C55E', '#06B6D4',
  '#000000', '#FFFFFF', '#334155', '#94A3B8'
]

const STORAGE_KEY = 'designkit_store_mockup_data'

// 单个上架图的数据结构
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

// 全局配置
const canvasWidth = ref(1290)
const canvasHeight = ref(2796)
const backgroundColor = ref('#4F46E5')
const textColor = ref('#FFFFFF')
const fontSize = ref(80)
const subFontSize = ref(40)
const imageScale = ref(0.8)
const imageMaxHeightPercent = ref(65)
const imageOffsetY = ref(0)

// 持久化逻辑
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
    mockups: mockupList.value.map(it => ({
      headline: it.headline,
      subheadline: it.subheadline
      // 图片不存本地，太重且Blob会有问题
    }))
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

const loadFromLocal = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
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
        mockupList.value = data.mockups.map((m: any, idx: number) => ({
          id: Date.now() + idx + '',
          screenshotFile: null,
          screenshotUrl: null,
          headline: m.headline,
          subheadline: m.subheadline
        }))
      }
    } catch (e) {
      console.error('Load fail', e)
    }
  }
}

const resetAll = () => {
  mockupList.value.forEach(it => {
    if (it.screenshotUrl) URL.revokeObjectURL(it.screenshotUrl)
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

// 处理背景图上传
const handleBackgroundUpdate = (f: File | File[] | null) => {
  const file = Array.isArray(f) ? f[0] : f
  if (backgroundUrl.value) URL.revokeObjectURL(backgroundUrl.value)
  if (file) {
    backgroundFile.value = file
    backgroundUrl.value = URL.createObjectURL(file)
  } else {
    backgroundFile.value = null
    backgroundUrl.value = null
  }
}

// 批量导入截图生成页面
const handleBatchImport = async (f: File | File[] | null | undefined) => {
  if (!f) return
  const files = Array.isArray(f) ? f : [f]
  if (files.length === 0) return
  
  const newList: MockupItem[] = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (file) {
      newList.push({
        id: (Date.now() + Math.random() * 100000).toString(),
        screenshotFile: file,
        screenshotUrl: URL.createObjectURL(file),
        headline: `主标题 ${mockupList.value.length + newList.length + 1}`,
        subheadline: '这里是副标题描写'
      })
    }
  }
  
  mockupList.value.push(...newList)
  
  // 关键修复：确保在 DOM 更新及 Ref 绑定后再触发绘制
  await nextTick()
  drawAll()
  
  ElMessage.success(`成功导入 ${files.length} 张截图`)
}

// 替换单页截图
const replaceScreenshot = (index: number, file: File) => {
  const item = mockupList.value[index]
  if (!item) return
  
  if (item.screenshotUrl) URL.revokeObjectURL(item.screenshotUrl)
  item.screenshotFile = file
  item.screenshotUrl = URL.createObjectURL(file)
  
  drawPage(index)
}

import { nextTick } from 'vue'

// 删除页面
const removeMockup = (index: number) => {
  const item = mockupList.value[index]
  if (item && item.screenshotUrl) URL.revokeObjectURL(item.screenshotUrl)
  mockupList.value.splice(index, 1)
}

// 应用预设尺寸
const applyPreset = (preset: typeof PRESET_SIZES[0]) => {
  canvasWidth.value = preset.width
  canvasHeight.value = preset.height
}

// 加载图片辅助
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

// 绘制单页
const drawPage = async (index: number) => {
  const canvas = canvasRefs.value[index]
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const item = mockupList.value[index]
  if (!item) return

  canvas.width = canvasWidth.value
  canvas.height = canvasHeight.value

  // 0. 清理画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 1. 背景
  if (backgroundUrl.value) {
    try {
      const bgImg = await loadImage(backgroundUrl.value)
      const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height)
      const x = (canvas.width / 2) - (bgImg.width / 2) * scale
      const y = (canvas.height / 2) - (bgImg.height / 2) * scale
      ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale)
    } catch (e) {
      console.error('BG load fail', e)
    }
  } else {
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // 2. 文字
  ctx.fillStyle = textColor.value
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `bold ${fontSize.value}px "Inter", "PingFang SC", sans-serif`
  ctx.fillText(item.headline, canvas.width / 2, 160)

  ctx.font = `${subFontSize.value}px "Inter", "PingFang SC", sans-serif`
  ctx.globalAlpha = 0.8
  ctx.fillText(item.subheadline, canvas.width / 2, 160 + fontSize.value + 40)
  ctx.globalAlpha = 1.0

  // 3. 截图
  if (item.screenshotUrl) {
    try {
      const img = await loadImage(item.screenshotUrl)
      
      // 计算基础尺寸
      let displayWidth = canvas.width * imageScale.value
      let displayHeight = (img.height / img.width) * displayWidth
      
      // 高度限制校准
      const maxHeight = canvas.height * (imageMaxHeightPercent.value / 100)
      if (displayHeight > maxHeight) {
        displayHeight = maxHeight
        displayWidth = (img.width / img.height) * displayHeight
      }

      const x = (canvas.width - displayWidth) / 2
      
      // 智能定位：确保在标题下方
      // 标题区域大致高度：顶部留白(160) + 主字号 + 间距(40) + 副字号 + 底部安全间距(60)
      const textAreaHeight = 160 + fontSize.value + 40 + subFontSize.value + 60
      const availableHeight = canvas.height - textAreaHeight
      
      // 在剩余空间中居中，并应用手动偏移
      const y = textAreaHeight + (availableHeight - displayHeight) / 2 + imageOffsetY.value 

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
      ctx.quadraticCurveTo(x + displayWidth, y + displayHeight, x + displayWidth - radius, y + displayHeight)
      ctx.lineTo(x + radius, y + displayHeight)
      ctx.quadraticCurveTo(x, y + displayHeight, x, y + displayHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, x, y, displayWidth, displayHeight)
      ctx.restore()
    } catch (e) {}
  }
}

const drawAll = async () => {
  // 强制等待 DOM 更新，确保所有 canvas refs 已绑定
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
      await new Promise(r => setTimeout(r, 400))
    }
    ElMessage.success('全部导出完成')
  } finally {
    isExporting.value = false
  }
}

watch([
  mockupList, canvasWidth, canvasHeight, backgroundColor, 
  textColor, fontSize, subFontSize, imageScale, 
  imageMaxHeightPercent, imageOffsetY, backgroundUrl
], async () => {
  await drawAll()
  saveToLocal()
}, { deep: true })

onMounted(async () => {
  loadFromLocal()
  await nextTick()
  await drawAll()
  // 针对某些复杂情况再补一次延迟绘制，解决首张图概率性空白
  setTimeout(drawAll, 100)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  mockupList.value.forEach(it => {
    if (it.screenshotUrl) URL.revokeObjectURL(it.screenshotUrl)
  })
  if (backgroundUrl.value) URL.revokeObjectURL(backgroundUrl.value)
})
</script>

<template>
  <div class="store-mockup-page px-4 py-6 md:py-10 mx-auto max-w-7xl w-full box-border bg-slate-50 min-h-screen">
    <PageHeader 
      title="上架图快速生成" 
      description="批量生成精美的应用商店展示图" 
      icon="solar:gallery-edit-bold-duotone"
      class="!mb-6"
    />

    <!-- 初始化上传界面 -->
    <div v-if="mockupList.length === 0" class="init-container flex flex-col items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-slate-200 shadow-xl shadow-slate-200/50 animate-fade-in overflow-hidden relative group">
      <div class="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
      
      <div class="relative z-10 w-full max-w-xl px-10 py-16 flex flex-col items-center text-center">
        <div class="mb-8 relative">
           <div class="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center text-white text-5xl shadow-2xl shadow-blue-500/40 animate-bounce-subtle">
             <Icon icon="solar:camera-add-bold-duotone" />
           </div>
           <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white">
             <Icon icon="solar:check-read-bold" />
           </div>
        </div>

        <h2 class="text-3xl font-black text-slate-800 mb-4 tracking-tight">准备好图片了吗？</h2>
        <p class="text-slate-500 mb-10 max-w-sm mx-auto leading-relaxed">
          拖拽多张 App 截图到这里，我们将为您自动排版并生成精美的 App Store 素材。
        </p>

        <div class="w-full">
          <ToolUploader
            :modelValue="null"
            multiple
            accept="image/*"
            empty-icon="solar:upload-minimalistic-bold-duotone"
            empty-text="点击或拖拽上传多张截图"
            hint="支持多份 JPG/PNG/WebP 格式图片"
            @update:modelValue="handleBatchImport"
            class="!rounded-3xl border-none bg-slate-50 hover:bg-slate-100 transition-all !p-8"
          />
        </div>

        <div class="mt-10 flex items-center gap-6 text-xs font-bold text-slate-400">
          <div class="flex items-center gap-1.5"><Icon icon="solar:shield-check-bold" class="text-blue-500" /> 私密安全（本地直接生成）</div>
          <div class="flex items-center gap-1.5"><Icon icon="solar:bolt-bold" class="text-amber-500" /> 批量高效输出</div>
        </div>
      </div>
    </div>

    <!-- 工作区 -->
    <div v-else class="space-y-12 animate-fade-in">
      <!-- 1. 全局配置 -->
      <el-card shadow="never" class="!border-none !rounded-3xl shadow-sm overflow-visible">
        <div class="flex flex-col md:flex-row gap-8">
          <div class="flex-1 space-y-6">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <Icon icon="solar:settings-bold-duotone" class="text-xl text-blue-600" />
                <h3 class="font-bold text-slate-800">全局外观设置</h3>
              </div>
              <el-popconfirm title="确定要重置所有页面和配置吗？" @confirm="resetAll">
                <template #reference>
                  <el-button type="danger" link size="small" icon="Refresh">重置数据</el-button>
                </template>
              </el-popconfirm>
            </div>
            
            <el-row :gutter="20">
              <el-col :md="12" :xs="24">
                <el-form-item label="商店规格预设 & 尺寸管理">
                  <div class="flex flex-col gap-4">
                    <div class="flex flex-wrap gap-2">
                      <el-button 
                        v-for="p in PRESET_SIZES" :key="p.name" size="small"
                        :type="canvasWidth === p.width && canvasHeight === p.height ? 'primary' : ''" plain @click="applyPreset(p)"
                      >
                        {{ p.name }} ({{ p.width }}x{{ p.height }})
                      </el-button>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-bold text-slate-500">宽度</span>
                        <el-input-number v-model="canvasWidth" :min="100" :max="5000" size="small" controls-position="right" class="!w-28" />
                        <span class="text-slate-300 text-xs">px</span>
                      </div>
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-bold text-slate-500">高度</span>
                        <el-input-number v-model="canvasHeight" :min="100" :max="5000" size="small" controls-position="right" class="!w-28" />
                        <span class="text-slate-300 text-xs">px</span>
                      </div>
                      <div class="text-[10px] text-blue-500/60 font-medium flex items-center gap-1">
                        <Icon icon="solar:info-circle-bold-duotone" />
                        自定义尺寸将实时应用到所有页面
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :md="6" :xs="12">
                 <el-form-item label="背景颜色">
                  <div class="flex items-center gap-2">
                    <el-color-picker v-model="backgroundColor" show-alpha />
                    <div class="flex flex-wrap gap-1 max-w-[120px]">
                      <div v-for="c in PRESET_COLORS" :key="c" class="w-5 h-5 rounded border border-slate-100 cursor-pointer hover:scale-110 transition-transform" :style="{ background: c }" @click="backgroundColor = c"></div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :md="6" :xs="12">
                <el-form-item label="文字颜色">
                  <div class="flex items-center gap-2">
                    <el-color-picker v-model="textColor" />
                     <div class="flex gap-1">
                      <div class="w-5 h-5 bg-white rounded border border-slate-200 cursor-pointer" @click="textColor = '#FFFFFF'"></div>
                      <div class="w-5 h-5 bg-black rounded border border-slate-200 cursor-pointer" @click="textColor = '#000000'"></div>
                      <div class="w-5 h-5 bg-slate-500 rounded border border-slate-200 cursor-pointer" @click="textColor = '#64748b'"></div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :md="6" :xs="12">
                <el-form-item label="主标题字号">
                  <el-input-number v-model="fontSize" :min="20" :max="300" class="!w-full" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :md="6" :xs="12">
                <el-form-item label="副标题字号">
                  <el-input-number v-model="subFontSize" :min="10" :max="200" class="!w-full" controls-position="right" />
                </el-form-item>
              </el-col>
              <el-col :md="6" :xs="12">
                <el-form-item label="截图缩放">
                   <el-slider v-model="imageScale" :min="0.1" :max="1.5" :step="0.01" />
                </el-form-item>
              </el-col>
              <el-col :md="6" :xs="12">
                <el-form-item label="截图最大高度 (%)">
                   <el-slider v-model="imageMaxHeightPercent" :min="10" :max="90" />
                </el-form-item>
              </el-col>
              <el-col :md="6" :xs="12">
                <el-form-item label="截图垂直偏移">
                   <el-slider v-model="imageOffsetY" :min="-1000" :max="1000" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <div class="md:w-64 space-y-4">
             <el-form-item label="自定义通用背景图">
                <ToolUploader
                  :modelValue="backgroundFile"
                  compact
                  empty-icon="solar:gallery-add-bold"
                  empty-text="上传背景"
                  @update:modelValue="handleBackgroundUpdate"
                  class="!min-h-[120px]"
                />
             </el-form-item>
             <el-button type="primary" size="large" class="w-full !h-12 !rounded-xl !font-bold shadow-lg shadow-blue-500/20" :loading="isExporting" @click="exportAll">
                批量导出 {{ mockupList.length }} 张图
             </el-button>
          </div>
        </div>
      </el-card>

      <!-- 2. 页面列表 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        <div v-for="(item, idx) in mockupList" :key="item.id" class="flex flex-col gap-4 animate-fade-in-up" :style="{ animationDelay: idx * 100 + 'ms' }">
          <!-- 标题设置卡片 -->
          <div class="bg-white p-4 rounded-2xl shadow-sm space-y-4 border border-slate-100">
             <div class="flex items-center justify-between mb-1">
               <span class="text-xs font-black text-blue-600">PAGE {{ idx + 1 }}</span>
               <el-button link type="danger" size="small" @click="removeMockup(idx)">删除</el-button>
             </div>
             <el-input v-model="item.headline" placeholder="主标题" size="small" />
             <el-input v-model="item.subheadline" placeholder="副标题/描述" type="textarea" :rows="2" size="small" />
          </div>

          <!-- 预览 Canvas &上传控制器 -->
          <div class="flex flex-col gap-2">
            <div 
              class="w-full bg-slate-200 rounded-2xl overflow-hidden shadow-md flex items-center justify-center relative group"
              :style="{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }"
            >
              <canvas 
                :ref="el => setCanvasRef(el, idx)" 
                class="w-full h-full object-contain bg-white"
              ></canvas>
              
              <div v-if="!item.screenshotUrl" class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4 text-center cursor-pointer pointer-events-none">
                <Icon icon="solar:camera-rotate-bold-duotone" class="text-3xl text-white/50 mb-2" />
                <p class="text-white/70 text-[10px] font-bold">本地缓存不包含图片文件<br>请重新上传此页截图</p>
              </div>

              <div v-else class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                 <span class="text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">预览渲染中...</span>
              </div>
            </div>

            <!-- 单独上传/替换按钮 -->
            <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="(file) => { if (file && file.raw) replaceScreenshot(idx, file.raw) }"
              class="w-full"
            >
              <el-button size="small" class="w-full !rounded-xl !bg-white !border-slate-200 !text-slate-600 font-bold hover:!text-blue-500 shadow-sm" icon="Upload">
                {{ item.screenshotUrl ? '替换截图' : '上传截图' }}
              </el-button>
            </el-upload>
          </div>
        </div>

        <!-- 添加按钮 -->
        <div class="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 rounded-3xl hover:bg-slate-100/50 transition-colors cursor-pointer group">
           <el-upload
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              multiple
              accept="image/*"
              :on-change="(file) => { if (file && file.raw) handleBatchImport(file.raw) }"
            >
              <div class="flex flex-col items-center text-slate-400 group-hover:text-blue-500 transition-colors">
                <Icon icon="solar:add-circle-bold-duotone" class="text-4xl mb-2" />
                <span class="font-bold">追加截图</span>
              </div>
            </el-upload>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.font-display { font-family: 'Inter', sans-serif; }
.animate-fade-in { animation: fadeIn 0.6s ease-out; }
.animate-fade-in-up { animation: fadeInUp 0.6s ease-out backwards; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { 
  from { opacity: 0; transform: translateY(20px); } 
  to { opacity: 1; transform: translateY(0); } 
}
@keyframes bounceSubtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.animate-bounce-subtle { animation: bounceSubtle 3s ease-in-out infinite; }

.init-container {
  min-height: calc(100vh - 220px);
}

:deep(.el-card__body) { padding: 24px; }
:deep(.el-form-item__label) { 
  font-weight: 800; 
  font-size: 12px; 
  color: #64748b;
  margin-bottom: 8px;
}

/* 消除全局多余滚动条 */
.store-mockup-page {
  overflow-x: hidden;
}
</style>
