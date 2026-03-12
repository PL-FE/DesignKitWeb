import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import CadConverter from '@/views/CadConverter.vue'
import ImageCompressor from '@/views/ImageCompressor.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { title: 'DesignKit - 设计工程工具集' },
    },
    {
      path: '/cad-converter',
      name: 'cad-converter',
      component: CadConverter,
      meta: { title: 'CAD 版本转换 - DesignKit' },
    },
    {
      path: '/image-compressor',
      name: 'image-compressor',
      component: ImageCompressor,
      meta: { title: '图片压缩 - DesignKit' },
    },
    {
      path: '/image-resizer',
      name: 'image-resizer',
      component: () => import('@/views/ImageResizer.vue'),
      meta: { title: '图片尺寸修改 - DesignKit' },
    },
    {
      path: '/video-info',
      name: 'video-info',
      component: () => import('@/views/VideoInfo.vue'),
      meta: { title: '媒体信息查看 - DesignKit' },
    },
    {
      path: '/video-converter',
      name: 'video-converter',
      component: () => import('@/views/VideoConverter.vue'),
      meta: { title: '视频格式转换 - DesignKit' },
    },
    {
      path: '/video-compressor',
      name: 'video-compressor',
      component: () => import('@/views/VideoCompressor.vue'),
      meta: { title: '视频压缩 - DesignKit' },
    },
    {
      path: '/video-gif',
      name: 'video-gif',
      component: () => import('@/views/VideoGifMaker.vue'),
      meta: { title: '截帧 / 转 GIF - DesignKit' },
    },
    {
      path: '/video-editor',
      name: 'video-editor',
      component: () => import('@/views/VideoEditor.vue'),
      meta: { title: '视频快速编辑 - DesignKit' },
    },
    {
      path: '/board-layout',
      name: 'board-layout',
      component: () => import('@/views/BoardLayout.vue'),
      meta: { title: '展板排版生成 PSD - DesignKit' },
    },
    {
      path: '/audio-vocal-removal',
      name: 'audio-vocal-removal',
      component: () => import('@/views/AudioVocalRemoval.vue'),
      meta: { title: '人声去除 / 伴奏提取 - DesignKit' },
    },
    {
      path: '/audio-merge',
      name: 'audio-merge',
      component: () => import('@/views/AudioMerge.vue'),
      meta: { title: '音乐合并 - DesignKit' },
    },
  ],
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
})

export default router
