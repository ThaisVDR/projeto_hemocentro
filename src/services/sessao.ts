import { computed, ref } from 'vue'

// O que o backend chama de permissão (o gestor pode tudo, sem precisar delas).
export type Permissao =
  | 'VISUALIZAR_DASHBOARD'
  | 'ENVIAR_DOCUMENTOS'
  | 'REVISAR_FICHAS'
  | 'CONSULTAR_PRONTUARIOS'
  | 'CONSULTAR_AUDITORIA'

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: 'GESTOR' | 'COLABORADOR'
  permissoes: Permissao[]
}

// A sessão de verdade fica num cookie que o JavaScript não lê (httpOnly).
// Aqui guardamos só o que a tela precisa: quem está logado e o token CSRF,
// que vai no cabeçalho X-CSRF-Token de todo POST/PATCH.
export interface Sessao {
  usuario: Usuario
  csrfToken: string
  expiraEm: string
}

const CHAVE = 'hmt:sessao'

function lerSalva(): Sessao | null {
  try {
    const salva = JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null')
    // Sessões do formato antigo (antes da senha) não têm csrfToken: descarta.
    return salva?.csrfToken && salva?.usuario?.id ? salva : null
  } catch {
    return null
  }
}

const sessao = ref<Sessao | null>(lerSalva())

export const estaAutenticado = computed(() => sessao.value !== null)
export const usuarioLogado = computed(() => sessao.value?.usuario ?? null)
export const csrfAtual = computed(() => sessao.value?.csrfToken ?? null)
// Id de quem está logado, em texto, para comparar com o revisor da ficha.
export const idUsuarioAtual = computed(() => (sessao.value ? String(sessao.value.usuario.id) : null))
export const ehGestor = computed(() => sessao.value?.usuario.perfil === 'GESTOR')

export function temPermissao(permissao: Permissao | undefined): boolean {
  if (!permissao) return true
  const usuario = sessao.value?.usuario
  if (!usuario) return false
  return usuario.perfil === 'GESTOR' || usuario.permissoes.includes(permissao)
}

export function iniciarSessao(nova: Sessao): void {
  sessao.value = nova
  sessionStorage.setItem(CHAVE, JSON.stringify(nova))
}

export function encerrarSessao(): void {
  sessao.value = null
  sessionStorage.removeItem(CHAVE)
}
