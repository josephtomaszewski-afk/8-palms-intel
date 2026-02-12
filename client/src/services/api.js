import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5002/api')

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile')
}

export const homeService = {
  getAllHomeListings: (params) => api.get('/homes', { params }),
  getHomeListingById: (id) => api.get(`/homes/${id}`),
  getHomeAnalytics: (params) => api.get('/homes/analytics', { params }),
  getTopDeals: (params) => api.get('/homes/top-deals', { params }),
  getHomeListingsForMap: (params) => api.get('/homes/map', { params }),
  getRefreshStatus: () => api.get('/homes/refresh-status'),
  refreshListings: () => api.post('/homes/refresh'),
  scoreListings: () => api.post('/homes/score'),
  getMarketHistory: (params) => api.get('/homes/history', { params }),
  saveProperty: (homeListingId) => api.post('/homes/save', { homeListingId }),
  unsaveProperty: (homeListingId) => api.delete(`/homes/save/${homeListingId}`),
  getSavedProperties: () => api.get('/homes/saved'),
  getMySavedIds: () => api.get('/homes/saved/my-ids'),
  excludeProperty: (homeListingId) => api.post('/homes/exclude', { homeListingId }),
  unexcludeProperty: (homeListingId) => api.delete(`/homes/exclude/${homeListingId}`),
  getExcludedProperties: () => api.get('/homes/excluded'),
  getMyExcludedIds: () => api.get('/homes/excluded/my-ids'),
  getValueAddListings: (params) => api.get('/homes/value-add', { params }),
  refreshValueAddListings: () => api.post('/homes/value-add/refresh')
}

export const retailService = {
  // Chat - natural language search
  chat: (message) => api.post('/retail/chat', { message }),

  // Saved searches
  getSavedSearches: () => api.get('/retail/searches'),
  saveSearch: (data) => api.post('/retail/searches', data),
  updateSearch: (id, data) => api.put(`/retail/searches/${id}`, data),
  deleteSearch: (id) => api.delete(`/retail/searches/${id}`),
  getSearchResults: (id) => api.get(`/retail/searches/${id}/results`),
  runSearch: (id) => api.post(`/retail/searches/${id}/run`),

  // Listings
  getListings: (params) => api.get('/retail/listings', { params }),
  getListingById: (id) => api.get(`/retail/listings/${id}`),
  refreshListings: (state) => api.post('/retail/listings/refresh', { state }),

  // User preferences
  updatePreferences: (data) => api.put('/retail/preferences', data)
}

export default api
