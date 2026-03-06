export interface ImageSize {
  width: number
  height: number
  [key: string]: any
}

export interface LayoutBox {
  x: number
  y: number
  w: number
  h: number
  [key: string]: any
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

/**
 * 统一计算入口
 * 计算指定模式下的所有图片坐标和尺寸
 *
 * @param mode 布局模式 masonry, grid, nine_grid, left_hero, top_hero, magazine
 * @param imageSizes 图片对象数组，至少包含 width, height
 * @param canvasW 画布总宽
 * @param canvasH 画布总高
 * @param gap 间距
 * @returns LayoutBox[] 包含每个框的 x, y, w, h
 */
export function calculateBoxes(
  mode: string,
  imageSizes: ImageSize[],
  canvasW: number,
  canvasH: number,
  gap: number
): LayoutBox[] {
  const numItems = imageSizes.length
  if (numItems === 0) return []

  const w = Math.max(1, canvasW - 2 * gap)
  const h = Math.max(1, canvasH - 2 * gap)

  let boxes: LayoutBox[] = []

  switch (mode) {
    case 'left_hero':
      boxes = layoutLeftHero(numItems, w, h, gap)
      break
    case 'top_hero':
      boxes = layoutTopHero(numItems, w, h, gap)
      break
    case 'magazine':
      boxes = layoutMagazine(numItems, w, h, gap)
      break
    case 'masonry':
      boxes = layoutMasonry(imageSizes, w, h, gap)
      break
    case 'nine_grid':
      boxes = layoutNineGrid(numItems, w, h, gap)
      break
    case 'grid':
    default:
      boxes = layoutGrid(numItems, w, h, gap)
      break
  }

  // 加上外部 gap 边距作为画布内保留距离
  for (const b of boxes) {
    b.x += gap
    b.y += gap
  }

  return boxes
}
