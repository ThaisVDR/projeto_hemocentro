<template>
  <section class="revisao">
    <p class="revisao__trilha">
      <router-link :to="{ name: 'fila' }">Fila de revisão</router-link> / {{ arquivo ? arquivo.nome : 'Nova ficha' }}
    </p>
    <PageHeader :titulo="titulo" :subtitulo="subtitulo">
      <span class="selo" :class="statusFicha.classe">{{ statusFicha.rotulo }}</span>
      <router-link :to="{ name: 'fila' }" class="botao">
        <ArrowLeft :size="16" /> Voltar à fila
      </router-link>
    </PageHeader>

    <div class="cartao progresso">
      <ClipboardCheck :size="18" class="progresso__icone" />
      <strong>{{ finalizada ? statusFicha.rotulo : 'Conferência documental em andamento' }}</strong>
      <div class="progresso__barra"><span :style="{ width: `${percentual}%` }" /></div>
      <span class="progresso__numeros">{{ conferencia.resolvidos }} de {{ conferencia.total }} itens conferidos</span>
      <span v-if="conferencia.incertos.length" class="selo selo--alerta">
        {{conferencia.incertos.map(i => i.rotulo).join(' e ')}} a confirmar
      </span>
      <span class="progresso__dica">Todos os campos podem ser editados.</span>
    </div>

    <p v-if="carregando" class="mensagem mensagem--info">Carregando ficha…</p>
    <p v-if="mensagem" class="mensagem" :class="`mensagem--${mensagem.tipo}`">{{ mensagem.texto }}</p>

    <div v-if="!carregando && fichaId && !finalizada" class="cartao revisor">
      <template v-if="ficha.status === 'AGUARDANDO_REVISAO' || ficha.status === 'COM_PENDENCIA'">
        <span>Ninguém está revisando esta ficha.</span>
        <button type="button" class="botao botao--primario" :disabled="salvando" @click="comecarRevisao">
          <UserCheck :size="14" /> Iniciar revisão
        </button>
      </template>
      <span v-else-if="revisaoEhMinha">Você está revisando esta ficha.</span>
      <template v-else-if="revisor">
        <span><strong>{{ revisor.nome }}</strong> está revisando esta ficha.</span>
        <button type="button" class="botao" :disabled="salvando" @click="tomarRevisao">
          <Users :size="14" /> Assumir revisão
        </button>
      </template>
    </div>

    <div class="revisao__colunas">
      <div class="revisao__documento">
        <DocumentoOriginal :arquivo="arquivo" :pagina="pagina" @selecionar="selecionarArquivo"
          @mudar-pagina="pagina = $event" />
      </div>

      <div class="cartao dados">
        <header class="dados__cabecalho">
          <div>
            <h2>Dados da ficha</h2>
            <p>Preencha ou confira cada campo conforme o documento original</p>
          </div>
          <ClipboardList :size="18" class="dados__ia" />
        </header>

        <div class="alerta">
          <AlertTriangle :size="16" />
          <span>
            Transcreva exatamente o que está no original e não complete por suposição. Use
            <Minus :size="12" /> para registrar campos em branco no papel. Resultados laboratoriais
            (DiaCell, DiaPanel, fenotipagem) devem ser transcritos literalmente: nt, NR e vazio não são negativo.
          </span>
        </div>

        <SecaoRevisao titulo="Identificação do receptor" etiqueta="Págs. 1 e 4">
          <div class="grade">
            <CampoRevisao class="grade__inteira" :campo="ficha.identificacao.nome"
              v-bind="eventos(ficha.identificacao.nome)" />
            <CampoRevisao :campo="ficha.identificacao.racaCor" :opcoes="opcoesRacaCor"
              v-bind="eventos(ficha.identificacao.racaCor)" />
            <CampoRevisao :campo="ficha.identificacao.aboRh" :opcoes="opcoesAboRh"
              v-bind="eventos(ficha.identificacao.aboRh)" />
            <CampoRevisao :campo="ficha.identificacao.dataNascimento" tipo="date"
              v-bind="eventos(ficha.identificacao.dataNascimento)" />
            <CampoRevisao :campo="ficha.identificacao.sexo" :opcoes="opcoesSexo"
              v-bind="eventos(ficha.identificacao.sexo)" />
            <CampoRevisao class="grade__inteira" :campo="ficha.identificacao.nomeMae"
              v-bind="eventos(ficha.identificacao.nomeMae)" />
            <CampoRevisao :campo="ficha.identificacao.prontuario" v-bind="eventos(ficha.identificacao.prontuario)" />
            <CampoRevisao :campo="ficha.identificacao.cartaoSus" v-bind="eventos(ficha.identificacao.cartaoSus)" />
            <CampoRevisao :campo="ficha.identificacao.municipio" v-bind="eventos(ficha.identificacao.municipio)" />
            <CampoRevisao :campo="ficha.identificacao.diagnostico" v-bind="eventos(ficha.identificacao.diagnostico)" />
          </div>

          <div v-if="ficha.cadastroSemelhante" class="semelhante">
            <Users :size="18" />
            <div>
              <strong>1 cadastro semelhante • {{ ficha.cadastroSemelhante.prontuario }}</strong>
              <small>{{ ficha.cadastroSemelhante.motivo }}</small>
            </div>
            <router-link class="botao"
              :to="{ name: 'prontuarios', params: { pacienteId: ficha.cadastroSemelhante.prontuario } }">
              Comparar
            </router-link>
          </div>
        </SecaoRevisao>

        <SecaoRevisao titulo="Ficha transfusional" :pagina="1"
          subtitulo="Uma linha por envio de hemocomponente. NR = não realizado, não significa negativo."
          etiqueta="Registro transfusional">
          <div class="tabela-rolavel" @focusin="pagina = 1">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Data do envio</th>
                  <th>Hemocomp.</th>
                  <th>Nº da doação</th>
                  <th>GR.S/RhD</th>
                  <th>Vol (ml)</th>
                  <th>PAI</th>
                  <th>Prova cruzada</th>
                  <th>Destino</th>
                  <th>Responsável</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(linha, indice) in ficha.transfusoes" :key="indice">
                  <td>
                    <CampoData :model-value="linha.dataEnvio ?? undefined"
                      @update:model-value="valor => { linha.dataEnvio = valor ?? null; marcarEditado(ficha.transfusoesConferencia) }" />
                  </td>
                  <td><input v-model="linha.tipoHemocomponente" class="curto"
                      @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td><input v-model="linha.numeroDoacao" @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td><input v-model="linha.grsRhd" @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td><input v-model="linha.volMl" class="curto" inputmode="numeric"
                      @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td>
                    <select v-model="linha.testesPai" @change="marcarEditado(ficha.transfusoesConferencia)">
                      <option :value="null">—</option>
                      <option v-for="opcao in opcoesTeste" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <select v-model="linha.provaCruzada" @change="marcarEditado(ficha.transfusoesConferencia)">
                      <option :value="null">—</option>
                      <option v-for="opcao in opcoesTeste" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}
                      </option>
                    </select>
                  </td>
                  <td><input v-model="linha.destino" @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td>
                    <CampoColaborador v-model="linha.responsavelLiberacao"
                      @update:model-value="marcarEditado(ficha.transfusoesConferencia)" />
                  </td>
                  <td>
                    <button type="button" class="icone-botao" title="Remover linha" @click="removerTransfusao(indice)">
                      <Trash2 :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="botao botao--leve" @click="adicionarTransfusao">
            <Plus :size="14" /> Adicionar envio
          </button>
          <ConferenciaTabela :conferencia="ficha.transfusoesConferencia"
            @confirmar="confirmar(ficha.transfusoesConferencia)" />
        </SecaoRevisao>

        <SecaoRevisao v-for="pesquisa in ficha.pesquisas" :key="pesquisa.documento"
          :titulo="pesquisa.documento === 'ID-DiaPanel' ? 'Identificação de anticorpos' : 'Pesquisa de anticorpos irregulares'"
          :pagina="pesquisa.pagina"
          :subtitulo="`${pesquisa.documento} • matriz de antígenos do reagente vinculada ao lote do kit, não precisa ser transcrita`"
          etiqueta="Bio-Rad">
          <div class="grade">
            <CampoRevisao :campo="pesquisa.data" tipo="date" v-bind="eventos(pesquisa.data)" />
            <CampoRevisao :campo="pesquisa.loteKit" v-bind="eventos(pesquisa.loteKit)" />
            <CampoRevisao :campo="pesquisa.grupoAntigenos" v-bind="eventos(pesquisa.grupoAntigenos)" />
            <CampoRevisao :campo="pesquisa.interpretacao" v-bind="eventos(pesquisa.interpretacao)" />
          </div>
          <div class="tabela-rolavel" @focusin="pagina = pesquisa.pagina">
            <table class="tabela tabela--compacta">
              <thead>
                <tr>
                  <th>Célula / controle</th>
                  <th>LISS/Coombs</th>
                  <th>Enzima</th>
                  <th>4 °C</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="reacao in pesquisa.reacoes" :key="reacao.celula">
                  <th>{{ reacao.celula }}</th>
                  <td v-for="coluna in colunasReacao" :key="coluna">
                    <select v-model="reacao[coluna]" @change="marcarEditado(pesquisa.reacoesConferencia)">
                      <option :value="null">—</option>
                      <option v-for="opcao in reacoes" :key="opcao" :value="opcao">{{ opcao }}</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ConferenciaTabela :conferencia="pesquisa.reacoesConferencia"
            @confirmar="confirmar(pesquisa.reacoesConferencia)" />
        </SecaoRevisao>

        <SecaoRevisao titulo="Pesquisa imuno-hematológica" :pagina="4"
          subtitulo="Grupo, fator Rh, anticorpos irregulares, TAD e fenotipagem eritrocitária"
          etiqueta="Resultados laboratoriais">
          <div class="grade">
            <CampoRevisao :campo="ih.grupoSanguineo" :opcoes="opcoesGrupo" v-bind="eventos(ih.grupoSanguineo)" />
            <CampoRevisao :campo="ih.fatorRh" :opcoes="opcoesPositivoNegativo" v-bind="eventos(ih.fatorRh)" />
            <CampoRevisao :campo="ih.dFraco" v-bind="eventos(ih.dFraco)" />
            <CampoRevisao :campo="ih.pai" :opcoes="opcoesTeste" v-bind="eventos(ih.pai)" />
            <CampoRevisao :campo="ih.autocontrole" :opcoes="opcoesTeste" v-bind="eventos(ih.autocontrole)" />
            <CampoRevisao :campo="ih.tad" :opcoes="opcoesTeste" v-bind="eventos(ih.tad)" />
            <CampoRevisao class="grade__inteira" :campo="ih.dcScreening" :opcoes="opcoesTeste"
              v-bind="eventos(ih.dcScreening)" />
            <CampoRevisao class="grade__inteira" :campo="ih.observacao" v-bind="eventos(ih.observacao)" />
          </div>

          <h4 class="subtitulo">Fenotipagem eritrocitária</h4>
          <div class="fenotipo" @focusin="pagina = 4">
            <label v-for="antigeno in antigenos" :key="antigeno" class="fenotipo__celula">
              <span>{{ antigeno }}</span>
              <select :value="ih.fenotipo[antigeno] ?? ''" @change="alterarFenotipo(antigeno, $event)">
                <option value="">—</option>
                <option v-for="opcao in reacoes" :key="opcao" :value="opcao">{{ opcao }}</option>
              </select>
            </label>
          </div>
          <p class="legenda">0 = negativo • w = fraco • 1+ a 4+ = positivo • nt = não testado • NR = não realizado.
            Vazio não é negativo.</p>
          <ConferenciaTabela :conferencia="ih.fenotipoConferencia" @confirmar="confirmar(ih.fenotipoConferencia)" />

          <h4 class="subtitulo">Identificação de anticorpos irregulares</h4>
          <div class="tabela-rolavel" @focusin="pagina = 4">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Método</th>
                  <th>Especificidade</th>
                  <th>Classe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(anticorpo, indice) in ih.anticorpos" :key="indice">
                  <td>
                    <CampoData :model-value="anticorpo.data ?? undefined"
                      @update:model-value="valor => { anticorpo.data = valor ?? undefined; marcarEditado(ih.anticorposConferencia) }" />
                  </td>
                  <td><input v-model="anticorpo.metodo" @input="marcarEditado(ih.anticorposConferencia)" /></td>
                  <td><input v-model="anticorpo.especificidade" placeholder="Ex.: Anti-c"
                      @input="marcarEditado(ih.anticorposConferencia)" /></td>
                  <td><input v-model="anticorpo.classe" @input="marcarEditado(ih.anticorposConferencia)" /></td>
                  <td>
                    <button type="button" class="icone-botao" title="Remover linha" @click="removerAnticorpo(indice)">
                      <Trash2 :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <button type="button" class="botao botao--leve" @click="adicionarAnticorpo">
            <Plus :size="14" /> Adicionar anticorpo
          </button>
          <ConferenciaTabela :conferencia="ih.anticorposConferencia" @confirmar="confirmar(ih.anticorposConferencia)" />

          <div class="grade">
            <CampoRevisao :campo="ih.amostra" v-bind="eventos(ih.amostra)" />
            <CampoRevisao :campo="ih.metodologia" v-bind="eventos(ih.metodologia)" />
            <CampoRevisao :campo="ih.dataExame" tipo="date" v-bind="eventos(ih.dataExame)" />
            <CampoRevisao :campo="ih.solicitante" v-bind="eventos(ih.solicitante)" />
            <CampoRevisao class="grade__inteira" :campo="ih.responsavelTecnico"
              v-bind="eventos(ih.responsavelTecnico)" />
          </div>
        </SecaoRevisao>
      </div>
    </div>

    <div class="cartao">
      <ResumoImunohematologico :dados="dadosResumo" />
    </div>

    <footer class="acoes cartao">
      <div class="acoes__texto">
        <UserCheck :size="18" />
        <div>
          <strong>Conferência humana obrigatória</strong>
          <small v-if="conferencia.podeAprovar">
            {{ conferencia.resolvidos }} de {{ conferencia.total }} itens preenchidos ou conferidos • revise antes de
            aprovar.
          </small>
          <small v-else>{{ conferencia.bloqueios.join(' ') }}</small>
        </div>
      </div>
      <div class="acoes__botoes">
        <button type="button" class="botao" :disabled="salvando || !revisaoEhMinha" @click="recusar">
          <Ban :size="14" /> Recusar
        </button>
        <button type="button" class="botao" :disabled="salvando || !revisaoEhMinha" @click="sinalizarPendencia">
          <Flag :size="14" /> Sinalizar pendência
        </button>
        <button type="button" class="botao" :disabled="salvando || !revisaoEhMinha" @click="salvarRascunho">Salvar
          rascunho</button>
        <button type="button" class="botao botao--primario"
          :disabled="!conferencia.podeAprovar || salvando || !revisaoEhMinha" @click="aprovar">
          <Check :size="14" /> Aprovar e salvar
        </button>
      </div>
    </footer>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  AlertTriangle, ArrowLeft, Ban, Check, ClipboardCheck, ClipboardList, Flag, Minus, Plus, Trash2, UserCheck, Users
} from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import ResumoImunohematologico from '@/components/ResumoImunohematologico.vue'
import CampoRevisao from '@/components/revisao/CampoRevisao.vue'
import ConferenciaTabela from '@/components/revisao/ConferenciaTabela.vue'
import DocumentoOriginal, { ArquivoDocumento } from '@/components/revisao/DocumentoOriginal.vue'
import SecaoRevisao from '@/components/revisao/SecaoRevisao.vue'
import {
  alteracoesDaIdentificacao, alteracoesDaImunohematologia, alteracoesDasTransfusoes,
  fichaDaExtracao, fichaParaEnvio, indicePesquisaPrincipal
} from '@/domain/conversaoApi'
import { ANTIGENOS_FICHA_FENOTIPAGEM, extrairAnticorpos, Reacao, REACOES } from '@/domain/fenotipo'
import { DadosImunohematologicos } from '@/domain/resumoImunohematologico'
import {
  CampoRevisavel, Conferencia, confirmarConferencia, criarFichaVazia, criarTransfusaoVazia,
  desfazerNaoConsta, DOCUMENTOS_DA_FICHA, editarCampo, marcarNaoConsta, resumirConferencia, STATUS_FICHA, RESULTADOS_TESTE, FichaEmRevisao
} from '@/domain/revisao'
import {
  aprovarFicha, buscarFicha, recusarFicha, salvarAlteracoes, sinalizarPendenciaFicha, urlArquivoDocumento, assumirRevisao, iniciarRevisao
} from '@/services/api'
import { tokenAtual } from '@/services/sessao'
import CampoData from '@/components/CampoData.vue'
import CampoColaborador from '@/components/revisao/CampoColaborador.vue'
import { OPCOES_ABO_RH, OPCOES_RACA, OPCOES_SEXO } from '@/domain/traducao'


interface Mensagem {
  tipo: 'sucesso' | 'info' | 'alerta'
  texto: string
}

function tipoPeloNome(nome: string): string {
  if (/\.pdf$/i.test(nome)) return 'application/pdf'
  if (/\.png$/i.test(nome)) return 'image/png'
  return 'image/jpeg'
}

export default defineComponent({
  name: 'RevisarFichaView',
  components: {
    AlertTriangle, ArrowLeft, Ban, Check, ClipboardCheck, ClipboardList, Flag, Minus, Plus, Trash2, UserCheck, Users,
    PageHeader, ResumoImunohematologico, CampoRevisao, ConferenciaTabela, DocumentoOriginal, SecaoRevisao, CampoData,
    CampoColaborador
  },
  setup() {
    const rota = useRoute()
    const ficha = reactive(criarFichaVazia())
    const ih = computed(() => ficha.imunohematologia)
    const pagina = ref(1)
    const mensagem = ref<Mensagem | null>(null)
    const arquivo = ref<ArquivoDocumento | null>(null)
    const fichaId = computed(() => (rota.params.fichaId as string | undefined) || null)
    const carregando = ref(false)
    const salvando = ref(false)
    const revisor = ref<{ id: number; nome: string } | null>(null)
    const original = ref<FichaEmRevisao | null>(null)
    const indicePesquisa = ref<number | null>(null)
    const revisaoEhMinha = computed(() =>
      ficha.status === 'EM_REVISAO' && revisor.value !== null && String(revisor.value.id) === tokenAtual.value
    )

    const conferencia = computed(() => resumirConferencia(ficha))
    const percentual = computed(() =>
      Math.round((conferencia.value.resolvidos / conferencia.value.total) * 100)
    )
    const finalizada = computed(() => ficha.status === 'VALIDADA' || ficha.status === 'RECUSADA')

    const titulo = computed(() => {
      const nome = ficha.identificacao.nome.valor
      return nome ? `Revisar ficha de ${nome}` : 'Revisar ficha'
    })

    const subtitulo = computed(() => arquivo.value
      ? `${arquivo.value.nome} • ficha de ${DOCUMENTOS_DA_FICHA.length} páginas: ${DOCUMENTOS_DA_FICHA.join(', ')}`
      : 'Selecione o documento digitalizado e preencha os campos conforme o original.'
    )

    const statusFicha = computed(() => STATUS_FICHA[ficha.status])

    function trocarArquivo(novo: ArquivoDocumento | null) {
      if (arquivo.value?.url.startsWith('blob:')) URL.revokeObjectURL(arquivo.value.url)
      arquivo.value = novo
      pagina.value = 1
    }

    function selecionarArquivo(novo: File) {
      trocarArquivo({ nome: novo.name, tipo: novo.type, url: URL.createObjectURL(novo) })
    }

    async function carregar(id: string | null) {
      mensagem.value = null
      if (!id) {
        Object.assign(ficha, criarFichaVazia())
        revisor.value = null
        original.value = null
        indicePesquisa.value = null
        trocarArquivo(null)
        return
      }
      carregando.value = true
      try {
        const detalhe = await buscarFicha(id)
        Object.assign(ficha, fichaDaExtracao(detalhe))
        original.value = fichaDaExtracao(detalhe)
        indicePesquisa.value = indicePesquisaPrincipal(detalhe)
        revisor.value = detalhe.revisor
        const nomeArquivo = detalhe.documento.nomeOriginal
        trocarArquivo({ nome: nomeArquivo, tipo: tipoPeloNome(nomeArquivo), url: urlArquivoDocumento(detalhe.documento.id) })
        if (detalhe.erroLeitura) mensagem.value = { tipo: 'alerta', texto: `Leitura da IA: ${detalhe.erroLeitura}` }
      } catch (erro) {
        mensagem.value = { tipo: 'alerta', texto: (erro as Error).message }
      } finally {
        carregando.value = false
      }
    }

    async function comecarRevisao() {
      if (!fichaId.value) return
      salvando.value = true
      try {
        const resposta = await iniciarRevisao(fichaId.value)
        ficha.status = resposta.status
        revisor.value = resposta.revisor
        mensagem.value = { tipo: 'sucesso', texto: 'Revisão iniciada. A ficha agora está com você.' }
      } catch (e) {
        mensagem.value = { tipo: 'alerta', texto: (e as Error).message }
      } finally {
        salvando.value = false
      }
    }

    async function tomarRevisao() {
      if (!fichaId.value || !revisor.value) return
      const justificativa = window.prompt(
        `${revisor.value.nome} está revisando esta ficha. Por que você vai assumir? (opcional)`
      )
      if (justificativa === null) return
      salvando.value = true
      try {
        const resposta = await assumirRevisao(fichaId.value, justificativa.trim() || null)
        revisor.value = resposta.revisor
        mensagem.value = { tipo: 'sucesso', texto: 'Você assumiu a revisão desta ficha.' }
      } catch (e) {
        mensagem.value = { tipo: 'alerta', texto: (e as Error).message }
      } finally {
        salvando.value = false
      }
    }

    watch(fichaId, carregar, { immediate: true })

    // Evita perder uma revisão em andamento ao fechar ou recarregar a página.
    function avisarAntesDeSair(evento: BeforeUnloadEvent) {
      if (conferencia.value.resolvidos > 0 && !finalizada.value) {
        evento.preventDefault()
        evento.returnValue = ''
      }
    }

    onMounted(() => window.addEventListener('beforeunload', avisarAntesDeSair))
    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', avisarAntesDeSair)
      trocarArquivo(null)
    })

    const dadosResumo = computed<DadosImunohematologicos>(() => {
      const dados = ih.value
      const fator = dados.fatorRh.valor === 'Positivo' ? '+' : dados.fatorRh.valor === 'Negativo' ? '-' : ''
      const grupoDaPagina4 = dados.grupoSanguineo.valor ? `${dados.grupoSanguineo.valor}${fator}` : null
      return {
        racaCor: ficha.identificacao.racaCor.valor,
        aboRh: ficha.identificacao.aboRh.valor ?? grupoDaPagina4,
        fenotipo: dados.fenotipo,
        anticorpos: [
          ...dados.anticorpos.flatMap(a => extrairAnticorpos(a.especificidade)),
          ...ficha.pesquisas.flatMap(p => extrairAnticorpos(p.interpretacao.valor))
        ]
      }
    })

    function eventos(campo: CampoRevisavel) {
      return {
        onAtualizar: (valor: string) => editarCampo(campo, valor),
        onConfirmar: () => confirmarConferencia(campo),
        onNaoConsta: () => marcarNaoConsta(campo),
        onDesfazerNaoConsta: () => desfazerNaoConsta(campo),
        onFoco: (numero: number) => { pagina.value = numero }
      }
    }

    function confirmar(item: Conferencia) {
      confirmarConferencia(item)
    }

    function marcarEditado(item: Conferencia) {
      item.estado = 'editado'
    }

    function alterarFenotipo(antigeno: string, evento: Event) {
      const valor = (evento.target as HTMLSelectElement).value
      ih.value.fenotipo[antigeno] = valor ? (valor as Reacao) : null
      marcarEditado(ih.value.fenotipoConferencia)
    }

    function adicionarTransfusao() {
      ficha.transfusoes.push(criarTransfusaoVazia())
      marcarEditado(ficha.transfusoesConferencia)
    }

    function removerTransfusao(indice: number) {
      ficha.transfusoes.splice(indice, 1)
      marcarEditado(ficha.transfusoesConferencia)
    }

    function adicionarAnticorpo() {
      ih.value.anticorpos.push({ data: null, metodo: null, especificidade: null, classe: null })
      marcarEditado(ih.value.anticorposConferencia)
    }

    function removerAnticorpo(indice: number) {
      ih.value.anticorpos.splice(indice, 1)
      marcarEditado(ih.value.anticorposConferencia)
    }

    // Executa uma ação no backend; sem ficha enviada pelo Upload não há onde gravar.
    async function executar(acao: (id: string) => Promise<unknown>, sucesso: Mensagem) {
      if (!fichaId.value) {
        mensagem.value = {
          tipo: 'alerta',
          texto: 'Esta ficha não foi enviada pela tela de Upload, então ainda não existe no banco. ' +
            'Envie o arquivo pelo Upload: ele passa pela IA e aparece na fila de revisão.'
        }
        return false
      }
      salvando.value = true
      try {
        await acao(fichaId.value)
        mensagem.value = sucesso
        return true
      } catch (erro) {
        mensagem.value = { tipo: 'alerta', texto: (erro as Error).message }
        return false
      } finally {
        salvando.value = false
      }
    }

    async function aprovar() {
      const ok = await executar(
        id => aprovarFicha(id, fichaParaEnvio(ficha)),
        { tipo: 'sucesso', texto: 'Ficha aprovada e gravada no prontuário do paciente.' }
      )
      if (ok) ficha.status = 'VALIDADA'
    }

    async function salvarRascunho() {
      if (!original.value) return
      const alteracoes = [
        ...alteracoesDaIdentificacao(original.value, ficha),
        ...alteracoesDasTransfusoes(original.value.transfusoes, ficha.transfusoes),
        ...alteracoesDaImunohematologia(original.value, ficha, indicePesquisa.value)
      ]
      if (alteracoes.length === 0) {
        mensagem.value = { tipo: 'info', texto: 'Nada foi alterado desde o último salvamento.' }
        return
      }
      const ok = await executar(
        id => salvarAlteracoes(id, alteracoes),
        { tipo: 'sucesso', texto: `${alteracoes.length} campo(s) salvo(s). A ficha continua com você.` }
      )
      if (ok) {
        original.value = JSON.parse(JSON.stringify(ficha))
        if (alteracoes.some(a => a.campo === 'pesquisas[0]')) indicePesquisa.value = 0
      }
    }

    async function sinalizarPendencia() {
      const motivo = window.prompt('Qual é a pendência desta ficha?')
      if (!motivo) return
      const ok = await executar(
        id => sinalizarPendenciaFicha(id, motivo),
        { tipo: 'alerta', texto: 'Ficha marcada com pendência e devolvida à fila.' }
      )
      if (ok) ficha.status = 'COM_PENDENCIA'
    }

    async function recusar() {
      const motivo = window.prompt('Por que esta ficha está sendo recusada? (ex.: documento ilegível ou de outro tipo)')
      if (!motivo) return
      const ok = await executar(
        id => recusarFicha(id, motivo),
        { tipo: 'alerta', texto: 'Ficha recusada. Ela não entra no prontuário.' }
      )
      if (ok) ficha.status = 'RECUSADA'
    }

    return {
      ficha, ih, pagina, mensagem, arquivo, carregando, salvando, finalizada, conferencia, percentual,
      fichaId, revisor, revisaoEhMinha, comecarRevisao, tomarRevisao,
      titulo, subtitulo, statusFicha, dadosResumo,
      selecionarArquivo, eventos, confirmar, marcarEditado, alterarFenotipo, adicionarTransfusao, removerTransfusao,
      adicionarAnticorpo, removerAnticorpo, aprovar, salvarRascunho, sinalizarPendencia, recusar,
      antigenos: ANTIGENOS_FICHA_FENOTIPAGEM,
      reacoes: REACOES,
      colunasReacao: ['coombs', 'enzima', 'frio'] as const,
      opcoesTeste: RESULTADOS_TESTE,
      opcoesRacaCor: OPCOES_RACA,
      opcoesAboRh: OPCOES_ABO_RH,
      opcoesGrupo: ['A', 'B', 'AB', 'O'].map(g => ({ valor: g, rotulo: g })),
      opcoesPositivoNegativo: ['Positivo', 'Negativo'].map(v => ({ valor: v, rotulo: v })),
      opcoesSexo: OPCOES_SEXO
    }
  }
})

</script>

<style scoped>
.revisao {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.revisor {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.revisao__trilha {
  margin: 0 0 -12px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.progresso {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 14px 20px;
}

.progresso__icone {
  color: var(--cor-primaria);
}

.progresso__barra {
  flex: 0 1 260px;
  height: 6px;
  border-radius: 3px;
  background: var(--cor-neutro-suave);
  overflow: hidden;
}

.progresso__barra span {
  display: block;
  height: 100%;
  background: var(--cor-sucesso);
  transition: width 0.2s;
}

.progresso__numeros,
.progresso__dica {
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.mensagem {
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--raio);
  font-size: 13px;
}

.mensagem--sucesso {
  background: var(--cor-sucesso-suave);
  color: var(--cor-sucesso);
}

.mensagem--info {
  background: var(--cor-info-suave);
  color: var(--cor-info);
}

.mensagem--alerta {
  background: var(--cor-alerta-suave);
  color: var(--cor-alerta);
}

.revisao__colunas {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 24px;
  align-items: start;
}

.revisao__documento {
  position: sticky;
  top: 16px;
}

.dados__cabecalho {
  display: flex;
  justify-content: space-between;
}

.dados__cabecalho h2 {
  font-size: 18px;
}

.dados__cabecalho p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.dados__ia {
  color: var(--cor-primaria);
}

.alerta {
  display: flex;
  gap: 10px;
  margin: 20px 0 8px;
  padding: 14px 16px;
  border-radius: var(--raio);
  background: var(--cor-alerta-suave);
  color: var(--cor-alerta);
  font-size: 13px;
}

.alerta svg {
  flex-shrink: 0;
}

.grade {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 20px;
}

.grade__inteira {
  grid-column: 1 / -1;
}

.semelhante {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--raio);
  background: var(--cor-fundo);
  color: var(--cor-texto-suave);
}

.semelhante div {
  flex: 1;
}

.semelhante strong {
  display: block;
  font-size: 13px;
  color: var(--cor-texto);
}

.semelhante small {
  font-size: 12px;
}

.subtitulo {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 600;
}

.tabela-rolavel {
  overflow-x: auto;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.tabela th {
  padding: 8px 6px;
  background: var(--cor-fundo);
  font-weight: 600;
  text-align: left;
  color: var(--cor-texto-suave);
  white-space: nowrap;
}

.tabela td {
  padding: 4px;
  border-bottom: 1px solid var(--cor-borda);
}

.tabela input,
.tabela select {
  width: 100%;
  min-width: 90px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font: inherit;
  background: var(--cor-superficie);
}

.tabela input.curto {
  min-width: 60px;
}

.tabela--compacta select {
  min-width: 70px;
}

.tabela--compacta tbody th {
  background: none;
  border-bottom: 1px solid var(--cor-borda);
}

.fenotipo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
  gap: 8px;
}

.fenotipo__celula {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: var(--cor-texto-suave);
}

.fenotipo__celula select {
  height: 32px;
  padding: 0 4px;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font: inherit;
  font-weight: 400;
  color: var(--cor-texto);
  background: var(--cor-superficie);
}

.icone-botao {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--cor-texto-suave);
}

.icone-botao:hover {
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}

.botao--leve {
  align-self: flex-start;
  height: 30px;
  font-size: 12px;
}

.legenda {
  margin: 0;
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.acoes {
  position: sticky;
  bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
}

.acoes__texto {
  display: flex;
  gap: 12px;
  color: var(--cor-primaria);
}

.acoes__texto strong {
  display: block;
  font-size: 13px;
  color: var(--cor-texto);
}

.acoes__texto small {
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.acoes__botoes {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.acoes .botao:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 1100px) {
  .revisao__colunas {
    grid-template-columns: 1fr;
  }

  .revisao__documento {
    position: static;
  }
}
</style>
