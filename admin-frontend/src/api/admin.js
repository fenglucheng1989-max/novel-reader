import http from './request'

export const login = (data) => http.post('/api/v1/auth/login', data)
export const dashboard = () => http.get('/api/v1/admin/dashboard')

export const listBooks = (params) => http.get('/api/v1/admin/books', { params })
export const getBook = (id) => http.get(`/api/v1/admin/books/${id}`)
export const createBook = (data) => http.post('/api/v1/admin/books', data)
export const updateBook = (id, data) => http.put(`/api/v1/admin/books/${id}`, data)
export const deleteBook = (id) => http.delete(`/api/v1/admin/books/${id}`)

export const listChapters = (bookId) => http.get(`/api/v1/admin/books/${bookId}/chapters`)
export const getChapter = (id) => http.get(`/api/v1/admin/chapters/${id}`)
export const createChapter = (bookId, data) => http.post(`/api/v1/admin/books/${bookId}/chapters`, data)
export const updateChapter = (id, data) => http.put(`/api/v1/admin/chapters/${id}`, data)
export const deleteChapter = (id) => http.delete(`/api/v1/admin/chapters/${id}`)

export const listCategories = () => http.get('/api/v1/admin/categories')
export const createCategory = (data) => http.post('/api/v1/admin/categories', data)
export const updateCategory = (id, data) => http.put(`/api/v1/admin/categories/${id}`, data)
export const deleteCategory = (id) => http.delete(`/api/v1/admin/categories/${id}`)

export const previewImport = (data) => http.post('/api/v1/admin/import/preview', data)
export const previewTxtImport = (data) => http.post('/api/v1/admin/import/txt/preview', data, { timeout: 30000 })
export const confirmImport = (data) => http.post('/api/v1/admin/import/confirm', data)
