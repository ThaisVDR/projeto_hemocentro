<template>
  <section>
    <PageHeader
      titulo="Visão geral do acervo"
      subtitulo="Da digitalização à conferência: acompanhe o avanço e o que precisa de atenção."
    >
      <div class="periodo">
        <label>
          De
          <CampoData v-model="de" />
        </label>
        <label>
          Até
          <CampoData v-model="ate" />
        </label>
        <button type="button" class="botao" :disabled="carregandoTudo" @click="carregarTudo">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>
      <router-link :to="{ name: 'upload' }" class="botao botao--primario">
        <Upload :size="16" /> Enviar documentos
      </router-link>
    </PageHeader>

    <p v-if="erroPeriodo" class="aviso-periodo">{{ erroPeriodo }}</p>
    <p v-else-if="indicadores" class="texto-periodo">
      Período exibido: {{ formatarData(indicadores.periodo.de) }} a {{ formatarData(indicadores.periodo.ate) }}.
      Em revisão e em processamento mostram a situação de agora.
    </p>

    <div class="grade grade--cartoes">
      <CartaoIndicador
        rotulo="Fichas digitalizadas"
        :valor="indicadores ? indicadores.fichas.digitalizadas : null"
        detalhe="Enviadas no período"
      />
      <CartaoIndicador
        rotulo="Fichas validadas"
        :valor="indicadores ? indicadores.fichas.validadas : null"
        :detalhe="detalheValidadas"
      />
      <CartaoIndicador
        rotulo="Em revisão humana"
        :valor="indicadores ? indicadores.fichas.emRevisao : null"
        :detalhe="detalheRevisao"
      />
      <CartaoIndicador
        rotulo="Em processamento"
        :valor="indicadores ? indicadores.fichas.lendo : null"
        :detalhe="detalheProcessamento"
      />
    </div>

    <div v-if="erroIndicadores" class="cartao erro-bloco">
      <p>{{ erroIndicadores }}</p>
      <button type="button" class="botao" @click="carregarIndicadores">Tentar novamente</button>
    </div>
    <p v-else-if="!indicadores" class="carregando">Carregando indicadores…</p>
    <div v-else class="grade grade--duas">
      <GraficoSemanal :semanas="indicadores.evolucaoSemanal" />
      <QualidadeCadastro :qualidade="indicadores.qualidadeCadastro" />
    </div>

    <div class="grade grade--duas">
      <PrioridadesRevisao
        :itens="prioridades ? prioridades.itens : []"
        :carregando="carregandoPrioridades"
        :erro="erroPrioridades"
      />
      <AtividadeRecente :eventos="eventos" :carregando="carregandoEventos" :erro="erroEventos" />
    </div>

    <p class="nota">
      Base do projeto: aproximadamente 850 pacientes ativos. Os totais acima medem fichas e não representam
      cobertura real de pacientes.
    </p>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { RefreshCw, Upload } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import CampoData from '@/components/CampoData.vue'
import CartaoIndicador from '@/components/dashboard/CartaoIndicador.vue'
import GraficoSemanal from '@/components/dashboard/GraficoSemanal.vue'
import QualidadeCadastro from '@/components/dashboard/QualidadeCadastro.vue'
import PrioridadesRevisao from '@/components/dashboard/PrioridadesRevisao.vue'
import AtividadeRecente from '@/components/dashboard/AtividadeRecente.vue'
import {
  buscarDashboard,
  DashboardApi,
  EventoAuditoriaApi,
  FilaRevisaoApi,
  listarEventosRecentes,
  listarPrioridadesRevisao
} from '@/services/api'
import { formatarData } from '@/utils/formatacao'

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/

export default defineComponent({
  name: 'DashboardView',
  components: {
    PageHeader,
    CampoData,
    CartaoIndicador,
    GraficoSemanal,
    QualidadeCadastro,
    PrioridadesRevisao,
    AtividadeRecente,
    RefreshCw,
    Upload
  },
  setup() {
    // Período em AAAA-MM-DD (o CampoData devolve '' enquanto a data está incompleta). Vazio = padrão do backend.
    const de = ref('')
    const ate = ref('')
    const erroPeriodo = ref<string | null>(null)

    const indicadores = ref<DashboardApi | null>(null)
    const erroIndicadores = ref<string | null>(null)
    const carregandoIndicadores = ref(false)

    const prioridades = ref<FilaRevisaoApi | null>(null)
    const erroPrioridades = ref<string | null>(null)
    const carregandoPrioridades = ref(false)

    const eventos = ref<EventoAuditoriaApi[]>([])
    const erroEventos = ref<string | null>(null)
    const carregandoEventos = ref(false)

    // Cada bloco carrega e falha sozinho: se a auditoria cair, os números e o gráfico continuam na tela.
    async function carregarIndicadores() {
      erroPeriodo.value = null
      if (de.value && ate.value && de.value > ate.value) {
        erroPeriodo.value = 'A data inicial não pode ser depois da data final.'
        return
      }
      erroIndicadores.value = null
      carregandoIndicadores.value = true
      try {
        indicadores.value = await buscarDashboard({
          de: DATA_ISO.test(de.value) ? de.value : undefined,
          ate: DATA_ISO.test(ate.value) ? ate.value : undefined
        })
      } catch (e) {
        indicadores.value = null
        erroIndicadores.value = (e as Error).message
      } finally {
        carregandoIndicadores.value = false
      }
    }

    async function carregarPrioridades() {
      erroPrioridades.value = null
      carregandoPrioridades.value = true
      try {
        prioridades.value = await listarPrioridadesRevisao(3)
      } catch (e) {
        prioridades.value = null
        erroPrioridades.value = (e as Error).message
      } finally {
        carregandoPrioridades.value = false
      }
    }

    async function carregarEventos() {
      erroEventos.value = null
      carregandoEventos.value = true
      try {
        eventos.value = (await listarEventosRecentes(3)).itens
      } catch (e) {
        eventos.value = []
        erroEventos.value = (e as Error).message
      } finally {
        carregandoEventos.value = false
      }
    }

    async function carregarTudo() {
      await Promise.all([carregarIndicadores(), carregarPrioridades(), carregarEventos()])
    }

    const carregandoTudo = computed(
      () => carregandoIndicadores.value || carregandoPrioridades.value || carregandoEventos.value
    )

    onMounted(carregarTudo)

    // Contadores por status, de todas as fichas (não só das 3 listadas). Status sem fichas não vêm: vale 0.
    function contar(status: string): number {
      return prioridades.value?.contadores[status] ?? 0
    }

    const detalheValidadas = computed(() => {
      const f = indicadores.value?.fichas
      if (!f) return ''
      if (f.digitalizadas === 0) return 'Sem fichas digitalizadas no período'
      const percentual = Math.round((f.validadas / f.digitalizadas) * 1000) / 10
      // Validadas e digitalizadas contam datas diferentes: pode haver ficha enviada antes e validada agora.
      if (percentual > 100) return 'Inclui fichas enviadas antes do período'
      return `${percentual.toLocaleString('pt-BR')}% das fichas digitalizadas`
    })

    const detalheRevisao = computed(() => {
      if (!prioridades.value) return 'Situação atual'
      return (
        `${contar('AGUARDANDO_REVISAO')} aguardando • ${contar('EM_REVISAO')} em revisão • ` +
        `${contar('COM_PENDENCIA')} com pendência`
      )
    })

    const detalheProcessamento = computed(() => {
      if (!prioridades.value) return 'Situação atual'
      const base = `${contar('ENVIADA')} na fila • ${contar('LENDO')} em leitura`
      const erros = contar('FALHA_LEITURA')
      return erros > 0 ? `${base} • ${erros} com erro de leitura` : base
    })

    return {
      de,
      ate,
      erroPeriodo,
      indicadores,
      erroIndicadores,
      prioridades,
      erroPrioridades,
      carregandoPrioridades,
      eventos,
      erroEventos,
      carregandoEventos,
      carregandoTudo,
      carregarTudo,
      carregarIndicadores,
      detalheValidadas,
      detalheRevisao,
      detalheProcessamento,
      formatarData
    }
  }
})
</script>

<style scoped>
.periodo {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.periodo label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  font-weight: 600;
  color: var(--cor-texto-suave);
}

.periodo :deep(input) {
  width: 108px;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  font: inherit;
  font-weight: 400;
  color: var(--cor-texto);
}

.texto-periodo,
.aviso-periodo {
  margin: -12px 0 16px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.aviso-periodo {
  color: var(--cor-primaria);
  font-weight: 600;
}

.grade {
  display: grid;
  gap: 16px;
  margin-bottom: 16px;
}

.grade--cartoes {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.grade--duas {
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  align-items: start;
}

@media (max-width: 1000px) {
  .grade--duas {
    grid-template-columns: minmax(0, 1fr);
  }
}

.carregando {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.erro-bloco {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  color: var(--cor-primaria);
}

.erro-bloco p {
  margin: 0;
  font-weight: 600;
}

.nota {
  margin: 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}
</style>