import { computed, ref } from 'vue'

export interface Usuario {
  nome: string
  email: string
  perfil: string
}
interface Sessao {
  token: string
  usuario: Usuario
}

const CHAVE = 'hmt:sessao'

function lerSalva(): Sessao | null {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE) ?? 'null')
  } catch {
    return null
  }
}

const sessao = ref<Sessao | null>(lerSalva())

export const estaAutenticado = computed(() => sessao.value !== null)
export const usuarioLogado = computed(() => sessao.value?.usuario ?? null)
export const tokenAtual = computed(() => sessao.value?.token ?? null)

export function iniciarSessao(nova: Sessao): void {
  sessao.value = nova
  sessionStorage.setItem(CHAVE, JSON.stringify(nova))
}

export function encerrarSessao(): void {
  sessao.value = null
  sessionStorage.removeItem(CHAVE)
}