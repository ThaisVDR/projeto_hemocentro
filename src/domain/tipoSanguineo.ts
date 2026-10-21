// Compatibilidade ABO/RhD para transfusão de concentrado de hemácias.
// Regra: o receptor pode receber do doador quando
//   (a) todo antígeno A/B do doador também existe no receptor, e
//   (b) o doador é RhD negativo ou o receptor é RhD positivo.
// Referência para conferência — as regras devem ser validadas pela equipe técnica.

export type GrupoABO = 'A' | 'B' | 'AB' | 'O'
export type FatorRh = '+' | '-'

export interface TipoSanguineo {
  abo: GrupoABO
  rh: FatorRh
}

const ANTIGENOS_ABO: Record<GrupoABO, string[]> = {
  O: [],
  A: ['A'],
  B: ['B'],
  AB: ['A', 'B']
}

export const TIPOS_SANGUINEOS: TipoSanguineo[] = (['A', 'B', 'AB', 'O'] as GrupoABO[])
  .flatMap(abo => (['+', '-'] as FatorRh[]).map(rh => ({ abo, rh })))

export function formatarTipoSanguineo(tipo: TipoSanguineo): string {
  return `${tipo.abo}${tipo.rh}`
}

/**
 * Lê o texto livre gravado pelo backend (campo `aboRh`, ex.: "O+", "AB NEG", "A positivo").
 * Retorna null quando não dá para identificar com segurança.
 */
export function lerTipoSanguineo(texto?: string | null): TipoSanguineo | null {
  if (!texto) return null
  const normalizado = texto.toUpperCase().replace(/\s+/g, '')
  const encontrado = normalizado.match(/^(AB|A|B|O)(\+|-|POS(ITIVO)?|NEG(ATIVO)?)$/)
  if (!encontrado) return null
  const rh: FatorRh = encontrado[2].startsWith('+') || encontrado[2].startsWith('POS') ? '+' : '-'
  return { abo: encontrado[1] as GrupoABO, rh }
}

export function podeReceberHemacias(receptor: TipoSanguineo, doador: TipoSanguineo): boolean {
  const aboCompativel = ANTIGENOS_ABO[doador.abo].every(antigeno =>
    ANTIGENOS_ABO[receptor.abo].includes(antigeno)
  )
  const rhCompativel = doador.rh === '-' || receptor.rh === '+'
  return aboCompativel && rhCompativel
}

/** Tipos dos quais o receptor pode receber hemácias. */
export function doadoresCompativeis(receptor: TipoSanguineo): TipoSanguineo[] {
  return TIPOS_SANGUINEOS.filter(doador => podeReceberHemacias(receptor, doador))
}

/** Tipos para os quais o doador pode doar hemácias. */
export function receptoresCompativeis(doador: TipoSanguineo): TipoSanguineo[] {
  return TIPOS_SANGUINEOS.filter(receptor => podeReceberHemacias(receptor, doador))
}
