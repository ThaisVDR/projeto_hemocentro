<template>
  <section>
    <PageHeader
      titulo="Auditoria e rastreabilidade"
      subtitulo="Acompanhe autoria, origem e alterações do envio à validação de cada ficha."
    >
      <button type="button" class="botao" :disabled="exportando" @click="exportar">
        <Download :size="16" /> {{ exportando ? 'Gerando planilha…' : 'Exportar trilha' }}
      </button>
    </PageHeader>

    <!-- Contadores (respeitam os filtros aplicados) -->
    <div class="contadores">
      <div class="contador">
        <ListChecks :size="18" />
        <div>
          <strong>{{ contadores.eventos }}</strong>
          <span>Eventos no filtro</span>
          <small>Envios, edições, validações e consultas</small>
        </div>
      </div>
      <div class="contador">
        <PenLine :size="18" />
        <div>
          <strong>{{ contadores.edicoes }}</strong>
          <span>Edições de campos</span>
          <small>Com valores anterior e posterior</small>
        </div>
      </div>
      <div class="contador">
        <ShieldCheck :size="18" />
        <div>
          <strong>{{ contadores.validacoes }}</strong>
          <span>Validações no período</span>
          <small>Sempre atribuídas a um usuário</small>
        </div>
      </div>
    </div>

    <div class="layout">
      <!-- Lista de eventos -->
      <div class="cartao lista">
        <form class="filtros" @submit.prevent="aplicarFiltros">
          <label class="busca">
            <Search :size="16" />
            <input
              v-model="formulario.busca"
              type="search"
              placeholder="Buscar ficha (FIC-0320), lote (DEM-012) ou paciente"
            />
          </label>

          <label class="campo">
            <span>De</span>
            <input v-model="formulario.de" type="date" :max="formulario.ate || undefined" />
          </label>
          <label class="campo">
            <span>Até</span>
            <input v-model="formulario.ate" type="date" :min="formulario.de || undefined" />
          </label>

          <label class="campo">
            <span>Evento</span>
            <select v-model="formulario.tipo">
              <option value="">Todos</option>
              <option v-for="opcao in opcoesTipo" :key="opcao.valor" :value="opcao.valor">{{ opcao.rotulo }}</option>
            </select>
          </label>

          <label class="campo">
            <span>Usuário</span>
            <select v-model.number="formulario.usuarioId">
              <option :value="null">Todos</option>
              <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nome }}</option>
            </select>
          </label>

          <div class="filtros__acoes">
            <button type="submit" class="botao botao--primario" :disabled="carregando">
              <Filter :size="14" /> Filtrar
            </button>
            <button v-if="temFiltro" type="button" class="botao" @click="limparFiltros">
              <X :size="14" /> Limpar
            </button>
          </div>
        </form>

        <div class="lista__titulo">
          <h2>Eventos registrados</h2>
          <small v-if="!carregando && !erro">
            {{ eventos.length }} de {{ total }} eventos • mais recentes primeiro
          </small>
        </div>

        <p v-if="carregando" class="estado">Carregando eventos…</p>
        <div v-else-if="erro" class="estado estado--erro">
          <p>{{ erro }}</p>
          <button type="button" class="botao" @click="carregar">Tentar novamente</button>
        </div>
        <p v-else-if="eventos.length === 0" class="estado">
          {{ temFiltro ? 'Nenhum evento encontrado para esses filtros.' : 'Nenhum evento registrado ainda.' }}
        </p>

        <div v-else class="tabela-rolagem">
          <table class="tabela">
            <thead>
              <tr>
                <th>Data / hora</th>
                <th>Evento</th>
                <th>Registro / origem</th>
                <th>Autoria</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="evento in eventos"
                :key="evento.id"
                class="linha"
                :class="{ 'linha--ativa': evento.id === selecionadoId }"
                tabindex="0"
                :aria-selected="evento.id === selecionadoId"
                @click="selecionar(evento.id)"
                @keyup.enter="selecionar(evento.id)"
              >
                <td>
                  <strong>{{ quando(evento.ocorridoEm).data }}</strong>
                  <small>{{ quando(evento.ocorridoEm).hora }}</small>
                </td>
                <td>
                  <span class="selo" :class="tipo(evento.tipo).classe">{{ tipo(evento.tipo).rotulo }}</span>
                </td>
                <td>
                  <strong>{{ evento.ficha?.codigo ?? evento.lote?.codigo ?? '—' }}</strong>
                  <small>{{ origem(evento) }}</small>
                </td>
                <td>
                  <strong>{{ evento.usuario?.nome ?? 'Sistema' }}</strong>
                  <small>{{ evento.usuario ? 'Usuário' : 'Fila de leitura (IA)' }}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!carregando && !erro && totalPaginas > 1" class="paginacao">
          <button type="button" class="botao" :disabled="pagina === 1" @click="irParaPagina(pagina - 1)">
            ← Anterior
          </button>
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>
          <button type="button" class="botao" :disabled="pagina === totalPaginas" @click="irParaPagina(pagina + 1)">
            Próxima →
          </button>
        </div>
      </div>

      <!-- Detalhe do evento -->
      <aside class="cartao detalhe" aria-live="polite">
        <p v-if="!selecionadoId" class="estado">Selecione um evento para ver o detalhe.</p>
        <p v-else-if="carregandoDetalhe" class="estado">Carregando detalhe…</p>
        <div v-else-if="erroDetalhe" class="estado estado--erro">
          <p>{{ erroDetalhe }}</p>
          <button type="button" class="botao" @click="carregarDetalhe(selecionadoId)">Tentar novamente</button>
        </div>

        <template v-else-if="detalhe">
          <div class="detalhe__topo">
            <h2>Detalhe do evento</h2>
            <span class="selo" :class="tipo(detalhe.tipo).classe">{{ tipo(detalhe.tipo).rotulo }}</span>
          </div>
          <p class="detalhe__codigo">{{ detalhe.codigo }}</p>

          <dl class="dados">
            <div>
              <dt>Ficha</dt>
              <dd>{{ detalhe.fichaCodigo ?? '—' }}</dd>
            </div>
            <div>
              <dt>Data e hora</dt>
              <dd>{{ quando(detalhe.ocorridoEm).data }} • {{ quando(detalhe.ocorridoEm).hora }}</dd>
            </div>
            <div>
              <dt>Autoria</dt>
              <dd>{{ detalhe.usuario?.nome ?? 'Sistema (fila de leitura)' }}</dd>
            </div>
            <div>
              <dt>Lote</dt>
              <dd>{{ detalhe.loteCodigo ?? '—' }}</dd>
            </div>
            <div v-if="detalhe.paciente" class="dados__largo">
              <dt>Paciente</dt>
              <dd>{{ detalhe.paciente.nome }}</dd>
            </div>
            <div class="dados__largo">
              <dt>Original vinculado</dt>
              <dd>
                <template v-if="detalhe.documento">
                  {{ detalhe.documento.nomeOriginal }}<template v-if="detalhe.pagina"> • página {{ detalhe.pagina }}</template>
                </template>
                <template v-else>Sem documento vinculado</template>
              </dd>
            </div>
          </dl>

          <!-- Só eventos de edição têm valor anterior / posterior -->
          <template v-if="detalhe.campo">
            <h3 class="detalhe__subtitulo">Alteração: {{ detalhe.campo }}</h3>

            <div class="valor valor--anterior">
              <span>Valor anterior • sugestão da extração</span>
              <strong>{{ detalhe.valorAnterior || 'Vazio' }}</strong>
            </div>
            <div class="valor valor--posterior">
              <span>Valor posterior • correção humana</span>
              <strong>{{ detalhe.valorPosterior || 'Vazio' }}</strong>
            </div>
          </template>

          <div v-if="detalhe.justificativa" class="justificativa">
            <template v-if="detalhe.tipo === 'LEITURA_FALHOU'">
              <span>Motivo da falha</span>
              <p>{{ mensagemErroLeitura(detalhe.justificativa) }}</p>
              <details class="tecnico">
                <summary>Ver detalhes técnicos</summary>
                <p>{{ detalhe.justificativa }}</p>
              </details>
            </template>
            <template v-else>
              <span>Justificativa registrada</span>
              <p>{{ detalhe.justificativa }}</p>
            </template>
          </div>

          <p v-if="detalhe.tipo === 'CAMPO_EDITADO'" class="aviso">
            <Info :size="14" />
            A edição não equivale à aprovação. A validação final é registrada como um evento separado.
          </p>

          <div class="detalhe__acoes">
            <router-link
              v-if="detalhe.fichaId"
              :to="{ name: 'revisar', params: { fichaId: detalhe.fichaId } }"
              class="botao"
            >
              <FileText :size="14" /> Abrir ficha de origem
            </router-link>
            <a
              v-if="detalhe.documento"
              :href="urlDocumento(detalhe.documento.id)"
              target="_blank"
              rel="noopener"
              class="botao"
            >
              <ExternalLink :size="14" /> Original
            </a>
          </div>
        </template>
      </aside>
    </div>

    <!-- Rodapé informativo (texto do design) -->
    <div class="rodape">
      <div class="cartao">
        <h3>Cadeia de rastreabilidade</h3>
        <p>Cada etapa preserva o vínculo à origem.</p>
        <ol class="cadeia">
          <li>Original</li>
          <li>OCR + IA</li>
          <li>Edição humana</li>
          <li>Validação</li>
          <li>Prontuário</li>
        </ol>
      </div>
      <div class="cartao">
        <h3>Governança prevista no escopo</h3>
        <p>
          Controle por perfil, criptografia em trânsito e repouso e anonimização/pseudonimização quando cabível,
          alinhados à LGPD e à Lei do Ciclo do Sangue. Esta tela não comprova implementação ou certificação.
        </p>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { Download, ExternalLink, FileText, Filter, Info, ListChecks, PenLine, Search, ShieldCheck, X } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { OPCOES_TIPO_EVENTO, TipoEventoApi, infoDoTipo, partesDataHora } from '@/domain/auditoria'
import {
  EVENTOS_POR_PAGINA,
  EventoAuditoriaApi,
  EventoAuditoriaDetalheApi,
  FiltrosAuditoria,
  buscarEventoAuditoria,
  exportarTrilhaAuditoria,
  listarEventosAuditoria,
  listarUsuarios,
  urlArquivoDocumento
} from '@/services/api'
import { useAvisos } from '@/composables/useAvisos'
import { mensagemErroLeitura } from '@/utils/erros'

const FILTROS_VAZIOS = (): FiltrosAuditoria => ({ busca: '', de: '', ate: '', tipo: '', usuarioId: null })

export default defineComponent({
  name: 'AuditoriaView',
  components: {
    PageHeader, Download, ExternalLink, FileText, Filter, Info, ListChecks, PenLine, Search, ShieldCheck, X
  },
  setup() {
    const { avisar } = useAvisos()

    // `formulario` é o que a pessoa está digitando; `aplicados` é o que a lista realmente usa.
    // Assim a tela só recarrega ao clicar em Filtrar (ou Enter), e a exportação usa os mesmos filtros da lista.
    const formulario = reactive<FiltrosAuditoria>(FILTROS_VAZIOS())
    const aplicados = ref<FiltrosAuditoria>(FILTROS_VAZIOS())
    const usuarios = ref<{ id: number; nome: string }[]>([])

    const eventos = ref<EventoAuditoriaApi[]>([])
    const contadores = ref({ eventos: 0, edicoes: 0, validacoes: 0 })
    const total = ref(0)
    const pagina = ref(1)
    const carregando = ref(false)
    const erro = ref<string | null>(null)

    const selecionadoId = ref<number | null>(null)
    const detalhe = ref<EventoAuditoriaDetalheApi | null>(null)
    const carregandoDetalhe = ref(false)
    const erroDetalhe = ref<string | null>(null)

    const exportando = ref(false)

    const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / EVENTOS_POR_PAGINA)))
    const temFiltro = computed(() => {
      const f = aplicados.value
      return Boolean(f.busca || f.de || f.ate || f.tipo || f.usuarioId)
    })

    // Evita que uma resposta lenta e antiga sobrescreva uma mais nova (troca rápida de filtro/evento).
    let sequenciaLista = 0
    let sequenciaDetalhe = 0

    async function carregar() {
      const minha = ++sequenciaLista
      carregando.value = true
      erro.value = null
      try {
        const resposta = await listarEventosAuditoria(aplicados.value, pagina.value)
        if (minha !== sequenciaLista) return
        eventos.value = resposta.itens
        contadores.value = resposta.contadores
        total.value = resposta.total

        // Mantém o evento aberto se ele continua na página; senão abre o primeiro.
        const continua = resposta.itens.some(e => e.id === selecionadoId.value)
        if (!continua) {
          const primeiro = resposta.itens[0]
          if (primeiro) selecionar(primeiro.id)
          else limparDetalhe()
        }
      } catch (e) {
        if (minha !== sequenciaLista) return
        erro.value = (e as Error).message
      } finally {
        if (minha === sequenciaLista) carregando.value = false
      }
    }

    async function carregarDetalhe(id: number) {
      const minha = ++sequenciaDetalhe
      carregandoDetalhe.value = true
      erroDetalhe.value = null
      try {
        const resposta = await buscarEventoAuditoria(id)
        if (minha !== sequenciaDetalhe) return
        detalhe.value = resposta
      } catch (e) {
        if (minha !== sequenciaDetalhe) return
        detalhe.value = null
        erroDetalhe.value = (e as Error).message
      } finally {
        if (minha === sequenciaDetalhe) carregandoDetalhe.value = false
      }
    }

    function selecionar(id: number) {
      selecionadoId.value = id
      carregarDetalhe(id)
    }

    function limparDetalhe() {
      sequenciaDetalhe++
      selecionadoId.value = null
      detalhe.value = null
      erroDetalhe.value = null
      carregandoDetalhe.value = false
    }

    function aplicarFiltros() {
      aplicados.value = { ...formulario, busca: formulario.busca.trim() }
      pagina.value = 1
      carregar()
    }

    function limparFiltros() {
      Object.assign(formulario, FILTROS_VAZIOS())
      aplicarFiltros()
    }

    function irParaPagina(nova: number) {
      pagina.value = nova
      carregar()
    }

    async function exportar() {
      exportando.value = true
      try {
        const { blob, nome } = await exportarTrilhaAuditoria(aplicados.value)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = nome
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        avisar('sucesso', 'Trilha exportada com os filtros aplicados.')
      } catch (e) {
        avisar('erro', (e as Error).message)
      } finally {
        exportando.value = false
      }
    }

    // Complementa a coluna "Registro": lote (quando há ficha), paciente, campo e página.
    function origem(evento: EventoAuditoriaApi): string {
      const partes: string[] = []
      if (evento.ficha && evento.lote) partes.push(evento.lote.codigo)
      if (evento.paciente) partes.push(evento.paciente.nome)
      if (evento.campo) partes.push(evento.campo)
      if (evento.pagina) partes.push(`página ${evento.pagina}`)
      return partes.join(' • ') || 'Sem detalhes adicionais'
    }

    onMounted(async () => {
      carregar()
      try {
        usuarios.value = await listarUsuarios()
      } catch {
        // O filtro de usuário é opcional: se falhar, a lista continua funcionando.
      }
    })

    return {
      formulario, usuarios, opcoesTipo: OPCOES_TIPO_EVENTO,
      eventos, contadores, total, pagina, totalPaginas, carregando, erro, temFiltro,
      selecionadoId, detalhe, carregandoDetalhe, erroDetalhe, exportando,
      carregar, carregarDetalhe, selecionar, aplicarFiltros, limparFiltros, irParaPagina, exportar,
      origem,
      tipo: (t: TipoEventoApi | string) => infoDoTipo(t),
      quando: partesDataHora,
      urlDocumento: urlArquivoDocumento,
      mensagemErroLeitura
    }
  }
})
</script>

<style scoped>
.contadores {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.contador {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 16px 18px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-grande);
  background: var(--cor-superficie);
  color: var(--cor-primaria);
}

.contador div {
  display: flex;
  flex-direction: column;
}

.contador strong {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.1;
  color: var(--cor-texto);
}

.contador span {
  font-size: 13px;
  font-weight: 600;
  color: var(--cor-texto);
}

.contador small {
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
  align-items: start;
}

/* ---- Filtros ---- */
.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--cor-borda);
}

.busca {
  display: flex;
  flex: 1 1 100%;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  color: var(--cor-texto-suave);
}

.busca input {
  flex: 1;
  border: 0;
  outline: 0;
  font: inherit;
  color: var(--cor-texto);
  background: transparent;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--cor-texto-suave);
}

.campo input,
.campo select {
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  font: inherit;
  font-weight: 400;
  color: var(--cor-texto);
}

.filtros__acoes {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

/* ---- Lista ---- */
.lista__titulo {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.lista__titulo h2 {
  font-size: 16px;
}

.lista__titulo small {
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.tabela-rolagem {
  overflow-x: auto;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tabela th {
  padding: 10px 12px;
  background: var(--cor-fundo);
  font-size: 11px;
  font-weight: 600;
  text-align: left;
  color: var(--cor-texto-suave);
}

.tabela td {
  padding: 12px;
  border-bottom: 1px solid var(--cor-borda);
  vertical-align: top;
}

.tabela td strong {
  display: block;
  font-weight: 600;
}

.tabela td small {
  display: block;
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.linha {
  cursor: pointer;
  outline: none;
}

.linha:hover,
.linha:focus-visible {
  background: var(--cor-fundo);
}

.linha--ativa,
.linha--ativa:hover {
  background: var(--cor-primaria-suave);
  box-shadow: inset 3px 0 0 var(--cor-primaria);
}

.paginacao {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.estado {
  padding: 32px 16px;
  margin: 0;
  text-align: center;
  color: var(--cor-texto-suave);
}

.estado--erro {
  color: var(--cor-primaria);
}

.estado--erro p {
  margin: 0 0 12px;
}

/* ---- Detalhe ---- */
.detalhe {
  position: sticky;
  top: 16px;
}

.detalhe__topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.detalhe__topo h2 {
  font-size: 16px;
}

.detalhe__codigo {
  margin: 4px 0 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--cor-texto-suave);
}

.dados {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 0 16px;
}

.dados__largo {
  grid-column: 1 / -1;
}

.dados dt {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cor-texto-fraco);
}

.dados dd {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.detalhe__subtitulo {
  margin: 4px 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.valor {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
  padding: 10px 12px;
  border-radius: var(--raio);
  border: 1px solid var(--cor-borda);
}

.valor span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.valor strong {
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.valor--anterior {
  background: var(--cor-neutro-suave);
  color: var(--cor-texto-suave);
}

.valor--anterior strong {
  color: var(--cor-texto);
  text-decoration: line-through;
  text-decoration-color: var(--cor-texto-fraco);
}

.valor--posterior {
  background: var(--cor-sucesso-suave);
  border-color: #bfe3cf;
  color: var(--cor-sucesso);
}

.valor--posterior strong {
  color: var(--cor-texto);
}

.justificativa {
  margin: 12px 0;
}

.justificativa span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--cor-texto-fraco);
}

.justificativa p {
  margin: 4px 0 0;
  font-size: 13px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.tecnico {
  margin-top: 8px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.tecnico summary {
  cursor: pointer;
  font-weight: 600;
}

.tecnico p {
  max-height: 200px;
  overflow-y: auto;
  font-size: 11px;
}

.aviso {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin: 12px 0;
  padding: 10px 12px;
  border-radius: var(--raio);
  background: var(--cor-info-suave);
  font-size: 12px;
  color: var(--cor-info);
}

.aviso svg {
  flex: none;
  margin-top: 2px;
}

.detalhe__acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.detalhe__acoes .botao {
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
}

/* ---- Rodapé ---- */
.rodape {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

.rodape h3 {
  font-size: 14px;
  font-weight: 600;
}

.rodape p {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.cadeia {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}

.cadeia li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--cor-neutro-suave);
  font-size: 12px;
  font-weight: 600;
}

.cadeia li:not(:last-child)::after {
  content: '→';
  margin-left: 4px;
  color: var(--cor-texto-fraco);
}

@media (max-width: 1100px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .detalhe {
    position: static;
  }
}

@media (max-width: 720px) {
  .contadores,
  .rodape {
    grid-template-columns: 1fr;
  }
}
</style>