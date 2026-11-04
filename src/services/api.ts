import { Reacao, extrairAnticorpos, interpretarReacao } from '@/domain/fenotipo'
import { tokenAtual } from '@/services/sessao'
import { MotivoRecusa, StatusFicha } from '@/domain/revisao'
import { TipoEventoApi } from '@/domain/auditoria'

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

// O que a IA leu (FichaExtraida do backend). Datas em AAAA-MM-DD; null = vazio ou ilegível.
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

// Folha Bio-Rad lida pela IA (páginas 2 e 3). "celula" é o número da hemácia (DiaCell: 1 e 2; DiaPanel: 1 a 11).
export interface KitExtraidoApi {
  tipo: 'DIACELL' | 'DIAPANEL' | null
  dataPesquisa: string | null
  interpretacao: string | null
  autocontroleLissCoombs: string | null
  autocontroleEnzima: string | null
  autocontroleFrio: string | null
  resultados: { celula: number; lissCoombs: string | null; enzima: string | null; frio: string | null }[]
}

export interface FichaDetalheApi {
  id: number
  codigo: string
  status: StatusFicha
  erroLeitura: string | null
  documento: { id: number; nomeOriginal: string; totalPaginas: number | null }
  revisor: { id: number; nome: string } | null
  dados: FichaExtraidaApi | null
}

export interface FichaResumoApi {
  id: string
  arquivo: string
  status: StatusFicha
  pacienteNome: string | null
  criadaEm: string
  enviadaPor: string | null
}

// ---------- Rotas ----------

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

// Sem pacienteId, o backend cria um paciente novo; com ele, liga a ficha a esse paciente.
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
// Rotas do backend usadas aqui (todas somente leitura):
//   GET /pacientes?nome=&dataNascimento=&nomeMae=&prontuario=&pagina=&limite=  → busca (lista paginada)
//   GET /pacientes/:id/ficha-completa                                          → dados da página do paciente

// Cada item da busca (GET /pacientes). Não traz raça nem ABO/Rh: isso só vem na ficha completa.
export interface PacienteResumoApi {
  id: string;
  nome: string;
  dataNascimento?: string;
  nomeMae?: string;
  prontuario?: string;
  fichasValidadas: number;
  racaCor?: string;
  aboRh?: string;
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


//   GET /pacientes/:id/historico → fichas validadas e documentos de origem
export interface HistoricoItemApi {
  ficha: { id: number; codigo: string }
  dataAtendimento: string | null
  documento: {
    id: number
    nomeOriginal: string
    totalPaginas: number | null
    loteCodigo: string
    url: string
  }
  validacao: { validadoPor: string | null; validadoEm: string | null }
}

// Formato que as telas do Prontuário usam (os componentes não mudam).
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

// Resposta de GET /pacientes/:id/ficha-completa (somente leitura, só registros validados).
// O Prontuário aproveita uma parte (buscarPaciente); a tela Ficha completa usa tudo.
// Datas em AAAA-MM-DD; enums chegam como no banco (O_POSITIVO, NEGATIVO...) e são traduzidos em domain/traducao.ts.
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

// Uma linha por ficha validada, da mais recente para a mais antiga (GET /pacientes/:id/historico).
export interface HistoricoItemApi {
  ficha: { id: number; codigo: string }
  dataAtendimento: string | null
  documento: { id: number; nomeOriginal: string; totalPaginas: number | null; loteCodigo: string; url: string }
  validacao: { validadoPor: string | null; validadoEm: string | null }
}

export function buscarHistorico(id: string): Promise<HistoricoItemApi[]> {
  return requisitar<HistoricoItemApi[]>(`/pacientes/${encodeURIComponent(id)}/historico`)
}

export async function buscarPaciente(id: string): Promise<PacienteDetalheApi> {
  const ficha = await requisitar<FichaCompletaApi>(`/pacientes/${encodeURIComponent(id)}/ficha-completa`)
  const { paciente: p, ultimaValidacao, pesquisasImunoHematologicas: pesquisas } = ficha

  // Para cada antígeno vale o resultado da pesquisa mais recente; "0" = negativo.
  const antigenosVistos = new Set<string>()
  const antigenosNegativos: string[] = []
  // "Anti-c" citado em várias pesquisas aparece uma vez só (com a data da mais recente).
  const anticorpos: AnticorpoPacienteApi[] = []

  for (const pesquisa of pesquisas) {
    for (const { antigeno, resultado } of pesquisa.fenotipagem) {
      if (antigenosVistos.has(antigeno)) continue
      antigenosVistos.add(antigeno)
      if (interpretarReacao(resultado as Reacao) === 'negativo') antigenosNegativos.push(antigeno)
    }
    for (const especificidade of extrairAnticorpos(pesquisa.especificidade)) {
      if (!anticorpos.some((a) => a.especificidade.toLowerCase() === especificidade.toLowerCase())) {
        anticorpos.push({ data: pesquisa.dataPesquisa, especificidade, classe: null })
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

export interface DashboardApi {
  periodo: { de: string; ate: string }
  // digitalizadas e validadas contam o período; emRevisao e lendo são a situação de agora.
  fichas: { digitalizadas: number; validadas: number; emRevisao: number; lendo: number }
  evolucaoSemanal: { semana: string; fichas: number }[]
  qualidadeCadastro: { validadas: number; completas: number; percentual: number }
}

// de/ate em AAAA-MM-DD; sem eles o backend usa as últimas 6 semanas.
export function buscarDashboard(periodo: { de?: string; ate?: string } = {}): Promise<DashboardApi> {
  const parametros = new URLSearchParams()
  if (periodo.de) parametros.set('de', periodo.de)
  if (periodo.ate) parametros.set('ate', periodo.ate)
  const consulta = parametros.toString()
  return requisitar<DashboardApi>(`/dashboard${consulta ? `?${consulta}` : ''}`)
}

// As fichas que mais pedem atenção primeiro (com alerta e, entre elas, as que esperam há mais tempo).
// `contadores` vem de todas as fichas, não só das 3 listadas: serve para detalhar os cartões.
export function listarPrioridadesRevisao(limite = 3): Promise<FilaRevisaoApi> {
  const parametros = new URLSearchParams()
  parametros.set('status', 'AGUARDANDO_REVISAO,EM_REVISAO,COM_PENDENCIA')
  parametros.set('ordenar', 'atencao')
  parametros.set('limite', String(limite))
  return requisitar<FilaRevisaoApi>(`/fichas?${parametros.toString()}`)
}

// Mais recentes primeiro.
export function listarEventosRecentes(limite = 3): Promise<ListaPaginadaApi<EventoAuditoriaApi>> {
  return requisitar<ListaPaginadaApi<EventoAuditoriaApi>>(`/auditoria/eventos?limite=${limite}`)
}

// ---------- Auditoria ----------
// Rotas do backend (somente leitura):
//   GET /auditoria/eventos?busca=&de=&ate=&tipo=&usuarioId=&pagina=&limite=  → lista + contadores
//   GET /auditoria/eventos/:id                                                → detalhe do evento
//   GET /auditoria/eventos/exportar?(mesmos filtros)                          → trilha-auditoria.xlsx

export interface ListaEventosAuditoriaApi extends ListaPaginadaApi<EventoAuditoriaApi> {
  contadores: { eventos: number; edicoes: number; validacoes: number }
}
export interface EventoAuditoriaApi {
  id: number
  codigo: string
  tipo: string
  ocorridoEm: string
  usuario: { id: number; nome: string } | null // null = o próprio sistema (fila da IA)
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
  valorAnterior: string | null // sugestão da extração
  valorPosterior: string | null // correção humana
  justificativa: string | null
  documento: { id: number; nomeOriginal: string; url: string } | null
}

export interface FiltrosAuditoria {
  busca: string
  de: string // AAAA-MM-DD ou ''
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

export function listarUsuarios(): Promise<{ id: number; nome: string; email: string }[]> {
  return requisitar('/usuarios')
}

// A exportação devolve um arquivo (não JSON) e precisa do header X-Usuario-Id,
// então não dá para usar um <a href>: baixamos como Blob e o componente dispara o download.
export async function exportarTrilhaAuditoria(filtros: FiltrosAuditoria): Promise<{ blob: Blob; nome: string }> {
  const headers = new Headers()
  if (tokenAtual.value) headers.set('X-Usuario-Id', tokenAtual.value)

  let resposta: Response
  try {
    resposta = await fetch(`${API_URL}/auditoria/eventos/exportar?${parametrosAuditoria(filtros).toString()}`, { headers })
  } catch {
    throw new ErroApi(`Não foi possível conectar ao servidor (${API_URL}). Verifique se o backend está rodando.`)
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const mensagem = corpo?.message ?? corpo?.erro ?? `Erro ${resposta.status} ao exportar a trilha.`
    throw new ErroApi(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem, resposta.status)
  }

  const nome = resposta.headers.get('Content-Disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? 'trilha-auditoria.xlsx'
  return { blob: await resposta.blob(), nome }
}
