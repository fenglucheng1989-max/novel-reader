import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'
import AdminLayout from '../layout/AdminLayout.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import Books from '../views/Books.vue'
import BookForm from '../views/BookForm.vue'
import Chapters from '../views/Chapters.vue'
import ChapterForm from '../views/ChapterForm.vue'
import Categories from '../views/Categories.vue'
import Import from '../views/Import.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    {
      path: '/',
      component: AdminLayout,
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', component: Dashboard, meta: { title: '概览' } },
        { path: 'books', component: Books, meta: { title: '书籍管理' } },
        { path: 'books/new', component: BookForm, meta: { title: '新增书籍' } },
        { path: 'books/:id/edit', component: BookForm, meta: { title: '编辑书籍' } },
        { path: 'books/:bookId/chapters', component: Chapters, meta: { title: '章节管理' } },
        { path: 'books/:bookId/chapters/new', component: ChapterForm, meta: { title: '新增章节' } },
        { path: 'chapters/:id/edit', component: ChapterForm, meta: { title: '编辑章节' } },
        { path: 'categories', component: Categories, meta: { title: '分类管理' } },
        { path: 'import', component: Import, meta: { title: 'URL 导入' } }
      ]
    }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path !== '/login' && !auth.isLoggedIn) {
    return '/login'
  }
  if (to.path === '/login' && auth.isLoggedIn) {
    return '/dashboard'
  }
})

export default router
