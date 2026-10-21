// Conferência humana de uma ficha extraída pela IA (human-in-the-loop).
// Os nomes dos campos seguem FichaExtraida do backend; os campos marcados com
// "(papel)" existem nas fichas físicas mas ainda não são gravados pelo backend.
import { Fenotipo } from './fenotipo'

/**
 * conferido  – revisora confirmou que bate com o original
 * editado    – revisora corrigiu o valor sugerido
 * incerto    – IA indicou leitura duvidosa; bloqueia a aprovação
 * sugerido   – valor da IA ainda não conferido
 * nao_consta – campo vazio no original; não bloqueia
 */
export type EstadoCampo = 'conferido' | 'editado' | 'incerto' | 'sugerido' | 'nao_consta'

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

export type StatusFicha = 'aguardando' | 'em_revisao' | 'com_pendencia' | 'validada'

export interface FichaEmRevisao {
  id: string
  lote: string
  arquivo: string
  totalPaginas: number
  documentosPorPagina: string[]
  status: StatusFicha
  revisaoIniciada: { por: string; hora: string }
  origem: string
  cadastroSemelhante: { prontuario: string; motivo: string } | null
  identificacao: IdentificacaoRevisao
  transfusoes: TransfusaoRevisao[]
  transfusoesConferencia: Conferencia
  pesquisas: PesquisaBioRadRevisao[]
  imunohematologia: ImunohematologiaRevisao
}

export function editarCampo(campo: CampoRevisavel, valor: string): void {
  campo.valor = valor.trim() === '' ? null : valor
  campo.estado = 'editado'
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

export function resumirConferencia(ficha: FichaEmRevisao): ResumoConferencia {
  const itens = listarConferencias(ficha)
  const incertos = itens.filter(i => i.estado === 'incerto')
  const resolvidos = itens.filter(i => i.estado !== 'incerto' && i.estado !== 'sugerido').length
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
