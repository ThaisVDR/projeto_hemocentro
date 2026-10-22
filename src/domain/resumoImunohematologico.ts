// Resumo exibido em destaque na ficha do paciente, na ordem pedida pela equipe:
// raça/cor → grupo ABO/RhD → antígenos → anticorpos → exigências e compatibilidade.
// É derivado dos dados registrados e não deve ser gravado no banco.
import {
  antigenoDoAnticorpo,
  antigenosExigidosNegativos,
  Fenotipo,
  interpretarReacao,
  resumirFenotipo,
  SistemaResumido
} from './fenotipo'
import { CodigoRacaCor, formatarRacaCor } from './paciente'
import { doadoresCompativeis, formatarTipoSanguineo, lerTipoSanguineo } from './tipoSanguineo'

export interface DadosImunohematologicos {
  racaCor: CodigoRacaCor | null
  aboRh: string | null
  fenotipo: Fenotipo
  anticorpos: string[]
}

export interface ResumoImunohematologico {
  racaCor: string
  tipoSanguineo: string | null
  /** Texto original quando não foi possível interpretar o grupo ABO/RhD. */
  tipoNaoInterpretado: string | null
  sistemas: SistemaResumido[]
  anticorpos: string[]
  antigenosExigidosNegativos: string[]
  podeReceberDe: string[]
  /** Combinações incomuns que costumam indicar erro de transcrição. */
  alertas: string[]
}

export function lerCodigoRacaCor(valor?: string | null): CodigoRacaCor | null {
  const codigo = Number(valor)
  return codigo >= 1 && codigo <= 5 ? (codigo as CodigoRacaCor) : null
}

/**
 * Aloanticorpos se formam contra antígenos que a pessoa não tem. Anti-X com X positivo
 * no próprio fenótipo é incomum e costuma ser erro de leitura de uma das páginas.
 */
export function conferirAnticorposComFenotipo(anticorpos: string[], fenotipo: Fenotipo): string[] {
  return anticorpos
    .filter(anticorpo => {
      const antigeno = antigenoDoAnticorpo(anticorpo)
      return antigeno !== null && interpretarReacao(fenotipo[antigeno]) === 'positivo'
    })
    .map(anticorpo => {
      const antigeno = antigenoDoAnticorpo(anticorpo)
      return `${anticorpo} registrado, mas o antígeno ${antigeno} está positivo (${fenotipo[antigeno as string]}) ` +
        'na fenotipagem. Combinação incomum: confira a transcrição das duas páginas.'
    })
}

export function montarResumoImunohematologico(dados: DadosImunohematologicos): ResumoImunohematologico {
  const tipo = lerTipoSanguineo(dados.aboRh)
  const anticorpos = Array.from(new Set(dados.anticorpos))

  return {
    racaCor: formatarRacaCor(dados.racaCor),
    tipoSanguineo: tipo ? formatarTipoSanguineo(tipo) : null,
    tipoNaoInterpretado: tipo ? null : dados.aboRh,
    sistemas: resumirFenotipo(dados.fenotipo),
    anticorpos,
    antigenosExigidosNegativos: antigenosExigidosNegativos(anticorpos),
    podeReceberDe: tipo ? doadoresCompativeis(tipo).map(formatarTipoSanguineo) : [],
    alertas: conferirAnticorposComFenotipo(anticorpos, dados.fenotipo)
  }
}
