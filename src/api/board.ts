import request from './request'

/**
 * 获取展板排版预览图 (PNG Blob)
 * @param formData 包含 files (图片), layout, width, height, gap, bg_color 等参数
 */
export async function previewBoard(formData: FormData): Promise<Blob> {
  const response = await request.post('/board/preview', formData, {
    responseType: 'blob',
    timeout: 60000 * 2, // 由于可能包含多图处理，超时时间稍微给长一点
  })
  return response.data
}

/**
 * 导出展板结果 (PSD Blob)
 */
export async function exportBoard(
  formData: FormData
): Promise<{ blob: Blob; filename: string; resultSize: string }> {
  const response = await request.post('/board/export', formData, {
    responseType: 'blob',
    timeout: 60000 * 5, // 导出 PSD 文件更耗时
  })

  const disposition = response.headers['content-disposition']
  let filename = 'board_layout.psd'

  if (disposition && disposition.includes("filename*=UTF-8''")) {
    filename = decodeURIComponent(disposition.split("filename*=UTF-8''")[1])
  } else if (disposition && disposition.includes('filename=')) {
    filename = disposition.split('filename=')[1].replace(/"/g, '')
  }

  return {
    blob: response.data,
    filename,
    resultSize: response.headers['x-result-size'] || '0',
  }
}
