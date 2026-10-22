import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { estaAutenticado } from '@/services/sessao'
const EXIGIR_LOGIN = process.env.VUE_APP_EXIGIR_LOGIN === 'true'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'dashboard' } },
  {
    path: '/',
    component: AuthLayout,
    meta: { publica: true },
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
      { path: 'cadastro', name: 'cadastro', component: () => import('@/views/auth/CadastroView.vue') },
      { path: 'esqueci-senha', name: 'esqueci-senha', component: () => import('@/views/auth/EsqueciSenhaView.vue') }
    ]
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { titulo: 'Dashboard' }
      },
      {
        path: 'upload',
        name: 'upload',
        component: () => import('@/views/UploadView.vue'),
        meta: { titulo: 'Upload de documentos' }
      },
      {
        path: 'fila',
        name: 'fila',
        component: () => import('@/views/FilaRevisaoView.vue'),
        meta: { titulo: 'Fila de revisão' }
      },
      {
        path: 'revisar/:fichaId?',
        name: 'revisar',
        component: () => import('@/views/RevisarFichaView.vue'),
        meta: { titulo: 'Revisar ficha' }
      },
      {
        path: 'prontuarios/:pacienteId?',
        name: 'prontuarios',
        component: () => import('@/views/ProntuarioView.vue'),
        meta: { titulo: 'Prontuários' }
      },
      {
        path: 'prontuarios/:pacienteId/ficha-completa',
        name: 'ficha-completa',
        component: () => import('@/views/FichaCompletaView.vue'),
        meta: { titulo: 'Prontuários' }
      },
      {
        path: 'auditoria',
        name: 'auditoria',
        component: () => import('@/views/AuditoriaView.vue'),
        meta: { titulo: 'Auditoria' }
      }
    ]
  },
  { path: '/:caminho(.*)*', redirect: { name: 'dashboard' } }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

router.beforeEach((destino) => {
  if (!EXIGIR_LOGIN) return

  const publica = destino.matched.some((r) => r.meta.publica)
  if (!publica && !estaAutenticado.value) {
    return { name: 'login', query: { redirect: destino.fullPath } }
  }
  if (publica && estaAutenticado.value) return { name: 'dashboard' }
})

export default router