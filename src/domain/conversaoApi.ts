import { FichaDetalheApi } from '@/services/api'
import { extrairAnticorpos, Fenotipo } from './fenotipo'
import { RACA_COR } from './paciente'
import { lerCodigoRacaCor } from './resumoImunohematologico'
import { CampoRevisavel, criarFichaVazia, FichaEmRevisao, IdentificacaoRevisao } from './revisao'
import { formatarTipoSanguineo, lerTipoSanguineo } from './tipoSanguineo'

function sugerir(campo: CampoRevisavel, valor: string | number | null | undefined): void {
  if (valor === null || valor === undefined || String(valor).trim() === '') return
  campo.valor = String(valor)
  campo.estado = 'sugerido'
}

/** Aceita "1", "1 - Branco" ou "Branco" e devolve o código 1–5 como texto. */
function codigoRacaCor(texto: string | null): string | null {
  if (!texto) return null
  const codigo = lerCodigoRacaCor(texto.match(/[1-5]/)?.[0])
  if (codigo) return String(codigo)
  const porNome = Object.entries(RACA_COR).find(([, nome]) => texto.toLowerCase().includes(nome.toLowerCase()))
  return porNome ? porNome[0] : texto
}

function textoAboRh(texto: string | null): string | null {
  const tipo = lerTipoSanguineo(texto)
  return tipo ? formatarTipoSanguineo(tipo) : texto
}

function textoFatorRh(texto: string | null): string | null {
  if (!texto) return null
  if (/pos|\+/i.test(texto)) return 'Positivo'
  if (/neg|-/i.test(texto)) return 'Negativo'
  return texto
}

const CAMPOS_PACIENTE: Record<string, keyof IdentificacaoRevisao> = {
  nome: 'nome',
  dataNascimento: 'dataNascimento',
  prontuario: 'prontuario',
  racaCor: 'racaCor',
  aboRh: 'aboRh',
  diagnostico: 'diagnostico',
  nomeMae: 'nomeMae'
}

export function fichaDaExtracao(detalhe: FichaDetalheApi): FichaEmRevisao {
  const ficha = criarFichaVazia()
  ficha.status = detalhe.status
  const extracao = detalhe.extracao
  if (!extracao) return ficha

  const p = extracao.paciente
  const id = ficha.identificacao
  sugerir(id.nome, p.nome)
  sugerir(id.dataNascimento, p.dataNascimento)
  sugerir(id.prontuario, p.prontuario)
  sugerir(id.racaCor, codigoRacaCor(p.racaCor))
  sugerir(id.aboRh, textoAboRh(p.aboRh))
  sugerir(id.diagnostico, p.diagnostico)
  sugerir(id.nomeMae, p.nomeMae)

  if (extracao.transfusoes.length > 0) {
    ficha.transfusoes = extracao.transfusoes.map(t => ({
      dataEnvio: t.dataEnvio,
      tipoHemocomponente: t.tipoHemocomponente,
      numeroDoacao: t.numeroDoacao,
      grsRhd: t.grsRhd,
      volMl: t.volMl === null ? null : String(t.volMl),
      testesPai: t.testesPai,
      provaCruzada: t.provaCruzada,
      destino: [t.cidadeDestino, t.ufDestino].filter(Boolean).join(' / ') || null,
      responsavelLiberacao: t.responsavelLiberacao
    }))
    ficha.transfusoesConferencia.estado = 'sugerido'
  }

  // O backend ainda não separa DiaCell, DiaPanel e Pesquisa Imuno Hematológica:
  // os resultados vão para a página 4 e as páginas Bio-Rad ficam para preenchimento.
  const ih = ficha.imunohematologia
  const principal = extracao.pesquisas.find(x => x.gs || x.rh) ?? extracao.pesquisas[0]
  if (principal) {
    sugerir(ih.grupoSanguineo, principal.gs)
    sugerir(ih.fatorRh, textoFatorRh(principal.rh))
    sugerir(ih.tad, principal.tad)
    sugerir(ih.pai, principal.pai)
    sugerir(ih.autocontrole, principal.autocontrole)
    sugerir(ih.dataExame, principal.data)
    sugerir(ih.responsavelTecnico, principal.responsavel)
  }
  ih.anticorpos = extracao.pesquisas.flatMap(x =>
    extrairAnticorpos(x.interpretacao).map(especificidade => ({
      data: x.data, metodo: null, especificidade, classe: null
    }))
  )
  if (ih.anticorpos.length > 0) ih.anticorposConferencia.estado = 'sugerido'

  for (const incerto of detalhe.camposIncertos) {
    const chave = CAMPOS_PACIENTE[incerto.campo.replace(/^paciente\./, '')]
    if (chave) {
      id[chave].estado = 'incerto'
      id[chave].nota = incerto.motivo
    }
  }

  return ficha
}

function valor(campo: CampoRevisavel): string | null {
  return campo.valor
}

/** Dados conferidos enviados ao aprovar. Mantém os nomes de FichaExtraida e acrescenta os campos novos. */
export function fichaParaEnvio(ficha: FichaEmRevisao) {
  const id = ficha.identificacao
  const ih = ficha.imunohematologia
  const prontuario = Number(id.prontuario.valor)

  return {
    paciente: {
      nome: valor(id.nome),
      dataNascimento: valor(id.dataNascimento),
      prontuario: id.prontuario.valor && Number.isInteger(prontuario) ? prontuario : null,
      racaCor: lerCodigoRacaCor(id.racaCor.valor),
      aboRh: valor(id.aboRh),
      dFraco: valor(ih.dFraco),
      sexo: valor(id.sexo),
      cartaoSus: valor(id.cartaoSus),
      municipio: valor(id.municipio),
      diagnostico: valor(id.diagnostico),
      nomeMae: valor(id.nomeMae)
    },
    transfusoes: ficha.transfusoes
      .filter(t => Object.values(t).some(v => v !== null && v !== ''))
      .map(t => {
        const [cidadeDestino, ufDestino] = (t.destino ?? '').split('/').map(s => s.trim())
        return {
          dataEnvio: t.dataEnvio || null,
          tipoHemocomponente: t.tipoHemocomponente,
          numeroDoacao: t.numeroDoacao,
          grsRhd: t.grsRhd,
          volMl: t.volMl ? Number(t.volMl) : null,
          testesPai: t.testesPai,
          provaCruzada: t.provaCruzada,
          cidadeDestino: cidadeDestino || null,
          ufDestino: ufDestino || null,
          responsavelLiberacao: t.responsavelLiberacao
        }
      }),
    pesquisas: ficha.pesquisas.map(x => ({
      documento: x.documento,
      data: valor(x.data),
      loteKit: valor(x.loteKit),
      grupoAntigenos: valor(x.grupoAntigenos),
      interpretacao: valor(x.interpretacao),
      reacoes: x.reacoes
    })),
    imunohematologia: {
      grupoSanguineo: valor(ih.grupoSanguineo),
      fatorRh: valor(ih.fatorRh),
      pai: valor(ih.pai),
      autocontrole: valor(ih.autocontrole),
      tad: valor(ih.tad),
      dcScreening: valor(ih.dcScreening),
      observacao: valor(ih.observacao),
      solicitante: valor(ih.solicitante),
      amostra: valor(ih.amostra),
      metodologia: valor(ih.metodologia),
      dataExame: valor(ih.dataExame),
      responsavelTecnico: valor(ih.responsavelTecnico),
      fenotipo: ih.fenotipo as Fenotipo,
      anticorpos: ih.anticorpos
        .filter(a => a.especificidade)
        .map(a => ({ ...a, data: a.data || null }))
    }
  }
}

export type FichaParaEnvio = ReturnType<typeof fichaParaEnvio>
