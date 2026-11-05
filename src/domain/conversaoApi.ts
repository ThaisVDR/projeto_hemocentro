import { AlteracaoApi, FichaDetalheApi, KitExtraidoApi } from '@/services/api'
import { normalizarAboRh, normalizarRaca, traduzirAboRh } from './traducao'
import { ANTIGENOS_FICHA_FENOTIPAGEM, extrairAnticorpos, Fenotipo, Reacao, REACOES } from './fenotipo'
import { lerCodigoRacaCor } from './resumoImunohematologico'
import {
  CampoRevisavel, criarFichaVazia, FichaEmRevisao, IdentificacaoRevisao, ImunohematologiaRevisao, lerResultadoTeste,
  PesquisaBioRadRevisao, TransfusaoRevisao
} from './revisao'

function sugerir(campo: CampoRevisavel, valor: string | number | null | undefined): void {
  if (valor === null || valor === undefined || String(valor).trim() === '') return
  campo.valor = String(valor)
  campo.estado = 'sugerido'
}

function textoFatorRh(texto: string | null): string | null {
  if (!texto) return null
  if (/pos|\+/i.test(texto)) return 'Positivo'
  if (/neg|-/i.test(texto)) return 'Negativo'
  return texto
}

// Sugere um resultado de teste; se a IA leu algo que não é Positivo/Negativo/NR, marca como incerto.
function sugerirTeste(campo: CampoRevisavel, texto: string | null): void {
  const resultado = lerResultadoTeste(texto)
  if (resultado) {
    sugerir(campo, resultado)
  } else if (texto) {
    campo.estado = 'incerto'
    campo.nota = `Leitura da IA não reconhecida: "${texto}"`
  }
}

// A IA e o backend chamam o antígeno K de "Kell"; a grade da tela usa "K", como no papel.
const ANTIGENO_NO_BACKEND: Record<string, string> = { K: 'Kell' }

function antigenoNaTela(nomeNoBackend: string): string {
  return Object.keys(ANTIGENO_NO_BACKEND).find(nome => ANTIGENO_NO_BACKEND[nome] === nomeNoBackend) ?? nomeNoBackend
}

// Páginas 2 e 3 da tela ↔ folhas Bio-Rad do backend (kits).
type TipoKit = 'DIACELL' | 'DIAPANEL'
const TIPO_DO_KIT: Record<string, TipoKit> = { 'ID-DiaCell I, II': 'DIACELL', 'ID-DiaPanel': 'DIAPANEL' }

// Célula da tela → número no backend: o DiaCell usa algarismos romanos (I e II).
function numeroDaCelula(celula: string): number {
  if (celula === 'I') return 1
  if (celula === 'II') return 2
  return Number(celula)
}

function reacaoValida(valor: string | null): Reacao | null {
  return valor && (REACOES as string[]).includes(valor) ? valor as Reacao : null
}

function preencherKit(pesquisa: PesquisaBioRadRevisao, kit: KitExtraidoApi): void {
  sugerir(pesquisa.data, kit.dataPesquisa)
  sugerir(pesquisa.interpretacao, kit.interpretacao)
  for (const reacao of pesquisa.reacoes) {
    if (reacao.celula === 'Autocontrole') {
      reacao.coombs = reacaoValida(kit.autocontroleLissCoombs)
      reacao.enzima = reacaoValida(kit.autocontroleEnzima)
      reacao.frio = reacaoValida(kit.autocontroleFrio)
      continue
    }
    const lida = kit.resultados.find(r => r.celula === numeroDaCelula(reacao.celula))
    reacao.coombs = reacaoValida(lida?.lissCoombs ?? null)
    reacao.enzima = reacaoValida(lida?.enzima ?? null)
    reacao.frio = reacaoValida(lida?.frio ?? null)
  }
  if (pesquisa.reacoes.some(r => r.coombs || r.enzima || r.frio)) pesquisa.reacoesConferencia.estado = 'sugerido'
}

// Qual pesquisa do backend aparece na página 4 da revisão: a primeira com grupo ou Rh.
export function indicePesquisaPrincipal(detalhe: FichaDetalheApi): number | null {
  const pesquisas = detalhe.dados?.pesquisas ?? []
  if (pesquisas.length === 0) return null
  const comGrupo = pesquisas.findIndex(x => x.gs || x.rh)
  return comGrupo >= 0 ? comGrupo : 0
}

export function fichaDaExtracao(detalhe: FichaDetalheApi): FichaEmRevisao {
  const ficha = criarFichaVazia()
  ficha.status = detalhe.status
  const extracao = detalhe.dados
  if (!extracao) return ficha

  const p = extracao.paciente
  const id = ficha.identificacao
  sugerir(id.nome, p.nome)
  sugerir(id.dataNascimento, p.dataNascimento)
  sugerir(id.prontuario, p.prontuario)
  sugerir(id.racaCor, normalizarRaca(p.raca) ?? p.raca)
  sugerir(id.aboRh, normalizarAboRh(p.aboRh) ?? p.aboRh)
  sugerir(id.diagnostico, p.diagnostico)
  sugerir(id.nomeMae, p.nomeMae)
  sugerir(id.sexo, p.sexo)
  sugerir(id.cartaoSus, p.cartaoSus)
  sugerir(id.municipio, [p.municipio, p.ufMunicipio].filter(Boolean).join(' / '))

  if (extracao.transfusoes.length > 0) {
    ficha.transfusoes = extracao.transfusoes.map(t => ({
      dataEnvio: t.dataEnvio,
      tipoHemocomponente: t.tipoHemocomponente,
      numeroDoacao: t.numeroDoacao,
      grsRhd: t.grsRhd ? traduzirAboRh(t.grsRhd) : null,
      volMl: t.volMl === null ? null : String(t.volMl),
      testesPai: t.testesPai,
      provaCruzada: t.provaCruzada,
      destino: [t.cidadeDestino, t.ufDestino].filter(Boolean).join(' / ') || null,
      responsavelLiberacao: t.responsavelLiberacao
    }))
    ficha.transfusoesConferencia.estado = 'sugerido'
  }

  const ih = ficha.imunohematologia
  const indice = indicePesquisaPrincipal(detalhe)
  const principal = indice === null ? undefined : extracao.pesquisas[indice]
  if (principal) {
    sugerir(ih.grupoSanguineo, principal.gs)
    sugerir(ih.fatorRh, textoFatorRh(principal.rh))
    sugerirTeste(ih.tad, principal.tad)
    sugerirTeste(ih.pai, principal.pai)
    sugerirTeste(ih.autocontrole, principal.autocontrole)
    sugerir(ih.dataExame, principal.dataPesquisa)
    sugerir(ih.responsavelTecnico, principal.responsavel)
    sugerir(ih.dFraco, principal.dFraco)
    sugerirTeste(ih.dcScreening, principal.dcScreening)
    sugerir(ih.amostra, principal.amostra)
    sugerir(ih.metodologia, principal.metodologia)
    sugerir(ih.observacao, principal.observacao)
  }
    // Fenotipagem lida pela IA → grade da tela. Resultado fora da lista (0, w, 1+ a 4+, nt, NR) fica de fora.
  for (const { antigeno, resultado } of principal?.fenotipagem ?? []) {
    if ((REACOES as string[]).includes(resultado)) ih.fenotipo[antigenoNaTela(antigeno)] = resultado as Reacao
  }
  if (Object.keys(ih.fenotipo).length > 0) ih.fenotipoConferencia.estado = 'sugerido'

  // Páginas 2 e 3: cada folha Bio-Rad lida pela IA preenche a seção do mesmo tipo.
  for (const pesquisa of ficha.pesquisas) {
    const kit = (extracao.kits ?? []).find(k => k.tipo === TIPO_DO_KIT[pesquisa.documento])
    if (kit) preencherKit(pesquisa, kit)
  }


  // Anticorpos: uma linha por anticorpo, com data e classe (pesquisa da página 4).
  // Fichas antigas sem a lista: monta a partir do texto da especificidade ("Anti-E, Anti-c").
  ih.anticorpos = !principal
    ? []
    : principal.anticorpos?.length
      ? principal.anticorpos.map(a => ({ data: a.data, especificidade: a.especificidade, classe: a.classe }))
      : extrairAnticorpos(principal.especificidade || principal.interpretacao).map(especificidade => ({
        data: null, especificidade, classe: null
      }))
  if (ih.anticorpos.length > 0) ih.anticorposConferencia.estado = 'sugerido'
  return ficha
}

// Campo da tela → caminho do dado no backend (FichaExtraida).
const CAMINHOS_PACIENTE: Record<keyof IdentificacaoRevisao, string> = {
  nome: 'paciente.nome',
  prontuario: 'paciente.prontuario',
  dataNascimento: 'paciente.dataNascimento',
  sexo: 'paciente.sexo',
  nomeMae: 'paciente.nomeMae',
  racaCor: 'paciente.raca',
  aboRh: 'paciente.aboRh',
  municipio: 'paciente.municipio',
  diagnostico: 'paciente.diagnostico',
  cartaoSus: 'paciente.cartaoSus'
}

// Só os campos da identificação que mudaram desde a última vez que a ficha veio do backend.
export function alteracoesDaIdentificacao(antes: FichaEmRevisao, agora: FichaEmRevisao): AlteracaoApi[] {
  const campos = Object.keys(CAMINHOS_PACIENTE) as (keyof IdentificacaoRevisao)[]
   return campos
    .filter(campo => agora.identificacao[campo].valor !== antes.identificacao[campo].valor)
    .flatMap(campo => {
      const texto = agora.identificacao[campo].valor?.trim() || null
      if (campo === 'municipio') {
        // "Cuiabá / MT" → município e UF separados, como o backend guarda.
        const [cidade, uf] = (texto ?? '').split('/').map(parte => parte.trim())
        return [
          { campo: 'paciente.municipio', valor: cidade || null },
          { campo: 'paciente.ufMunicipio', valor: uf || null }
        ]
      }
      return [{
        campo: CAMINHOS_PACIENTE[campo],
        valor: campo === 'prontuario' && texto ? Number(texto) : texto
      }]
    })
}

// Uma linha da tabela de envios no formato do backend (TransfusaoExtraida).
function transfusaoParaApi(t: TransfusaoRevisao) {
  const [cidade, uf] = (t.destino ?? '').split('/').map(parte => parte.trim())
  return {
    dataEnvio: t.dataEnvio || null,
    tipoHemocomponente: t.tipoHemocomponente || null,
    numeroDoacao: t.numeroDoacao || null,
    grsRhd: normalizarAboRh(t.grsRhd) ?? (t.grsRhd || null),
    volMl: t.volMl ? Number(t.volMl) : null,
    testesPai: t.testesPai || null,
    provaCruzada: t.provaCruzada || null,
    cidadeDestino: cidade || null,
    ufDestino: uf || null,
    responsavelLiberacao: t.responsavelLiberacao || null
  }
}

function linhaPreenchida(t: TransfusaoRevisao): boolean {
  return Object.values(t).some(valor => valor !== null && valor !== '')
}

// Compara as linhas uma a uma: campo corrigido, linha nova no fim ou linha removida.
export function alteracoesDasTransfusoes(antes: TransfusaoRevisao[], agora: TransfusaoRevisao[]): AlteracaoApi[] {
  const linhasAntes = antes.filter(linhaPreenchida)
  const linhasAgora = agora.filter(linhaPreenchida)
  const alteracoes: AlteracaoApi[] = []

  linhasAgora.forEach((linha, i) => {
    const nova = transfusaoParaApi(linha)
    if (i >= linhasAntes.length) {
      alteracoes.push({ campo: `transfusoes[${i}]`, valor: { ...nova, numeroServico: null, tracejador: null, pagina: 1 } })
      return
    }
    const velha = transfusaoParaApi(linhasAntes[i])
    for (const chave of Object.keys(nova) as (keyof typeof nova)[]) {
      if (nova[chave] !== velha[chave]) {
        alteracoes.push({ campo: `transfusoes[${i}].${chave}`, valor: nova[chave] })
      }
    }
  })

  for (let i = linhasAntes.length - 1; i >= linhasAgora.length; i--) {
    alteracoes.push({ campo: `transfusoes[${i}]`, valor: null })
  }
  return alteracoes
}

type CampoPesquisa = keyof Pick<ImunohematologiaRevisao,
  'grupoSanguineo' | 'fatorRh' | 'dFraco' | 'pai' | 'tad' | 'autocontrole' | 'dcScreening' |
  'observacao' | 'amostra' | 'metodologia' | 'dataExame' | 'responsavelTecnico'>

// Campo da página 4 na tela → campo da pesquisa no backend (PesquisaExtraida).
const CAMPOS_PESQUISA: Record<CampoPesquisa, string> = {
  grupoSanguineo: 'gs',
  fatorRh: 'rh',
  dFraco: 'dFraco',
  pai: 'pai',
  tad: 'tad',
  autocontrole: 'autocontrole',
  dcScreening: 'dcScreening',
  observacao: 'observacao',
  amostra: 'amostra',
  metodologia: 'metodologia',
  dataExame: 'dataPesquisa',
  responsavelTecnico: 'responsavel'
}

function valorDaPesquisa(ficha: FichaEmRevisao, campo: CampoPesquisa): string | null {
  const texto = ficha.imunohematologia[campo].valor?.trim() || null
  return campo === 'fatorRh' && texto ? texto.toUpperCase() : texto
}

// Grade da tela → lista do backend, só com os antígenos preenchidos, na ordem da ficha.
function fenotipagemParaApi(ficha: FichaEmRevisao) {
  const fenotipo = ficha.imunohematologia.fenotipo
  return ANTIGENOS_FICHA_FENOTIPAGEM
    .filter(antigeno => fenotipo[antigeno])
    .map(antigeno => ({ antigeno: ANTIGENO_NO_BACKEND[antigeno] ?? antigeno, resultado: fenotipo[antigeno] as string }))
}

// Tabela de anticorpos da tela → lista do backend (só as linhas com especificidade).
function anticorposParaApi(ficha: FichaEmRevisao) {
  return ficha.imunohematologia.anticorpos
    .filter(anticorpo => anticorpo.especificidade?.trim())
    .map(anticorpo => ({
      especificidade: (anticorpo.especificidade as string).trim(),
      data: anticorpo.data || null,
      classe: anticorpo.classe || null
    }))
}

export function alteracoesDaImunohematologia(
  antes: FichaEmRevisao, agora: FichaEmRevisao, indice: number | null
): AlteracaoApi[] {
  const campos = Object.keys(CAMPOS_PESQUISA) as CampoPesquisa[]
  const mudaram = campos.filter(campo => valorDaPesquisa(agora, campo) !== valorDaPesquisa(antes, campo))

  const fenotipagem = fenotipagemParaApi(agora)
  const mudouFenotipagem = JSON.stringify(fenotipagem) !== JSON.stringify(fenotipagemParaApi(antes))
  const anticorpos = anticorposParaApi(agora)
  const mudouAnticorpos = JSON.stringify(anticorpos) !== JSON.stringify(anticorposParaApi(antes))

  if (mudaram.length === 0 && !mudouFenotipagem && !mudouAnticorpos) return []

  if (indice === null) {
    const nova: Record<string, unknown> = { anticorpos, interpretacao: null, fenotipagem, pagina: 4 }
    campos.forEach(campo => { nova[CAMPOS_PESQUISA[campo]] = valorDaPesquisa(agora, campo) })
    return [{ campo: 'pesquisas[0]', valor: nova }]
  }

  const alteracoes: AlteracaoApi[] = mudaram.map(campo => ({
    campo: `pesquisas[${indice}].${CAMPOS_PESQUISA[campo]}`,
    valor: valorDaPesquisa(agora, campo)
  }))
  if (mudouFenotipagem) alteracoes.push({ campo: `pesquisas[${indice}].fenotipagem`, valor: fenotipagem })
  if (mudouAnticorpos) alteracoes.push({ campo: `pesquisas[${indice}].anticorpos`, valor: anticorpos })
  return alteracoes
}

// Seção Bio-Rad da tela → campos do kit no backend (só os que a tela edita).
function kitParaApi(pesquisa: PesquisaBioRadRevisao) {
  const autocontrole = pesquisa.reacoes.find(r => r.celula === 'Autocontrole')
  return {
    dataPesquisa: pesquisa.data.valor || null,
    interpretacao: pesquisa.interpretacao.valor?.trim() || null,
    autocontroleLissCoombs: autocontrole?.coombs ?? null,
    autocontroleEnzima: autocontrole?.enzima ?? null,
    autocontroleFrio: autocontrole?.frio ?? null,
    resultados: pesquisa.reacoes
      .filter(r => r.celula !== 'Autocontrole' && (r.coombs || r.enzima || r.frio))
      .map(r => ({ celula: numeroDaCelula(r.celula), lissCoombs: r.coombs, enzima: r.enzima, frio: r.frio }))
  }
}

// Tipo de cada kit no backend, na ordem da lista (para saber a posição de cada um).
export function tiposDosKits(detalhe: FichaDetalheApi): (string | null)[] {
  return (detalhe.dados?.kits ?? []).map(kit => kit.tipo)
}

// Páginas 2 e 3 que mudaram. Kit que já existe: só os campos alterados; kit novo: a folha inteira no fim da lista.
export function alteracoesDosKits(
  antes: FichaEmRevisao, agora: FichaEmRevisao, tiposNoBackend: (string | null)[]
): AlteracaoApi[] {
  const alteracoes: AlteracaoApi[] = []
  let proximaPosicao = tiposNoBackend.length

  agora.pesquisas.forEach((pesquisa, i) => {
    const tipo = TIPO_DO_KIT[pesquisa.documento]
    const novo = kitParaApi(pesquisa)
    const velho = kitParaApi(antes.pesquisas[i])
    if (!tipo || JSON.stringify(novo) === JSON.stringify(velho)) return

    const posicao = tiposNoBackend.indexOf(tipo)
    if (posicao < 0) {
      alteracoes.push({
        campo: `kits[${proximaPosicao}]`,
        valor: { tipo, gs: null, rh: null, tad: null, pai: null, tecnica: null, observacao: null, ...novo, pagina: pesquisa.pagina }
      })
      proximaPosicao++
      return
    }
    for (const chave of Object.keys(novo) as (keyof typeof novo)[]) {
      if (JSON.stringify(novo[chave]) !== JSON.stringify(velho[chave])) {
        alteracoes.push({ campo: `kits[${posicao}].${chave}`, valor: novo[chave] })
      }
    }
  })
  return alteracoes
}

function valor(campo: CampoRevisavel): string | null {
  return campo.valor
}

// Dados conferidos enviados ao aprovar. Mantém os nomes de FichaExtraida e acrescenta os campos novos.
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
