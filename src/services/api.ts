// Comunicação com o Backend-Hemocentro.
// As rotas seguem o fluxo combinado com o backend (upload → IA → ficha "digitalizada" →
// revisão → aprovação). Se algum nome de rota mudar, ajuste somente este arquivo.
import { StatusFicha } from '@/domain/revisao'
import { tokenAtual } from '@/services/sessao'

export const API_URL = (process.env.VUE_APP_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

const esperar = (ms = 600) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export class ErroApi extends Error {
  constructor(mensagem: string, readonly status?: number) {
    super(mensagem)
  }
}
async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const headers = new Headers(opcoes.headers)
  if (tokenAtual.value) headers.set('X-Usuario-Id', tokenAtual.value)

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers })
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
  extracao: FichaExtraidaApi | null
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

// ---------- Autenticação ----------

export interface RespostaLoginApi {
  token: string
  usuario: { nome: string; email: string; perfil: string }
}

interface UsuarioApi {
  id: number
  nome: string
  email: string
}

export async function entrar(dados: { email: string; senha: string }): Promise<RespostaLoginApi> {
  const lista = await requisitar<UsuarioApi[]>('/usuarios')
  const u = lista.find((x) => x.email.toLowerCase() === dados.email.trim().toLowerCase())
  if (!u) throw new ErroApi('Usuário não encontrado ou inativo.', 401)

  return {
    token: String(u.id),
    usuario: { nome: u.nome, email: u.email, perfil: 'revisor' }
  }
}

export async function cadastrar(dados: { nome: string; email: string; senha: string }): Promise<void> {
  try {
    await enviarJson<unknown>('/usuarios', 'POST', {
      nome: dados.nome.trim(),
      email: dados.email.trim()
    })
  } catch (e) {
    if (e instanceof ErroApi && e.status === 409) {
      throw new ErroApi('Este e-mail já está cadastrado.', 409)
    }
    throw e
  }
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  void email
  await esperar()
}

// ---------- Pacientes ----------

export interface PacienteResumoApi {
  id: string
  nome: string
  dataNascimento: string | null
  nomeMae: string | null
  prontuario: number | null
  racaCor: string | null
  aboRh: string | null
}

export interface FiltrosPaciente {
  nome: string
  dataNascimento?: string
  nomeMae?: string
}

export function buscarPacientes(filtros: FiltrosPaciente): Promise<PacienteResumoApi[]> {
  const parametros = new URLSearchParams()
  parametros.set('nome', filtros.nome)
  if (filtros.dataNascimento) parametros.set('dataNascimento', filtros.dataNascimento)
  if (filtros.nomeMae) parametros.set('nomeMae', filtros.nomeMae)
  return requisitar<PacienteResumoApi[]>(`/pacientes?${parametros.toString()}`)
}

export interface AnticorpoPacienteApi {
  data: string | null
  especificidade: string
  classe: string | null
}

export interface PacienteDetalheApi extends PacienteResumoApi {
  sexo: string | null
  cpf: string | null
  cartaoSus: string | null
  municipio: string | null
  diagnostico: string | null
  dFraco: string | null
  antigenosNegativos: string[]
  anticorpos: AnticorpoPacienteApi[]
  ultimaValidacao: { em: string; por: string } | null
}

export function buscarPaciente(id: string):
Promise<PacienteDetalheApi> {
  return requisitar<PacienteDetalheApi>
  (`/pacientes/${encodeURIComponent(id)}`)
}