import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API_URI,
  timeout: 5000,
})
axiosInstance.interceptors.response.use(
  (response) => {
    const status = response.status
    if (status >= 200 && status < 300) {
      // 请求成功，返回数据（可以进一步处理 response.data）
      return response.data
    } else {
      return Promise.reject(new Error(`HTTP 状态错误：${status}`))
    }
  },
  (error) => {},
)

export default axiosInstance
