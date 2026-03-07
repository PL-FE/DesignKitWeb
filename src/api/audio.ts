import request from './request'

// --------------- API Functions ---------------

/**
 * 人声去除（伴奏提取）
 */
export const removeVocals = async (formData: FormData) => {
  const response = await request.post('/audio/vocal-removal', formData, {
    responseType: 'blob',
    timeout: 0, // 处理时间较长，禁用超时
  })
  return response.data
}

/**
 * 音频合并
 */
export async function mergeAudio(formData: FormData): Promise<Blob> {
  const response = await request.post('/audio/merge', formData, {
    responseType: 'blob',
  })
  return response.data
}
