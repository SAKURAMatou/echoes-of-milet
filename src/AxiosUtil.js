import axios from 'axios'

const env = import.meta.env

const axiosInstance = axios.create({
  baseURL: env.VITE_BASE_API_URI,
})

export default axiosInstance
