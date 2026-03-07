export interface ImageSize {
  width: number
  height: number
  ratio?: number
  [key: string]: any
}

export interface LayoutBox {
  x: number
  y: number
  w: number
  h: number
  [key: string]: any
}

export interface TextItem {
  text: string
  fontSize: number
  color: string
  align: 'left' | 'center' | 'right'
  weight: string
  x: number
  y: number
  w: number
  h: number
}

export interface SectionItem {
  id: string
  title: string
  titleFontSize: number
  titleColor: string
  titleAlign: 'left' | 'center' | 'right'
  layout: string
  heightRatio: number // 区块高度占比 (影响该行的整体高度)
  widthRatio: number // 同一行内区块宽度的占比，默认为 1
  images: any[] // LocalImage[]
  boxes: LayoutBox[] // 计算后的图片坐标
  bound?: LayoutBox // 区块自身的整体边界坐标(供外框/空白区展示使用)
  isOverflow: boolean // 计算结果是否高度溢出
  isOverflowX?: boolean // 计算结果是否宽度溢出

  // 自定义网格配置
  customGridCols?: number
  customGridRows?: number
  customColRatios?: number[]
  customRowRatios?: number[]
}

export interface SectionRow {
  id: string
  sections: SectionItem[]
}

// 辅助方法：计算网格行列数
export function getGridDimensions(
  numItems: number,
  w: number,
  h: number
): { cols: number; rows: number } {
  const aspect = h > 0 ? w / h : 1
  const rows = Math.max(1, Math.round(Math.sqrt(numItems / aspect)))
  const cols = Math.max(1, Math.ceil(numItems / rows))
  return { cols, rows }
}

// 等分网格 grid
function layoutGrid(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  const { cols, rows } = getGridDimensions(numItems, w, h)
  const boxes: LayoutBox[] = []
  const boxW = (w - (cols - 1) * gap) / cols
  const boxH = (h - (rows - 1) * gap) / rows

  for (let i = 0; i < numItems; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    boxes.push({
      x: c * (boxW + gap),
      y: r * (boxH + gap),
      w: boxW,
      h: boxH,
    })
  }
  return boxes
}

// 三宫格/九宫格 nine_grid
function layoutNineGrid(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  let cols, rows
  if (numItems <= 3) {
    cols = numItems
    rows = 1
  } else if (numItems <= 4) {
    cols = 2
    rows = 2
  } else if (numItems <= 6) {
    cols = 3
    rows = 2
  } else {
    cols = 3
    rows = 3
  }

  const boxes: LayoutBox[] = []
  const boxW = (w - (cols - 1) * gap) / cols
  const boxH = (h - (rows - 1) * gap) / rows
  const limit = Math.min(numItems, cols * rows)

  for (let i = 0; i < limit; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    boxes.push({
      x: c * (boxW + gap),
      y: r * (boxH + gap),
      w: boxW,
      h: boxH,
    })
  }
  return boxes
}

// 左侧大图 left_hero
function layoutLeftHero(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems === 1) return layoutGrid(1, w, h, gap)

  const heroW = (w - gap) * 0.5
  const boxes: LayoutBox[] = [{ x: 0, y: 0, w: heroW, h }]

  const remBoxes = layoutGrid(numItems - 1, w - heroW - gap, h, gap)
  for (const b of remBoxes) {
    b.x += heroW + gap
  }
  return [...boxes, ...remBoxes]
}

// 右侧大图 right_hero
function layoutRightHero(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems === 1) return layoutGrid(1, w, h, gap)

  const heroW = (w - gap) * 0.5

  const remBoxes = layoutGrid(numItems - 1, w - heroW - gap, h, gap)

  const boxes: LayoutBox[] = [{ x: w - heroW, y: 0, w: heroW, h }]
  return [...remBoxes, ...boxes]
}

// 顶部大图 top_hero
function layoutTopHero(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems === 1) return layoutGrid(1, w, h, gap)

  const heroH = (h - gap) * 0.5
  const boxes: LayoutBox[] = [{ x: 0, y: 0, w, h: heroH }]

  const remBoxes = layoutGrid(numItems - 1, w, h - heroH - gap, gap)
  for (const b of remBoxes) {
    b.y += heroH + gap
  }
  return [...boxes, ...remBoxes]
}

// 底部大图 bottom_hero
function layoutBottomHero(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems === 1) return layoutGrid(1, w, h, gap)

  const heroH = (h - gap) * 0.5

  const remBoxes = layoutGrid(numItems - 1, w, h - heroH - gap, gap)

  const boxes: LayoutBox[] = [{ x: 0, y: h - heroH, w, h: heroH }]
  return [...remBoxes, ...boxes]
}

// 杂志风格 magazine
function layoutMagazine(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems <= 2) return layoutGrid(numItems, w, h, gap)

  const heroW = (w - gap) * 0.5
  const boxes: LayoutBox[] = [
    { x: 0, y: 0, w: heroW, h: (h - gap) * 0.6 },
    { x: 0, y: (h - gap) * 0.6 + gap, w: heroW, h: (h - gap) * 0.4 },
  ]

  const remBoxes = layoutGrid(numItems - 2, w - heroW - gap, h, gap)
  for (const b of remBoxes) {
    b.x += heroW + gap
  }
  return [...boxes, ...remBoxes]
}

// 横向等分 equal_rows
function layoutEqualRows(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  return layoutGrid(numItems, w, h, gap).map((_, i) => {
    const rows = numItems
    const boxH = (h - (rows - 1) * gap) / rows
    return {
      x: 0,
      y: i * (boxH + gap),
      w: w,
      h: boxH,
    }
  })
}

// 纵向等分 equal_cols
function layoutEqualCols(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  return layoutGrid(numItems, w, h, gap).map((_, i) => {
    const cols = numItems
    const boxW = (w - (cols - 1) * gap) / cols
    return {
      x: i * (boxW + gap),
      y: 0,
      w: boxW,
      h: h,
    }
  })
}

// 瀑布流 masonry
function layoutMasonry(
  imageSizes: ImageSize[],
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  const numItems = imageSizes.length
  if (numItems === 0) return []

  let cols = w > h ? 3 : 2
  if (numItems < cols) cols = numItems

  const colW = (w - (cols - 1) * gap) / cols
  const colHeights = new Array(cols).fill(0)

  const boxesWithCol: (LayoutBox & { col: number; hIdeal: number })[] = []

  for (let i = 0; i < numItems; i++) {
    const minC = colHeights.indexOf(Math.min(...colHeights))
    const imgInfo = imageSizes[i]
    let aspect = 1
    if (imgInfo && imgInfo.height > 0) {
      aspect = imgInfo.width / imgInfo.height
    }
    const boxH = colW / aspect

    boxesWithCol.push({
      col: minC,
      x: minC * (colW + gap),
      y: 0, // 临时占位
      w: colW, // 临时占位
      h: 0, // 临时占位
      hIdeal: boxH,
    })
    colHeights[minC] += boxH + gap
  }

  // 整理每个列的高并缩放
  for (let c = 0; c < cols; c++) {
    const cBoxes = boxesWithCol.filter((b) => b.col === c)
    if (cBoxes.length === 0) continue

    const cTotalH = cBoxes.reduce((sum, b) => sum + b.hIdeal, 0)
    const cAvailH = h - (cBoxes.length - 1) * gap
    let curY = 0

    for (const b of cBoxes) {
      const scaledH = cTotalH > 0 ? (b.hIdeal / cTotalH) * cAvailH : 0
      b.w = colW
      b.h = scaledH
      b.y = curY
      curY += scaledH + gap
    }
  }

  // 返回时去掉辅助属性
  return boxesWithCol.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }))
}

// 中心大图 center_hero
function layoutCenterHero(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems <= 4) return layoutGrid(numItems, w, h, gap)

  const heroW = (w - gap * 2) * 0.5
  const heroH = (h - gap * 2) * 0.5
  const sideW = (w - heroW - gap * 2) / 2
  const sideH = (h - heroH - gap * 2) / 2

  const boxes: LayoutBox[] = []
  // Center hero
  boxes.push({ x: sideW + gap, y: sideH + gap, w: heroW, h: heroH })

  // Distribute remaining
  const remItems = numItems - 1
  const topCount = Math.ceil(remItems / 4)
  const bottomCount = Math.ceil((remItems - topCount) / 3)
  const leftCount = Math.ceil((remItems - topCount - bottomCount) / 2)
  const rightCount = remItems - topCount - bottomCount - leftCount

  // Top
  if (topCount > 0) {
    boxes.push(
      ...layoutGrid(topCount, w, sideH, gap).map((b) => ({
        ...b,
        x: b.x,
        y: 0,
      }))
    )
  }
  // Bottom
  if (bottomCount > 0) {
    boxes.push(
      ...layoutGrid(bottomCount, w, sideH, gap).map((b) => ({
        ...b,
        x: b.x,
        y: h - sideH,
      }))
    )
  }
  // Left
  if (leftCount > 0) {
    boxes.push(
      ...layoutGrid(leftCount, sideW, heroH, gap).map((b) => ({
        ...b,
        x: 0,
        y: sideH + gap,
      }))
    )
  }
  // Right
  if (rightCount > 0) {
    boxes.push(
      ...layoutGrid(rightCount, sideW, heroH, gap).map((b) => ({
        ...b,
        x: w - sideW,
        y: sideH + gap,
      }))
    )
  }

  return boxes
}

// 错落砖墙 span_grid
function layoutSpanGrid(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems <= 2) return layoutGrid(numItems, w, h, gap)

  const boxes: LayoutBox[] = []
  if (numItems === 3) {
    const halfW = (w - gap) / 2
    const halfH = (h - gap) / 2
    boxes.push({ x: 0, y: 0, w: halfW, h: h })
    boxes.push({ x: halfW + gap, y: 0, w: halfW, h: halfH })
    boxes.push({ x: halfW + gap, y: halfH + gap, w: halfW, h: halfH })
  } else if (numItems === 4) {
    const thirdW = (w - gap * 2) / 3
    const halfH = (h - gap) / 2
    boxes.push({ x: 0, y: 0, w: thirdW * 2 + gap, h: halfH })
    boxes.push({ x: thirdW * 2 + gap * 2, y: 0, w: thirdW, h: halfH })
    boxes.push({ x: 0, y: halfH + gap, w: thirdW, h: halfH })
    boxes.push({
      x: thirdW + gap,
      y: halfH + gap,
      w: thirdW * 2 + gap,
      h: halfH,
    })
  } else {
    // pattern for 5+ items
    const thirdW = (w - gap * 2) / 3
    const thirdH = (h - gap * 2) / 3
    boxes.push({ x: 0, y: 0, w: thirdW * 2 + gap, h: thirdH * 2 + gap }) // big
    boxes.push({ x: thirdW * 2 + gap * 2, y: 0, w: thirdW, h: thirdH })
    boxes.push({
      x: thirdW * 2 + gap * 2,
      y: thirdH + gap,
      w: thirdW,
      h: thirdH,
    })

    // Bottom row
    const bottomRem = numItems - 3
    const bottomGrid = layoutGrid(bottomRem, w, thirdH, gap)
    boxes.push(
      ...bottomGrid.map((b) => ({ ...b, x: b.x, y: thirdH * 2 + gap * 2 }))
    )
  }

  return boxes
}

// 交替布局 checkerboard
function layoutCheckerboard(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []

  const rows = Math.ceil(numItems / 3)
  const rowH = (h - (rows - 1) * gap) / rows
  const boxes: LayoutBox[] = []

  let currentImg = 0
  for (let r = 0; r < rows; r++) {
    const y = r * (rowH + gap)
    const itemsInRow = Math.min(3, numItems - currentImg)

    if (itemsInRow === 1) {
      boxes.push({ x: 0, y, w, h: rowH })
      currentImg++
    } else if (itemsInRow === 2) {
      const w1 = (w - gap) * (r % 2 === 0 ? 0.6 : 0.4)
      const w2 = w - gap - w1
      boxes.push({ x: 0, y, w: w1, h: rowH })
      boxes.push({ x: w1 + gap, y, w: w2, h: rowH })
      currentImg += 2
    } else {
      // 3 items
      if (r % 2 === 0) {
        // large, small, small
        const lW = (w - gap * 2) * 0.5
        const sW = (w - lW - gap * 2) / 2
        boxes.push({ x: 0, y, w: lW, h: rowH })
        boxes.push({ x: lW + gap, y, w: sW, h: rowH })
        boxes.push({ x: lW + sW + gap * 2, y, w: sW, h: rowH })
      } else {
        // small, small, large
        const lW = (w - gap * 2) * 0.5
        const sW = (w - lW - gap * 2) / 2
        boxes.push({ x: 0, y, w: sW, h: rowH })
        boxes.push({ x: sW + gap, y, w: sW, h: rowH })
        boxes.push({ x: sW * 2 + gap * 2, y, w: lW, h: rowH })
      }
      currentImg += 3
    }
  }
  return boxes
}

// 黄金比例对折 golden_ratio
function layoutGoldenRatio(
  numItems: number,
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  if (numItems === 0) return []
  if (numItems === 1) return layoutGrid(1, w, h, gap)

  const boxes: LayoutBox[] = []
  let currentX = 0
  let currentY = 0
  let currentW = w
  let currentH = h
  let dir = 0 // 0: right, 1: bottom, 2: left, 3: top

  for (let i = 0; i < numItems; i++) {
    if (i === numItems - 1) {
      // Last item takes remaining space
      boxes.push({ x: currentX, y: currentY, w: currentW, h: currentH })
      break
    }

    const ratio = 0.618
    if (dir === 0) {
      // Split vertically, put on left
      const nextW = (currentW - gap) * ratio
      boxes.push({ x: currentX, y: currentY, w: nextW, h: currentH })
      currentX += nextW + gap
      currentW = currentW - nextW - gap
    } else if (dir === 1) {
      // Split horizontally, put on top
      const nextH = (currentH - gap) * ratio
      boxes.push({ x: currentX, y: currentY, w: currentW, h: nextH })
      currentY += nextH + gap
      currentH = currentH - nextH - gap
    } else if (dir === 2) {
      // Split vertically, put on right
      const nextW = (currentW - gap) * ratio
      boxes.push({
        x: currentX + currentW - nextW,
        y: currentY,
        w: nextW,
        h: currentH,
      })
      currentW = currentW - nextW - gap
    } else if (dir === 3) {
      // Split horizontally, put on bottom
      const nextH = (currentH - gap) * ratio
      boxes.push({
        x: currentX,
        y: currentY + currentH - nextH,
        w: currentW,
        h: nextH,
      })
      currentH = currentH - nextH - gap
    }
    dir = (dir + 1) % 4
  }
  return boxes
}

// 自由画廊 (横向) gallery_row
function layoutGalleryRow(
  imageSizes: ImageSize[],
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  const numItems = imageSizes.length
  if (numItems === 0) return []

  const totalRatio = imageSizes.reduce(
    (sum, img) => sum + Math.max(0.1, img.ratio || 1),
    0
  )
  const allocatableW = Math.max(0, w - (numItems - 1) * gap)

  let currentX = 0
  const boxes: LayoutBox[] = []

  for (let i = 0; i < numItems; i++) {
    const itemRatio = Math.max(0.1, imageSizes[i]?.ratio || 1)
    const itemW = (itemRatio / totalRatio) * allocatableW
    boxes.push({
      x: currentX,
      y: 0,
      w: itemW,
      h: h,
    })
    currentX += itemW + gap
  }
  return boxes
}

// 自由画廊 (纵向) gallery_col
function layoutGalleryCol(
  imageSizes: ImageSize[],
  w: number,
  h: number,
  gap: number
): LayoutBox[] {
  const numItems = imageSizes.length
  if (numItems === 0) return []

  const totalRatio = imageSizes.reduce(
    (sum, img) => sum + Math.max(0.1, img.ratio || 1),
    0
  )
  const allocatableH = Math.max(0, h - (numItems - 1) * gap)

  let currentY = 0
  const boxes: LayoutBox[] = []

  for (let i = 0; i < numItems; i++) {
    const itemRatio = Math.max(0.1, imageSizes[i]?.ratio || 1)
    const itemH = (itemRatio / totalRatio) * allocatableH
    boxes.push({
      x: 0,
      y: currentY,
      w: w,
      h: itemH,
    })
    currentY += itemH + gap
  }
  return boxes
}

// 自定义网格 custom_grid
function layoutCustomGrid(
  numItems: number,
  w: number,
  h: number,
  gap: number,
  gridCols?: number,
  gridRows?: number,
  colRatios?: number[],
  rowRatios?: number[]
): LayoutBox[] {
  if (numItems === 0) return []

  const cols = gridCols || 2
  const rows = gridRows || 2

  let validColRatios = colRatios || []
  if (validColRatios.length !== cols) {
    validColRatios = new Array(cols).fill(1)
  }

  let validRowRatios = rowRatios || []
  if (validRowRatios.length !== rows) {
    validRowRatios = new Array(rows).fill(1)
  }

  const totalColRatio = validColRatios.reduce(
    (sum, r) => sum + Math.max(0.1, r || 1),
    0
  )
  const totalRowRatio = validRowRatios.reduce(
    (sum, r) => sum + Math.max(0.1, r || 1),
    0
  )

  const allocatableW = Math.max(0, w - (cols - 1) * gap)
  const allocatableH = Math.max(0, h - (rows - 1) * gap)

  const colWidths = validColRatios.map(
    (r) => (Math.max(0.1, r || 1) / totalColRatio) * allocatableW
  )
  const rowHeights = validRowRatios.map(
    (r) => (Math.max(0.1, r || 1) / totalRowRatio) * allocatableH
  )

  const colXs: number[] = [0]
  for (let c = 0; c < cols; c++) {
    const prev = colXs[c] ?? 0
    const wVal = colWidths[c] ?? 0
    colXs.push(prev + wVal + gap)
  }

  const rowYs: number[] = [0]
  for (let r = 0; r < rows; r++) {
    const prev = rowYs[r] ?? 0
    const hVal = rowHeights[r] ?? 0
    rowYs.push(prev + hVal + gap)
  }

  const boxes: LayoutBox[] = []
  const maxItems = Math.min(numItems, cols * rows)
  for (let i = 0; i < maxItems; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    const boxX = colXs[c] !== undefined ? colXs[c] : 0
    const boxY = rowYs[r] !== undefined ? rowYs[r] : 0
    const boxW = colWidths[c] !== undefined ? colWidths[c] : allocatableW / cols
    const boxH =
      rowHeights[r] !== undefined ? rowHeights[r] : allocatableH / rows

    boxes.push({
      x: boxX,
      y: boxY,
      w: boxW,
      h: boxH,
    })
  }

  return boxes
}

/**
 * 二维高级固定尺寸排版计算 (按行/列划分)
 *
 * @param rows 所有分区的二维数组配置
 * @param mainTitle 全局大标题配置
 * @param canvasW 整个画布总宽度
 * @param canvasH 整个画布总高度
 * @param gap 模块间距及模块内部图片间距
 * @param padding 整个外部的边缘留白
 * @returns 包含各区块最终坐标计算更新后的 rows，生成的 texts，以及判断总体是否溢出
 */
export function calculateAdvancedLayout(
  rows: SectionRow[],
  mainTitle: {
    text: string
    fontSize: number
    color: string
    align: 'left' | 'center' | 'right'
    weight: string
  },
  canvasW: number,
  canvasH: number,
  gap: number,
  padding: number = 0
): {
  rows: SectionRow[]
  texts: TextItem[]
  globalOverflow: boolean
  globalOverflowX?: boolean
} {
  const texts: TextItem[] = []
  let currentY = padding
  const w = Math.max(1, canvasW - 2 * padding)
  let globalOverflowX = false

  // 1. 处理全局大标题
  if (mainTitle.text) {
    const textH = mainTitle.fontSize * 1.5 // 预估文本行高
    texts.push({
      text: mainTitle.text,
      fontSize: mainTitle.fontSize,
      color: mainTitle.color,
      align: mainTitle.align,
      weight: mainTitle.weight,
      x: padding,
      y: currentY,
      w: w,
      h: textH,
    })
    currentY += textH + gap * 2 // 大标题下方留出更多间距
  }

  // 剩余可用高度
  const remainingH = canvasH - currentY - padding

  if (rows.length === 0) {
    return {
      rows,
      texts,
      globalOverflow: currentY > canvasH,
      globalOverflowX: false,
    }
  }

  // 2. 根据 ratio 划分每一行的理论高度
  // 每一行的权重，取该行内部最高的 heightRatio
  const rowWeights = rows.map((row) =>
    row.sections.reduce((max, s) => Math.max(max, s.heightRatio || 0.1), 0.1)
  )
  const totalWeight = rowWeights.reduce((sum, w) => sum + w, 0)

  // 纵向行间隙总计
  const totalRowGapsH = Math.max(0, rows.length - 1) * gap
  const allocatableH = Math.max(0, remainingH - totalRowGapsH)

  console.log('--- Advanced Layout Calc ---', {
    canvasH,
    remainingH,
    allocatableH,
    rowWeights,
  })

  // 按行计算
  for (let rIdx = 0; rIdx < rows.length; rIdx++) {
    const row = rows[rIdx]
    if (!row) continue
    const rowWeight = rowWeights[rIdx] ?? 1
    // 这一行分配到的真实像素高度
    const rowAllocatedH = (rowWeight / totalWeight) * allocatableH
    let maxSectionBottom = currentY // 在计算过程中，寻找本行哪个盒子内容撑得最下面

    // 在行内水平分布列的宽度
    const totalColsRatio = row.sections.reduce(
      (sum, s) => sum + Math.max(0.1, s.widthRatio || 1),
      0
    )
    const totalColGaps = Math.max(0, row.sections.length - 1) * gap
    const allocatableW = Math.max(0, w - totalColGaps)

    let currentX = padding

    // 计算列 (区块)
    for (let cIdx = 0; cIdx < row.sections.length; cIdx++) {
      const sec = row.sections[cIdx]
      if (!sec) continue
      sec.isOverflow = false
      sec.isOverflowX = false
      sec.boxes = []

      // 该列分配到的宽度
      const colRatio = Math.max(0.1, sec.widthRatio || 1)
      const secW = (colRatio / totalColsRatio) * allocatableW
      let sectionAvailY = currentY

      // 绘制区块小标题
      if (sec.title) {
        const textH = sec.titleFontSize * 1.5
        texts.push({
          text: sec.title,
          fontSize: sec.titleFontSize,
          color: sec.titleColor,
          align: sec.titleAlign,
          weight: 'bold',
          x: currentX,
          y: sectionAvailY,
          w: secW,
          h: textH,
        })
        sectionAvailY += textH + gap
      }

      // 留给内部图片的可用高度 (受该行物理高度约束)
      const imagesAvailH = Math.max(
        1,
        rowAllocatedH - (sectionAvailY - currentY)
      )

      sec.bound = {
        x: currentX,
        y: currentY,
        w: secW,
        h: rowAllocatedH,
      }

      // 计算内容坐标
      if (sec.images && sec.images.length > 0) {
        const sizes = sec.images.map((img) => ({
          width: img.width,
          height: img.height,
          ratio: img.ratio,
        }))

        // 本地化的画框坐标
        const baseBoxes = calculateBoxesCore(
          sec.layout,
          sizes,
          secW,
          imagesAvailH,
          gap,
          sec.customGridCols,
          sec.customGridRows,
          sec.customColRatios,
          sec.customRowRatios
        )

        // 统一偏移，合并到全局坐标系
        let contentMaxBottom = 0
        let contentMaxRight = 0
        for (const b of baseBoxes) {
          b.x += currentX
          b.y += sectionAvailY
          if (b.y + b.h > contentMaxBottom) {
            contentMaxBottom = b.y + b.h
          }
          if (b.x + b.w > contentMaxRight) {
            contentMaxRight = b.x + b.w
          }
        }
        sec.boxes = baseBoxes

        // 溢出判定 (高度超海底线)
        if (contentMaxBottom > currentY + rowAllocatedH + 2) {
          sec.isOverflow = true
        }

        // 溢出判定 (宽度超该列的分配物理界限)
        if (contentMaxRight > currentX + secW + 2) {
          sec.isOverflowX = true
          globalOverflowX = true // 全局也跟着标红
        }

        maxSectionBottom = Math.max(maxSectionBottom, contentMaxBottom)
      } else {
        // 无内容的情况
        maxSectionBottom = Math.max(maxSectionBottom, sectionAvailY)
      }

      // x 轴向右进
      currentX += secW + gap
    }

    // 行高向下推进 (严格采用分配的区块高度向底部累加)
    currentY += rowAllocatedH + gap
  }

  // 退回最后一个多加的 gap，检查最下面是否超出画布全高度
  currentY -= gap
  const globalOverflow = currentY > canvasH - padding

  return { rows, texts, globalOverflow, globalOverflowX }
}

/**
 * 原本的算框入口提取成内部调用，它纯粹是个无状态算出相对于 0,0 开始的尺寸列表
 */
function calculateBoxesCore(
  mode: string,
  imageSizes: ImageSize[],
  w: number,
  h: number,
  gap: number,
  customGridCols?: number,
  customGridRows?: number,
  customColRatios?: number[],
  customRowRatios?: number[]
): LayoutBox[] {
  const numItems = imageSizes.length
  if (numItems === 0) return []

  let boxes: LayoutBox[] = []

  switch (mode) {
    case 'left_hero':
      boxes = layoutLeftHero(numItems, w, h, gap)
      break
    case 'right_hero':
      boxes = layoutRightHero(numItems, w, h, gap)
      break
    case 'top_hero':
      boxes = layoutTopHero(numItems, w, h, gap)
      break
    case 'bottom_hero':
      boxes = layoutBottomHero(numItems, w, h, gap)
      break
    case 'magazine':
      boxes = layoutMagazine(numItems, w, h, gap)
      break
    case 'equal_rows':
      boxes = layoutEqualRows(numItems, w, h, gap)
      break
    case 'equal_cols':
      boxes = layoutEqualCols(numItems, w, h, gap)
      break
    case 'gallery_row':
      boxes = layoutGalleryRow(imageSizes, w, h, gap)
      break
    case 'gallery_col':
      boxes = layoutGalleryCol(imageSizes, w, h, gap)
      break
    case 'custom_grid':
      boxes = layoutCustomGrid(
        numItems,
        w,
        h,
        gap,
        customGridCols,
        customGridRows,
        customColRatios,
        customRowRatios
      )
      break
    case 'masonry':
      boxes = layoutMasonry(imageSizes, w, h, gap)
      break
    case 'nine_grid':
      boxes = layoutNineGrid(numItems, w, h, gap)
      break
    case 'center_hero':
      boxes = layoutCenterHero(numItems, w, h, gap)
      break
    case 'span_grid':
      boxes = layoutSpanGrid(numItems, w, h, gap)
      break
    case 'checkerboard':
      boxes = layoutCheckerboard(numItems, w, h, gap)
      break
    case 'golden_ratio':
      boxes = layoutGoldenRatio(numItems, w, h, gap)
      break
    case 'grid':
    default:
      boxes = layoutGrid(numItems, w, h, gap)
      break
  }

  return boxes
}
