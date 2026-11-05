<template>
  <section class="revisao" :class="{ 'revisao--erros': mostrarErros }">
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

    <div v-if="pendenciaVisivel && pendencia" class="mensagem mensagem--alerta pendencia">
      <Flag :size="16" />
      <div>
        <strong>
          Pendência sinalizada
          <template v-if="pendencia.sinalizadoPor">por {{ pendencia.sinalizadoPor.nome }}</template>
          em {{ formatarDataHora(pendencia.sinalizadoEm) }}
        </strong>
        <p>{{ pendencia.motivo || 'Sem motivo registrado.' }}</p>
      </div>
    </div>

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
        <LegendaEstados />

        <nav class="indice" aria-label="Seções da ficha">
          <button v-for="item in indiceSecoes" :key="item.numero" type="button" class="indice__item"
            @click="irParaSecao(item.numero)">
            <span>{{ item.numero }}</span> {{ item.titulo }}
          </button>
        </nav>

        <SecaoRevisao :numero="1" titulo="Identificação do receptor" etiqueta="Págs. 1 e 4">
          <div class="grade">
            <CampoRevisao class="grade__inteira" :class="{ 'campo--erro': !ficha.identificacao.nome.valor }"
              :campo="ficha.identificacao.nome" v-bind="eventos(ficha.identificacao.nome)" />
            <CampoRevisao :campo="ficha.identificacao.racaCor" :opcoes="opcoesRacaCor"
              v-bind="eventos(ficha.identificacao.racaCor)" />
            <CampoRevisao :campo="ficha.identificacao.aboRh" :opcoes="opcoesAboRh"
              v-bind="eventos(ficha.identificacao.aboRh)" />
            <CampoRevisao :class="{ 'campo--erro': !ficha.identificacao.dataNascimento.valor }"
              :campo="ficha.identificacao.dataNascimento" tipo="date"
              v-bind="eventos(ficha.identificacao.dataNascimento)" />
            <CampoRevisao :campo="ficha.identificacao.sexo" :opcoes="opcoesSexo"
              v-bind="eventos(ficha.identificacao.sexo)" />
            <CampoRevisao class="grade__inteira" :campo="ficha.identificacao.nomeMae"
              v-bind="eventos(ficha.identificacao.nomeMae)" />
            <CampoRevisao :campo="ficha.identificacao.prontuario" v-bind="eventos(ficha.identificacao.prontuario)" />
            <CampoRevisao :campo="ficha.identificacao.cartaoSus" v-bind="eventos(ficha.identificacao.cartaoSus)" />
            <CampoRevisao :campo="ficha.identificacao.municipio" tipo="cidade"
              v-bind="eventos(ficha.identificacao.municipio)" />
            <CampoRevisao :campo="ficha.identificacao.diagnostico" v-bind="eventos(ficha.identificacao.diagnostico)" />
          </div>

          <div v-if="semelhantes.length && !finalizada" class="semelhante"
            :class="{ 'semelhante--erro': mostrarErros && falta }">
            <Users :size="18" />
            <div>
              <strong>Possível paciente já cadastrado</strong>
              <small>Confira com o original. Se for a mesma pessoa, a ficha entra no prontuário dela.</small>

              <label v-for="paciente in semelhantes" :key="paciente.id" class="semelhante__opcao">
                <input v-model="pacienteEscolhido" type="radio" name="paciente" :value="paciente.id"
                  :disabled="!revisaoEhMinha" />
                <span>
                  <b>{{ paciente.nome }}</b> • nasc. {{ formatarData(paciente.dataNascimento) || '—' }}
                  • mãe: {{ paciente.nomeMae || '—' }} • prontuário {{ paciente.prontuario ?? '—' }}
                  • {{ paciente.fichasValidadas }} ficha(s)
                  <small>Coincide: {{paciente.coincide.map(c => rotulosCoincide[c]).join(', ')}}</small>
                </span>
                <router-link :to="{ name: 'prontuarios', params: { pacienteId: paciente.id } }" target="_blank">
                  Ver prontuário
                </router-link>
              </label>

              <label class="semelhante__opcao">
                <input v-model="pacienteEscolhido" type="radio" name="paciente" :value="null"
                  :disabled="!revisaoEhMinha" />
                <span><b>É outra pessoa</b>: cadastrar um paciente novo</span>
              </label>
            </div>
          </div>
        </SecaoRevisao>

        <SecaoRevisao :numero="2" titulo="Ficha transfusional" :pagina="1"
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
                  <td><input v-model="linha.tipoHemocomponente" class="curto" list="hemocomponentes"
                      @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td><input v-model="linha.numeroDoacao" @input="marcarEditado(ficha.transfusoesConferencia)" /></td>
                  <td>
                    <select v-model="linha.grsRhd" @change="marcarEditado(ficha.transfusoesConferencia)">
                      <option :value="null">—</option>
                      <option v-if="linha.grsRhd && !gruposRh.includes(linha.grsRhd)" :value="linha.grsRhd">
                        {{ linha.grsRhd }}
                      </option>
                      <option v-for="grupo in gruposRh" :key="grupo" :value="grupo">{{ grupo }}</option>
                    </select>
                  </td>
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
                  <td>
                    <CampoCidade v-model="linha.destino"
                      @update:model-value="marcarEditado(ficha.transfusoesConferencia)" />
                  </td>
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
            <datalist id="hemocomponentes">
              <option v-for="tipo in hemocomponentes" :key="tipo" :value="tipo" />
            </datalist>
          </div>
          <button type="button" class="botao botao--leve" @click="adicionarTransfusao">
            <Plus :size="14" /> Adicionar envio
          </button>
          <ConferenciaTabela :conferencia="ficha.transfusoesConferencia"
            @confirmar="confirmar(ficha.transfusoesConferencia)"
            @desfazer="desfazerConferencia(ficha.transfusoesConferencia)" />
        </SecaoRevisao>

        <SecaoRevisao v-for="(pesquisa, i) in ficha.pesquisas" :key="pesquisa.documento" :numero="i + 3"
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
            @confirmar="confirmar(pesquisa.reacoesConferencia)"
            @desfazer="desfazerConferencia(pesquisa.reacoesConferencia)" />
        </SecaoRevisao>

        <SecaoRevisao :numero="ficha.pesquisas.length + 3" titulo="Pesquisa imuno-hematológica" :pagina="4"
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
          <ConferenciaTabela :conferencia="ih.fenotipoConferencia" @confirmar="confirmar(ih.fenotipoConferencia)"
            @desfazer="desfazerConferencia(ih.fenotipoConferencia)" />

          <h4 class="subtitulo">Identificação de anticorpos irregulares</h4>
          <div class="tabela-rolavel" @focusin="pagina = 4">
            <table class="tabela">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Especificidade</th>
                  <th>Classe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(anticorpo, indice) in ih.anticorpos" :key="indice">
                  <td>
                    <CampoData :model-value="anticorpo.data ?? undefined"
                      @update:model-value="valor => { anticorpo.data = valor || null; marcarEditado(ih.anticorposConferencia) }" />
                  </td>
                  <td><input v-model="anticorpo.especificidade" placeholder="Ex.: Anti-c"
                      @input="marcarEditado(ih.anticorposConferencia)" /></td>
                  <td>
                    <select v-model="anticorpo.classe" @change="marcarEditado(ih.anticorposConferencia)">
                      <option :value="null">—</option>
                      <option v-for="opcao in classesAnticorpo" :key="opcao.valor" :value="opcao.valor">
                        {{ opcao.rotulo }}
                      </option>
                    </select>
                  </td>
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
          <ConferenciaTabela :conferencia="ih.anticorposConferencia" @confirmar="confirmar(ih.anticorposConferencia)"
            @desfazer="desfazerConferencia(ih.anticorposConferencia)" />

          <div class="grade">
            <CampoRevisao :campo="ih.amostra" v-bind="eventos(ih.amostra)" />
            <CampoRevisao :campo="ih.metodologia" v-bind="eventos(ih.metodologia)" />
            <CampoRevisao :campo="ih.dataExame" tipo="date" v-bind="eventos(ih.dataExame)" />
            <CampoRevisao :campo="ih.solicitante" v-bind="eventos(ih.solicitante)" />
            <CampoRevisao class="grade__inteira" :campo="ih.responsavelTecnico" tipo="colaborador"
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
          <small v-if="!estaAutenticado" class="acoes__aviso">
            Faça login para salvar, recusar ou aprovar.
            <router-link :to="{ name: 'login' }">Entrar</router-link>
          </small>
          <small v-else-if="!revisaoEhMinha && !finalizada" class="acoes__aviso">
            Inicie ou assuma a revisão (no topo da página) para salvar, recusar ou aprovar.
          </small>
          <small v-else-if="falta" class="acoes__aviso">
            Indique se a ficha é de um paciente já cadastrado (na Identificação) antes de aprovar.
            <button type="button" class="acoes__ir" @click="mostrarOndeFalta">Mostrar onde</button>
          </small>
          <small v-else-if="conferencia.podeAprovar">
            {{ conferencia.resolvidos }} de {{ conferencia.total }} itens preenchidos ou conferidos • revise antes de
            aprovar.
          </small>
          <small v-else class="acoes__aviso">
            {{ conferencia.bloqueios.join(' ') }}
            <button type="button" class="acoes__ir" @click="mostrarOndeFalta">Mostrar onde</button>
          </small>
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
          :disabled="salvando || !revisaoEhMinha" @click="aprovar">
          <Check :size="14" /> Aprovar e salvar
        </button>
      </div>
    </footer>
  </section>
  <DialogoRecusa v-if="recusando" @confirmar="confirmarRecusa" @fechar="recusando = false" />
  <DialogoPendencia v-if="pendenciando" @confirmar="confirmarPendencia" @fechar="pendenciando = false" />
  <DialogoConfirmacao v-if="assumindo && revisor" titulo="Assumir revisão"
    :texto="`${revisor.nome} está revisando esta ficha. Ao assumir, a revisão passa para você e fica registrada na auditoria.`"
    campo-texto="Por que você vai assumir? (opcional)" placeholder="Ex.: a colega está de folga"
    rotulo-confirmar="Assumir revisão" @confirmar="confirmarAssumir" @fechar="assumindo = false" />
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
  alteracoesDosKits, fichaDaExtracao, indicePesquisaPrincipal, tiposDosKits
} from '@/domain/conversaoApi'
import { ANTIGENOS_FICHA_FENOTIPAGEM, extrairAnticorpos, Reacao, REACOES } from '@/domain/fenotipo'
import { DadosImunohematologicos } from '@/domain/resumoImunohematologico'
import {
  CampoRevisavel, Conferencia, confirmarConferencia, criarFichaVazia, criarTransfusaoVazia, desfazerConferencia, MotivoRecusa,
  desfazerNaoConsta, DOCUMENTOS_DA_FICHA, editarCampo, marcarNaoConsta, resumirConferencia, STATUS_FICHA, RESULTADOS_TESTE, FichaEmRevisao,
  CLASSES_ANTICORPO
} from '@/domain/revisao'
import {
  aprovarFicha, buscarFicha, recusarFicha, salvarAlteracoes, sinalizarPendenciaFicha, urlArquivoDocumento, assumirRevisao,
  iniciarRevisao, AlteracaoApi, buscarSemelhantes, PacienteSemelhanteApi, PendenciaApi
} from '@/services/api'
import { estaAutenticado, idUsuarioAtual, usuarioLogado } from '@/services/sessao'
import CampoData from '@/components/CampoData.vue'
import { formatarData, formatarDataHora } from '@/utils/formatacao'
import { avisar, fecharErros } from '@/composables/useAvisos'
import { mensagemErroLeitura } from '@/utils/erros'
import CampoColaborador from '@/components/revisao/CampoColaborador.vue'
import CampoCidade from '@/components/revisao/CampoCidade.vue'
import LegendaEstados from '@/components/revisao/LegendaEstados.vue'
import DialogoRecusa from '@/components/revisao/DialogoRecusa.vue'
import DialogoPendencia from '@/components/revisao/DialogoPendencia.vue'
import DialogoConfirmacao from '@/components/DialogoConfirmacao.vue'
import { OPCOES_ABO_RH, OPCOES_RACA, OPCOES_SEXO, ROTULO_ABO_RH } from '@/domain/traducao'


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
    CampoColaborador, CampoCidade, LegendaEstados, DialogoRecusa, DialogoPendencia, DialogoConfirmacao
  },
  setup() {
    const rota = useRoute()
    const roteador = useRouter()
    const ficha = reactive(criarFichaVazia())
    const ih = computed(() => ficha.imunohematologia)
    const pagina = ref(1)
    const mensagem = ref<Mensagem | null>(null)
    const arquivo = ref<ArquivoDocumento | null>(null)
    const fichaId = computed(() => (rota.params.fichaId as string | undefined) || null)
    const carregando = ref(false)
    const salvando = ref(false)
    const revisor = ref<{ id: number; nome: string } | null>(null)
    // Motivo da última pendência: aparece enquanto a ficha está com pendência ou em revisão de novo.
    const pendencia = ref<PendenciaApi | null>(null)
    const pendenciaVisivel = computed(() => ficha.status === 'COM_PENDENCIA' || ficha.status === 'EM_REVISAO')
    const original = ref<FichaEmRevisao | null>(null)
    const indicePesquisa = ref<number | null>(null)
    const tiposNoBackend = ref<(string | null)[]>([])
    const recusando = ref(false)
    const pendenciando = ref(false)
    const assumindo = ref(false)
    const semelhantes = ref<PacienteSemelhanteApi[]>([])
    // undefined = ainda não escolheu; null = é outra pessoa (paciente novo); texto = id do paciente existente.
    const pacienteEscolhido = ref<string | null | undefined>(undefined)
    const falta = computed(() => semelhantes.value.length > 0 && pacienteEscolhido.value === undefined)
    const revisaoEhMinha = computed(() =>
      ficha.status === 'EM_REVISAO' && revisor.value !== null && String(revisor.value.id) === idUsuarioAtual.value
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

    // Mini-índice: mesma numeração das seções, para pular direto para uma delas.
    const indiceSecoes = computed(() => [
      { numero: 1, titulo: 'Identificação' },
      { numero: 2, titulo: 'Ficha transfusional' },
      ...ficha.pesquisas.map((pesquisa, i) => ({ numero: i + 3, titulo: pesquisa.documento })),
      { numero: ficha.pesquisas.length + 3, titulo: 'Pesquisa imuno-hematológica' }
    ])

    // Sugestões de hemocomponente: siglas comuns + as que já aparecem nesta ficha (o campo continua livre).
    const SIGLAS_HEMOCOMPONENTE = ['CH', 'CHD', 'CHDF', 'CHF', 'CHI', 'CP', 'CPAF', 'PFC', 'CRIO']
    const hemocomponentes = computed(() => Array.from(new Set([
      ...SIGLAS_HEMOCOMPONENTE,
      ...ficha.transfusoes.map(t => t.tipoHemocomponente?.trim().toUpperCase()).filter((t): t is string => !!t)
    ])))

    function irParaSecao(numero: number) {
      document.getElementById(`secao-${numero}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

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
        tiposNoBackend.value = []
        semelhantes.value = []
        trocarArquivo(null)
        return
      }
      carregando.value = true
      try {
        const detalhe = await buscarFicha(id)
        Object.assign(ficha, fichaDaExtracao(detalhe))
        original.value = fichaDaExtracao(detalhe)
        indicePesquisa.value = indicePesquisaPrincipal(detalhe)
        tiposNoBackend.value = tiposDosKits(detalhe)
        revisor.value = detalhe.revisor
        pendencia.value = detalhe.pendencia ?? null
        carregarSemelhantes()
        const nomeArquivo = detalhe.documento.nomeOriginal
        trocarArquivo({ nome: nomeArquivo, tipo: tipoPeloNome(nomeArquivo), url: urlArquivoDocumento(detalhe.documento.id) })
        if (detalhe.erroLeitura) mensagem.value = { tipo: 'alerta', texto: `Leitura da IA: ${mensagemErroLeitura(detalhe.erroLeitura)}` }
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
        avisar('sucesso', 'Revisão iniciada. A ficha agora está com você.')
      } catch (e) {
        avisar('erro', (e as Error).message)
      } finally {
        salvando.value = false
      }
    }

    function tomarRevisao() {
      assumindo.value = true
    }

    async function confirmarAssumir(justificativa: string | null) {
      assumindo.value = false
      if (!fichaId.value) return
      salvando.value = true
      try {
        const resposta = await assumirRevisao(fichaId.value, justificativa)
        revisor.value = resposta.revisor
        avisar('sucesso', 'Você assumiu a revisão desta ficha.')
      } catch (e) {
        avisar('erro', (e as Error).message)
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
        onDesfazerConferencia: () => desfazerConferencia(campo),
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
      ih.value.anticorpos.push({ data: null, especificidade: null, classe: null })
      marcarEditado(ih.value.anticorposConferencia)
    }

    function removerAnticorpo(indice: number) {
      ih.value.anticorpos.splice(indice, 1)
      marcarEditado(ih.value.anticorposConferencia)
    }

    // Executa uma ação no backend; sem ficha enviada pelo Upload não há onde gravar.
    async function executar(acao: (id: string) => Promise<unknown>, sucesso: Mensagem) {
      if (!fichaId.value) {
        avisar('erro', 'Esta ficha não foi enviada pela tela de Upload, então ainda não existe no banco. ' +
          'Envie o arquivo pelo Upload: ele passa pela IA e aparece na fila de revisão.')
        return false
      }
      salvando.value = true
      try {
        await acao(fichaId.value)
        avisar(sucesso.tipo, sucesso.texto)
        return true
      } catch (erro) {
        avisar('erro', (erro as Error).message)
        return false
      } finally {
        salvando.value = false
      }
    }

    // Depois de tentar aprovar com algo faltando, os campos que bloqueiam ficam com borda vermelha.
    const mostrarErros = ref(false)

    async function mostrarOndeFalta() {
      mostrarErros.value = true
      await nextTick()
      document.querySelector('.revisao--erros .campo--erro, .revisao--erros .campo--incerto, .semelhante--erro')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // PAI, prova cruzada, TAD, autocontrole e DC-Screening sem resultado são gravados como NR (não realizado),
    // e não como vazio. A fenotipagem pode continuar vazia.
    function preencherTestesVazios(): number {
      let preenchidos = 0
      ficha.transfusoes
        .filter(linha => Object.values(linha).some(v => v !== null && v !== ''))
        .forEach(linha => {
          if (!linha.testesPai) { linha.testesPai = 'NAO_REALIZADO'; preenchidos++ }
          if (!linha.provaCruzada) { linha.provaCruzada = 'NAO_REALIZADO'; preenchidos++ }
        })
      // Só na pesquisa que já existe: ficha sem a página 4 não ganha uma pesquisa só com NR.
      if (indicePesquisa.value === null) return preenchidos
      const testes = [ih.value.pai, ih.value.tad, ih.value.autocontrole, ih.value.dcScreening]
      testes.filter(campo => !campo.valor).forEach(campo => { editarCampo(campo, 'NAO_REALIZADO'); preenchidos++ })
      return preenchidos
    }

    async function aprovar() {
      if (!fichaId.value) return
      if (falta.value || !conferencia.value.podeAprovar) {
        avisar('erro', falta.value
          ? 'Indique se a ficha é de um paciente já cadastrado antes de aprovar.'
          : conferencia.value.bloqueios.join(' '))
        mostrarOndeFalta()
        return
      }
      const preenchidos = preencherTestesVazios()
      if (preenchidos > 0) avisar('info', `${preenchidos} teste(s) sem resultado gravado(s) como NR — não realizado.`)
      salvando.value = true
      try {
        // O backend aprova o que está gravado nele: primeiro salva as correções pendentes.
        const alteracoes = alteracoesPendentes()
        if (alteracoes.length > 0) {
          await salvarAlteracoes(fichaId.value, alteracoes)
          marcarComoSalvo(alteracoes)
        }

        const resultado = await aprovarFicha(fichaId.value, pacienteEscolhido.value ?? null)
        ficha.status = 'VALIDADA'
        revisor.value = null

        const g = resultado.gravacao
        const paciente = g.pacienteCriado ? 'Paciente novo cadastrado' : 'Ficha ligada ao paciente já cadastrado'
        fecharErros()
        avisar('sucesso', `Ficha aprovada. ${paciente}; ${g.transfusoesCriadas} transfusão(ões) e ` +
          `${g.pesquisasCriadas} pesquisa(s) gravadas no prontuário.`)
        resultado.avisos.forEach(aviso => avisar('alerta', aviso))

        roteador.push({ name: 'prontuarios', params: { pacienteId: g.pacienteId } })
      } catch (e) {
        avisar('erro', (e as Error).message)
      } finally {
        salvando.value = false
      }
    }

    // O que mudou desde a última vez que a ficha foi gravada no backend.
    function alteracoesPendentes(): AlteracaoApi[] {
      if (!original.value) return []
      return [
        ...alteracoesDaIdentificacao(original.value, ficha),
        ...alteracoesDasTransfusoes(original.value.transfusoes, ficha.transfusoes),
        ...alteracoesDaImunohematologia(original.value, ficha, indicePesquisa.value),
        ...alteracoesDosKits(original.value, ficha, tiposNoBackend.value)
      ]
    }

    // Depois de gravar: a "foto do antes" passa a ser a ficha como está agora.
    function marcarComoSalvo(alteracoes: AlteracaoApi[]) {
      original.value = JSON.parse(JSON.stringify(ficha))
      if (alteracoes.some(a => a.campo === 'pesquisas[0]')) indicePesquisa.value = 0
      // Kit criado agora: guarda o tipo na posição dele, para o próximo salvamento alterar em vez de criar outro.
      for (const alteracao of alteracoes) {
        const posicao = alteracao.campo.match(/^kits\[(\d+)\]$/)
        if (posicao) tiposNoBackend.value[Number(posicao[1])] = (alteracao.valor as { tipo: string }).tipo
      }
      carregarSemelhantes()
    }

    async function carregarSemelhantes() {
      if (!fichaId.value) return
      try {
        semelhantes.value = await buscarSemelhantes(fichaId.value)
      } catch {
        semelhantes.value = []
      }
      pacienteEscolhido.value = undefined
    }

    async function salvarRascunho() {
      const alteracoes = alteracoesPendentes()
      if (alteracoes.length === 0) {
        avisar('info', 'Nada foi alterado desde o último salvamento.')
        return
      }
      const ok = await executar(
        id => salvarAlteracoes(id, alteracoes),
        { tipo: 'sucesso', texto: `${alteracoes.length} campo(s) salvo(s). A ficha continua com você.` }
      )
      if (ok) marcarComoSalvo(alteracoes)
    }

    function sinalizarPendencia() {
      pendenciando.value = true
    }

    async function confirmarPendencia(motivo: string) {
      pendenciando.value = false
      const ok = await executar(
        id => sinalizarPendenciaFicha(id, motivo),
        { tipo: 'alerta', texto: 'Ficha marcada com pendência e devolvida à fila.' }
      )
      if (ok) {
        ficha.status = 'COM_PENDENCIA'
        revisor.value = null
        const quem = usuarioLogado.value
        pendencia.value = {
          motivo,
          sinalizadoPor: quem ? { id: quem.id, nome: quem.nome } : null,
          sinalizadoEm: new Date().toISOString()
        }
      }
    }

    function recusar() {
      recusando.value = true
    }

    async function confirmarRecusa(escolha: { motivo: MotivoRecusa; observacao: string | null }) {
      recusando.value = false
      const ok = await executar(
        id => recusarFicha(id, escolha.motivo, escolha.observacao),
        { tipo: 'alerta', texto: 'Ficha recusada. Ela saiu da fila e não entra no prontuário.' }
      )
      if (ok) {
        ficha.status = 'RECUSADA'
        revisor.value = null
      }
    }

    return {
      mostrarErros, mostrarOndeFalta,
      pendencia, pendenciaVisivel, formatarDataHora,
      ficha, ih, pagina, mensagem, arquivo, carregando, salvando, finalizada, conferencia, percentual,
      fichaId, revisor, revisaoEhMinha, comecarRevisao, tomarRevisao, estaAutenticado,
      titulo, subtitulo, statusFicha, dadosResumo, indiceSecoes, irParaSecao,
      selecionarArquivo, eventos, confirmar, desfazerConferencia, marcarEditado, alterarFenotipo,
      adicionarTransfusao, removerTransfusao,
      adicionarAnticorpo, removerAnticorpo, aprovar, salvarRascunho, sinalizarPendencia, recusar, recusando, confirmarRecusa,
      pendenciando, confirmarPendencia, assumindo, confirmarAssumir, semelhantes, pacienteEscolhido, falta, formatarData,
      antigenos: ANTIGENOS_FICHA_FENOTIPAGEM,
      reacoes: REACOES,
      colunasReacao: ['coombs', 'enzima', 'frio'] as const,
      opcoesTeste: RESULTADOS_TESTE,
      classesAnticorpo: CLASSES_ANTICORPO,
      opcoesRacaCor: OPCOES_RACA,
      opcoesAboRh: OPCOES_ABO_RH,
      opcoesGrupo: ['A', 'B', 'AB', 'O'].map(g => ({ valor: g, rotulo: g })),
      opcoesPositivoNegativo: ['Positivo', 'Negativo'].map(v => ({ valor: v, rotulo: v })),
      opcoesSexo: OPCOES_SEXO,
      gruposRh: Object.values(ROTULO_ABO_RH) as string[],
      hemocomponentes,
      rotulosCoincide: { nome: 'nome', dataNascimento: 'data de nascimento', nomeMae: 'nome da mãe' } as Record<string, string>
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

/* Depois de tentar aprovar: borda vermelha no que bloqueia a aprovação. */
.revisao--erros :deep(.campo--erro input),
.revisao--erros :deep(.campo--erro select),
.revisao--erros :deep(.campo--incerto input),
.revisao--erros :deep(.campo--incerto select) {
  border-color: #c62828;
  box-shadow: 0 0 0 2px rgba(192, 57, 43, 0.15);
}

.revisao--erros :deep(.campo--erro .campo__nota)::after {
  content: ' • obrigatório para aprovar';
  color: #c62828;
}

.semelhante--erro {
  outline: 2px solid #c62828;
  outline-offset: 2px;
}

.acoes__ir {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: var(--cor-primaria);
  text-decoration: underline;
  cursor: pointer;
}

.pendencia {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.pendencia p {
  margin: 4px 0 0;
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

.indice {
  position: sticky;
  top: 8px;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  box-shadow: 0 4px 12px rgba(31, 35, 40, 0.06);
}

.indice__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  border: 0;
  border-radius: 999px;
  background: var(--cor-fundo);
  font: inherit;
  font-size: 12px;
  color: var(--cor-texto);
  cursor: pointer;
}

.indice__item:hover {
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}

.indice__item span {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--cor-primaria);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
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

.semelhante__opcao {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  padding: 10px 12px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  font-size: 13px;
  color: var(--cor-texto);
  cursor: pointer;
}

.semelhante__opcao span {
  flex: 1;
}

.semelhante__opcao small {
  display: block;
  margin-top: 2px;
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
  z-index: 5;
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

.acoes__aviso {
  color: var(--cor-alerta);
  font-weight: 600;
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
