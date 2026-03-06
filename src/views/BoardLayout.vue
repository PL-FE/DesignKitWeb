<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { UploadFile, UploadFiles } from 'element-plus'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import { exportBoard } from '@/api/board'
import { calculateBoxes } from '@/utils/boardLayout'
import type { LayoutBox } from '@/utils/boardLayout'

const isExporting = ref(false)

// 扩展文件类型以保存对象 URL 和尺寸数据
interface LocalImage {
  id: string
  file: File
  url: string
  width: number
  height: number
  box?: LayoutBox
}

const localImages = ref<LocalImage[]>([])
const layoutBoxes = ref<LayoutBox[]>([])
const dragIndex = ref(-1)

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

// 读取图片的宽高
const getImageSize = (
  url: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      resolve({ width: 0, height: 0 })
    }
    img.src = url
  })
}

// 处理上传：由于我们要自定义拖拽网格，不再使用 el-upload 的默认列表，改成自定义管理
const handleFilesChange = async (
  uploadFile: UploadFile,
  uploadFiles: UploadFiles
) => {
  if (!uploadFile.raw) return

  const file = uploadFile.raw
  const url = URL.createObjectURL(file)
  const size = await getImageSize(url)

  localImages.value.push({
    id: uploadFile.uid + '_' + Date.now(),
    file,
    url,
    width: size.width,
    height: size.height,
  })

  updateLayout()
}

const handleRemove = (index: number) => {
  const item = localImages.value[index]
  if (item && item.url) {
    URL.revokeObjectURL(item.url)
  }
  localImages.value.splice(index, 1)
  updateLayout()
}

// 核心排版触发函数
const updateLayout = () => {
  layoutBoxes.value = calculateBoxes(
    form.value.layout,
    localImages.value,
    form.value.width,
    form.value.height,
    form.value.gap
  )
}

// 监听参数变化，自动更新布局
watch(
  form,
  () => {
    updateLayout()
  },
  { deep: true }
)

// 拖拽互换逻辑
const onDragStart = (index: number, event: DragEvent) => {
  dragIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'

    // 创建限定尺寸的拖拽虚影，防止因为原图分辨率过大导致体验不佳
    if (event.target instanceof HTMLElement) {
      const img = event.target.querySelector('img')
      if (img) {
        const dragImg = img.cloneNode(true) as HTMLImageElement
        dragImg.style.width = '120px'
        dragImg.style.height = '120px'
        dragImg.style.objectFit = 'cover'
        dragImg.style.borderRadius = '12px'
        dragImg.style.position = 'absolute'
        dragImg.style.top = '-9999px'
        dragImg.style.left = '-9999px'

        document.body.appendChild(dragImg)

        // 设置鼠标抓取点在缩略图正中心
        event.dataTransfer.setDragImage(dragImg, 60, 60)

        // setDragImage 抓取完毕后清理临时 DOM
        setTimeout(() => {
          if (dragImg.parentNode) {
            document.body.removeChild(dragImg)
          }
        }, 0)
      }
    }
  }
}

const onDragEnter = (index: number) => {
  if (dragIndex.value !== -1 && dragIndex.value !== index) {
    // 交换数组元素位置
    const temp = localImages.value[dragIndex.value]
    localImages.value[dragIndex.value] = localImages.value[index]
    localImages.value[index] = temp
    dragIndex.value = index
    // 注意：这里不用再调用 updateLayout() 重新计算所有坐标，
    // 因为 Vue <transition-group> 依靠 :key 绑定。坐标和 Box 是按 index 给到 DOM 上的，
    // 元素本身在数组里的 index 变了，所以它的 box.x 等于直接变成了新位置的。
  }
}

const onDragEnd = () => {
  dragIndex.value = -1
}

// 用于在相对容器中缩放预览画板适配屏幕
const previewContainer = ref<HTMLElement | null>(null)
const scaleRatio = computed(() => {
  if (!previewContainer.value) return 1
  // 假设预览区域最大 800x600，留点边距
  const containerW = 800
  const containerH = 600
  const ratioW = containerW / form.value.width
  const ratioH = containerH / form.value.height
  return Math.min(ratioW, ratioH, 1) // 不放大，只缩小
})

const handleExport = async () => {
  if (localImages.value.length === 0) {
    ElMessage.warning('请先选择至少一张图片')
    return
  }

  isExporting.value = true
  try {
    const formData = new FormData()

    // 1. 将按顺序的本地文件发过去
    localImages.value.forEach((item) => {
      formData.append('files', item.file)
    })

    // 2. 将最终的布局数据 JSON 传过去，方便后端不用动脑直接画
    const layoutData = JSON.stringify({
      boxes: layoutBoxes.value, // 包含 [{x, y, w, h}, ...]
    })
    formData.append('layout_data', layoutData)

    formData.append('width', form.value.width.toString())
    formData.append('height', form.value.height.toString())
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
  } catch (error) {
    // 错误已拦截
    console.error(error)
  } finally {
    isExporting.value = false
  }
}

const setDimensions = (w: number, h: number) => {
  form.value.width = w
  form.value.height = h
}

onUnmounted(() => {
  localImages.value.forEach((item) => URL.revokeObjectURL(item.url))
})
</script>

<template>
  <ToolPageLayout
    title="图片展板排版"
    description="自动将多张图片智能排版成展板，拖拽交互体验，支持导出分层的 PSD 文件"
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
                添加图片
              </div>
              <el-tag
                size="small"
                type="info"
                effect="plain"
                class="rounded-lg"
              >
                已选 {{ localImages.length }} 张
              </el-tag>
            </div>
          </template>

          <el-upload
            class="w-full board-uploader"
            drag
            multiple
            :show-file-list="false"
            :auto-upload="false"
            :on-change="handleFilesChange"
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
                拖拽多张图片到此处，或 <em>点击继续上传</em>
              </div>
            </div>
          </el-upload>
        </el-card>

        <!-- 预览结果卡片 -->
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card flex-1 min-h-[500px]"
        >
          <template #header>
            <div class="flex items-center gap-2 font-bold text-slate-800">
              <Icon
                icon="solar:eye-bold-duotone"
                class="text-emerald-500 text-lg"
              />
              交互式排版预览 (随意拖拽互换位置)
            </div>
          </template>

          <div
            ref="previewContainer"
            class="w-full h-[600px] flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 overflow-hidden relative"
          >
            <template v-if="localImages.length > 0">
              <!-- 根据计算出的 scale 缩小真画布 -->
              <div
                class="absolute origin-center transition-transform duration-300 shadow-sm"
                :style="{
                  width: `${form.width}px`,
                  height: `${form.height}px`,
                  backgroundColor: form.bgColor,
                  transform: `scale(${scaleRatio})`,
                }"
              >
                <!-- 拖放排列层 -->
                <transition-group
                  name="grid-move"
                  tag="div"
                  class="w-full h-full relative"
                >
                  <div
                    v-for="(item, index) in localImages"
                    :key="item.id"
                    class="absolute cursor-move overflow-hidden group hover:z-10"
                    draggable="true"
                    @dragstart="onDragStart(index, $event)"
                    @dragenter="onDragEnter(index)"
                    @dragover.prevent
                    @dragend="onDragEnd"
                    :style="
                      layoutBoxes[index]
                        ? {
                            left: layoutBoxes[index].x + 'px',
                            top: layoutBoxes[index].y + 'px',
                            width: layoutBoxes[index].w + 'px',
                            height: layoutBoxes[index].h + 'px',
                          }
                        : { display: 'none' }
                    "
                  >
                    <!-- 内部图片裁剪适应效果 -->
                    <img
                      :src="item.url"
                      class="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]"
                    />

                    <!-- 角标序号 -->
                    <div
                      class="absolute top-4 left-4 min-w-[32px] h-[32px] flex items-center justify-center bg-black/60 text-white rounded-lg text-sm font-bold backdrop-blur-sm shadow-md"
                    >
                      {{ index + 1 }}
                    </div>

                    <!-- 删除按钮 -->
                    <button
                      @click="handleRemove(index)"
                      class="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm hover:bg-red-500"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" />
                    </button>

                    <!-- 拖拽提示层（可加可不加） -->
                    <div
                      v-show="dragIndex === index"
                      class="absolute inset-0 bg-emerald-500/20 border-2 border-emerald-500"
                    ></div>
                  </div>
                </transition-group>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col items-center text-slate-400 gap-3">
                <Icon
                  icon="solar:gallery-minimalistic-line-duotone"
                  class="text-6xl opacity-50"
                />
                <p class="text-sm font-medium">
                  请先上传图片，体验实时渲染排版
                </p>
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

        <div class="mt-8">
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
            导出为 PSD (原图分层)
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

/* 覆盖 el-upload drag 模式 */
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

/* Grid Move Animation using FLIP provided by Vue transition-group */
.grid-move-move,
.grid-move-enter-active,
.grid-move-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.grid-move-enter-from,
.grid-move-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.grid-move-leave-active {
  position: absolute; /* 防止占据位置导致挤压动画 */
}
</style>
