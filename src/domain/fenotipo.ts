// Fenotipagem eritrocitária: leitura das reações e exigência de antígeno negativo.
// Ausência de informação (nt, NR ou vazio) nunca é tratada como negativo.

export type Reacao = '0' | 'w' | '1+' | '2+' | '3+' | '4+' | 'nt' | 'NR'
export type StatusAntigeno = 'positivo' | 'negativo' | 'desconhecido'

export interface SistemaSanguineo {
  nome: string
  antigenos: string[]
}

// Ordem de exibição dos sistemas, seguindo as fichas ID-DiaCell / ID-DiaPanel.
export const SISTEMAS_SANGUINEOS: SistemaSanguineo[] = [
  { nome: 'Rh', antigenos: ['D', 'C', 'E', 'c', 'e', 'Cw'] },
  { nome: 'Kell', antigenos: ['K', 'k', 'Kpa', 'Kpb', 'Jsa', 'Jsb'] },
  { nome: 'Duffy', antigenos: ['Fya', 'Fyb'] },
  { nome: 'Kidd', antigenos: ['Jka', 'Jkb'] },
  { nome: 'Lewis', antigenos: ['Lea', 'Leb'] },
  { nome: 'P', antigenos: ['P1'] },
  { nome: 'MNS', antigenos: ['M', 'N', 'S', 's'] },
  { nome: 'Lutheran', antigenos: ['Lua', 'Lub'] },
  { nome: 'Diego', antigenos: ['Dia'] }
]

/** Colunas da fenotipagem eritrocitária na ficha "Pesquisa Imuno Hematológica", na ordem do papel. */
export const ANTIGENOS_FICHA_FENOTIPAGEM = [
  'C', 'c', 'E', 'e', 'K', 'k', 'Kpa', 'Kpb', 'Jka', 'Jkb', 'M',
  'N', 'S', 's', 'Fya', 'Fyb', 'P1', 'Lea', 'Leb', 'Lua', 'Lub'
]

export const REACOES: Reacao[] = ['0', 'w', '1+', '2+', '3+', '4+', 'nt', 'NR']

/** Reação registrada por antígeno. Antígeno ausente = não informado. */
export type Fenotipo = Partial<Record<string, Reacao | null>>

export function interpretarReacao(reacao?: Reacao | null): StatusAntigeno {
  if (reacao === '0') return 'negativo'
  if (reacao === 'w' || reacao === '1+' || reacao === '2+' || reacao === '3+' || reacao === '4+') {
    return 'positivo'
  }
  return 'desconhecido'
}

export interface AntigenoResumido {
  antigeno: string
  reacao: Reacao | null
  status: StatusAntigeno
}

export interface SistemaResumido {
  sistema: string
  antigenos: AntigenoResumido[]
}

/** Agrupa o fenótipo por sistema, mantendo só os sistemas com algum registro. */
export function resumirFenotipo(fenotipo: Fenotipo): SistemaResumido[] {
  return SISTEMAS_SANGUINEOS
    .map(sistema => ({
      sistema: sistema.nome,
      antigenos: sistema.antigenos
        .filter(antigeno => antigeno in fenotipo)
        .map(antigeno => {
          const reacao = fenotipo[antigeno] ?? null
          return { antigeno, reacao, status: interpretarReacao(reacao) }
        })
    }))
    .filter(sistema => sistema.antigenos.length > 0)
}

/** Ex.: "D 4+, C 4+, E 0, c 0, e 4+, Cw nt" */
export function formatarFenotipo(fenotipo: Fenotipo, sistemas?: string[]): string {
  return resumirFenotipo(fenotipo)
    .filter(s => !sistemas || sistemas.includes(s.sistema))
    .flatMap(s => s.antigenos.map(a => `${a.antigeno} ${a.reacao ?? '—'}`))
    .join(', ')
}

/** "Anti-c" → "c". Mantém maiúsculas/minúsculas: c e C são antígenos diferentes. */
export function antigenoDoAnticorpo(anticorpo: string): string | null {
  const encontrado = anticorpo.trim().match(/^anti-?\s*(\S+)$/i)
  return encontrado ? encontrado[1] : null
}

/** Encontra anticorpos citados em texto livre. "Anti-c • histórico simulado" → ["Anti-c"]. */
export function extrairAnticorpos(texto?: string | null): string[] {
  if (!texto) return []
  const encontrados = texto.match(/\banti-\s?[A-Za-z0-9]+/gi) ?? []
  return encontrados.map(a => 'Anti-' + a.replace(/^anti-\s?/i, ''))
}

/** Antígenos que o sangue recebido precisa ter negativos, a partir dos anticorpos identificados. */
export function antigenosExigidosNegativos(anticorpos: string[]): string[] {
  const antigenos = anticorpos
    .map(antigenoDoAnticorpo)
    .filter((antigeno): antigeno is string => antigeno !== null)
  return Array.from(new Set(antigenos))
}

export type ResultadoAvaliacao = 'compativel' | 'incompativel' | 'nao_confirmado'

export interface AvaliacaoAntigenos {
  resultado: ResultadoAvaliacao
  /** Antígenos exigidos negativos que o doador tem positivos. */
  conflitos: string[]
  /** Antígenos exigidos negativos sem informação no doador. */
  naoConfirmados: string[]
}

/** Confere se o fenótipo do doador respeita os antígenos exigidos negativos do paciente. */
export function avaliarFenotipoDoador(anticorpos: string[], fenotipoDoador: Fenotipo): AvaliacaoAntigenos {
  const conflitos: string[] = []
  const naoConfirmados: string[] = []

  for (const antigeno of antigenosExigidosNegativos(anticorpos)) {
    const status = interpretarReacao(fenotipoDoador[antigeno])
    if (status === 'positivo') conflitos.push(antigeno)
    else if (status === 'desconhecido') naoConfirmados.push(antigeno)
  }

  const resultado: ResultadoAvaliacao = conflitos.length > 0
    ? 'incompativel'
    : naoConfirmados.length > 0 ? 'nao_confirmado' : 'compativel'

  return { resultado, conflitos, naoConfirmados }
}
