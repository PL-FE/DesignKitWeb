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
  ],
})

router.afterEach((to) => {
  if (to.meta.title) {
    document.title = to.meta.title as string
  }
})

export default router
