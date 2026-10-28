<template>
  <section>
    <PageHeader titulo="Fila de revisão humana"
      subtitulo="Confira lacunas, corrija a leitura da IA e valide cada ficha antes de ela entrar no prontuário.">
      <router-link :to="{ name: 'upload' }" class="botao botao--primario">
        <Upload :size="16" /> Enviar fichas
      </router-link>
    </PageHeader>

    <div class="filtros">
      <button v-for="filtro in filtros" :key="filtro.valor" type="button" class="filtro"
        :class="{ 'filtro--ativo': filtroAtivo === filtro.valor }" @click="escolherFiltro(filtro.valor)">
        <span>{{ filtro.rotulo }}</span>
        <strong>{{ contar(filtro.valor) }}</strong>
      </button>
    </div>

    <div class="cartao">
      <div class="barra">
        <label class="busca">
          <Search :size="16" />
          <input v-model="busca" type="search" placeholder="Buscar por nome, nome da mãe ou data de nascimento"
            @keyup.enter="buscar" />
        </label>
        <button type="button" class="botao" :disabled="carregando" @click="carregar">
          <RefreshCw :size="14" /> Atualizar
        </button>
      </div>

      <p v-if="carregando" class="estado">Carregando fichas…</p>
      <div v-else-if="erro" class="estado estado--erro">
        <p>{{ erro }}</p>
        <button type="button" class="botao" @click="carregar">Tentar novamente</button>
      </div>
      <p v-else-if="fichas.length === 0" class="estado">
        {{ busca ? 'Nenhuma ficha encontrada para essa busca.' : 'Nenhuma ficha nesta etapa.' }}
      </p>

      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Paciente / ficha</th>
            <th>Situação</th>
            <th>Desde</th>
            <th>Revisor</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ficha in fichas" :key="ficha.id">
            <td>
              <strong>{{ ficha.paciente?.nome || 'Nome não identificado' }}</strong>
              <small>{{ ficha.codigo }}</small>
            </td>
            <td><span class="selo" :class="status[ficha.status].classe">{{ status[ficha.status].rotulo }}</span></td>
            <td>{{ formatarDataHora(ficha.desde) }}</td>
            <td>{{ ficha.revisor?.nome || '—' }}</td>
            <td>
              <router-link v-if="ficha.status !== 'ENVIADA' && ficha.status !== 'LENDO'"
                :to="{ name: 'revisar', params: { fichaId: ficha.id } }" class="link">
                {{ ficha.status === 'VALIDADA' || ficha.status === 'RECUSADA' ? 'Ver' : 'Revisar' }} →
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="!carregando && totalPaginas > 1" class="paginacao">
        <button type="button" class="botao" :disabled="pagina === 1" @click="irParaPagina(pagina - 1)">
          ← Anterior
        </button>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <button type="button" class="botao" :disabled="pagina === totalPaginas" @click="irParaPagina(pagina + 1)">
          Próxima →
        </button>
      </div>

    </div>

    <p class="nota">CPF ausente não bloqueia: a identificação usa nome, data de nascimento e nome da mãe.</p>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { RefreshCw, Search, Upload } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { STATUS_FICHA, StatusFicha } from '@/domain/revisao'
import { FICHAS_POR_PAGINA, FichaFilaApi, listarFilaRevisao } from '@/services/api'

type Filtro = 'pendentes' | StatusFicha

// "Pendentes" reúne tudo o que ainda precisa de ação humana.
const PENDENTES: StatusFicha[] = ['AGUARDANDO_REVISAO', 'EM_REVISAO', 'COM_PENDENCIA']

export default defineComponent({
  name: 'FilaRevisaoView',
  components: { RefreshCw, Search, Upload, PageHeader },
  setup() {
    const fichas = ref<FichaFilaApi[]>([])
    const contadores = ref<Record<string, number>>({})
    const total = ref(0)
    const pagina = ref(1)
    const carregando = ref(false)
    const erro = ref<string | null>(null)
    const busca = ref('')
    const filtroAtivo = ref<Filtro>('pendentes')

    const filtros: { valor: Filtro; rotulo: string }[] = [
      { valor: 'pendentes', rotulo: 'Pendentes' },
      { valor: 'AGUARDANDO_REVISAO', rotulo: 'Aguardando revisão' },
      { valor: 'EM_REVISAO', rotulo: 'Em revisão' },
      { valor: 'COM_PENDENCIA', rotulo: 'Com pendência' },
      { valor: 'VALIDADA', rotulo: 'Validadas' }

    ]

    function statusDoFiltro(filtro: Filtro): StatusFicha[] {
      return filtro === 'pendentes' ? PENDENTES : [filtro]
    }

    function contar(filtro: Filtro) {
      if (filtro === 'pendentes') return contadores.value.todas ?? 0
      return contadores.value[filtro] ?? 0
    }

    const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / FICHAS_POR_PAGINA)))

    async function carregar() {
      carregando.value = true
      erro.value = null
      try {
        const resposta = await listarFilaRevisao({
          status: statusDoFiltro(filtroAtivo.value),
          busca: busca.value.trim(),
          pagina: pagina.value
        })
        fichas.value = resposta.itens
        contadores.value = resposta.contadores
        total.value = resposta.total
      } catch (e) {
        erro.value = (e as Error).message
      } finally {
        carregando.value = false
      }
    }

    function escolherFiltro(filtro: Filtro) {
      filtroAtivo.value = filtro
      pagina.value = 1
      carregar()
    }

    function buscar() {
      pagina.value = 1
      carregar()
    }

    function irParaPagina(nova: number) {
      pagina.value = nova
      carregar()
    }

    function formatarDataHora(iso: string) {
      const data = new Date(iso)
      return isNaN(data.getTime()) ? iso : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }

    onMounted(carregar)

    return {
      fichas, carregando, erro, busca, filtroAtivo, filtros, pagina, totalPaginas,
      contar, carregar, escolherFiltro, buscar, irParaPagina, formatarDataHora, status: STATUS_FICHA
    }
  }
})
</script>

<style scoped>
.filtros {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
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


.filtro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-grande);
  background: var(--cor-superficie);
  color: var(--cor-texto-suave);
  text-align: left;
}

.filtro strong {
  font-size: 22px;
  font-weight: 500;
  color: var(--cor-texto);
}

.filtro--ativo {
  border-color: #e3a5b0;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}

.filtro--ativo strong {
  color: var(--cor-primaria);
}

.barra {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.busca {
  display: flex;
  flex: 1;
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
}

.tabela td small {
  display: block;
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.link {
  font-weight: 600;
  color: var(--cor-primaria);
}

.nota {
  margin-top: 12px;
  font-size: 11px;
  color: var(--cor-texto-suave);
}
</style>
