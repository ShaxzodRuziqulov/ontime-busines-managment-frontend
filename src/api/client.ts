import axios from 'axios'

const apiClient = axios.create({
  baseURL: `https://34-76-229-135.nip.io/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      import('@/router').then(({ default: router }) => {
        router.push('/login')
      })
    }
    return Promise.reject(error)
  }
)

export default apiClient
