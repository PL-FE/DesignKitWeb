<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { compressImageApi } from '@/api/image'

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/bmp,image/tiff'

// 表单状态
const file = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

// 模式与参数
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

function handleFileChange(uploadFile: any) {
  if (uploadFile && uploadFile.raw) {
    selectFile(uploadFile.raw)
  }
}

function selectFile(f: File) {
  file.value = f
  result.value = null
  previewUrl.value = URL.createObjectURL(f)
}

function removeFile() {
  file.value = null
  previewUrl.value = null
  result.value = null
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
      const calcTarget = fileKb * (qualityPercentage.value / 100)
      form.append('target_kb', String(Math.max(1, calcTarget)))
    } else {
      if (targetKb.value) {
        form.append('target_kb', String(targetKb.value))
      } else {
        throw new Error('请填写目标文件体积')
      }
    }

    if (maxWidth.value) form.append('max_width', String(maxWidth.value))
    if (maxHeight.value) form.append('max_height', String(maxHeight.value))
    form.append('output_format', outputFormat.value)
    form.append('strip_exif', String(stripExif.value))

    const res = await compressImageApi(form)
    result.value = res

    ElMessage.success('压缩完成')
  } catch (e: any) {
    // API 文件及拦截器已处理相应的异常通知
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
  <div
    class="px-4 py-6 md:py-10 mx-auto max-w-6xl w-full box-border overflow-x-hidden animate-fade-in"
  >
    <!-- Header -->
    <PageHeader
      title="智能图像压缩"
      description="本地处理极速转换，保护隐私同时满足体积要求"
      icon="solar:gallery-minimalistic-bold-duotone"
      gradient="from-violet-500 to-fuchsia-500"
    />

    <el-row :gutter="24">
      <!-- 左侧：上传与配置 -->
      <el-col :xs="24" :lg="14" class="mb-6 lg:mb-0">
        <!-- 上传区域 -->
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl mb-6 custom-card"
        >
          <el-upload
            class="upload-demo w-full"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :accept="ACCEPTED_TYPES"
            :on-change="handleFileChange"
          >
            <!-- if !file -->
            <div v-if="!file" class="el-upload__text px-4 py-8 md:py-12">
              <Icon
                icon="solar:upload-linear"
                class="text-4xl text-violet-400 mb-2 inline-block"
              />
              <div class="text-base font-bold text-slate-700">
                将图片拖曳至此，或
                <em class="text-violet-500 not-italic">点击选择</em>
              </div>
              <div class="text-xs text-slate-400 mt-2">支持 JPG, PNG, WEBP</div>
            </div>
            <!-- if file preview -->
            <div
              v-else
              class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 md:p-6 w-full h-full relative z-10 text-left cursor-default"
            >
              <div class="relative flex-shrink-0">
                <img
                  :src="previewUrl!"
                  class="w-24 h-24 object-cover rounded-xl shadow-sm border border-slate-100"
                />
              </div>
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <p
                  class="font-bold text-slate-800 text-base truncate w-full"
                  :title="file.name"
                >
                  {{ file.name }}
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
                @click.stop="removeFile"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </el-button>
            </div>
          </el-upload>
        </el-card>

        <!-- 配置区域 -->
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card lg:mb-0 mb-6"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:settings-minimalistic-bold-duotone"
                class="text-violet-500 text-lg"
              />
              压制设置
            </div>
          </template>

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

            <div v-if="compressMode === 'quality'">
              <el-form-item label="输出体积比例">
                <el-slider
                  v-model="qualityPercentage"
                  :min="10"
                  :max="100"
                  :step="5"
                  show-input
                  class="px-2"
                />
              </el-form-item>
            </div>
            <div v-else>
              <el-form-item label="目标文件体积 (KB)">
                <el-input
                  type="number"
                  v-model.number="targetKb"
                  placeholder="填入数字，如: 500"
                  size="large"
                >
                  <template #append>KB</template>
                </el-input>
              </el-form-item>
            </div>

            <el-row :gutter="20">
              <el-col :xs="24" :sm="12">
                <el-form-item label="输出格式">
                  <el-select
                    v-model="outputFormat"
                    size="large"
                    class="w-full rounded-xl"
                  >
                    <el-option label="JPEG" value="jpeg" />
                    <el-option label="PNG" value="png" />
                    <el-option label="WEBP" value="webp" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12">
                <el-form-item label="进阶选项">
                  <div
                    class="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg w-full"
                  >
                    <span class="text-sm font-medium text-slate-600"
                      >清除EXIF信息</span
                    >
                    <el-switch
                      v-model="stripExif"
                      style="--el-switch-on-color: #8b5cf6"
                    />
                  </div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="最大尺寸约束 (选填)">
              <el-row :gutter="12">
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

            <div class="mt-6 pt-6 border-t border-slate-100">
              <el-button
                type="primary"
                size="large"
                class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
                :class="
                  !loading && file
                    ? 'shadow-lg shadow-violet-500/30 hover:-translate-y-0.5'
                    : ''
                "
                color="#8b5cf6"
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
                {{ loading ? '压缩处理中...' : '开始执行压缩' }}
              </el-button>
            </div>
          </el-form>
        </el-card>
      </el-col>

      <!-- 右侧/下方：结果区 -->
      <el-col :xs="24" :lg="10">
        <el-card
          shadow="never"
          class="border-slate-200 rounded-2xl h-full min-h-[300px] flex flex-col custom-card sticky top-24"
        >
          <div
            v-if="!result"
            class="flex-1 flex flex-col items-center justify-center opacity-40 py-20 px-6 text-center"
          >
            <Icon
              icon="solar:checklist-minimalistic-bold-duotone"
              class="text-6xl text-slate-300 mb-4"
            />
            <p class="font-bold text-slate-500">
              参数设定完成后，点击左侧按钮进行处理
            </p>
          </div>

          <div v-else class="flex-1 flex flex-col animate-fade-in-up">
            <h4
              class="font-bold text-slate-800 text-base mb-4 flex items-center gap-2"
            >
              <Icon
                icon="solar:check-circle-bold-duotone"
                class="text-emerald-500 text-lg"
              />
              处理完成
            </h4>

            <div
              class="relative rounded-xl overflow-hidden bg-slate-100/50 mb-6 aspect-video flex-shrink-0 flex items-center justify-center border border-slate-100"
            >
              <img :src="result.url" class="object-contain w-full h-full p-2" />
            </div>

            <el-row :gutter="12" class="mb-6">
              <el-col :span="8">
                <div
                  class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center h-full flex flex-col justify-center"
                >
                  <span
                    class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1"
                    >之前</span
                  >
                  <span class="font-black text-slate-700 text-sm md:text-base"
                    >{{ result.originalKb
                    }}<span class="text-[10px] ml-0.5">KB</span></span
                  >
                </div>
              </el-col>
              <el-col :span="8">
                <div
                  class="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center h-full flex flex-col justify-center relative transform scale-105 shadow-sm shadow-emerald-100/50 z-10"
                >
                  <span
                    class="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1"
                    >减少了</span
                  >
                  <span class="font-black text-emerald-600 text-base md:text-lg"
                    >{{ result.ratio
                    }}<span class="text-[10px] ml-0.5">%</span></span
                  >
                </div>
              </el-col>
              <el-col :span="8">
                <div
                  class="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center h-full flex flex-col justify-center"
                >
                  <span
                    class="block text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1"
                    >之后</span
                  >
                  <span class="font-black text-violet-700 text-sm md:text-base"
                    >{{ result.compressedKb
                    }}<span class="text-[10px] ml-0.5">KB</span></span
                  >
                </div>
              </el-col>
            </el-row>

            <div class="mt-8 pt-4">
              <el-button
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
                保存结果文件
              </el-button>
            </div>
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
.animate-fade-in-up {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* override el-upload styling for full width and drag design */
:deep(.el-upload) {
  width: 100%;
  display: block;
}
:deep(.el-upload-dragger) {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  width: 100%;
}

/* Card wrapper generic styles */
.custom-card {
  --el-card-padding: 1.25rem;
}

/* Radio button responsive width */
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
