// Tradução dos valores que o backend envia (enums do Prisma) para o texto mostrado na tela.
// Ex.: O_POSITIVO → "O+", BRANCO → "Branca", F → "Feminino".
// Usado pela Revisão da ficha e pelo Prontuário, para os dois mostrarem sempre o mesmo texto.
// Se o backend ganhar um valor novo no enum, basta acrescentar uma linha no mapa certo.

export const ROTULO_RACA = {
  BRANCO: 'Branca',
  PRETO: 'Preta',
  PARDO: 'Parda',
  AMARELO: 'Amarela',
  INDIGENA: 'Indígena'
} as const

export const ROTULO_SEXO = {
  F: 'Feminino',
  M: 'Masculino'
} as const

export const ROTULO_ABO_RH = {
  A_POSITIVO: 'A+',
  A_NEGATIVO: 'A-',
  B_POSITIVO: 'B+',
  B_NEGATIVO: 'B-',
  AB_POSITIVO: 'AB+',
  AB_NEGATIVO: 'AB-',
  O_POSITIVO: 'O+',
  O_NEGATIVO: 'O-'
} as const

export type RacaApi = keyof typeof ROTULO_RACA
export type SexoApi = keyof typeof ROTULO_SEXO
export type AboRhApi = keyof typeof ROTULO_ABO_RH

export interface Opcao {
  valor: string
  rotulo: string
}


function traduzir(mapa: Record<string, string>, valor: string | null | undefined, vazio: string): string {
  if (!valor) return vazio
  return Object.prototype.hasOwnProperty.call(mapa, valor) ? mapa[valor] : valor
}

export function traduzirRaca(valor?: string | null): string {
  return traduzir(ROTULO_RACA, valor, 'Não informada')
}

export function traduzirSexo(valor?: string | null): string {
  return traduzir(ROTULO_SEXO, valor, 'Não informado')
}

export function traduzirAboRh(valor?: string | null): string {
  return traduzir(ROTULO_ABO_RH, valor, 'Não informado')
}

function paraOpcoes(mapa: Record<string, string>): Opcao[] {
  return Object.keys(mapa).map(chave => ({ valor: chave, rotulo: mapa[chave] }))
}

export const OPCOES_RACA: Opcao[] = paraOpcoes(ROTULO_RACA)
export const OPCOES_SEXO: Opcao[] = paraOpcoes(ROTULO_SEXO)
export const OPCOES_ABO_RH: Opcao[] = paraOpcoes(ROTULO_ABO_RH)

const ORDEM_RACA: RacaApi[] = ['BRANCO', 'PRETO', 'PARDO', 'AMARELO', 'INDIGENA']

export function normalizarRaca(valor?: string | null): RacaApi | null {
  if (!valor) return null
  const texto = valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
  const codigo = texto.match(/^([1-5])(\D|$)/)
  if (codigo) return ORDEM_RACA[Number(codigo[1]) - 1]
  return ORDEM_RACA.find(chave => texto.startsWith(chave.slice(0, -1))) ?? null
}

export function normalizarAboRh(valor?: string | null): AboRhApi | null {
  if (!valor) return null
  const texto = valor.toUpperCase().replace(/[\s_]+/g, '')
  const achou = texto.match(/^(AB|A|B|O)(\+|-|POS(ITIVO)?|NEG(ATIVO)?)$/)
  if (!achou) return null
  const rh = achou[2].startsWith('+') || achou[2].startsWith('POS') ? 'POSITIVO' : 'NEGATIVO'
  return `${achou[1]}_${rh}` as AboRhApi
}