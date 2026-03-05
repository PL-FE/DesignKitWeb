import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useVideoStore = defineStore(
  'video',
  () => {
    // 转换页面的偏好
    const preferredFormat = ref<string>('mp4')
    // 压缩页面的偏好
    const preferredCompressLevel = ref<string>('medium')
    // Gif 制作偏好
    const preferredGifFormat = ref<string>('gif')
    const preferredFps = ref<number>(15)

    return {
      preferredFormat,
      preferredCompressLevel,
      preferredGifFormat,
      preferredFps,
    }
  },
  {
    persist: true,
  }
)
