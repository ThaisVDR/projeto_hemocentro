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
        :class="{ 'filtro--ativo': filtroAtivo === filtro.valor }" @click="filtroAtivo = filtro.valor">
        <span>{{ filtro.rotulo }}</span>
        <strong>{{ contar(filtro.valor) }}</strong>
      </button>
    </div>

    <div class="cartao">
      <div class="barra">
        <label class="busca">
          <Search :size="16" />
          <input v-model="busca" type="search" placeholder="Buscar por paciente ou código" />
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
      <p v-else-if="visiveis.length === 0" class="estado">
        {{ fichas.length === 0 ? 'Nenhuma ficha enviada ainda.' : 'Nenhuma ficha com esse filtro.' }}
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
          <tr v-for="ficha in visiveis" :key="ficha.id">
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
    </div>

    <p class="nota">CPF ausente não bloqueia: a identificação usa nome, data de nascimento e nome da mãe.</p>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { RefreshCw, Search, Upload } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { STATUS_FICHA, StatusFicha } from '@/domain/revisao'
import { FichaFilaApi, listarFilaRevisao } from '@/services/api'

type Filtro = 'pendentes' | StatusFicha

// "Pendentes" reúne tudo o que ainda precisa de ação humana.
const PENDENTES: StatusFicha[] = ['AGUARDANDO_REVISAO', 'EM_REVISAO', 'COM_PENDENCIA', 'FALHA_LEITURA']

export default defineComponent({
  name: 'FilaRevisaoView',
  components: { RefreshCw, Search, Upload, PageHeader },
  setup() {
    const fichas = ref<FichaFilaApi[]>([])
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

    function pertence(ficha: FichaFilaApi, filtro: Filtro) {
      return filtro === 'pendentes' ? PENDENTES.includes(ficha.status) : ficha.status === filtro
    }

    function contar(filtro: Filtro) {
      return fichas.value.filter(f => pertence(f, filtro)).length
    }

    const visiveis = computed(() => {
      const termo = busca.value.trim().toLowerCase()
      return fichas.value
        .filter(f => pertence(f, filtroAtivo.value))
        .filter(f => !termo || `${f.paciente?.nome ?? ''} ${f.codigo}`.toLowerCase().includes(termo))
    })

    async function carregar() {
      carregando.value = true
      erro.value = null
      try {
        const resposta = await listarFilaRevisao()
        fichas.value = resposta.itens
      } catch (e) {
        erro.value = (e as Error).message
      } finally {
        carregando.value = false
      }
    }

    function formatarDataHora(iso: string) {
      const data = new Date(iso)
      return isNaN(data.getTime()) ? iso : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }

    onMounted(carregar)

    return {
      fichas, carregando, erro, busca, filtroAtivo, filtros, visiveis,
      contar, carregar, formatarDataHora, status: STATUS_FICHA
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
