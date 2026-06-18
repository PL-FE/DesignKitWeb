import request from './request'

// --------------- API Functions ---------------



/**
 * 音频合并
 */
export async function mergeAudio(formData: FormData): Promise<Blob> {
  const response = await request.post('/audio/merge', formData, {
    responseType: 'blob',
  })
  return response.data
}
