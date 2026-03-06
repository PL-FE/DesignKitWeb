import request from './request'

/**
 * 导出展板结果 (PSD Blob)
 * @param formData 包含 files 以及 layout_data (包含前端计算好的坐标 JSON 字符串)
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
