<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { UploadUserFile } from 'element-plus'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import { previewBoard, exportBoard } from '@/api/board'

const isPreviewing = ref(false)
const isExporting = ref(false)
const previewUrl = ref('')

const fileList = ref<UploadUserFile[]>([])

const form = ref({
  width: 1920,
  height: 1080,
  layout: 'masonry',
  gap: 20,
  bgColor: '#FFFFFF',
  dpi: 300,
})

const layouts = [
  { label: '自适应瀑布流', value: 'masonry' },
  { label: '等分网格', value: 'grid' },
  { label: '三宫格/九宫格', value: 'nine_grid' },
  { label: '左侧大图', value: 'left_hero' },
  { label: '顶部大图', value: 'top_hero' },
  { label: '杂志风格', value: 'magazine' },
]

const handlePreview = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择至少一张图片')
    return
  }

  isPreviewing.value = true
  try {
    const formData = new FormData()
    fileList.value.forEach((item) => {
      if (item.raw) {
        formData.append('files', item.raw)
      }
    })
    formData.append('layout', form.value.layout)
    formData.append('width', form.value.width.toString())
    formData.append('height', form.value.height.toString())
    formData.append('gap', form.value.gap.toString())
    formData.append('bg_color', form.value.bgColor)

    const blob = await previewBoard(formData)
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
    }
    previewUrl.value = URL.createObjectURL(blob)
    ElMessage.success('预览生成成功')
  } catch {
    // 错误已由拦截器处理
  } finally {
    isPreviewing.value = false
  }
}

const handleExport = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择至少一张图片')
    return
  }

  isExporting.value = true
  try {
    const formData = new FormData()
    fileList.value.forEach((item) => {
      if (item.raw) {
        formData.append('files', item.raw)
      }
    })
    formData.append('layout', form.value.layout)
    formData.append('width', form.value.width.toString())
    formData.append('height', form.value.height.toString())
    formData.append('gap', form.value.gap.toString())
    formData.append('bg_color', form.value.bgColor)
    formData.append('dpi', form.value.dpi.toString())

    const { blob, filename } = await exportBoard(formData)

    // 下载文件
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    // 错误处理
  } finally {
    isExporting.value = false
  }
}

const setDimensions = (w: number, h: number) => {
  form.value.width = w
  form.value.height = h
}

// 自动生成预览的效果：可以监听 form 的变化来自动请求，但是考虑到上传可能很慢且图片多，最好是让用户手动点。这里暂不自动刷新。
</script>

<template>
  <ToolPageLayout
    title="图片展板排版"
    description="自动将多张图片智能排版成展板，并支持导出为分层的 PSD 文件进行二次编辑"
    icon="solar:gallery-edit-bold-duotone"
    color="emerald"
    :leftSpan="16"
    :rightSpan="8"
  >
    <!-- 左侧：上传区与预览区 -->
    <template #upload>
      <div class="flex flex-col gap-6">
        <!-- 上传卡片 -->
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card overflow-visible"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2 font-bold text-slate-800">
                <Icon
                  icon="solar:folder-with-files-bold-duotone"
                  class="text-emerald-500 text-lg"
                />
                选择图片 (可拖拽排序)
              </div>
              <el-tag
                size="small"
                type="info"
                effect="plain"
                class="rounded-lg"
              >
                已选 {{ fileList.length }} 张
              </el-tag>
            </div>
          </template>

          <el-upload
            class="w-full board-uploader"
            drag
            multiple
            :auto-upload="false"
            v-model:file-list="fileList"
            list-type="picture-card"
            accept=".jpg,.jpeg,.png,.webp,.bmp"
          >
            <div
              class="flex flex-col items-center justify-center p-6 text-slate-400"
            >
              <Icon
                icon="solar:upload-bold-duotone"
                class="text-5xl text-emerald-400 mb-3"
              />
              <div class="el-upload__text font-medium text-slate-600">
                拖拽多张图片到此处，或 <em>点击上传</em>
              </div>
            </div>
          </el-upload>
        </el-card>

        <!-- 预览结果卡片 -->
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card flex-1 min-h-[400px]"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:eye-bold-duotone"
                class="text-emerald-500 text-lg"
              />
              排版预览
            </div>
          </template>
          <div
            class="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 overflow-hidden relative"
          >
            <template v-if="previewUrl">
              <img
                :src="previewUrl"
                class="max-w-full max-h-[600px] object-contain shadow-sm"
              />
            </template>
            <template v-else>
              <div class="flex flex-col items-center text-slate-400 gap-3">
                <Icon
                  icon="solar:gallery-minimalistic-line-duotone"
                  class="text-6xl opacity-50"
                />
                <p class="text-sm font-medium">配置右上角参数并点击生成预览</p>
              </div>
            </template>
          </div>
        </el-card>
      </div>
    </template>

    <!-- 右侧：功能控制面板 -->
    <template #panel>
      <el-card
        shadow="hover"
        class="border-slate-200 rounded-2xl custom-card sticky top-6"
      >
        <template #header>
          <div class="flex items-center gap-2 font-bold text-slate-800">
            <Icon
              icon="solar:settings-bold-duotone"
              class="text-emerald-500 text-lg"
            />
            排版设置
          </div>
        </template>

        <el-form label-position="top" size="large" class="space-y-2">
          <!-- 排版模板 -->
          <el-form-item label="排版模板">
            <el-select v-model="form.layout" class="w-full">
              <el-option
                v-for="item in layouts"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <!-- 画板尺寸 -->
          <el-form-item label="画板尺寸 (宽 x 高 px)">
            <div class="flex items-center gap-2 w-full">
              <el-input-number
                v-model="form.width"
                :min="100"
                :step="100"
                class="!w-full"
                :controls="false"
                placeholder="宽"
              />
              <span class="text-slate-400 text-sm">x</span>
              <el-input-number
                v-model="form.height"
                :min="100"
                :step="100"
                class="!w-full"
                :controls="false"
                placeholder="高"
              />
            </div>
            <div class="flex gap-2 mt-2 w-full">
              <el-tag
                size="small"
                class="cursor-pointer"
                @click="setDimensions(1920, 1080)"
                >1920x1080 (16:9)</el-tag
              >
              <el-tag
                size="small"
                class="cursor-pointer"
                @click="setDimensions(1080, 1920)"
                >1080x1920 (9:16)</el-tag
              >
              <el-tag
                size="small"
                class="cursor-pointer"
                @click="setDimensions(2480, 3508)"
                >A4 版面</el-tag
              >
            </div>
          </el-form-item>

          <!-- 间距 -->
          <el-form-item label="图片间距">
            <el-slider
              v-model="form.gap"
              :min="0"
              :max="100"
              :step="5"
              class="px-2"
            />
          </el-form-item>

          <!-- 背景色 -->
          <el-form-item label="背景颜色">
            <el-color-picker
              v-model="form.bgColor"
              :predefine="[
                '#FFFFFF',
                '#000000',
                '#F3F4F6',
                '#EF4444',
                '#3B82F6',
                '#10B981',
              ]"
            />
          </el-form-item>

          <!-- 输出DPI -->
          <el-form-item label="PSD 输出分辨率 (DPI)">
            <el-input-number
              v-model="form.dpi"
              :min="72"
              :max="600"
              :step="72"
              class="!w-full"
            />
          </el-form-item>
        </el-form>

        <div class="mt-8 flex flex-col gap-4">
          <el-button
            type="primary"
            class="w-full !h-12 !rounded-xl !text-base transition-all"
            plain
            :loading="isPreviewing"
            @click="handlePreview"
          >
            <Icon
              icon="solar:eye-linear"
              class="mr-2 text-lg"
              v-if="!isPreviewing"
            />
            生成排版预览
          </el-button>

          <el-button
            type="primary"
            class="w-full !h-14 !rounded-2xl !font-bold !text-lg !m-0 transition-transform hover:scale-[1.02] shadow-lg shadow-emerald-500/30"
            :loading="isExporting"
            @click="handleExport"
          >
            <Icon
              icon="solar:download-minimalistic-bold-duotone"
              class="mr-2 text-xl"
              v-if="!isExporting"
            />
            导出为 PSD (分层)
          </el-button>
        </div>
      </el-card>
    </template>
  </ToolPageLayout>
</template>

<style scoped>
.custom-card {
  --el-card-padding: 1.25rem;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 覆盖 el-upload drag 模式使其兼容 picture-card 展示 */
.board-uploader :deep(.el-upload-dragger) {
  padding: 20px;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;
  background-color: #f8fafc;
  transition: all 0.3s;
}
.board-uploader :deep(.el-upload-dragger:hover) {
  border-color: #10b981;
  background-color: #ecfdf5;
}

/* 重置 list-type 引起的奇怪样式覆盖 */
.board-uploader :deep(.el-upload--picture-card) {
  background-color: transparent;
  border: none;
  width: 100%;
  height: auto;
}
</style>
