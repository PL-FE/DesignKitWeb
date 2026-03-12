<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/bmp'

const fileList = ref<File[]>([])
// 用于预览和参考的第一张图的信息
const referenceDimensions = ref<{ width: number; height: number } | null>(null)
const firstPreviewUrl = ref<string | null>(null)

// 配置参数
const resizeMode = ref<'dimensions' | 'percentage'>('dimensions')
const targetWidth = ref<number | null>(null)
const targetHeight = ref<number | null>(null)
const percentage = ref<number>(50)
const lockAspectRatio = ref(true)
const outputFormat = ref<'image/jpeg' | 'image/png' | 'image/webp'>(
  'image/jpeg'
)
const quality = ref(0.9)

// 结果状态
const loading = ref(false)
const progress = ref(0)
const results = ref<
  Array<{
    name: string
    width: number
    height: number
    url: string
    filename: string
    sizeKb: string
  }>
>([])

const totalSizeDisplay = computed(() => {
  const total = fileList.value.reduce((acc, f) => acc + f.size, 0)
  const kb = total / 1024
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`
})

// 处理文件上传
const handleFileUpdate = (f: File | File[] | null) => {
  const incoming = Array.isArray(f) ? f : f ? [f] : []
  fileList.value = incoming
  results.value = []

  if (firstPreviewUrl.value) {
    URL.revokeObjectURL(firstPreviewUrl.value)
    firstPreviewUrl.value = null
  }

  if (incoming.length > 0) {
    const first = incoming[0]
    firstPreviewUrl.value = URL.createObjectURL(first)
    const img = new Image()
    img.onload = () => {
      referenceDimensions.value = { width: img.width, height: img.height }
      if (!targetWidth.value) targetWidth.value = img.width
      if (!targetHeight.value) targetHeight.value = img.height
    }
    img.src = firstPreviewUrl.value
  } else {
    referenceDimensions.value = null
    targetWidth.value = null
    targetHeight.value = null
  }
}

// 监听宽度变化，同步高度（基于参考图）
watch(targetWidth, (newVal) => {
  if (
    lockAspectRatio.value &&
    referenceDimensions.value &&
    newVal &&
    resizeMode.value === 'dimensions'
  ) {
    const ratio =
      referenceDimensions.value.height / referenceDimensions.value.width
    const nextHeight = Math.round(newVal * ratio)
    if (targetHeight.value !== nextHeight) {
      targetHeight.value = nextHeight
    }
  }
})

// 监听高度变化，同步宽度（基于参考图）
watch(targetHeight, (newVal) => {
  if (
    lockAspectRatio.value &&
    referenceDimensions.value &&
    newVal &&
    resizeMode.value === 'dimensions'
  ) {
    const ratio =
      referenceDimensions.value.width / referenceDimensions.value.height
    const nextWidth = Math.round(newVal * ratio)
    if (targetWidth.value !== nextWidth) {
      targetWidth.value = nextWidth
    }
  }
})

async function processImages() {
  if (fileList.value.length === 0) return

  loading.value = true
  progress.value = 0
  results.value = []

  try {
    for (let i = 0; i < fileList.value.length; i++) {
      const f = fileList.value[i]
      const res = await processSingleFile(f)
      results.value.push(res)
      progress.value = Math.round(((i + 1) / fileList.value.length) * 100)
    }
    ElMessage.success(`成功处理 ${fileList.value.length} 张图片`)
  } catch (err) {
    console.error(err)
    ElMessage.error('图片处理过程中出错')
  } finally {
    loading.value = false
  }
}

async function processSingleFile(file: File) {
  return new Promise<{
    name: string
    width: number
    height: number
    url: string
    filename: string
    sizeKb: string
  }>((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(url)

      let w = 0
      let h = 0

      if (resizeMode.value === 'percentage') {
        w = Math.round(img.width * (percentage.value / 100))
        h = Math.round(img.height * (percentage.value / 100))
      } else {
        // 如果是指定尺寸，全部统一
        w = targetWidth.value || img.width
        h = targetHeight.value || img.height
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject('Canvas context error')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject('Blob creation failed')
          const extension = outputFormat.value.split('/')[1]
          const filename =
            file.name.replace(/\.[^/.]+$/, '') + `_${w}x${h}.${extension}`

          resolve({
            name: file.name,
            width: w,
            height: h,
            url: URL.createObjectURL(blob),
            filename,
            sizeKb: (blob.size / 1024).toFixed(1),
          })
        },
        outputFormat.value,
        quality.value
      )
    }
    img.onerror = () => reject('Image load error')
    img.src = url
  })
}

function downloadSingle(item: any) {
  const a = document.createElement('a')
  a.href = item.url
  a.download = item.filename
  a.click()
}

function downloadAll() {
  results.value.forEach((item, index) => {
    // 稍微延迟下载以避免触发浏览器的并发下载限制
    setTimeout(() => {
      downloadSingle(item)
    }, index * 200)
  })
}
</script>

<template>
  <ToolPageLayout
    title="图片尺寸修改"
    description="自由调整图片宽高，支持批量处理，纯本地 Canvas 处理更安全"
    icon="solar:smartphone-rotate-orientation-bold-duotone"
    color="amber"
  >
    <template #upload>
      <ToolUploader
        :model-value="fileList"
        multiple
        empty-icon="solar:add-square-linear"
        empty-text="点击或拖拽上传图片 (多选)"
        hint="支持 JPG · PNG · WebP · BMP"
        :accept="ACCEPTED_TYPES"
        @update:model-value="handleFileUpdate"
      >
        <template #selected="{ remove }">
          <div class="p-4 md:p-6 w-full h-full relative z-10 text-left">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800"
                  >已选择 {{ fileList.length }} 张图片</span
                >
                <el-tag
                  size="small"
                  type="info"
                  effect="plain"
                  class="!font-bold"
                >
                  共 {{ totalSizeDisplay }}
                </el-tag>
              </div>
              <el-button type="danger" link @click.stop="remove">
                <Icon icon="solar:trash-bin-trash-bold" class="mr-1" /> 清空
              </el-button>
            </div>

            <div
              class="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
            >
              <div
                v-for="(f, idx) in fileList"
                :key="f.name + idx"
                class="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 group transition-all"
              >
                <div
                  class="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <Icon
                    icon="solar:gallery-bold"
                    class="w-full h-full p-2 text-slate-400"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-bold text-slate-700 truncate">
                    {{ f.name }}
                  </p>
                  <p class="text-[10px] text-slate-400 font-medium">
                    {{ (f.size / 1024).toFixed(1) }} KB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ToolUploader>
    </template>

    <template #panel>
      <ToolSettingsCard
        card-title="尺寸设置"
        card-title-icon="solar:settings-minimalistic-bold-duotone"
      >
        <template v-if="results.length > 0">
          <div class="flex-1 flex flex-col animate-fade-in-up">
            <h4
              class="font-bold text-slate-800 text-sm mb-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-2">
                <Icon
                  icon="solar:check-circle-bold-duotone"
                  class="text-base text-amber-500"
                />
                处理完成 ({{ results.length }})
              </div>
              <el-button type="primary" size="small" link @click="downloadAll">
                下载全部
              </el-button>
            </h4>

            <div
              class="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar"
            >
              <div
                v-for="(res, idx) in results"
                :key="idx"
                class="bg-white border border-slate-100 rounded-xl p-3 flex items-center gap-3 shadow-sm hover:border-amber-200 transition-colors"
              >
                <div
                  class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100 bg-slate-50"
                >
                  <img :src="res.url" class="object-cover w-full h-full" />
                </div>
                <div class="flex-1 min-w-0">
                  <p
                    class="text-xs font-bold text-slate-700 truncate"
                    :title="res.filename"
                  >
                    {{ res.filename }}
                  </p>
                  <div class="flex gap-2 mt-1">
                    <span
                      class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-500"
                      >{{ res.width }} × {{ res.height }}</span
                    >
                    <span
                      class="text-[10px] bg-amber-50 px-1.5 py-0.5 rounded font-bold text-amber-600"
                      >{{ res.sizeKb }} KB</span
                    >
                  </div>
                </div>
                <el-button
                  circle
                  size="small"
                  type="primary"
                  plain
                  @click="downloadSingle(res)"
                >
                  <Icon icon="solar:download-minimalistic-bold" />
                </el-button>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <el-form label-position="top">
            <div v-if="loading" class="py-8 text-center">
              <el-progress
                type="circle"
                :percentage="progress"
                :color="'#f59e0b'"
              />
              <p class="mt-4 text-sm font-bold text-slate-600">
                正在处理第
                {{ Math.ceil(progress / (100 / fileList.length) || 0) }}
                张图片...
              </p>
            </div>

            <template v-else>
              <el-form-item label="调整方式">
                <el-radio-group
                  v-model="resizeMode"
                  size="large"
                  class="w-full"
                >
                  <el-radio-button label="dimensions" style="margin-right: 10px"
                    >指定宽高</el-radio-button
                  >
                  <el-radio-button label="percentage">按百分比</el-radio-button>
                </el-radio-group>
              </el-form-item>

              <div v-if="resizeMode === 'dimensions'">
                <el-row :gutter="12">
                  <el-col :span="11">
                    <el-form-item label="宽度 (px)">
                      <el-input-number
                        v-model="targetWidth"
                        :min="1"
                        :max="10000"
                        class="!w-full"
                        controls-position="right"
                        placeholder="宽度"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="2" class="flex items-end justify-center pb-4">
                    <div
                      class="cursor-pointer transition-colors"
                      :class="
                        lockAspectRatio ? 'text-amber-500' : 'text-slate-300'
                      "
                      @click="lockAspectRatio = !lockAspectRatio"
                    >
                      <Icon
                        :icon="
                          lockAspectRatio
                            ? 'solar:link-bold'
                            : 'solar:link-broken-bold'
                        "
                        class="text-xl"
                      />
                    </div>
                  </el-col>
                  <el-col :span="11">
                    <el-form-item label="高度 (px)">
                      <el-input-number
                        v-model="targetHeight"
                        :min="1"
                        :max="10000"
                        class="!w-full"
                        controls-position="right"
                        placeholder="高度"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <p
                  v-if="referenceDimensions"
                  class="text-[10px] text-slate-400 mt-1"
                >
                  * 比例锁定参考自上传的第一张图片
                </p>
              </div>

              <div v-else>
                <el-form-item label="调整比例">
                  <div class="px-2 w-full">
                    <el-slider
                      v-model="percentage"
                      :min="1"
                      :max="200"
                      :format-tooltip="(v) => v + '%'"
                      show-input
                    />
                    <div
                      class="flex justify-between text-[10px] text-slate-400 font-bold px-1"
                    >
                      <span>1%</span>
                      <span>100% (原始)</span>
                      <span>200%</span>
                    </div>
                  </div>
                </el-form-item>
              </div>

              <el-row :gutter="16" class="mt-4">
                <el-col :span="12">
                  <el-form-item label="导出格式">
                    <el-select
                      v-model="outputFormat"
                      size="large"
                      class="w-full"
                    >
                      <el-option label="JPEG" value="image/jpeg" />
                      <el-option label="PNG" value="image/png" />
                      <el-option label="WebP" value="image/webp" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="图片质量">
                    <el-select
                      v-model="quality"
                      size="large"
                      class="w-full"
                      :disabled="outputFormat === 'image/png'"
                    >
                      <el-option label="极高 (100%)" :value="1.0" />
                      <el-option label="高 (90%)" :value="0.9" />
                      <el-option label="中 (80%)" :value="0.8" />
                      <el-option label="低 (60%)" :value="0.6" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </template>
          </el-form>
        </template>

        <template #action>
          <div v-if="results.length > 0" class="space-y-3">
            <el-button
              type="primary"
              size="large"
              class="w-full !h-14 !text-lg !rounded-2xl !font-bold shadow-lg shadow-amber-500/30"
              style="
                background-color: var(--page-accent);
                border-color: var(--page-accent);
              "
              @click="downloadAll"
            >
              <template #icon>
                <Icon
                  icon="solar:download-square-bold-duotone"
                  class="text-xl"
                />
              </template>
              点击下载全部 ({{ results.length }})
            </el-button>
            <el-button
              size="large"
              class="w-full !h-10 !rounded-xl !font-bold"
              plain
              @click="results = []"
            >
              修改设置并重新处理
            </el-button>
          </div>
          <el-button
            v-else
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :class="
              !loading && fileList.length > 0
                ? 'shadow-lg hover:-translate-y-0.5'
                : ''
            "
            style="
              background-color: var(--page-accent);
              border-color: var(--page-accent);
            "
            :loading="loading"
            :disabled="fileList.length === 0"
            @click="processImages"
          >
            <template #icon>
              <Icon
                v-if="!loading"
                icon="solar:magic-stick-3-bold-duotone"
                class="text-xl"
              />
            </template>
            {{ loading ? '处理中...' : `开始批量处理 (${fileList.length} 个)` }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-radio-button__inner) {
  border-radius: 8px !important;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
