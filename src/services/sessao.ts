import { ref, computed } from 'vue';

export interface Usuario {
  id: number
  nome: string
  email: string
  trocarSenhaNoProximoLogin?: boolean
  perfil: 'GESTOR' | 'COLABORADOR'
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
export const ehColaborador = computed(() => sessao.value?.usuario.perfil === 'COLABORADOR')

// Conta criada pelo gestor com senha provisória: até trocar, o backend bloqueia todas as rotas (403).
export const precisaTrocarSenha = computed(() => sessao.value?.usuario.trocarSenhaNoProximoLogin === true)

export function marcarTrocaDeSenha(pendente: boolean): void {
  if (!sessao.value) return
  sessao.value = { ...sessao.value, usuario: { ...sessao.value.usuario, trocarSenhaNoProximoLogin: pendente } }
  sessionStorage.setItem(CHAVE, JSON.stringify(sessao.value))
}

export function iniciarSessao(nova: Sessao): void {
  sessao.value = nova
  sessionStorage.setItem(CHAVE, JSON.stringify(nova))
}

export function encerrarSessao(): void {
  sessao.value = null
  sessionStorage.removeItem(CHAVE)
}