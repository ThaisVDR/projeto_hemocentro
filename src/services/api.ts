// Comunicação com o Backend-Hemocentro.
// As rotas seguem o fluxo combinado com o backend (upload → IA → ficha "digitalizada" →
// revisão → aprovação). Se algum nome de rota mudar, ajuste somente este arquivo.
import { StatusFicha } from '@/domain/revisao'
import { tokenAtual } from '@/services/sessao'


export const API_URL = (process.env.VUE_APP_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
// Mudar a lógica do VUE_APP_EXIGIR_LOGIN para True quando o Backend estiver pronto para autenticação.
const AUTH_MOCK = process.env.VUE_APP_AUTH_MOCK !== 'false'
const esperar = (ms = 600) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class ErroApi extends Error {
  constructor(mensagem: string, readonly status?: number) {
    super(mensagem)
  }
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response

  
  try {
    resposta = await fetch(`${API_URL}${caminho}`, opcoes)
  } catch {
    throw new ErroApi(`Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando.`)
  }
   const headers: Record<string, string> = { ...(opcoes.headers as Record<string, string> | undefined) }
    if (tokenAtual.value) headers.Authorization = `Bearer ${tokenAtual.value}`
    resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers })

  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const mensagem = corpo?.message ?? corpo?.erro ?? `Erro ${resposta.status} ao acessar ${caminho}.`
    throw new ErroApi(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem, resposta.status)
  }

  return corpo as T
  
}

function enviarJson<T>(caminho: string, metodo: string, dados: unknown): Promise<T> {
  return requisitar<T>(caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  })
}

// ---------- Formatos trocados com o backend ----------

/** Mesmo formato de FichaExtraida no backend (src/types/ficha.types.ts). Datas em AAAA-MM-DD. */
export interface FichaExtraidaApi {
  paciente: {
    nome: string | null
    dataNascimento: string | null
    prontuario: number | null
    racaCor: string | null
    aboRh: string | null
    diagnostico: string | null
    nomeMae: string | null
  }
  transfusoes: {
    dataEnvio: string | null
    tipoHemocomponente: string | null
    numeroDoacao: string | null
    grsRhd: string | null
    volMl: number | null
    testesPai: string | null
    provaCruzada: string | null
    cidadeDestino: string | null
    ufDestino: string | null
    responsavelLiberacao: string | null
  }[]
  pesquisas: {
    data: string | null
    gs: string | null
    rh: string | null
    tad: string | null
    pai: string | null
    autocontrole: string | null
    interpretacao: string | null
    responsavel: string | null
  }[]
}

export interface CampoIncertoApi {
  /** Caminho do campo, ex.: "paciente.dataNascimento". */
  campo: string
  motivo: string
}

export interface FichaResumoApi {
  id: string
  arquivo: string
  status: StatusFicha
  pacienteNome: string | null
  criadaEm: string
  enviadaPor: string | null
}

export interface FichaDetalheApi extends FichaResumoApi {
  totalPaginas: number | null
  /** O que a IA leu, guardado sem alteração. */
  extracao: FichaExtraidaApi | null
  /** Rascunho da revisão, quando houver. */
  revisao: unknown | null
  camposIncertos: CampoIncertoApi[]
  erro: string | null
}

// ---------- Rotas ----------

export function enviarFicha(arquivo: File): Promise<FichaResumoApi> {
  const formulario = new FormData()
  formulario.append('file', arquivo)
  return requisitar<FichaResumoApi>('/fichas', { method: 'POST', body: formulario })
}

export function listarFichas(status?: StatusFicha): Promise<FichaResumoApi[]> {
  const filtro = status ? `?status=${status}` : ''
  return requisitar<FichaResumoApi[]>(`/fichas${filtro}`)
}

export function buscarFicha(id: string): Promise<FichaDetalheApi> {
  return requisitar<FichaDetalheApi>(`/fichas/${encodeURIComponent(id)}`)
}

export function urlArquivoFicha(id: string): string {
  return `${API_URL}/fichas/${encodeURIComponent(id)}/arquivo`
}

export function salvarRascunhoFicha(id: string, revisao: unknown): Promise<void> {
  return enviarJson(`/fichas/${encodeURIComponent(id)}`, 'PUT', { revisao })
}

export function aprovarFicha(id: string, dados: unknown): Promise<void> {
  return enviarJson(`/fichas/${encodeURIComponent(id)}/aprovar`, 'POST', dados)
}

export function sinalizarPendenciaFicha(id: string, motivo: string): Promise<void> {
  return enviarJson(`/fichas/${encodeURIComponent(id)}/pendencia`, 'POST', { motivo })
}

export function recusarFicha(id: string, motivo: string): Promise<void> {
  return enviarJson(`/fichas/${encodeURIComponent(id)}/recusar`, 'POST', { motivo })
}


export interface RespostaLoginApi {
  token: string
  usuario: { nome: string; email: string; perfil: string }
}

export async function entrar(dados: { email: string; senha: string }): Promise<RespostaLoginApi> {
  if (AUTH_MOCK) {
    await esperar()
    if (dados.senha !== 'Senha123') throw new ErroApi('E-mail ou senha incorretos.', 401)
    return { token: 'token-de-demonstracao', usuario: { nome: 'Camila Rocha', email: dados.email, perfil: 'revisor' } }
  }
  return enviarJson<RespostaLoginApi>('/auth/login', 'POST', dados)
}

export async function cadastrar(dados: { nome: string; email: string; senha: string }): Promise<void> {
  if (AUTH_MOCK) return esperar()
  return enviarJson<void>('/auth/cadastro', 'POST', dados)
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  if (AUTH_MOCK) return esperar()
  return enviarJson<void>('/auth/esqueci-senha', 'POST', { email })
}