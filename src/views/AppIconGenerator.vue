<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <!-- Header -->
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Icon icon="solar:widget-add-bold-duotone" class="text-blue-600" />
          App 图标批处理
        </h1>
        <p class="text-slate-500 mt-1">上传一张高分辨率图标，自动生成 iOS / Android 等常用尺寸</p>
      </div>
      <el-button @click="router.push('/')" circle>
        <Icon icon="solar:home-2-linear" />
      </el-button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Left Column: Upload -->
      <div class="md:col-span-1">
        <div 
          class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-8"
        >
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
            1. 上传原始图标
          </h3>
          
          <div
            class="group relative border-2 border-dashed border-slate-200 rounded-xl p-4 transition-all hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer overflow-hidden flex flex-col items-center justify-center min-h-[240px]"
            @click="triggerUpload"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleFileChange"
            />
            
            <template v-if="!sourceImage">
              <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                <Icon icon="solar:upload-minimalistic-bold-duotone" />
              </div>
              <p class="font-bold text-slate-700">点击或拖拽上传</p>
              <p class="text-xs text-slate-400 mt-1 mt-2">推荐 1024x1024 或更高分辨率</p>
            </template>
            
            <template v-else>
              <img :src="sourceImage" class="w-full h-full object-contain rounded-lg shadow-sm" />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <p class="text-white font-bold text-sm">更换图片</p>
              </div>
            </template>
          </div>

          <div v-if="sourceImage" class="mt-4">
            <el-button 
              type="primary" 
              class="w-full !rounded-xl h-10 font-bold" 
              @click="generateAndDownload"
              :loading="processing"
            >
              <Icon icon="solar:download-minimalistic-bold-duotone" class="mr-2" />
              打包下载 ({{ selectedTotalCount }})
            </el-button>
          </div>
        </div>
      </div>

      <!-- Right Column: Settings -->
      <div class="md:col-span-2 space-y-6">
        <!-- Predefined Sizes -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">
              2. 选择目标尺寸
            </h3>
            <div class="flex gap-2">
              <el-button size="small" link @click="selectAll">全选</el-button>
              <el-button size="small" link @click="selectNone">全不选</el-button>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div 
              v-for="size in predefinedSizes" 
              :key="size.label"
              class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              @click="size.selected = !size.selected"
            >
              <el-checkbox v-model="size.selected" @click.stop />
              <div class="flex flex-col">
                <span class="text-sm font-bold text-slate-700">{{ size.width }}x{{ size.height }}</span>
                <span class="text-[10px] text-slate-400">{{ size.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Sizes -->
        <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
            3. 自定义尺寸 (可选)
          </h3>
          
          <div class="flex gap-2 mb-4">
            <el-input-number 
              v-model="newSize" 
              :min="1" 
              :max="4096" 
              placeholder="尺寸" 
              class="!w-32"
              :controls="false"
            />
            <span class="flex items-center text-slate-300 font-bold">px</span>
            <el-button type="primary" plain class="!rounded-lg" @click="addCustomSize">添加</el-button>
          </div>

          <div class="flex flex-wrap gap-2">
            <el-tag
              v-for="(size, index) in customSizes"
              :key="index"
              closable
              class="!rounded-lg !h-8 !px-3 font-bold"
              @close="removeCustomSize(index)"
            >
              {{ size }}x{{ size }}
            </el-tag>
            <p v-if="customSizes.length === 0" class="text-slate-400 text-sm py-2">暂无自定义尺寸</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden Canvas for Processing -->
    <canvas ref="processCanvas" class="hidden"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import JSZip from 'jszip'

const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const processCanvas = ref<HTMLCanvasElement | null>(null)
const sourceImage = ref<string | null>(null)
const processing = ref(false)
const newSize = ref(512)

interface IconSize {
  width: number
  height: number
  label: string
  selected: boolean
}

const predefinedSizes = ref<IconSize[]>([
  { width: 20, height: 20, label: 'Notification', selected: true },
  { width: 29, height: 29, label: 'Settings', selected: true },
  { width: 40, height: 40, label: 'Spotlight', selected: true },
  { width: 58, height: 58, label: 'Settings@2x', selected: true },
  { width: 60, height: 60, label: 'App Icon@1x', selected: true },
  { width: 72, height: 72, label: 'iPad App', selected: true },
  { width: 76, height: 76, label: 'iPad App@1x', selected: true },
  { width: 80, height: 80, label: 'Spotlight@2x', selected: true },
  { width: 87, height: 87, label: 'Settings@3x', selected: true },
  { width: 96, height: 96, label: 'Android Large', selected: true },
  { width: 120, height: 120, label: 'iPhone App@2x', selected: true },
  { width: 144, height: 144, label: 'iPad App@2x', selected: true },
  { width: 152, height: 152, label: 'iPad App@2x', selected: true },
  { width: 167, height: 167, label: 'iPad Pro', selected: true },
  { width: 180, height: 180, label: 'iPhone App@3x', selected: true },
  { width: 192, height: 192, label: 'Android XLarge', selected: true },
  { width: 1024, height: 1024, label: 'App Store', selected: true },
])

const customSizes = ref<number[]>([])

const selectedTotalCount = computed(() => {
  return predefinedSizes.value.filter(s => s.selected).length + customSizes.value.length
})

const triggerUpload = () => fileInput.value?.click()

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

const processFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    sourceImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const selectAll = () => predefinedSizes.value.forEach(s => s.selected = true)
const selectNone = () => predefinedSizes.value.forEach(s => s.selected = false)

const addCustomSize = () => {
  if (newSize.value && !customSizes.value.includes(newSize.value)) {
    customSizes.value.push(newSize.value)
  }
}

const removeCustomSize = (index: number) => {
  customSizes.value.splice(index, 1)
}

const generateAndDownload = async () => {
  if (!sourceImage.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  const selectedSizes = predefinedSizes.value.filter(s => s.selected)
  if (selectedSizes.length === 0 && customSizes.value.length === 0) {
    ElMessage.warning('请至少选择一个尺寸')
    return
  }

  processing.value = true
  try {
    const zip = new JSZip()
    const imgFolder = zip.folder('icons')
    
    const img = new Image()
    img.src = sourceImage.value
    await new Promise((resolve) => (img.onload = resolve))

    const canvas = processCanvas.value!
    const ctx = canvas.getContext('2d')!

    // Function to generate blob for a size
    const createResizedBlob = (width: number, height: number): Promise<Blob> => {
      return new Promise((resolve) => {
        canvas.width = width
        canvas.height = height
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => resolve(blob!), 'image/png')
      })
    }

    // Process predefined
    for (const size of selectedSizes) {
      const blob = await createResizedBlob(size.width, size.height)
      imgFolder?.file(`${size.width}x${size.height}.png`, blob)
    }

    // Process custom
    for (const size of customSizes.value) {
      const blob = await createResizedBlob(size, size)
      imgFolder?.file(`${size}x${size}.png`, blob)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const link = document.createElement('a')
    link.href = url
    link.download = 'app_icons.zip'
    link.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('打包下载成功！')
  } catch (error) {
    console.error(error)
    ElMessage.error('处理失败，请重试')
  } finally {
    processing.value = false
  }
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
</style>
