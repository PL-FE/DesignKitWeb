import axios from 'axios'
import { ElMessage } from 'element-plus'

// 根据环境变量判断当前环境，动态设置 baseURL
// 开发环境下为 /api （借助 vite.config.ts 代理到本地 8000 端口）
// 生产环境下直接指向真实的线上服务地址
const isDev = import.meta.env.DEV
const baseURL = isDev ? '/api' : 'https://pyservice.pl-fe.cn/api'

const request = axios.create({
  baseURL,
  timeout: 60000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // 统一处理错误，展示给用户，避免在每个调用处都手写
    let errorMsg = '网络或服务器异常，请稍后重试'
    if (error.response && error.response.data) {
      if (error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text()
          const errorData = JSON.parse(errorText)
          errorMsg = errorData.detail || errorMsg
        } catch (e) {
          // ignore parsing error
        }
      } else {
        errorMsg = error.response.data.detail || errorMsg
      }
    }
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  }
)

export default request
