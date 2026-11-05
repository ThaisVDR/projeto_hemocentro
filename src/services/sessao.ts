import { ref, computed } from 'vue';
// Se a interface Usuario vier do arquivo de domínio, você pode importar assim e remover a declaração abaixo.
// import type { Usuario } from '@/domain/usuario'; 

export interface Usuario {
  id: number
  nome: string
  email: string
  senha: string 
  perfil: 'GESTOR' | 'COLABORADOR'
  // A propriedade "permissoes" foi removida daqui.
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

// AS NOVAS VALIDAÇÕES DE PERFIL FICAM AQUI:
export const ehGestor = computed(() => sessao.value?.usuario.perfil === 'GESTOR')
export const ehColaborador = computed(() => sessao.value?.usuario.perfil === 'COLABORADOR')

// A função "temPermissao" foi completamente removida.

export function iniciarSessao(nova: Sessao): void {
  sessao.value = nova
  sessionStorage.setItem(CHAVE, JSON.stringify(nova))
}

export function encerrarSessao(): void {
  sessao.value = null
  sessionStorage.removeItem(CHAVE)
}