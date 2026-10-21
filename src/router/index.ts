import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', redirect: { name: 'dashboard' } },
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

export default createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})
