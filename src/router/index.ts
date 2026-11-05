import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { consultarSessao } from '@/services/api'
// Importamos apenas o necessário do novo arquivo de sessão
import { estaAutenticado, ehGestor, iniciarSessao } from '@/services/sessao'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'dashboard' } },
  {
    path: '/',
    component: AuthLayout,
    meta: { publica: true },
    children: [
      { path: 'login', name: 'login', component: () => import('@/views/auth/LoginView.vue') },
      { path: 'esqueci-senha', name: 'esqueci-senha', component: () => import('@/views/auth/EsqueciSenhaView.vue') },
      // Link do e-mail. Também serve para o usuário novo criar a primeira senha.
      {
        path: 'redefinir-senha',
        name: 'redefinir-senha',
        component: () => import('@/views/auth/RedefinirSenhaView.vue'),
        meta: { tambemLogado: true }
      }
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
        path: 'leituras',
        name: 'leituras',
        component: () => import('@/views/LeiturasView.vue'),
        meta: { titulo: 'Leituras com problema' }
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
        meta: { titulo: 'Revisar ficha' },
        // Sem ficha escolhida não há o que revisar: a ficha só chega aqui depois do upload e da leitura da IA.
        beforeEnter: (destino) => (destino.params.fichaId ? true : { name: 'fila' })
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
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/UsuariosView.vue'),
        meta: { titulo: 'Gestão de Usuários', requerGestor: true } // Marca a rota como restrita
      },
      {
        path: 'auditoria',
        name: 'auditoria',
        component: () => import('@/views/AuditoriaView.vue'),
        meta: { titulo: 'Auditoria', requerGestor: true } // Marca a rota como restrita
      }
    ]
  },
  { path: '/:caminho(.*)*', redirect: { name: 'dashboard' } }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Ordem em que procuramos uma tela que a pessoa pode abrir.
export const TELAS_INICIAIS = ['dashboard', 'upload', 'fila', 'prontuarios', 'auditoria']

export function primeiraTelaPermitida(): string | null {
  const rotas = router.getRoutes()
  return TELAS_INICIAIS.find((nome) => {
    const rota = rotas.find((r) => r.name === nome)
    // Se a rota exige gestor e o usuário atual não é, ele não pode acessar
    if (rota?.meta.requerGestor && !ehGestor.value) {
      return false
    }
    return true // Se não exige gestor, ou se exige e ele é gestor, está permitido
  }) ?? 'dashboard'
}

// Ao abrir o sistema numa aba nova, o cookie pode ainda valer: pergunta ao backend uma vez.
let sessaoConferida = false

router.beforeEach(async (destino) => {
  if (!estaAutenticado.value && !sessaoConferida) {
    sessaoConferida = true
    try {
      iniciarSessao(await consultarSessao())
    } catch {
      // Sem sessão válida: segue como visitante.
    }
  }

  const publica = destino.matched.some((r) => r.meta.publica)
  if (publica) {
    const inicial = primeiraTelaPermitida()
    if (estaAutenticado.value && !destino.meta.tambemLogado && inicial) return { name: inicial }
    return
  }

  if (!estaAutenticado.value) {
    return { name: 'login', query: { redirect: destino.fullPath } }
  }

  // Logado, mas tentando acessar área restrita sem ser Gestor
  if (destino.meta.requerGestor && !ehGestor.value) {
    const outra = primeiraTelaPermitida()
    return outra && outra !== destino.name ? { name: outra } : false
  }
})

export default router