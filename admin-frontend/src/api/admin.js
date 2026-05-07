import http from './request'

export const login = (data) => http.post('/auth/login', data)
export const dashboard = () => http.get('/admin/dashboard')

export const listBooks = (params) => http.get('/admin/books', { params })
export const getBook = (id) => http.get(`/admin/books/${id}`)
export const createBook = (data) => http.post('/admin/books', data)
export const updateBook = (id, data) => http.put(`/admin/books/${id}`, data)
export const deleteBook = (id) => http.delete(`/admin/books/${id}`)

export const listChapters = (bookId) => http.get(`/admin/books/${bookId}/chapters`)
export const getChapter = (id) => http.get(`/admin/chapters/${id}`)
export const createChapter = (bookId, data) => http.post(`/admin/books/${bookId}/chapters`, data)
export const updateChapter = (id, data) => http.put(`/admin/chapters/${id}`, data)
export const deleteChapter = (id) => http.delete(`/admin/chapters/${id}`)

export const listCategories = () => http.get('/admin/categories')
export const createCategory = (data) => http.post('/admin/categories', data)
export const updateCategory = (id, data) => http.put(`/admin/categories/${id}`, data)
export const deleteCategory = (id) => http.delete(`/admin/categories/${id}`)

export const previewImport = (data) => http.post('/admin/import/preview', data)
export const previewTxtImport = (data) => http.post('/admin/import/txt/preview', data, { timeout: 30000 })
export const confirmImport = (data) => http.post('/admin/import/confirm', data)
