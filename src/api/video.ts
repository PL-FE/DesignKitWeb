import request from './request'

// --------------- Types ---------------

export interface MediaInfoResponse {
  format: Record<string, any>
  streams: Record<string, any>[]
}

// --------------- API Functions ---------------

/**
 * 阶段二：获取媒体元数据
 */
export async function getVideoInfo(
  formData: FormData
): Promise<MediaInfoResponse> {
  const response = await request.post('/video/info', formData)
  return response.data
}

/**
 * 阶段三：格式转换 (返回二进制文件流)
 */
export async function convertVideo(formData: FormData): Promise<Blob> {
  const response = await request.post('/video/convert', formData, {
    responseType: 'blob',
  })
  return response.data
}

/**
 * 阶段四：体积压缩 (返回二进制文件流)
 */
export async function compressVideo(formData: FormData): Promise<Blob> {
  const response = await request.post('/video/compress', formData, {
    responseType: 'blob',
  })
  return response.data
}

/**
 * 阶段五：动图/截帧 (返回二进制文件流)
 */
export async function makeVideoGif(formData: FormData): Promise<Blob> {
  const response = await request.post('/video/gif', formData, {
    responseType: 'blob',
  })
  return response.data
}

/**
 * 阶段六：快捷剪辑 (返回二进制文件流)
 */
export async function editVideo(formData: FormData): Promise<Blob> {
  const response = await request.post('/video/edit', formData, {
    responseType: 'blob',
  })
  return response.data
}
