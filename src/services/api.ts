import { Reacao, interpretarReacao } from '@/domain/fenotipo'
import { csrfAtual, encerrarSessao, Sessao } from '@/services/sessao'
import { CLASSES_ANTICORPO, ClasseAnticorpo, MotivoRecusa, StatusFicha } from '@/domain/revisao'
import { TipoEventoApi } from '@/domain/auditoria'
import { ehErroTecnico, MENSAGEM_ERRO_GENERICA } from '@/utils/erros'

export const API_URL = (process.env.VUE_APP_API_URL ?? 'http://localhost:3000/api').replace(/\/$/, '')

export class ErroApi extends Error {
  constructor(mensagem: string, readonly status?: number, readonly detalhe?: string) {
    super(mensagem)
  }
}

async function chamar(caminho: string, opcoes: RequestInit = {}): Promise<Response> {
  const headers = new Headers(opcoes.headers)
  const metodo = (opcoes.method ?? 'GET').toUpperCase()
  if (metodo !== 'GET' && csrfAtual.value) headers.set('X-CSRF-Token', csrfAtual.value)

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers, credentials: 'include' })
  } catch {
    throw new ErroApi(`Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando.`)
  }

  if (resposta.status === 401 && !caminho.startsWith('/auth/')) {
    encerrarSessao()
    const voltar = encodeURIComponent(location.pathname + location.search)
    location.assign(`/login?redirect=${voltar}`)
  }
  return resposta
}

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await chamar(caminho, opcoes)

  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const bruta = corpo?.message ?? corpo?.erro ?? `Erro ${resposta.status} ao acessar ${caminho}.`
    const mensagem: string = Array.isArray(bruta) ? bruta.join(' ') : String(bruta)
    if (ehErroTecnico(mensagem)) {
      console.error(`[API] ${opcoes.method ?? 'GET'} ${caminho} → ${resposta.status}:`, mensagem)
      throw new ErroApi(MENSAGEM_ERRO_GENERICA, resposta.status, mensagem)
    }
    throw new ErroApi(mensagem, resposta.status)
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

// ---------- Tipos da Ficha ----------

export interface FichaExtraidaApi {
  paciente: {
    nome: string | null
    dataNascimento: string | null
    prontuario: number | null
    sexo: string | null
    raca: string | null
    aboRh: string | null
    cartaoSus: string | null
    diagnostico: string | null
    nomeMae: string | null
    municipio: string | null
    ufMunicipio: string | null
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
    dataPesquisa: string | null
    gs: string | null
    rh: string | null
    dFraco: string | null
    pai: string | null
    tad: string | null
    autocontrole: string | null
    dcScreening: string | null
    especificidade: string | null
    interpretacao: string | null
    observacao: string | null
    amostra: string | null
    metodologia: string | null
    responsavel: string | null
    fenotipagem: { antigeno: string; resultado: string }[]
  }[]
  kits: KitExtraidoApi[]
}

export interface KitExtraidoApi {
  tipo: 'DIACELL' | 'DIAPANEL' | null
  dataPesquisa: string | null
  interpretacao: string | null
  autocontroleLissCoombs: string | null
  autocontroleEnzima: string | null
  autocontroleFrio: string | null
  resultados: { celula: number; lissCoombs: string | null; enzima: string | null; frio: string | null }[]
}

export interface AnticorpoApi {
  especificidade: string
  data: string | null
  classe: ClasseAnticorpo | null
}

export interface FichaDetalheApi {
  id: number
  codigo: string
  status: StatusFicha
  erroLeitura: string | null
  documento: { id: number; nomeOriginal: string; totalPaginas: number | null }
  revisor: { id: number; nome: string } | null
  dados: FichaExtraidaApi | null
  pendencia?: PendenciaApi | null
}

export interface PendenciaApi {
  motivo: string | null
  sinalizadoPor: { id: number; nome: string } | null
  sinalizadoEm: string
}

export interface FichaResumoApi {
  id: string
  arquivo: string
  status: StatusFicha
  pacienteNome: string | null
  criadaEm: string
  enviadaPor: string | null
}

// ---------- Rotas de Fichas ----------

export function listarFichas(status?: StatusFicha): Promise<FichaResumoApi[]> {
  const filtro = status ? `?status=${status}` : ''
  return requisitar<FichaResumoApi[]>(`/fichas${filtro}`)
}

export function buscarFicha(id: string): Promise<FichaDetalheApi> {
  return requisitar<FichaDetalheApi>(`/fichas/${encodeURIComponent(id)}`)
}

export interface PacienteSemelhanteApi {
  id: string
  nome: string
  dataNascimento: string | null
  nomeMae: string | null
  prontuario: number | null
  fichasValidadas: number
  coincide: string[]
}

export function buscarSemelhantes(id: string): Promise<PacienteSemelhanteApi[]> {
  return requisitar<PacienteSemelhanteApi[]>(`/fichas/${encodeURIComponent(id)}/semelhantes`)
}

export interface RevisaoApi {
  status: StatusFicha
  revisor: { id: number; nome: string }
}

export function iniciarRevisao(id: string): Promise<RevisaoApi> {
  return requisitar<RevisaoApi>(`/fichas/${encodeURIComponent(id)}/iniciar-revisao`, { method: 'POST' })
}

export function assumirRevisao(id: string, justificativa: string | null): Promise<RevisaoApi> {
  return enviarJson<RevisaoApi>(`/fichas/${encodeURIComponent(id)}/assumir-revisao`, 'POST', { justificativa })
}

export interface AlteracaoApi {
  campo: string
  valor: unknown
}

export function salvarAlteracoes(id: string, alteracoes: AlteracaoApi[]): Promise<FichaDetalheApi> {
  return enviarJson<FichaDetalheApi>(`/fichas/${encodeURIComponent(id)}/dados`, 'PATCH', { alteracoes })
}

export function urlArquivoDocumento(documentoId: number): string {
  return `${API_URL}/documentos/${documentoId}/arquivo`
}

export interface AprovacaoApi {
  status: StatusFicha
  gravacao: {
    pacienteId: string
    pacienteCriado: boolean
    transfusoesCriadas: number
    pesquisasCriadas: number
    kitsCriados: number
  }
  avisos: string[]
}

export function aprovarFicha(id: string, pacienteId: string | null = null): Promise<AprovacaoApi> {
  const corpo = pacienteId ? { pacienteId } : {}
  return enviarJson<AprovacaoApi>(`/fichas/${encodeURIComponent(id)}/aprovar`, 'POST', corpo)
}

export function sinalizarPendenciaFicha(id: string, motivo: string): Promise<void> {
  return enviarJson(`/fichas/${encodeURIComponent(id)}/pendencia`, 'POST', { motivo })
}

export function recusarFicha(id: string, motivo: MotivoRecusa, observacao: string | null): Promise<void> {
  return enviarJson(`/fichas/${encodeURIComponent(id)}/recusar`, 'POST', { motivo, observacao })
}

// ---------- Upload (lotes) ----------

export interface DocumentoLoteApi {
  id: number
  nome: string
  nomeOriginal: string
  totalPaginas: number | null
  fichaId: number | null
  status: StatusFicha | null
  erro?: string | null
  falhouEm?: string | null
}

export interface LoteCriadoApi {
  id: number
  codigo: string
  nome: string
  documentos: DocumentoLoteApi[]
}

export function enviarLote(arquivos: File[]): Promise<LoteCriadoApi> {
  const formulario = new FormData()
  arquivos.forEach(arquivo => formulario.append('arquivos', arquivo))
  return requisitar<LoteCriadoApi>('/lotes', { method: 'POST', body: formulario })
}

export function buscarLote(id: number): Promise<{ documentos: DocumentoLoteApi[] }> {
  return requisitar(`/lotes/${id}`)
}

export function reprocessarDocumento(id: number): Promise<unknown> {
  return requisitar(`/documentos/${id}/reprocessar`, { method: 'POST' })
}

// ---------- Fila de revisão ----------

export interface ListaPaginadaApi<T> {
  itens: T[]
  total: number
  pagina: number
  limite: number
}

export interface FichaFilaApi {
  id: number
  codigo: string
  status: StatusFicha
  paciente: { nome: string | null; dataNascimento: string | null; nomeMae: string | null } | null
  lote: { id: number; codigo: string }
  revisor: { id: number; nome: string } | null
  desde: string
  alertas: string[]
}

export interface FilaRevisaoApi extends ListaPaginadaApi<FichaFilaApi> {
  contadores: Record<string, number>
}

export const FICHAS_POR_PAGINA = 20

export interface FiltrosFila {
  status: StatusFicha[]
  busca: string
  pagina: number
}

export function listarFilaRevisao(filtros: FiltrosFila): Promise<FilaRevisaoApi> {
  const parametros = new URLSearchParams()
  parametros.set('status', filtros.status.join(','))
  if (filtros.busca) parametros.set('busca', filtros.busca)
  parametros.set('pagina', String(filtros.pagina))
  parametros.set('limite', String(FICHAS_POR_PAGINA))
  return requisitar<FilaRevisaoApi>(`/fichas/revisao?${parametros.toString()}`)
}

// ---------- Colaboradores ----------

export interface ColaboradorApi {
  id: number
  nome: string
}

export function buscarColaboradores(busca: string): Promise<ColaboradorApi[]> {
  return requisitar<ColaboradorApi[]>(`/colaboradores?busca=${encodeURIComponent(busca)}`)
}

export function cadastrarColaborador(nome: string): Promise<ColaboradorApi> {
  return enviarJson<ColaboradorApi>('/colaboradores', 'POST', { nome: nome.trim() })
}

// ---------- Cidades ----------

export interface CidadeApi {
  id: number
  nomeCidade: string
  estados: { uf: string }
}

export function buscarCidades(busca: string): Promise<CidadeApi[]> {
  return requisitar<CidadeApi[]>(`/cidades?busca=${encodeURIComponent(busca)}`)
}

// ---------- Autenticação ----------

export function entrar(dados: { email: string; senha: string }): Promise<Sessao> {
  return enviarJson<Sessao>('/auth/login', 'POST', { email: dados.email.trim(), senha: dados.senha })
}

export function consultarSessao(): Promise<Sessao> {
  return requisitar<Sessao>('/auth/sessao')
}

export async function sair(): Promise<void> {
  await chamar('/auth/logout', { method: 'POST' })
}

export async function solicitarRedefinicaoSenha(email: string): Promise<void> {
  await enviarJson<unknown>('/auth/esqueci-senha', 'POST', { email: email.trim() })
}

export async function redefinirSenha(token: string, senha: string): Promise<void> {
  await enviarJson<unknown>('/auth/redefinir-senha', 'POST', { token, senha })
}

// ---------- Pacientes ----------

export interface PacienteResumoApi {
  id: string
  nome: string
  dataNascimento?: string
  nomeMae?: string
  prontuario?: string
  fichasValidadas: number
  racaCor?: string
  aboRh?: string
}

export interface FiltrosPaciente {
  nome?: string
  dataNascimento?: string
  nomeMae?: string
  prontuario?: number
  pagina?: number
}

export function buscarPacientes(filtros: FiltrosPaciente): Promise<ListaPaginadaApi<PacienteResumoApi>> {
  const parametros = new URLSearchParams()
  if (filtros.nome) parametros.set('nome', filtros.nome)
  if (filtros.dataNascimento) parametros.set('dataNascimento', filtros.dataNascimento)
  if (filtros.nomeMae) parametros.set('nomeMae', filtros.nomeMae)
  if (filtros.prontuario) parametros.set('prontuario', String(filtros.prontuario))
  if (filtros.pagina) parametros.set('pagina', String(filtros.pagina))
  return requisitar<ListaPaginadaApi<PacienteResumoApi>>(`/pacientes?${parametros.toString()}`)
}

export interface HistoricoItemApi {
  ficha: { id: number; codigo: string }
  dataAtendimento: string | null
  documento: { id: number; nomeOriginal: string; totalPaginas: number | null; loteCodigo: string; url: string }
  validacao: { validadoPor: string | null; validadoEm: string | null }
}

export interface AnticorpoPacienteApi {
  data: string | null
  especificidade: string
  classe: string | null
}

export interface PacienteDetalheApi {
  id: string
  nome: string
  dataNascimento: string | null
  nomeMae: string | null
  prontuario: number | null
  racaCor: string | null
  aboRh: string | null
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

export interface OrigemApi {
  fichaCodigo: string | null
  pagina: number | null
}

export interface TransfusaoApi {
  id: number
  dataEnvio: string
  tipoHemocomponente: string
  numeroDoacao: string
  numeroServico: string | null
  tracejador: string | null
  grsRhd: string
  volMl: number
  testesPai: string
  provaCruzada: string
  destino: string | null
  responsavelLiberacao: string | null
  origem: OrigemApi
}

export interface PesquisaImunoApi {
  id: number
  dataPesquisa: string
  gs: string | null
  rh: string | null
  dFraco: string | null
  pai: string | null
  tad: string | null
  autocontrole: string | null
  dcScreening: string | null
  especificidade: string | null
  interpretacao: string | null
  observacao: string | null
  amostra: string | null
  metodologia: string | null
  fenotipagem: { antigeno: string; resultado: string }[]
  anticorpos?: AnticorpoApi[]
  responsavel: string | null
  origem: OrigemApi
}

export interface ResultadoCelulaApi {
  celula: number
  lissCoombs: string | null
  enzima: string | null
  frio: string | null
}

export interface KitIdApi {
  id: number
  tipo: 'DIACELL' | 'DIAPANEL'
  dataPesquisa: string
  gs: string | null
  rh: string | null
  tad: string | null
  pai: string | null
  autocontroleLissCoombs: string | null
  autocontroleEnzima: string | null
  autocontroleFrio: string | null
  interpretacao: string | null
  tecnica: string | null
  observacao: string | null
  resultados: ResultadoCelulaApi[]
  origem: OrigemApi
}

export interface DocumentoValidadoApi {
  fichaCodigo: string
  documentoId: number
  nomeOriginal: string
  totalPaginas: number | null
  validadoEm: string | null
  url: string
}

export interface FichaCompletaApi {
  paciente: {
    id: string
    nome: string
    nomeSocial: string | null
    sexo: string | null
    raca: string | null
    aboRh: string | null
    dataNascimento: string
    idade: number
    prontuario: number | null
    cpf: string | null
    cartaoSus: string | null
    diagnostico: string | null
    nomeMae: string | null
    nomePai: string | null
    alergias: string | null
    municipio: string | null
  }
  ultimaValidacao: { fichaCodigo: string; validadoPor: string | null; validadoEm: string | null } | null
  transfusoes: TransfusaoApi[]
  pesquisasImunoHematologicas: PesquisaImunoApi[]
  kitsDiaCell: KitIdApi[]
  kitsDiaPanel: KitIdApi[]
  documentos: DocumentoValidadoApi[]
}

export function buscarFichaCompleta(id: string): Promise<FichaCompletaApi> {
  return requisitar<FichaCompletaApi>(`/pacientes/${encodeURIComponent(id)}/ficha-completa`)
}

export function buscarHistorico(id: string): Promise<HistoricoItemApi[]> {
  return requisitar<HistoricoItemApi[]>(`/pacientes/${encodeURIComponent(id)}/historico`)
}

export async function buscarPaciente(id: string): Promise<PacienteDetalheApi> {
  const ficha = await requisitar<FichaCompletaApi>(`/pacientes/${encodeURIComponent(id)}/ficha-completa`)
  const { paciente: p, ultimaValidacao, pesquisasImunoHematologicas: pesquisas } = ficha

  const antigenosVistos = new Set<string>()
  const antigenosNegativos: string[] = []
  const anticorpos: AnticorpoPacienteApi[] = []

  for (const pesquisa of pesquisas) {
    for (const { antigeno, resultado } of pesquisa.fenotipagem) {
      if (antigenosVistos.has(antigeno)) continue
      antigenosVistos.add(antigeno)
      if (interpretarReacao(resultado as Reacao) === 'negativo') antigenosNegativos.push(antigeno)
    }
    for (const anticorpo of pesquisa.anticorpos ?? []) {
      if (!anticorpos.some((a) => a.especificidade.toLowerCase() === anticorpo.especificidade.toLowerCase())) {
        const classe = CLASSES_ANTICORPO.find((c) => c.valor === anticorpo.classe)?.rotulo ?? null
        anticorpos.push({ data: anticorpo.data, especificidade: anticorpo.especificidade, classe })
      }
    }
  }

  return {
    id: p.id,
    nome: p.nome,
    dataNascimento: p.dataNascimento,
    nomeMae: p.nomeMae,
    prontuario: p.prontuario,
    racaCor: p.raca,
    aboRh: p.aboRh,
    sexo: p.sexo,
    cpf: p.cpf,
    cartaoSus: p.cartaoSus,
    municipio: p.municipio,
    diagnostico: p.diagnostico,
    dFraco: pesquisas.find((x) => x.dFraco)?.dFraco ?? null,
    antigenosNegativos,
    anticorpos,
    ultimaValidacao: ultimaValidacao
      ? { em: ultimaValidacao.validadoEm ?? '', por: ultimaValidacao.validadoPor ?? 'revisor não identificado' }
      : null
  }
}

// ---------- Dashboard ----------

export interface DashboardApi {
  periodo: { de: string; ate: string }
  fichas: { digitalizadas: number; validadas: number; emRevisao: number; lendo: number }
  evolucaoSemanal: { semana: string; fichas: number }[]
  qualidadeCadastro: { validadas: number; completas: number; percentual: number }
}

export function buscarDashboard(periodo: { de?: string; ate?: string } = {}): Promise<DashboardApi> {
  const parametros = new URLSearchParams()
  if (periodo.de) parametros.set('de', periodo.de)
  if (periodo.ate) parametros.set('ate', periodo.ate)
  const consulta = parametros.toString()
  return requisitar<DashboardApi>(`/dashboard${consulta ? `?${consulta}` : ''}`)
}

// ---------- Leituras com problema ----------

export const STATUS_LEITURA: StatusFicha[] = ['ENVIADA', 'LENDO', 'FALHA_LEITURA']

export interface FichaLeituraApi extends FichaFilaApi {
  documentoId: number
  erroLeitura: string | null
  falhouEm: string | null
}

export function listarLeituras(): Promise<ListaPaginadaApi<FichaLeituraApi> & { contadores: Record<string, number> }> {
  const parametros = new URLSearchParams()
  parametros.set('status', STATUS_LEITURA.join(','))
  parametros.set('limite', '100')
  return requisitar(`/fichas?${parametros.toString()}`)
}

export function listarPrioridadesRevisao(limite = 3): Promise<FilaRevisaoApi> {
  const parametros = new URLSearchParams()
  parametros.set('status', 'AGUARDANDO_REVISAO,EM_REVISAO,COM_PENDENCIA')
  parametros.set('ordenar', 'atencao')
  parametros.set('limite', String(limite))
  return requisitar<FilaRevisaoApi>(`/fichas?${parametros.toString()}`)
}

export function listarEventosRecentes(limite = 3): Promise<ListaPaginadaApi<EventoAuditoriaApi>> {
  return requisitar<ListaPaginadaApi<EventoAuditoriaApi>>(`/auditoria/eventos?limite=${limite}`)
}

// ---------- Auditoria ----------

export interface ListaEventosAuditoriaApi extends ListaPaginadaApi<EventoAuditoriaApi> {
  contadores: { eventos: number; edicoes: number; validacoes: number }
}

export interface EventoAuditoriaApi {
  id: number
  codigo: string
  tipo: string
  ocorridoEm: string
  usuario: { id: number; nome: string } | null
  ficha: { id: number; codigo: string } | null
  lote: { id: number; codigo: string } | null
  paciente: { id: string; nome: string } | null
  campo: string | null
  pagina: number | null
}

export interface EventoAuditoriaDetalheApi {
  id: number
  codigo: string
  tipo: TipoEventoApi
  ocorridoEm: string
  usuario: { id: number; nome: string } | null
  paciente: { id: string; nome: string } | null
  fichaId: number | null
  fichaCodigo: string | null
  loteId: number | null
  loteCodigo: string | null
  campo: string | null
  pagina: number | null
  valorAnterior: string | null
  valorPosterior: string | null
  justificativa: string | null
  documento: { id: number; nomeOriginal: string; url: string } | null
}

export interface FiltrosAuditoria {
  busca: string
  de: string
  ate: string
  tipo: TipoEventoApi | ''
  usuarioId: number | null
}

export const EVENTOS_POR_PAGINA = 10

function parametrosAuditoria(filtros: FiltrosAuditoria): URLSearchParams {
  const parametros = new URLSearchParams()
  if (filtros.busca) parametros.set('busca', filtros.busca)
  if (filtros.de) parametros.set('de', filtros.de)
  if (filtros.ate) parametros.set('ate', filtros.ate)
  if (filtros.tipo) parametros.set('tipo', filtros.tipo)
  if (filtros.usuarioId) parametros.set('usuarioId', String(filtros.usuarioId))
  return parametros
}

export function listarEventosAuditoria(filtros: FiltrosAuditoria, pagina: number): Promise<ListaEventosAuditoriaApi> {
  const parametros = parametrosAuditoria(filtros)
  parametros.set('pagina', String(pagina))
  parametros.set('limite', String(EVENTOS_POR_PAGINA))
  return requisitar<ListaEventosAuditoriaApi>(`/auditoria/eventos?${parametros.toString()}`)
}

export function buscarEventoAuditoria(id: number): Promise<EventoAuditoriaDetalheApi> {
  return requisitar<EventoAuditoriaDetalheApi>(`/auditoria/eventos/${id}`)
}

export async function exportarTrilhaAuditoria(filtros: FiltrosAuditoria): Promise<{ blob: Blob; nome: string }> {
  const resposta = await chamar(`/auditoria/eventos/exportar?${parametrosAuditoria(filtros).toString()}`)

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const bruta = corpo?.message ?? corpo?.erro ?? `Erro ${resposta.status} ao exportar a trilha.`
    const mensagem: string = Array.isArray(bruta) ? bruta.join(' ') : String(bruta)
    if (ehErroTecnico(mensagem)) {
      console.error(`[API] exportar trilha → ${resposta.status}:`, mensagem)
      throw new ErroApi(MENSAGEM_ERRO_GENERICA, resposta.status, mensagem)
    }
    throw new ErroApi(mensagem, resposta.status)
  }

  const nome = resposta.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? 'trilha-auditoria.xlsx'
  return { blob: await resposta.blob(), nome }
}

// ---------- Tipos de Usuários e Permissões (Gestor) ----------

// Adicione junto às outras interfaces
export type PermissaoUsuario =
  | 'VISUALIZAR_DASHBOARD'
  | 'ENVIAR_DOCUMENTOS'
  | 'REVISAR_FICHAS'
  | 'CONSULTAR_PRONTUARIOS'
  | 'CONSULTAR_AUDITORIA'
  | 'EXPORTAR_AUDITORIA'
  | 'GERENCIAR_USUARIOS'

export interface UsuarioGerenciamentoApi {
  id: number
  nome: string
  email: string
  ativo: boolean
  permissoes: PermissaoUsuario[]
  criadoEm?: string
}

export interface CriarUsuarioPayload {
  nome: string
  email: string
  permissoes: PermissaoUsuario[]
}

// Remova a função: export async function cadastrar(dados: { nome: string...
// E adicione as novas funções de gestão:

export function listarUsuarios(ativo?: boolean): Promise<UsuarioGerenciamentoApi[]> {
  const query = ativo !== undefined ? `?ativo=${ativo}` : ''
  return requisitar<UsuarioGerenciamentoApi[]>(`/usuarios${query}`)
}

export function criarUsuario(dados: CriarUsuarioPayload): Promise<UsuarioGerenciamentoApi> {
  return enviarJson<UsuarioGerenciamentoApi>('/usuarios', 'POST', dados)
}

export function atualizarUsuario(id: number, dados: Partial<CriarUsuarioPayload>): Promise<UsuarioGerenciamentoApi> {
  return enviarJson<UsuarioGerenciamentoApi>(`/usuarios/${id}`, 'PATCH', dados)
}

export function inativarUsuario(id: number): Promise<void> {
  return requisitar<void>(`/usuarios/${id}/inativar`, { method: 'POST' })
}

export function reativarUsuario(id: number): Promise<void> {
  return requisitar<void>(`/usuarios/${id}/reativar`, { method: 'POST' })
}