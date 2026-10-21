// Modelo do paciente usado pelas telas. Os nomes seguem o backend (Backend-Hemocentro,
// model Paciente) e incluem campos das fichas em papel que o backend ainda não grava:
// sexo, cpf, cartaoSus, municipio, dFraco, fenotipo e anticorposIrregulares.
import { Fenotipo } from './fenotipo'
import { TipoSanguineo } from './tipoSanguineo'

export const RACA_COR = {
  1: 'Branco',
  2: 'Preto',
  3: 'Pardo',
  4: 'Amarelo',
  5: 'Indígena'
} as const

export type CodigoRacaCor = keyof typeof RACA_COR

export function formatarRacaCor(codigo?: CodigoRacaCor | null): string {
  return codigo ? `${codigo} — ${RACA_COR[codigo]}` : 'Não informado'
}

export type Sexo = 'F' | 'M'
export type Classificacao = 'ambulatorio' | 'investigacao' | 'a_confirmar'

export interface Paciente {
  id: string
  prontuario: string
  nome: string
  dataNascimento: string | null
  nomeMae: string | null
  sexo: Sexo | null
  racaCor: CodigoRacaCor | null
  cpf: string | null
  cartaoSus: string | null
  municipio: string | null
  diagnostico: string | null
  classificacao: Classificacao
  tipoSanguineo: TipoSanguineo | null
  dFraco: string | null
  fenotipo: Fenotipo
  anticorposIrregulares: string[]
}
