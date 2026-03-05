<script setup lang="ts">
import { ref } from 'vue'
import { useConverterStore } from '@/stores/converter'
import { convertCadFile } from '@/api/converter'
import type { UploadRawFile } from 'element-plus'
import { Icon } from '@iconify/vue'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import ToolUploader from '@/components/ToolUploader.vue'
import ToolSettingsCard from '@/components/ToolSettingsCard.vue'

const converterStore = useConverterStore()
const isConverting = ref(false)
const selectedFile = ref<File | null>(null)
const conversionProgress = ref(0)
const progressStatusText = ref('')

/** 扩展名校验：只允许 .dwg / .dxf */
const validateCadFile = (file: UploadRawFile): boolean | string => {
  const name = file.name.toLowerCase()
  if (!name.endsWith('.dwg') && !name.endsWith('.dxf')) {
    return '只能上传 .dwg 或 .dxf 格式的文件'
  }
  return true
}

const handleConvert = async () => {
  if (!selectedFile.value) return

  isConverting.value = true
  conversionProgress.value = 0
  progressStatusText.value = '正在拼装传输块...'

  try {
    await convertCadFile(
      selectedFile.value,
      converterStore.preferredVersion,
      (progress, status) => {
        conversionProgress.value = progress
        if (status) progressStatusText.value = status
      }
    )
    selectedFile.value = null
  } catch {
    // 错误处理已经在 API 拦截器完成
  } finally {
    isConverting.value = false
    setTimeout(() => {
      conversionProgress.value = 0
      progressStatusText.value = ''
    }, 2000)
  }
}
</script>

<template>
  <ToolPageLayout
    title="CAD 版本转换"
    description="不装软件，在线把 DWG / DXF 转成低版本或其他格式"
    icon="solar:document-bold-duotone"
    gradient="from-blue-500 to-indigo-500"
  >
    <!-- 左侧：上传区 -->
    <template #upload>
      <ToolUploader
        v-model="selectedFile"
        empty-icon="solar:cloud-upload-bold-duotone"
        empty-icon-class="text-blue-400"
        empty-text="拖动 CAD 文件以添加"
        accent-class="text-blue-500"
        hint="支持 .dwg 和 .dxf · 最大 1000MB"
        accept=".dwg,.dxf"
        :max-size-mb="1000"
        :on-validate="validateCadFile"
        selected-icon="solar:file-check-bold-duotone"
        selected-bg-class="bg-blue-50"
        selected-icon-class="text-blue-500 border-blue-100"
      />
    </template>

    <!-- 右侧：设置面板 -->
    <template #panel>
      <ToolSettingsCard
        card-title="转换设置"
        card-title-icon="solar:settings-bold-duotone"
        card-title-icon-class="text-blue-500"
      >
        <el-form label-position="top" class="flex-1 flex flex-col">
          <el-form-item label="目标 CAD 版本">
            <el-select
              v-model="converterStore.preferredVersion"
              placeholder="请选择"
              size="large"
              class="w-full"
            >
              <el-option label="AutoCAD 2018" value="ACAD2018" />
              <el-option label="AutoCAD 2013" value="ACAD2013" />
              <el-option label="AutoCAD 2010" value="ACAD2010" />
              <el-option label="AutoCAD 2007" value="ACAD2007" />
              <el-option label="AutoCAD 2004" value="ACAD2004" />
              <el-option label="AutoCAD 2000" value="ACAD2000" />
              <el-option label="AutoCAD R14" value="ACAD14" />
              <el-option label="AutoCAD R12" value="ACAD12" />
            </el-select>
          </el-form-item>
        </el-form>

        <!-- 进度条 -->
        <div
          v-if="isConverting && conversionProgress !== undefined"
          class="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100"
        >
          <div class="flex justify-between items-center mb-2">
            <span
              class="text-xs font-bold text-slate-500 flex items-center gap-1"
            >
              <Icon
                v-if="conversionProgress === 100"
                icon="solar:round-transfer-line-duotone"
                class="animate-spin text-blue-500 text-base"
              />
              {{ progressStatusText || '正在解析文件...' }}
            </span>
            <span
              v-if="conversionProgress < 100"
              class="text-xs font-black text-blue-600"
              >{{ conversionProgress }}%</span
            >
          </div>
          <el-progress
            :percentage="conversionProgress"
            :show-text="false"
            :stroke-width="8"
            color="#3b82f6"
          />
        </div>

        <template #action>
          <el-button
            type="primary"
            size="large"
            class="w-full !h-14 !text-lg !rounded-2xl !font-bold transition-all"
            :class="
              !isConverting && selectedFile
                ? 'shadow-lg shadow-blue-500/30'
                : ''
            "
            color="#3b82f6"
            :disabled="!selectedFile || isConverting"
            :loading="isConverting"
            @click="handleConvert"
          >
            <template #icon>
              <Icon
                v-if="!isConverting"
                icon="solar:magic-stick-3-bold-duotone"
                class="text-xl"
              />
            </template>
            {{ isConverting ? '处理转换中...' : '开始执行转换' }}
          </el-button>
        </template>
      </ToolSettingsCard>
    </template>
  </ToolPageLayout>
</template>
