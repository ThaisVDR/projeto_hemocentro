<template>
  <section>
    <PageHeader titulo="Leituras com problema"
      subtitulo="Fichas que ainda não chegaram à revisão: na fila da IA, sendo lidas ou com falha na leitura.">
      <router-link :to="{ name: 'upload' }" class="botao botao--primario">
        <Upload :size="16" /> Enviar fichas
      </router-link>
    </PageHeader>

      <div class="filtros-cartao" role="group" aria-label="Filtrar leituras">
      <button v-for="filtro in filtros" :key="filtro.valor" type="button" class="filtro-cartao"
        :class="{ 'filtro-cartao--ativo': filtroAtivo === filtro.valor }"
        :aria-pressed="filtroAtivo === filtro.valor" @click="filtroAtivo = filtro.valor">
        <span>{{ filtro.rotulo }}</span>
        <strong>{{ contar(filtro.valor) }}</strong>
      </button>
    </div>

    <div class="cartao">
      <div class="barra">
        <p class="barra__texto">
          A lista se atualiza sozinha enquanto houver ficha sendo lida.
        </p>
        <button type="button" class="botao" :disabled="carregando" @click="carregar">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>

      <p v-if="carregando && fichas.length === 0" class="estado">Carregando fichas…</p>
      <div v-else-if="erro" class="estado estado--erro">
        <p>{{ erro }}</p>
        <button type="button" class="botao" @click="carregar">Tentar novamente</button>
      </div>
      <p v-else-if="visiveis.length === 0" class="estado">
        {{ filtroAtivo === 'FALHA_LEITURA' ? 'Nenhuma ficha com falha na leitura.' : 'Nenhuma ficha esperando a IA.' }}
      </p>

      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Ficha</th>
            <th>Situação</th>
            <th>Enviada em</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ficha in visiveis" :key="ficha.id">
            <td>
              <strong>{{ ficha.codigo }}</strong>
              <small>Lote {{ ficha.lote.codigo }}</small>
            </td>
            <td>
              <span class="selo" :class="status[ficha.status].classe">{{ status[ficha.status].rotulo }}</span>
              <small v-if="ficha.erroLeitura" class="motivo" :title="ficha.erroLeitura">
                {{ mensagemErroLeitura(ficha.erroLeitura) }}
              </small>
            </td>
            <td>{{ formatarDataHora(ficha.desde) }}</td>
            <td>
              <BotaoReprocessar v-if="ficha.status === 'FALHA_LEITURA'" :documento-id="ficha.documentoId"
                :falhou-em="ficha.falhouEm" @reprocessado="carregar" />
              <span v-else class="aguardando">Aguardando a IA</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="nota">
      Quando a leitura termina, a ficha sai daqui e aparece na Fila de revisão.
    </p>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { RefreshCw, Upload } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import BotaoReprocessar from '@/components/upload/BotaoReprocessar.vue'
import { STATUS_FICHA } from '@/domain/revisao'
import { FichaLeituraApi, listarLeituras } from '@/services/api'
import { mensagemErroLeitura } from '@/utils/erros'
import { formatarDataHora } from '@/utils/formatacao'

type Filtro = 'FALHA_LEITURA' | 'NA_FILA'

// Enquanto houver ficha na fila ou sendo lida, pergunta de novo a cada 10 segundos.
const INTERVALO_MS = 10_000

export default defineComponent({
  name: 'LeiturasView',
  components: { BotaoReprocessar, PageHeader, RefreshCw, Upload },
  setup() {
    const fichas = ref<FichaLeituraApi[]>([])
    const carregando = ref(false)
    const erro = ref('')
    const filtroAtivo = ref<Filtro>('FALHA_LEITURA')

    const filtros: { valor: Filtro; rotulo: string }[] = [
      { valor: 'FALHA_LEITURA', rotulo: 'Com falha' },
      { valor: 'NA_FILA', rotulo: 'Na fila ou lendo' }
    ]

    function doFiltro(ficha: FichaLeituraApi, filtro: Filtro): boolean {
      return filtro === 'FALHA_LEITURA' ? ficha.status === 'FALHA_LEITURA' : ficha.status !== 'FALHA_LEITURA'
    }

    const visiveis = computed(() => fichas.value.filter((ficha) => doFiltro(ficha, filtroAtivo.value)))

    function contar(filtro: Filtro): number {
      return fichas.value.filter((ficha) => doFiltro(ficha, filtro)).length
    }

    async function carregar() {
      carregando.value = true
      erro.value = ''
      try {
        fichas.value = (await listarLeituras()).itens
      } catch (e) {
        erro.value = (e as Error).message
      } finally {
        carregando.value = false
      }
    }

    let relogio: number | undefined
    onMounted(async () => {
      await carregar()
      // Abre na aba que tem alguma coisa: se não há falha, mostra as que estão na fila.
      if (contar('FALHA_LEITURA') === 0 && contar('NA_FILA') > 0) filtroAtivo.value = 'NA_FILA'
      relogio = window.setInterval(() => {
        if (contar('NA_FILA') > 0 && !carregando.value) carregar()
      }, INTERVALO_MS)
    })
    onUnmounted(() => window.clearInterval(relogio))

    return {
      fichas, visiveis, carregando, erro, filtros, filtroAtivo, contar, carregar,
      status: STATUS_FICHA, mensagemErroLeitura, formatarDataHora
    }
  }
})
</script>

<style scoped>
.barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.barra__texto {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.estado {
  padding: 32px;
  text-align: center;
  color: var(--cor-texto-suave);
}

.estado--erro {
  color: var(--cor-primaria);
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
  padding: 14px 12px;
  border-bottom: 1px solid var(--cor-borda);
  vertical-align: top;
}

.tabela td small {
  display: block;
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.tabela td .motivo {
  margin-top: 6px;
  color: var(--cor-primaria);
}

.aguardando {
  font-size: 12px;
  color: var(--cor-texto-fraco);
}

.nota {
  margin-top: 12px;
  font-size: 11px;
  color: var(--cor-texto-suave);
}
</style>
