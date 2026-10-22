// Comunicação com o Backend-Hemocentro.
// As rotas seguem o fluxo combinado com o backend (upload → IA → ficha "digitalizada" →
// revisão → aprovação). Se algum nome de rota mudar, ajuste somente este arquivo.
import { StatusFicha } from '@/domain/revisao'

export const API_URL = (process.env.VUE_APP_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

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
