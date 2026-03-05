<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'
import { compressImageApi } from '@/api/image'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/bmp,image/tiff'

const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

// 配置参数
const compressMode = ref<'quality' | 'target'>('quality')
const qualityPercentage = ref<number>(85)
const targetKb = ref<number>()
const maxWidth = ref<number>()
const maxHeight = ref<number>()
const outputFormat = ref<'jpeg' | 'png' | 'webp'>('jpeg')
const stripExif = ref(true)

// 结果状态
const loading = ref(false)
const result = ref<{
  originalKb: string
  compressedKb: string
  ratio: string
  url: string
  filename: string
} | null>(null)

const fileSizeDisplay = computed(() => {
  if (!file.value) return ''
  const kb = file.value.size / 1024
  return kb >= 1024 ? `${(kb / 1024).toFixed(2)} MB` : `${kb.toFixed(1)} KB`
})

// 文件选择：同步预览
const handleFileUpdate = (f: File | null) => {
  file.value = f
  result.value = null
  previewUrl.value = f ? URL.createObjectURL(f) : null
}

async function compress() {
  if (!file.value) return
  loading.value = true
  result.value = null
  try {
    const form = new FormData()
    form.append('file', file.value)
    if (compressMode.value === 'quality') {
      const fileKb = file.value.size / 1024
      form.append(
        'target_kb',
        String(Math.max(1, fileKb * (qualityPercentage.value / 100)))
      )
    } else {
      if (!targetKb.value) {
        ElMessage.warning('请填写目标文件体积')
        return
      }
      form.append('target_kb', String(targetKb.value))
    }
    if (maxWidth.value) form.append('max_width', String(maxWidth.value))
    if (maxHeight.value) form.append('max_height', String(maxHeight.value))
    form.append('output_format', outputFormat.value)
    form.append('strip_exif', String(stripExif.value))
    result.value = await compressImageApi(form)
    ElMessage.success('压缩完成')
  } catch {
    // API 拦截器已处理
  } finally {
    loading.value = false
  }
}

function download() {
  if (!result.value) return
  const a = document.createElement('a')
  a.href = result.value.url
  a.download = result.value.filename
  a.click()
}
</script>

<template>
  <ToolPageLayout
    title="图片压缩"
    description="压到指定大小，格式随便选，顺带能清 EXIF 信息"
    icon="solar:gallery-minimalistic-bold-duotone"
    color="violet"
  >
    <!-- 左侧：上传区（含图片预览） -->
    <template #upload>
      <ToolUploader
        :model-value="file"
        empty-icon="solar:upload-linear"
        empty-text="将图片拖曳至此"
        hint="支持 JPG · PNG · WebP · BMP · TIFF"
        :accept="ACCEPTED_TYPES"
        :max-size-mb="500"
        @update:model-value="handleFileUpdate"
      >
        <!-- 已选状态：带图片预览 -->
        <template #selected="{ file: f, remove }">
          <div
            class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 md:p-6 w-full h-full relative z-10 text-left cursor-default"
          >
            <div class="relative flex-shrink-0">
              <img
                v-if="previewUrl"
                :src="previewUrl"
                class="w-24 h-24 object-cover rounded-xl shadow-sm border border-slate-100"
              />
            </div>
            <div class="flex-1 min-w-0 flex flex-col justify-center">
              <p
                class="font-bold text-slate-800 text-base truncate w-full"
                :title="f.name"
              >
                {{ f.name }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <el-tag
                  size="small"
                  type="info"
                  effect="plain"
                  class="!font-bold"
                  >{{ fileSizeDisplay }}</el-tag
                >
              </div>
            </div>
            <el-button
              type="danger"
              circle
              plain
              size="small"
              class="absolute top-2 right-2 sm:static"
              @click.stop="remove"
            >
              <Icon icon="solar:trash-bin-trash-bold" />
            </el-button>
          </div>
        </template>
      </ToolUploader>
    </template>

    <!-- 右侧：配置设置 + 结果展示 -->
    <template #panel>
      <ToolSettingsCard
        card-title="压制设置"
        card-title-icon="solar:settings-minimalistic-bold-duotone"
      >
        <!-- 结果展示（有结果时显示，无结果时显示配置） -->
        <template v-if="result">
          <div class="flex-1 flex flex-col animate-fade-in-up">
            <h4
              class="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2"
            >
              <Icon
                icon="solar:check-circle-bold-duotone"
                class="text-base"
                style="color: var(--page-accent)"
              />
              压缩完成
            </h4>
            <div
              class="relative rounded-xl overflow-hidden bg-slate-100/50 mb-4 aspect-video flex-shrink-0 flex items-center justify-center border border-slate-100"
            >
              <img :src="result.url" class="object-contain w-full h-full p-2" />
            </div>
            <el-row :gutter="10" class="mb-4">
              <el-col :span="8">
                <div
                  class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center"
                >
                  <span
                    class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
                    >之前</span
                  >
                  <span class="font-black text-slate-700 text-sm"
                    >{{ result.originalKb
                    }}<span class="text-[10px] ml-0.5">KB</span></span
                  >
                </div>
              </el-col>
              <el-col :span="8">
                <div
                  class="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center relative transform scale-105 shadow-sm shadow-emerald-100/50 z-10"
                  style="
                    background: var(--page-accent);
                    border-color: var(--page-accent);
                    box-shadow: 0 4px 6px -1px var(--page-shadow, rgba(0, 0, 0, 0.1));
                  "
                >
                  <span
                    class="block text-[10px] font-bold text-white uppercase tracking-widest mb-1"
                    >减少了</span
                  >
                  <span class="font-black text-white text-base"
                    >{{ result.ratio
                    }}<span class="text-[10px] ml-0.5">%</span></span
                  >
                </div>
              </el-col>
              <el-col :span="8">
                <div
                  class="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center"
                  style="
                    background: var(--page-accent-light);
                    border-color: var(--page-accent-border);
                  "
                >
                  <span
                    class="block text-[10px] font-bold uppercase tracking-widest mb-1"
                    style="color: var(--page-accent)"
                    >之后</span
                  >
                  <span
                    class="font-black text-sm"
                    style="color: var(--page-accent-text, var(--page-accent))"
                    >{{ result.compressedKb
                    }}<span class="text-[10px] ml-0.5">KB</span></span
                  >
                </div>
              </el-col>
            </el-row>
          </div>
        </template>

        <!-- 配置区 -->
        <template v-else>
          <el-form label-position="top">
            <el-form-item label="压缩模式">
              <el-radio-group
                v-model="compressMode"
                size="large"
                class="w-full flex"
              >
                <el-radio-button label="quality" class="flex-1 !text-center"
                  >按比例压缩</el-radio-button
                >
                <el-radio-button label="target" class="flex-1 !text-center"
                  >指定目标大小</el-radio-button
                >
              </el-radio-group>
            </el-form-item>

            <el-form-item
              v-if="compressMode === 'quality'"
              label="输出体积比例"
            >
              <el-slider
                v-model="qualityPercentage"
                :min="10"
                :max="100"
                :step="5"
                show-input
                class="px-2"
              />
            </el-form-item>
            <el-form-item v-else label="目标文件体积 (KB)">
              <el-input
                type="number"
                v-model.number="targetKb"
                placeholder="如: 500"
                size="large"
              >
                <template #append>KB</template>
              </el-input>
            </el-form-item>

            <el-row :gutter="16">
              <el-col :xs="24" :sm="12">
                <el-form-item label="输出格式">
                  <el-select v-model="outputFormat" size="large" class="w-full">
                    <el-option label="JPEG" value="jpeg" />
                    <el-option label="PNG" value="png" />
                    <el-option label="WEBP" value="webp" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="进阶选项">
                  <div
                    class="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg w-full h-10"
                  >
                    <span class="text-sm font-medium text-slate-600"
                      >清除 EXIF</span
                    >
                    <el-switch v-model="stripExif" />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="最大尺寸约束 (选填)">
              <el-row :gutter="12" class="w-full">
                <el-col :span="12">
                  <el-input
                    type="number"
                    v-model.number="maxWidth"
                    placeholder="宽 (px)"
                    size="large"
                  />
                </el-col>
                <el-col :span="12">
                  <el-input
                    type="number"
                    v-model.number="maxHeight"
                    placeholder="高 (px)"
                    size="large"
                  />
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>
        </template>

        <!-- 底部按钮 -->
        <template #action>
          <div>
            <el-button
              v-if="result"
              type="success"
              size="large"
              class="w-full !h-14 !text-lg !rounded-2xl !font-bold shadow-lg shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
              @click="download"
            >
              <template #icon>
                <Icon
                  icon="solar:download-square-bold-duotone"
                  class="text-xl"
                />
              </template>
              保存文件
            </el-button>
          </div>
          <div>
            <el-button
              v-if="result"
              size="large"
              class="w-full !h-10 !rounded-xl !font-bold"
              plain
              @click="result = null"
            >
              重新设置
            </el-button>
          </div>
          <el-button
            v-if="!result"
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :class="!loading && file ? 'shadow-lg hover:-translate-y-0.5' : ''"
            :style="
              !loading && file
                ? 'box-shadow: 0 10px 15px -3px var(--page-shadow, rgba(0,0,0,0.1))'
                : ''
            "
            :loading="loading"
            :disabled="!file"
            @click="compress"
          >
            <template #icon>
              <Icon
                v-if="!loading"
                icon="solar:magic-stick-3-bold-duotone"
                class="text-xl"
              />
            </template>
            {{ loading ? '压缩中...' : '开始执行压缩' }}
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
:deep(.el-radio-group) {
  display: flex;
  width: 100%;
}
:deep(.el-radio-button) {
  flex: 1;
  display: flex;
}
:deep(.el-radio-button__inner) {
  flex: 1;
  width: 100%;
  border-radius: 8px !important;
}
</style>
