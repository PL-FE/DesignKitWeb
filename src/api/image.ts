import request from './request'

export async function compressImageApi(
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<{
  originalKb: string
  compressedKb: string
  ratio: string
  url: string
  filename: string
}> {
  const response = await request.post('/image/compress', formData, {
    responseType: 'blob',
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        onProgress(
          Math.round((progressEvent.loaded * 100) / progressEvent.total)
        )
      }
    },
  })

  const originalKb = parseFloat(response.headers['x-original-size'] || '0')
  const compressedKb = parseFloat(response.headers['x-compressed-size'] || '0')
  const ratio =
    originalKb > 0
      ? (((originalKb - compressedKb) / originalKb) * 100).toFixed(1)
      : '0'

  const disposition = response.headers['content-disposition'] || ''
  let filename = 'compressed_image'
  const filenameMatch = disposition.match(/filename\*=UTF-8''(.+)/)
  if (filenameMatch && filenameMatch[1]) {
    filename = decodeURIComponent(filenameMatch[1])
  } else {
    const filenameMatch2 = disposition.match(/filename="?([^";]+)"?/)
    if (filenameMatch2 && filenameMatch2[1]) {
      filename = decodeURIComponent(filenameMatch2[1])
    }
  }

  const blob = response.data
  const url = window.URL.createObjectURL(blob)

  return {
    originalKb: originalKb.toFixed(1),
    compressedKb: compressedKb.toFixed(1),
    ratio,
    url,
    filename,
  }
}
