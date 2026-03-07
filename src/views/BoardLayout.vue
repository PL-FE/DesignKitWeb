<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { UploadFile } from 'element-plus'
import ToolPageLayout from '@/components/ToolPageLayout.vue'
import BoardLayoutSelector from '@/components/BoardLayoutSelector.vue'
import { exportBoard } from '@/api/board'
import { calculateAdvancedLayout } from '@/utils/boardLayout'
import type {
  LayoutBox,
  SectionItem,
  SectionRow,
  TextItem,
} from '@/utils/boardLayout'

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

// 整个应用的配置
const form = ref({
  width: 1920,
  height: 2500, // 默认固定高度
  unit: 'px',
  gap: 20,
  padding: 60,
  radius: 0,
  bgColor: '#FFFFFF',
  dpi: 150,
})

// 大标题配置
const mainTitle = ref({
  text: '',
  fontSize: 120,
  color: '#333333',
  align: 'center' as 'left' | 'center' | 'right',
  weight: 'bold',
})

// 默认自带一个初始区块
const defaultSection = (): SectionItem => ({
  id: 'sec_' + Date.now() + Math.random().toString(36).slice(2, 6),
  title: '',
  titleFontSize: 60,
  titleColor: '#666666',
  titleAlign: 'left',
  layout: 'masonry',
  heightRatio: 1,
  widthRatio: 1,
  images: [],
  boxes: [],
  isOverflow: false,
})

// 区块列表定义 (二维数据结构 Rows > Sections)
const rows = ref<SectionRow[]>([
  {
    id: 'row_' + Date.now(),
    sections: [defaultSection()],
  },
])

// 选中的特定区块
const selectedSectionId = ref<string | null>(null)

// 计算后的产物
const previewTexts = ref<TextItem[]>([])
const globalOverflow = ref(false)
const globalOverflowX = ref(false)

const pixelWidth = computed(() => {
  if (form.value.unit === 'px') return form.value.width
  if (form.value.unit === 'in')
    return Math.round(form.value.width * form.value.dpi)
  if (form.value.unit === 'cm')
    return Math.round((form.value.width * form.value.dpi) / 2.54)
  if (form.value.unit === 'mm')
    return Math.round((form.value.width * form.value.dpi) / 25.4)
  return form.value.width
})

const pixelHeight = computed(() => {
  if (form.value.unit === 'px') return form.value.height
  if (form.value.unit === 'in')
    return Math.round(form.value.height * form.value.dpi)
  if (form.value.unit === 'cm')
    return Math.round((form.value.height * form.value.dpi) / 2.54)
  if (form.value.unit === 'mm')
    return Math.round((form.value.height * form.value.dpi) / 25.4)
  return form.value.height
})

const layouts = [
  { label: '自适应瀑布流', value: 'masonry' },
  { label: '等分网格', value: 'grid' },
  { label: '三宫格/九宫格', value: 'nine_grid' },
  { label: '左侧大图', value: 'left_hero' },
  { label: '右侧大图', value: 'right_hero' },
  { label: '顶部大图', value: 'top_hero' },
  { label: '底部大图', value: 'bottom_hero' },
  { label: '横向等分铺满', value: 'equal_rows' },
  { label: '纵向等分铺满', value: 'equal_cols' },
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

// 添加入特定的 section 区块（默认在最下方加一行）
const addSectionRow = () => {
  const newSec = defaultSection()
  rows.value.push({
    id: 'row_' + Date.now(),
    sections: [newSec],
  })
  selectedSectionId.value = newSec.id
  updateLayout()
}

// 移除某个行列的区块
const removeSection = (rIdx: number, cIdx: number) => {
  if (rows.value.length === 1 && rows.value[0].sections.length === 1) {
    ElMessage.warning('至少需要保留一个区块')
    return
  }

  const row = rows.value[rIdx]
  if (!row) return
  const sec = row.sections[cIdx]
  if (!sec) return

  sec.images.forEach((item: any) => {
    if (item.url) URL.revokeObjectURL(item.url)
  })
  row.sections.splice(cIdx, 1)

  // 如果这一行空了，则删掉这一行
  if (row.sections.length === 0) {
    rows.value.splice(rIdx, 1)
  }

  // 如果当前删掉的正是选中的，则置空
  if (selectedSectionId.value === sec.id) {
    selectedSectionId.value = null
  }

  updateLayout()
}

// 插入操作集合
const insertColBefore = (rIdx: number, cIdx: number) => {
  const row = rows.value[rIdx]
  if (!row) return
  const newSec = { ...defaultSection(), id: 'sec_' + Date.now() }
  row.sections.splice(cIdx, 0, newSec)
  selectedSectionId.value = newSec.id
  updateLayout()
}

const insertColAfter = (rIdx: number, cIdx: number) => {
  const row = rows.value[rIdx]
  if (!row) return
  const newSec = { ...defaultSection(), id: 'sec_' + Date.now() }
  row.sections.splice(cIdx + 1, 0, newSec)
  selectedSectionId.value = newSec.id
  updateLayout()
}

const insertRowBefore = (rIdx: number) => {
  const newSec = { ...defaultSection(), id: 'sec_' + Date.now() }
  rows.value.splice(rIdx, 0, {
    id: 'row_' + Date.now(),
    sections: [newSec],
  })
  selectedSectionId.value = newSec.id
  updateLayout()
}

const insertRowAfter = (rIdx: number) => {
  const newSec = { ...defaultSection(), id: 'sec_' + Date.now() }
  rows.value.splice(rIdx + 1, 0, {
    id: 'row_' + Date.now(),
    sections: [newSec],
  })
  selectedSectionId.value = newSec.id
  updateLayout()
}

// 处理上传：指定属于哪个 row, 哪 cols
const handleFilesChange = async (
  rIdx: number,
  cIdx: number,
  uploadFile: UploadFile
) => {
  if (!uploadFile.raw) return

  const file = uploadFile.raw
  const url = URL.createObjectURL(file)
  const size = await getImageSize(url)

  const row = rows.value[rIdx]
  if (!row) return
  const sec = row.sections[cIdx]
  if (!sec) return

  // Trigger Vue reactivity explicitly on array
  sec.images.push({
    id: uploadFile.uid + '_' + Date.now(),
    file,
    url,
    width: size.width,
    height: size.height,
  })

  // 强制解构触发深度监听
  rows.value = [...rows.value]
  updateLayout()
}

const handleRemove = (rIdx: number, cIdx: number, imageIdx: number) => {
  const row = rows.value[rIdx]
  if (!row) return
  const sec = row.sections[cIdx]
  if (!sec) return

  const item = sec.images[imageIdx]
  if (item && item.url) {
    URL.revokeObjectURL(item.url)
  }
  sec.images.splice(imageIdx, 1)

  // 触发刷新
  rows.value = [...rows.value]
  updateLayout()
}

let _isUpdatingLayout = false
// 核心排版触发函数
const updateLayout = () => {
  if (_isUpdatingLayout) return

  try {
    _isUpdatingLayout = true
    const result = calculateAdvancedLayout(
      rows.value,
      mainTitle.value,
      pixelWidth.value,
      pixelHeight.value,
      form.value.gap,
      form.value.padding
    )

    // 更新引用状态
    previewTexts.value = result.texts
    globalOverflow.value = result.globalOverflow
    globalOverflowX.value = result.globalOverflowX || false

    // Vue Reactivity 强刷
    rows.value = [...result.rows]
  } catch (err: any) {
    console.error('Layout Calculation Error:', err)
    ElMessage.error('排版计算出错：' + err.message)
  } finally {
    nextTick(() => {
      _isUpdatingLayout = false
    })
  }
}

// 监听参数变化，自动更新布局
watch(
  [form, mainTitle, rows],
  () => {
    updateLayout()
  },
  { deep: true, flush: 'post' }
)

onMounted(() => {
  if (rows.value[0]?.sections[0]) {
    selectedSectionId.value = rows.value[0].sections[0].id
  }
  updateLayout()
})

// 拖拽互换逻辑 (后续更新为行内/列内拖拽)
const dragIndex = ref({ rowIdx: -1, colIdx: -1, imageIdx: -1 })

const onDragStart = (
  rowIdx: number,
  colIdx: number,
  imageIdx: number,
  event: DragEvent
) => {
  dragIndex.value = { rowIdx, colIdx, imageIdx }
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

const onDragEnter = (rowIdx: number, colIdx: number, imageIdx: number) => {
  const row = rows.value[rowIdx]
  if (!row) return
  const sec = row.sections[colIdx]
  if (!sec) return

  if (
    dragIndex.value.rowIdx === rowIdx &&
    dragIndex.value.colIdx === colIdx &&
    dragIndex.value.imageIdx !== -1 &&
    dragIndex.value.imageIdx !== imageIdx
  ) {
    const images = sec.images
    const temp = images[dragIndex.value.imageIdx]
    if (temp) {
      images[dragIndex.value.imageIdx] = images[imageIdx]
      images[imageIdx] = temp
      dragIndex.value.imageIdx = imageIdx

      // 触发界面更新
      rows.value = [...rows.value]
    }
  }
}

const onDragEnd = () => {
  dragIndex.value = { rowIdx: -1, colIdx: -1, imageIdx: -1 }
}

// 可视化拖拽调整列宽
const isResizing = ref(false)
const resizeData = ref({
  startX: 0,
  startWidthRatio0: 1,
  startWidthRatio1: 1,
  rowIdx: -1,
  colIdx: -1,
  totalColsRatio: 1,
})

const startResizeColumn = (e: MouseEvent, rIdx: number, cIdx: number) => {
  e.preventDefault()
  e.stopPropagation()

  const row = rows.value[rIdx]
  if (!row || cIdx >= row.sections.length - 1) return

  const secL = row.sections[cIdx]
  const secR = row.sections[cIdx + 1]
  if (!secL || !secR) return

  isResizing.value = true
  resizeData.value = {
    startX: e.clientX,
    startWidthRatio0: secL.widthRatio || 1,
    startWidthRatio1: secR.widthRatio || 1,
    rowIdx: rIdx,
    colIdx: cIdx,
    totalColsRatio: row.sections.reduce(
      (sum, s) => sum + Math.max(0.1, s.widthRatio || 1),
      0
    ),
  }

  document.addEventListener('mousemove', handleColMousemove)
  document.addEventListener('mouseup', handleColMouseup)
}

const handleColMousemove = (e: MouseEvent) => {
  if (!isResizing.value) return
  const {
    startX,
    startWidthRatio0,
    startWidthRatio1,
    rowIdx,
    colIdx,
    totalColsRatio,
  } = resizeData.value

  const dx = e.clientX - startX
  // 近似计算 dx 对应的 ratio 变化 (基于画布大致宽度)
  const previewW = previewContainer.value?.clientWidth || 800
  const ratioDelta = (dx / previewW) * totalColsRatio

  const row = rows.value[rowIdx]
  if (row) {
    const secL = row.sections[colIdx]
    const secR = row.sections[colIdx + 1]
    if (!secL || !secR) return

    // 限制单列最小 ratio 为 0.1
    let newRatioL = startWidthRatio0 + ratioDelta
    let newRatioR = startWidthRatio1 - ratioDelta

    if (newRatioL < 0.1) {
      newRatioR -= 0.1 - newRatioL
      newRatioL = 0.1
    }
    if (newRatioR < 0.1) {
      newRatioL -= 0.1 - newRatioR
      newRatioR = 0.1
    }

    // 更新宽度占比
    secL.widthRatio = Math.max(0.1, newRatioL)
    secR.widthRatio = Math.max(0.1, newRatioR)

    // 即时触发排版更新
    updateLayout()
  }
}

const handleColMouseup = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleColMousemove)
  document.removeEventListener('mouseup', handleColMouseup)
}

// 用于在相对容器中缩放预览画板适配屏幕
const previewContainer = ref<HTMLElement | null>(null)

// 动态获取容器宽度，保证自适应计算 scale
const containerWidth = ref(800)

let resizeObserver: ResizeObserver | null = null

// 使用 ResizeObserver 监听外层容器大小变动，保证不同屏幕下尺寸自适应缩放
watch(
  previewContainer,
  (newVal) => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    if (newVal) {
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          // 只关心宽度，留出边距进行缩放 (左右各留 40px padding)
          containerWidth.value = entry.contentRect.width - 80
        }
      })
      resizeObserver.observe(newVal)
    }
  },
  { immediate: true }
)

const scaleRatio = computed(() => {
  if (containerWidth.value <= 0) return 1

  // 左右给一点留白
  const paddingVal = 20
  const usableW = Math.max(10, containerWidth.value - paddingVal * 2)

  const ratioW = usableW / (pixelWidth.value || 1)

  // 仅根据宽度放大或缩小，撑满容器宽度
  return Math.max(0.01, ratioW)
})

const handleExport = async () => {
  let imagesCount = 0
  rows.value.forEach((r) => {
    r.sections.forEach((s) => {
      imagesCount += s.images.length
    })
  })

  if (imagesCount === 0 && !mainTitle.value.text) {
    ElMessage.warning('请至少输入标题或上传图片')
    return
  }

  isExporting.value = true
  try {
    const formData = new FormData()

    let imgIdx = 0
    // 1. 将按顺序的本地文件发过去
    rows.value.forEach((r) => {
      r.sections.forEach((sec) => {
        sec.images.forEach((item) => {
          formData.append('files', item.file)
        })
      })
    })

    // 2. 将最终的布局数据 JSON 传过去
    // 所有从各个 section baseBoxes 提炼出来的图片绝对坐标打平成一维数组给后端
    const flatBoxes: LayoutBox[] = []
    rows.value.forEach((r) => {
      r.sections.forEach((sec) => {
        if (sec.boxes) {
          flatBoxes.push(...sec.boxes)
        }
      })
    })

    const layoutData = JSON.stringify({
      texts: previewTexts.value,
      boxes: flatBoxes,
    })
    formData.append('layout_data', layoutData)

    formData.append('width', pixelWidth.value.toString())
    formData.append('height', pixelHeight.value.toString())
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

const setDimensions = (w: number, h: number, unit: string = 'px') => {
  form.value.unit = unit
  form.value.width = w
  form.value.height = h
}

onUnmounted(() => {
  rows.value.forEach((r) => {
    r.sections.forEach((sec) => {
      sec.images.forEach((item: any) => URL.revokeObjectURL(item.url))
    })
  })
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
    <!-- 顶部：全局设置 -->
    <template #top-panel>
      <el-card
        shadow="hover"
        class="border-slate-200 rounded-2xl mb-6 custom-card"
      >
        <div
          class="flex items-center gap-2 font-bold text-slate-800 w-full mb-4"
        >
          <Icon
            icon="solar:settings-bold-duotone"
            class="text-emerald-500 text-lg"
          />
          全局海报设置
        </div>

        <el-form
          :inline="true"
          size="default"
          class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-4 items-end"
        >
          <el-form-item label="海报大标题" class="!mb-0 col-span-2">
            <div class="flex gap-2 w-full">
              <el-input
                v-model="mainTitle.text"
                placeholder="主标题(可选)"
                class="flex-1"
              />
              <el-input-number
                v-model="mainTitle.fontSize"
                :min="12"
                :max="800"
                :step="10"
                placeholder="字号"
                class="w-[60px]! shrink-0"
                :controls="false"
              />
            </div>
          </el-form-item>

          <el-form-item label="画版尺寸" class="!mb-0 col-span-2">
            <div class="flex items-center gap-2 w-full">
              <el-input-number
                v-model="form.width"
                :min="1"
                :step="form.unit === 'px' ? 100 : 10"
                class="flex-1"
                :controls="false"
                placeholder="宽"
              />
              <el-button
                circle
                size="small"
                @click="
                  () => {
                    const t = form.width
                    form.width = form.height
                    form.height = t
                  }
                "
                title="宽高对调"
                ><Icon icon="solar:transfer-horizontal-bold"
              /></el-button>
              <el-input-number
                v-model="form.height"
                :min="1"
                :step="form.unit === 'px' ? 100 : 10"
                class="flex-1"
                :controls="false"
                placeholder="高"
              />
              <el-select v-model="form.unit" class="w-[60px]! shrink-0">
                <el-option label="px" value="px" /><el-option
                  label="mm"
                  value="mm"
                /><el-option label="cm" value="cm" /><el-option
                  label="in"
                  value="in"
                />
              </el-select>
            </div>
          </el-form-item>

          <el-form-item label="快捷尺寸" class="!mb-0 col-span-2">
            <div class="flex gap-2 w-full">
              <el-tag
                size="default"
                class="cursor-pointer flex-1 text-center"
                @click="setDimensions(1920, 2500, 'px')"
                >长海报</el-tag
              >
              <el-tag
                size="default"
                class="cursor-pointer flex-1 text-center"
                @click="setDimensions(1080, 1920, 'px')"
                >壁纸</el-tag
              >
              <el-tag
                size="default"
                class="cursor-pointer flex-1 text-center"
                @click="setDimensions(210, 297, 'mm')"
                >A4</el-tag
              >
            </div>
          </el-form-item>

          <el-form-item label="留白" class="!mb-0">
            <el-input-number
              v-model="form.padding"
              :min="0"
              :max="500"
              :step="10"
              class="w-full"
              :controls="false"
            />
          </el-form-item>

          <el-form-item label="间距" class="!mb-0">
            <el-input-number
              v-model="form.gap"
              :min="0"
              :max="300"
              :step="5"
              class="w-full"
              :controls="false"
            />
          </el-form-item>

          <el-form-item label="背景色" class="!mb-0">
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
              class="w-full"
            />
          </el-form-item>

          <el-form-item label="DPI" class="!mb-0">
            <el-input-number
              v-model="form.dpi"
              :min="72"
              :max="600"
              :step="72"
              class="w-full"
              :controls="false"
            />
          </el-form-item>

          <div
            class="col-span-1 md:col-span-3 lg:col-span-4 xl:col-span-2 flex justify-end items-end h-[32px]"
          >
            <el-button
              type="primary"
              class="!rounded-xl !font-bold shadow-lg shadow-emerald-500/30 w-full"
              :loading="isExporting"
              @click="handleExport"
            >
              <Icon
                icon="solar:download-minimalistic-bold-duotone"
                class="mr-2 text-xl"
                v-if="!isExporting"
              />导出 PSD
            </el-button>
          </div>
        </el-form>
      </el-card>
    </template>
    <!-- 左侧：上传区与预览区 -->
    <template #upload>
      <div class="flex flex-col gap-6">
        <el-card
          shadow="hover"
          class="border-slate-200 rounded-2xl custom-card flex-1 min-h-[500px]"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-slate-800">
                <Icon
                  icon="solar:eye-bold-duotone"
                  class="text-emerald-500 text-lg"
                />
                可视化展板画布 (所见即所得)
              </div>
              <el-button
                size="small"
                type="primary"
                plain
                @click="addSectionRow"
              >
                <Icon icon="solar:add-circle-bold" class="mr-1" />
                新增空白行
              </el-button>
            </div>
          </template>

          <div
            ref="previewContainer"
            class="box-border w-full flex items-center justify-center bg-slate-50/80 rounded-xl border border-dashed border-slate-300 overflow-hidden relative transition-all duration-300"
            @click.self="selectedSectionId = null"
            :style="{
              height: `${Math.round(pixelHeight * scaleRatio) + 40}px`,
            }"
          >
            <template v-if="rows.length > 0 || previewTexts.length > 0">
              <!-- 根据计算出的 scale 缩小真画布 -->
              <div
                class="absolute transition-transform duration-300 shadow-sm"
                :class="[
                  globalOverflow
                    ? 'border-b-4 border-dashed border-red-500'
                    : '',
                  globalOverflowX
                    ? 'border-r-4 border-dashed border-red-500'
                    : '',
                ]"
                :style="{
                  width: `${pixelWidth}px`,
                  height: `${pixelHeight}px`,
                  backgroundColor: form.bgColor,
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) scale(${scaleRatio})`,
                }"
              >
                <div
                  v-if="globalOverflow || globalOverflowX"
                  class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-red-600/30 to-transparent h-32 flex flex-col items-center justify-end pb-4 text-red-700 font-bold z-50 pointer-events-none"
                >
                  <div class="flex items-center" v-if="globalOverflow">
                    <Icon
                      icon="solar:danger-triangle-bold"
                      class="mr-2 text-xl"
                    />
                    总内容已超出预设高度
                  </div>
                  <div class="flex items-center mt-1" v-if="globalOverflowX">
                    <Icon
                      icon="solar:danger-triangle-bold"
                      class="mr-2 text-xl"
                    />
                    内容严重超出画板宽度，请重新设置间距或区块宽度
                  </div>
                </div>

                <!-- 文本渲染层 -->
                <div class="absolute inset-0 z-20 pointer-events-none">
                  <div
                    v-for="(tItem, tIdx) in previewTexts"
                    :key="'txt-' + tIdx"
                    class="absolute flex flex-col justify-center"
                    :style="{
                      left: tItem.x + 'px',
                      top: tItem.y + 'px',
                      width: tItem.w + 'px',
                      height: tItem.h + 'px',
                      fontSize: tItem.fontSize + 'px',
                      color: tItem.color,
                      fontWeight: tItem.weight,
                      textAlign: tItem.align as any,
                      lineHeight: 1.2
                    }"
                  >
                    {{ tItem.text }}
                  </div>
                </div>

                <!-- 每个 行 和 Section 区块的边界渲染与交互 -->
                <template v-for="(row, rIdx) in rows" :key="row.id">
                  <div
                    v-for="(section, cIdx) in row.sections"
                    :key="'secbox-' + section.id"
                    class="absolute border-2 transition-all duration-200 box-border group/sec cursor-pointer"
                    :class="[
                      selectedSectionId === section.id
                        ? 'border-emerald-500 bg-emerald-50/30 z-40 shadow-xl'
                        : 'border-transparent hover:border-slate-300 hover:bg-slate-50/50 z-10',
                      section.isOverflow ? 'border-dashed !border-red-400' : '',
                    ]"
                    :style="
                      section.bound
                        ? {
                            left: section.bound.x - form.gap / 2 + 'px',
                            top: section.bound.y - form.gap / 2 + 'px',
                            width: section.bound.w + form.gap + 'px',
                            height: section.bound.h + form.gap + 'px',
                            borderWidth: `${
                              (selectedSectionId === section.id ? 2 : 1) /
                              scaleRatio
                            }px`,
                          }
                        : { display: 'none' }
                    "
                    @click.stop="selectedSectionId = section.id"
                  >
                    <!-- 空白上传提示区：如果此区没图 -->
                    <div
                      v-if="section.images.length === 0"
                      class="absolute inset-0 flex flex-col items-center justify-center opacity-50 hover:opacity-100 bg-slate-100/30 backdrop-blur-sm"
                    >
                      <el-upload
                        class="w-full h-full flex items-center justify-center opacity-0 absolute inset-0 z-50 cursor-pointer upload-full-cover"
                        drag
                        multiple
                        action="#"
                        :show-file-list="false"
                        :auto-upload="false"
                        :on-change="(file: any) => handleFilesChange(rIdx, cIdx, file)"
                        accept=".jpg,.jpeg,.png,.webp,.bmp"
                      >
                        <div class="w-full h-full"></div>
                      </el-upload>
                      <div
                        class="flex flex-col items-center justify-center pointer-events-none"
                        :style="{
                          transform: `scale(${Math.max(
                            1,
                            Math.min(10, 1 / scaleRatio)
                          )})`,
                        }"
                      >
                        <Icon
                          icon="solar:upload-bold-duotone"
                          class="text-4xl text-emerald-400 mb-2 pointer-events-none"
                        />
                        <div
                          class="text-sm font-bold text-slate-500 pointer-events-none"
                        >
                          点击/拖拽上传图
                        </div>
                      </div>
                    </div>

                    <!-- 悬浮删除区块 -->
                    <button
                      v-show="selectedSectionId === section.id"
                      @click.stop="removeSection(rIdx, cIdx)"
                      class="absolute z-50 rounded-full bg-white text-red-500 flex items-center justify-center shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-50 hover:border-red-500 hover:scale-110 active:scale-95"
                      :style="{
                        width: `${
                          36 * Math.min(3, Math.max(1, 1 / scaleRatio))
                        }px`,
                        height: `${
                          36 * Math.min(3, Math.max(1, 1 / scaleRatio))
                        }px`,
                        top: `${
                          -18 * Math.min(3, Math.max(1, 1 / scaleRatio))
                        }px`,
                        right: `${
                          -18 * Math.min(3, Math.max(1, 1 / scaleRatio))
                        }px`,
                        fontSize: `${
                          18 * Math.min(3, Math.max(1, 1 / scaleRatio))
                        }px`,
                      }"
                    >
                      <Icon icon="solar:trash-bin-trash-bold" />
                    </button>

                    <!-- 列宽拖拉手柄 (非最后一列) -->
                    <div
                      v-if="cIdx < row.sections.length - 1"
                      class="absolute top-0 bottom-0 z-50 cursor-col-resize hover:bg-emerald-500/30 active:bg-emerald-500 transition-colors flex items-center justify-center"
                      :style="{
                        width: `${14 / scaleRatio}px`,
                        right: `${-7 / scaleRatio}px`,
                      }"
                      :class="{
                        'bg-emerald-500/20':
                          isResizing &&
                          resizeData.colIdx === cIdx &&
                          resizeData.rowIdx === rIdx,
                      }"
                      @mousedown.stop="startResizeColumn($event, rIdx, cIdx)"
                    >
                      <div
                        class="bg-emerald-400 rounded-full opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
                        :style="{
                          width: `${4 / scaleRatio}px`,
                          height: `${32 / scaleRatio}px`,
                        }"
                      ></div>
                    </div>

                    <!-- 拖放排列层 (图元层) -->
                    <transition-group
                      name="grid-move"
                      tag="div"
                      class="w-full h-full absolute inset-0 pointer-events-none"
                      :style="{
                        zIndex: selectedSectionId === section.id ? 20 : 10,
                      }"
                    >
                      <div
                        v-for="(item, iIdx) in section.images"
                        :key="item.id"
                        class="absolute cursor-move group hover:z-30 pointer-events-auto"
                        draggable="true"
                        @dragstart="onDragStart(rIdx, cIdx, iIdx, $event)"
                        @dragenter="onDragEnter(rIdx, cIdx, iIdx)"
                        @dragover.prevent
                        @dragend="onDragEnd"
                        @click.stop="selectedSectionId = section.id"
                        :style="
                          section.boxes && section.boxes[iIdx]
                            ? {
                                left:
                                  section.boxes[iIdx].x -
                                  (section.bound?.x || 0) +
                                  form.gap / 2 +
                                  'px',
                                top:
                                  section.boxes[iIdx].y -
                                  (section.bound?.y || 0) +
                                  form.gap / 2 +
                                  'px',
                                width: section.boxes[iIdx].w + 'px',
                                height: section.boxes[iIdx].h + 'px',
                              }
                            : { display: 'none' }
                        "
                      >
                        <div
                          class="absolute inset-0 overflow-hidden shadow-sm transition-shadow group-hover:shadow-md"
                          :style="{ borderRadius: form.radius + 'px' }"
                        >
                          <img
                            :src="item.url"
                            class="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]"
                          />
                        </div>

                        <!-- 删除对应图片按钮 -->
                        <button
                          v-show="selectedSectionId === section.id"
                          @click.stop="handleRemove(rIdx, cIdx, iIdx)"
                          class="absolute z-30 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-red-500 shadow-lg border border-white/20 pointer-events-auto hover:scale-110 active:scale-95"
                          :style="{
                            width: `${
                              32 * Math.min(3, Math.max(1, 1 / scaleRatio))
                            }px`,
                            height: `${
                              32 * Math.min(3, Math.max(1, 1 / scaleRatio))
                            }px`,
                            top: `${
                              8 * Math.min(3, Math.max(1, 1 / scaleRatio))
                            }px`,
                            right: `${
                              8 * Math.min(3, Math.max(1, 1 / scaleRatio))
                            }px`,
                            fontSize: `${
                              16 * Math.min(3, Math.max(1, 1 / scaleRatio))
                            }px`,
                          }"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" />
                        </button>

                        <div
                          v-show="
                            dragIndex.rowIdx === rIdx &&
                            dragIndex.colIdx === cIdx &&
                            dragIndex.imageIdx === iIdx
                          "
                          class="absolute inset-0 bg-emerald-500/20 border-4 border-emerald-500 pointer-events-none z-30"
                          :style="{ borderRadius: form.radius + 'px' }"
                        ></div>
                      </div>
                    </transition-group>

                    <!-- Section 溢出标记 -->
                    <div
                      v-if="section.isOverflow || section.isOverflowX"
                      class="absolute z-40 bg-red-500/10 border-2 border-dashed border-red-500 pointer-events-none font-bold text-red-500 flex items-end justify-end p-4"
                      :style="{
                        left: form.padding + 'px',
                        top:
                          section.boxes && section.boxes.length > 0
                            ? (section.boxes[0]?.y || 0) + 'px'
                            : 0,
                        right: form.padding + 'px',
                        height: '100px',
                      }"
                    >
                      此区块{{ section.isOverflowX ? '宽度' : '高度' }}不足
                    </div>
                  </div>
                </template>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col items-center text-slate-400 gap-3">
                <Icon
                  icon="solar:gallery-minimalistic-line-duotone"
                  class="text-6xl opacity-50"
                />
                <p class="text-sm font-medium">
                  请先添加区块与图片，体验排版功能
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
        <el-form label-position="top" size="large" class="space-y-4">
          <!-- 选中某个区块时的局部设置 -->
          <div
            v-if="selectedSectionId"
            class="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-inner"
          >
            <h4
              class="font-bold text-emerald-800 text-sm mb-3 mt-0 flex justify-between items-center"
            >
              <span>当前选中区块配置</span>
            </h4>

            <template v-for="(row, rIdx) in rows" :key="row.id">
              <template
                v-for="(section, cIdx) in row.sections"
                :key="section.id"
              >
                <div v-if="section.id === selectedSectionId" class="space-y-4">
                  <el-form-item label="区块内部小标题">
                    <el-input
                      v-model="section.title"
                      placeholder="可选小标题"
                    />
                  </el-form-item>

                  <el-form-item label="网格排版模式">
                    <div class="overflow-hidden w-full">
                      <BoardLayoutSelector
                        v-model="section.layout"
                        :layouts="layouts"
                        class="w-full! box-border"
                      />
                    </div>
                  </el-form-item>
                  <div class="flex gap-4 w-full">
                    <el-form-item label="区块宽度配比" class="flex-1">
                      <el-input-number
                        v-model="section.widthRatio"
                        :min="0.1"
                        :max="20"
                        :step="1"
                        class="w-full! border-none"
                        :controls="false"
                      />
                    </el-form-item>
                    <el-form-item label="区块高度配比" class="flex-1">
                      <el-input-number
                        v-model="section.heightRatio"
                        :min="0.1"
                        :max="20"
                        :step="1"
                        class="w-full! border-none"
                        :controls="false"
                      />
                    </el-form-item>
                  </div>

                  <div
                    class="grid grid-cols-2 gap-3 pb-2 border-b border-emerald-200/50"
                  >
                    <el-button
                      size="small"
                      class="!w-full !m-0 justify-center"
                      @click="insertRowBefore(rIdx)"
                    >
                      <Icon icon="solar:arrow-up-bold" class="mr-1" />上方插入行
                    </el-button>
                    <el-button
                      size="small"
                      class="!w-full !m-0 justify-center"
                      @click="insertRowAfter(rIdx)"
                    >
                      <Icon
                        icon="solar:arrow-down-bold"
                        class="mr-1"
                      />下方插入行
                    </el-button>
                    <el-button
                      size="small"
                      class="!w-full !m-0 justify-center"
                      @click="insertColBefore(rIdx, cIdx)"
                    >
                      <Icon
                        icon="solar:arrow-left-bold"
                        class="mr-1"
                      />左侧插入列
                    </el-button>
                    <el-button
                      size="small"
                      class="!w-full !m-0 justify-center"
                      @click="insertColAfter(rIdx, cIdx)"
                    >
                      <Icon
                        icon="solar:arrow-right-bold"
                        class="mr-1"
                      />右侧插入列
                    </el-button>
                  </div>

                  <el-button
                    type="danger"
                    plain
                    class="w-full !mt-2"
                    @click="removeSection(rIdx, cIdx)"
                  >
                    <Icon icon="solar:trash-bin-trash-bold" class="mr-1" />
                    删除当前区块
                  </el-button>

                  <el-form-item label="拖拽上传更多图片">
                    <el-upload
                      class="w-full board-uploader"
                      drag
                      multiple
                      action="#"
                      :show-file-list="false"
                      :auto-upload="false"
                      :on-change="(file: any) => handleFilesChange(rIdx, cIdx, file)"
                      accept=".jpg,.jpeg,.png,.webp,.bmp"
                    >
                      <div
                        class="flex flex-col items-center justify-center py-3 text-slate-400"
                      >
                        <Icon
                          icon="solar:upload-bold-duotone"
                          class="text-3xl text-emerald-400 mb-1"
                        />
                        <div
                          class="el-upload__text font-medium text-slate-600 text-xs"
                        >
                          拖拽 / 点击增加图
                        </div>
                      </div>
                    </el-upload>
                  </el-form-item>
                </div>
              </template>
            </template>
          </div>
          <div
            v-else
            class="flex flex-col items-center justify-center p-10 text-slate-400 border border-dashed border-slate-200 rounded-xl"
          >
            <Icon
              icon="solar:cursor-square-line-duotone"
              class="text-4xl mb-2 opacity-50"
            />
            <p class="text-sm font-medium">
              请点击左侧画布中的区块以进行详细排版配置
            </p>
          </div>
        </el-form>
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

/* 确保预览区空白占位符能完全覆盖区域，支持点击触发系统文件选择框 */
.upload-full-cover :deep(.el-upload),
.upload-full-cover :deep(.el-upload-dragger) {
  width: 100%;
  height: 100%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 0;
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
