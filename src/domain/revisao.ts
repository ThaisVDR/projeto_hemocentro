// Conferência humana de uma ficha extraída pela IA (human-in-the-loop).
// Os nomes dos campos seguem FichaExtraida do backend; os campos marcados com
// "(papel)" existem nas fichas físicas mas ainda não são gravados pelo backend.
import { Fenotipo } from './fenotipo'

/**
 * vazio      – ainda não preenchido
 * conferido  – revisora confirmou que bate com o original
 * editado    – preenchido ou corrigido na revisão
 * incerto    – IA indicou leitura duvidosa; bloqueia a aprovação
 * sugerido   – valor da IA ainda não conferido
 * nao_consta – campo vazio no original; não bloqueia
 */
export type EstadoCampo = 'vazio' | 'conferido' | 'editado' | 'incerto' | 'sugerido' | 'nao_consta'

export interface Conferencia {
  rotulo: string
  estado: EstadoCampo
  pagina: number
  nota?: string
}

export interface CampoRevisavel extends Conferencia {
  valor: string | null
}

export interface IdentificacaoRevisao {
  nome: CampoRevisavel
  prontuario: CampoRevisavel
  dataNascimento: CampoRevisavel
  sexo: CampoRevisavel // (papel)
  nomeMae: CampoRevisavel
  racaCor: CampoRevisavel
  aboRh: CampoRevisavel
  municipio: CampoRevisavel // (papel)
  diagnostico: CampoRevisavel
  cartaoSus: CampoRevisavel // (papel)
}

/** Uma linha da tabela da Ficha Transfusional (TransfusaoExtraida). */
export interface TransfusaoRevisao {
  dataEnvio: string | null
  tipoHemocomponente: string | null
  numeroDoacao: string | null
  grsRhd: string | null
  volMl: string | null
  testesPai: string | null
  provaCruzada: string | null
  destino: string | null
  responsavelLiberacao: string | null
}

export interface ReacaoCelula {
  celula: string
  coombs: string | null
  enzima: string | null
  frio: string | null
}

/** Página Bio-Rad (ID-DiaCell I, II ou ID-DiaPanel). A matriz do reagente fica vinculada ao lote do kit. */
export interface PesquisaBioRadRevisao {
  documento: string
  pagina: number
  data: CampoRevisavel
  grupoAntigenos: CampoRevisavel
  interpretacao: CampoRevisavel
  loteKit: CampoRevisavel // (papel)
  reacoes: ReacaoCelula[]
  reacoesConferencia: Conferencia
}

export interface AnticorpoIdentificado {
  data: string | null
  metodo: string | null
  especificidade: string | null
  classe: string | null
}

/** Página "Pesquisa Imuno Hematológica" (MTHEMO.GDL.IMUNOREC.PIH.F12). */
export interface ImunohematologiaRevisao {
  grupoSanguineo: CampoRevisavel
  fatorRh: CampoRevisavel
  dFraco: CampoRevisavel // (papel)
  pai: CampoRevisavel
  autocontrole: CampoRevisavel
  tad: CampoRevisavel
  dcScreening: CampoRevisavel // (papel)
  observacao: CampoRevisavel
  solicitante: CampoRevisavel // (papel)
  amostra: CampoRevisavel // (papel)
  metodologia: CampoRevisavel // (papel)
  dataExame: CampoRevisavel
  responsavelTecnico: CampoRevisavel
  fenotipo: Fenotipo // (papel)
  fenotipoConferencia: Conferencia
  anticorpos: AnticorpoIdentificado[]
  anticorposConferencia: Conferencia
}

/**
 * Ciclo da ficha combinado com o backend: o upload já passa pela IA e grava a ficha
 * como "digitalizada"; só fichas "aprovada" entram no prontuário, dashboard e migração.
 */
export type StatusFicha =
  | 'processando'
  | 'erro_leitura'
  | 'digitalizada'
  | 'em_revisao'
  | 'com_pendencia'
  | 'aprovada'
  | 'recusada'

export const STATUS_FICHA: Record<StatusFicha, { rotulo: string; classe: string }> = {
  processando: { rotulo: 'Processando', classe: 'selo--info' },
  erro_leitura: { rotulo: 'Erro na leitura', classe: 'selo--perigo' },
  digitalizada: { rotulo: 'Aguardando revisão', classe: 'selo--neutro' },
  em_revisao: { rotulo: 'Em revisão', classe: 'selo--info' },
  com_pendencia: { rotulo: 'Com pendência', classe: 'selo--alerta' },
  aprovada: { rotulo: 'Aprovada', classe: 'selo--sucesso' },
  recusada: { rotulo: 'Recusada', classe: 'selo--perigo' }
}

/** Ordem das páginas na ficha física. */
export const DOCUMENTOS_DA_FICHA = [
  'Ficha transfusional',
  'ID-DiaCell I, II',
  'ID-DiaPanel',
  'Pesquisa imuno-hematológica'
]

export interface FichaEmRevisao {
  status: StatusFicha
  /** Preenchido pelo backend quando houver busca por cadastro com nome, DN e nome da mãe. */
  cadastroSemelhante: { prontuario: string; motivo: string } | null
  identificacao: IdentificacaoRevisao
  transfusoes: TransfusaoRevisao[]
  transfusoesConferencia: Conferencia
  pesquisas: PesquisaBioRadRevisao[]
  imunohematologia: ImunohematologiaRevisao
}

export function editarCampo(campo: CampoRevisavel, valor: string): void {
  const vazio = valor.trim() === ''
  campo.valor = vazio ? null : valor
  campo.estado = vazio ? 'vazio' : 'editado'
}

/** Registra que o campo está em branco no documento original. */
export function marcarNaoConsta(campo: CampoRevisavel): void {
  campo.valor = null
  campo.estado = 'nao_consta'
}

/** Desfaz o "não consta": o campo volta a ficar pendente de preenchimento. */
export function desfazerNaoConsta(campo: CampoRevisavel): void {
  if (campo.estado === 'nao_consta') campo.estado = 'vazio'
}

function campoVazio(rotulo: string, pagina: number): CampoRevisavel {
  return { rotulo, valor: null, estado: 'vazio', pagina }
}

function tabelaVazia(rotulo: string, pagina: number): Conferencia {
  return { rotulo, estado: 'vazio', pagina }
}

export function criarTransfusaoVazia(): TransfusaoRevisao {
  return {
    dataEnvio: null,
    tipoHemocomponente: null,
    numeroDoacao: null,
    grsRhd: null,
    volMl: null,
    testesPai: null,
    provaCruzada: null,
    destino: null,
    responsavelLiberacao: null
  }
}

function reacoesVazias(celulas: string[]): ReacaoCelula[] {
  return [...celulas, 'Autocontrole'].map(celula => ({ celula, coombs: null, enzima: null, frio: null }))
}

function pesquisaBioRadVazia(documento: string, pagina: number, celulas: string[]): PesquisaBioRadRevisao {
  return {
    documento,
    pagina,
    data: campoVazio('Data', pagina),
    grupoAntigenos: campoVazio('Grupo sanguíneo + antígenos', pagina),
    interpretacao: campoVazio('Interpretação', pagina),
    loteKit: campoVazio('Lote do kit', pagina),
    reacoes: reacoesVazias(celulas),
    reacoesConferencia: tabelaVazia(`Reações ${documento}`, pagina)
  }
}

/** Ficha em branco, com a mesma estrutura da ficha física de 4 páginas. */
export function criarFichaVazia(): FichaEmRevisao {
  return {
    status: 'em_revisao',
    cadastroSemelhante: null,
    identificacao: {
      nome: campoVazio('Nome do receptor', 1),
      prontuario: campoVazio('Prontuário', 1),
      racaCor: campoVazio('Raça/cor', 1),
      aboRh: campoVazio('ABO/Rh', 1),
      dataNascimento: campoVazio('Data de nascimento (DN)', 1),
      nomeMae: campoVazio('Nome da mãe', 1),
      municipio: campoVazio('Município', 1),
      diagnostico: campoVazio('Diagnóstico', 1),
      sexo: campoVazio('Sexo', 4),
      cartaoSus: campoVazio('Cartão SUS', 4)
    },
    transfusoes: [criarTransfusaoVazia()],
    transfusoesConferencia: tabelaVazia('Tabela de envios', 1),
    pesquisas: [
      pesquisaBioRadVazia('ID-DiaCell I, II', 2, ['I', 'II']),
      pesquisaBioRadVazia('ID-DiaPanel', 3, Array.from({ length: 11 }, (_, i) => String(i + 1)))
    ],
    imunohematologia: {
      grupoSanguineo: campoVazio('Grupo sanguíneo', 4),
      fatorRh: campoVazio('Fator Rh', 4),
      dFraco: campoVazio('D fraco', 4),
      pai: campoVazio('Pesquisa de anticorpos irregulares (PAI)', 4),
      autocontrole: campoVazio('Autocontrole', 4),
      tad: campoVazio('Teste da antiglobulina humana (TAD)', 4),
      dcScreening: campoVazio('Antiglobulina monoespecífico DC-Screening I', 4),
      observacao: campoVazio('Observação', 4),
      solicitante: campoVazio('Solicitante', 4),
      amostra: campoVazio('Amostra', 4),
      metodologia: campoVazio('Metodologia', 4),
      dataExame: campoVazio('Data do exame', 4),
      responsavelTecnico: campoVazio('Responsável técnico', 4),
      fenotipo: {},
      fenotipoConferencia: tabelaVazia('Fenotipagem eritrocitária', 4),
      anticorpos: [],
      anticorposConferencia: tabelaVazia('Identificação de anticorpos irregulares', 4)
    }
  }
}

export function confirmarConferencia(conferencia: Conferencia): void {
  conferencia.estado = 'conferido'
}

function ehConferencia(valor: unknown): valor is Conferencia {
  return typeof valor === 'object' && valor !== null && 'estado' in valor && 'rotulo' in valor
}

/** Todos os itens conferíveis da ficha, na ordem do documento. */
export function listarConferencias(ficha: FichaEmRevisao): Conferencia[] {
  const doGrupo = (grupo: object) => Object.values(grupo).filter(ehConferencia)
  return [
    ...doGrupo(ficha.identificacao),
    ficha.transfusoesConferencia,
    ...ficha.pesquisas.flatMap(p => [...doGrupo(p), p.reacoesConferencia]),
    ...doGrupo(ficha.imunohematologia)
  ]
}

export interface ResumoConferencia {
  total: number
  resolvidos: number
  incertos: Conferencia[]
  pendentesSugestao: number
  bloqueios: string[]
  podeAprovar: boolean
}

const ESTADOS_RESOLVIDOS: EstadoCampo[] = ['conferido', 'editado', 'nao_consta']

export function resumirConferencia(ficha: FichaEmRevisao): ResumoConferencia {
  const itens = listarConferencias(ficha)
  const incertos = itens.filter(i => i.estado === 'incerto')
  const resolvidos = itens.filter(i => ESTADOS_RESOLVIDOS.includes(i.estado)).length
  const pendentesSugestao = itens.filter(i => i.estado === 'sugerido').length

  const bloqueios: string[] = []
  if (!ficha.identificacao.nome.valor) bloqueios.push('Nome do receptor é obrigatório.')
  if (!ficha.identificacao.dataNascimento.valor) bloqueios.push('Data de nascimento é obrigatória.')
  incertos.forEach(i => bloqueios.push(`${i.rotulo}: leitura incerta a confirmar.`))

  return {
    total: itens.length,
    resolvidos,
    incertos,
    pendentesSugestao,
    bloqueios,
    podeAprovar: bloqueios.length === 0
  }
}

/** Resultados possíveis dos testes (PAI, TAD, autocontrole, prova cruzada…), iguais ao enum do backend. */
export type ResultadoTeste = 'POSITIVO' | 'NEGATIVO' | 'NAO_REALIZADO'

export const RESULTADOS_TESTE: { valor: ResultadoTeste; rotulo: string }[] = [
  { valor: 'POSITIVO', rotulo: 'Positivo' },
  { valor: 'NEGATIVO', rotulo: 'Negativo' },
  { valor: 'NAO_REALIZADO', rotulo: 'NR — não realizado' }
]

/** Entende o texto lido pela IA ("neg", "Negativo", "-", "não realizado"…). Devolve null se não reconhecer. */
export function lerResultadoTeste(texto?: string | null): ResultadoTeste | null {
  if (!texto) return null
  const normalizado = texto.trim().toUpperCase()

  if (
    normalizado === 'NR' ||
    normalizado === 'NAO_REALIZADO' ||
    normalizado.startsWith('NÃO REALIZ') ||
    normalizado.startsWith('NAO REALIZ')
  ) {
    return 'NAO_REALIZADO'
  }
  if (normalizado.startsWith('POS') || normalizado === '+') return 'POSITIVO'
  if (normalizado.startsWith('NEG') || normalizado === '-') return 'NEGATIVO'
  return null
}