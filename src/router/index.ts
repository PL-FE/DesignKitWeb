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
      path: '/video-info',
      name: 'video-info',
      component: () => import('@/views/VideoInfo.vue'),
      meta: { title: '媒体信息透视仪 - DesignKit' },
    },
    {
      path: '/video-converter',
      name: 'video-converter',
      component: () => import('@/views/VideoConverter.vue'),
      meta: { title: '全能格式转换中心 - DesignKit' },
    },
    {
      path: '/video-compressor',
      name: 'video-compressor',
      component: () => import('@/views/VideoCompressor.vue'),
      meta: { title: '视频体积压缩器 - DesignKit' },
    },
    {
      path: '/video-gif',
      name: 'video-gif',
      component: () => import('@/views/VideoGifMaker.vue'),
      meta: { title: '动图制造与封面提炼 - DesignKit' },
    },
    {
      path: '/video-editor',
      name: 'video-editor',
      component: () => import('@/views/VideoEditor.vue'),
      meta: { title: '快捷轻剪辑工具 - DesignKit' },
    },
  ],
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
})

export default router
