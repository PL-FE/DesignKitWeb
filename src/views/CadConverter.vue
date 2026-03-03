<script setup lang="ts">
import { ref } from 'vue'
import { useConverterStore } from '@/stores/converter'
import { convertCadFile } from '@/api/converter'
import type { UploadInstance, UploadProps } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

const converterStore = useConverterStore()
const uploadRef = ref<UploadInstance>()
const isConverting = ref(false)
const selectedFile = ref<File | null>(null)
const conversionProgress = ref(0)
const progressStatusText = ref('')

const handleChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    const isValidExtension =
      uploadFile.name.toLowerCase().endsWith('.dwg') ||
      uploadFile.name.toLowerCase().endsWith('.dxf')
    if (!isValidExtension) {
      ElMessage.warning('只能上传 .dwg 或 .dxf 格式的文件')
      uploadRef.value?.clearFiles()
      selectedFile.value = null
      return
    }

    if (uploadFile.size && uploadFile.size > 1000 * 1024 * 1024) {
      ElMessage.warning('文件大小不能超过 1000MB')
      uploadRef.value?.clearFiles()
      selectedFile.value = null
      return
    }
    selectedFile.value = uploadFile.raw
  }
}

const handleRemove: UploadProps['onRemove'] = () => {
  selectedFile.value = null
}

const handleConvert = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传需要转换的 CAD 文件')
    return
  }

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
    ElMessage.success('转换成功！已开始下载')
    uploadRef.value?.clearFiles()
    selectedFile.value = null
  } catch (err) {
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
  <div
    class="px-4 py-6 md:py-10 mx-auto max-w-6xl w-full box-border overflow-x-hidden animate-fade-in"
  >
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <div
        class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-md flex items-center justify-center text-white text-2xl flex-shrink-0"
      >
        <Icon icon="solar:document-bold-duotone" />
      </div>
      <div class="overflow-hidden">
        <h2
          class="text-xl md:text-2xl font-black text-slate-800 tracking-tight truncate"
        >
          CAD 版本转换
        </h2>
        <p class="text-slate-500 text-xs md:text-sm mt-1 truncate">
          云端解析极速转换，兼容全系列 AutoCAD 版本格式
        </p>
      </div>
    </div>

    <el-row :gutter="24">
      <!-- 左侧：上传区 -->
      <el-col :xs="24" :lg="14" class="mb-6 lg:mb-0">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col justify-center min-h-[300px]"
        >
          <el-upload
            ref="uploadRef"
            class="upload-demo w-full h-full flex flex-col justify-center"
            drag
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            accept=".dwg,.dxf"
            :on-change="handleChange"
          >
            <div
              v-if="!selectedFile"
              class="el-upload__text px-4 py-12 md:py-20 flex flex-col items-center"
            >
              <Icon
                icon="solar:cloud-upload-bold-duotone"
                class="text-5xl text-blue-400 mb-4 inline-block"
              />
              <div class="text-lg font-bold text-slate-700 mb-2">
                拖动文件以添加，或
                <em class="text-blue-500 not-italic">浏览文件</em>
              </div>
              <div class="text-xs text-slate-400 font-medium">
                最大支持 1000MB 的 .dwg 或 .dxf 单个文件
              </div>
            </div>

            <div
              v-else
              class="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-6 md:p-8 w-full h-full relative z-10 text-left cursor-default"
            >
              <div
                class="w-20 h-20 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-4xl shadow-sm border border-blue-100 flex-shrink-0"
              >
                <Icon icon="solar:file-check-bold-duotone" />
              </div>
              <div
                class="flex-1 min-w-0 flex flex-col justify-center w-full mt-2 sm:mt-0"
              >
                <p
                  class="font-bold text-slate-800 text-lg truncate w-full"
                  :title="selectedFile.name"
                >
                  {{ selectedFile.name }}
                </p>
                <div class="flex items-center gap-2 mt-2">
                  <el-tag
                    size="small"
                    type="primary"
                    effect="plain"
                    class="!font-bold"
                    >{{
                      (selectedFile.size / 1024 / 1024).toFixed(2)
                    }}
                    MB</el-tag
                  >
                </div>
              </div>
              <el-button
                type="danger"
                circle
                plain
                size="small"
                class="absolute top-2 right-2 sm:static mt-2 sm:mt-0"
                @click.stop="handleRemove"
              >
                <Icon icon="solar:trash-bin-trash-bold" />
              </el-button>
            </div>
          </el-upload>
        </el-card>
      </el-col>

      <!-- 右侧：控制台 -->
      <el-col :xs="24" :lg="10">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card h-full flex flex-col relative"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:settings-bold-duotone"
                class="text-blue-500 text-lg"
              />
              转换设置
            </div>
          </template>

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

            <div class="mt-auto pt-6 flex flex-col gap-3 flex-1 justify-end">
              <!-- 进度条及处理状态展示 -->
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
            </div>
          </el-form>
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
  }
  to {
    opacity: 1;
  }
}

/* override el-upload styling for full width and drag design */
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

/* Card wrapper generic styles */
.custom-card {
  --el-card-padding: 1.25rem;
}
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
