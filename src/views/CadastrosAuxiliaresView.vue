<template>
  <section>
    <PageHeader titulo="Cadastros auxiliares"
      subtitulo="Colaboradores e instituições que aparecem como opção nas fichas, como responsável técnico, solicitante e instituição de origem.">
      <button type="button" class="botao botao--primario" @click="editando = 0; nomeEditado = ''">
        <Plus :size="16" /> {{ aba.novo }}
      </button>
    </PageHeader>

    <div class="abas" role="tablist">
      <button v-for="a in abas" :key="a.valor" type="button" role="tab" class="aba"
        :class="{ 'aba--ativa': cadastro === a.valor }" :aria-selected="cadastro === a.valor" @click="cadastro = a.valor">
        <component :is="a.icone" :size="16" /> {{ a.rotulo }} <span class="contador">{{ listas[a.valor].length }}</span>
      </button>
    </div>

    <div class="barra">
      <label class="busca">
        <Search :size="16" />
        <input v-model="busca" type="search" :placeholder="aba.busca" />
      </label>
      <div class="segmentos" role="group" aria-label="Filtrar por status">
        <button v-for="f in filtros" :key="f.rotulo" type="button" :class="{ 'segmento--ativo': situacao === f.valor }"
          :aria-pressed="situacao === f.valor" @click="situacao = f.valor">{{ f.rotulo }}</button>
      </div>
    </div>

    <div class="cartao tabela-cartao">
      <table class="ficha-tabela">
        <thead>
          <tr><th>NOME</th><th>STATUS</th><th class="acoes">AÇÕES</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in linhas" :key="item.id">
            <td>
              <input v-if="editando === item.id" v-model="nomeEditado" class="campo" aria-label="Nome" @keyup.enter="salvar(item.id)" />
              <strong v-else>{{ item.nome }}</strong>
            </td>
            <td>
              <span class="selo" :class="item.ativo ? 'selo--sucesso' : 'selo--neutro'">{{ item.ativo ? 'Ativo' : 'Inativo' }}</span>
            </td>
            <td class="acoes">
              <template v-if="editando === item.id">
                <button type="button" class="icone" title="Salvar" aria-label="Salvar" @click="salvar(item.id)"><Check :size="15" /></button>
                <button type="button" class="icone" title="Cancelar" aria-label="Cancelar" @click="editando = null"><X :size="15" /></button>
              </template>
              <template v-else>
                <button type="button" class="icone" title="Editar" aria-label="Editar" @click="editando = item.id; nomeEditado = item.nome">
                  <Pencil :size="15" />
                </button>
                <button type="button" class="icone" :class="{ 'icone--perigo': item.ativo }" :title="item.ativo ? 'Inativar' : 'Reativar'"
                  :aria-label="item.ativo ? 'Inativar' : 'Reativar'" @click="alternar(item)">
                  <Ban v-if="item.ativo" :size="15" /><RotateCcw v-else :size="15" />
                </button>
              </template>
            </td>
          </tr>
          <tr v-if="linhas.length === 0">
            <td colspan="3" class="vazio">Nenhum cadastro encontrado.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Ban, Building2, Check, Pencil, Plus, RotateCcw, Search, Users, X } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import { avisar } from '@/composables/useAvisos'
import { CadastroAuxiliar, ItemCadastroApi, definirCadastroAtivo, listarCadastro, salvarCadastro } from '@/services/api'

const abas = [
  { valor: 'colaboradores', rotulo: 'Colaboradores', icone: Users, novo: 'Novo colaborador', busca: 'Buscar colaborador pelo nome' },
  { valor: 'instituicoes', rotulo: 'Instituições', icone: Building2, novo: 'Nova instituição', busca: 'Buscar instituição pelo nome' }
] as const
const filtros = [
  { valor: true, rotulo: 'Ativos' },
  { valor: false, rotulo: 'Inativos' },
  { valor: null, rotulo: 'Todos' }
]

const cadastro = ref<CadastroAuxiliar>('colaboradores')
const aba = computed(() => abas.find((a) => a.valor === cadastro.value)!)
const listas = ref<Record<CadastroAuxiliar, ItemCadastroApi[]>>({ colaboradores: [], instituicoes: [] })
const situacao = ref<boolean | null>(true)
const busca = ref('')
// null: nada em edição; 0: linha de novo cadastro; >0: id em edição.
const editando = ref<number | null>(null)
const nomeEditado = ref('')

const exibidos = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase()
  return listas.value[cadastro.value].filter((i) =>
    (situacao.value === null || i.ativo === situacao.value) && i.nome.toLocaleLowerCase().includes(termo))
})

// O novo cadastro entra como uma linha id 0 no topo, editada como as outras.
const linhas = computed(() => (editando.value === 0 ? [{ id: 0, nome: '', ativo: true }, ...exibidos.value] : exibidos.value))

async function carregar(qual: CadastroAuxiliar) {
  try {
    listas.value[qual] = await listarCadastro(qual)
  } catch (e) {
    avisar('erro', (e as Error).message)
  }
}

async function salvar(id: number) {
  if (!nomeEditado.value.trim()) return
  try {
    await salvarCadastro(cadastro.value, nomeEditado.value, id || undefined)
    avisar('sucesso', id ? 'Cadastro alterado.' : 'Cadastro incluído.')
    editando.value = null
    await carregar(cadastro.value)
  } catch (e) {
    avisar('erro', (e as Error).message)
  }
}

async function alternar(item: ItemCadastroApi) {
  try {
    await definirCadastroAtivo(cadastro.value, item.id, !item.ativo)
    avisar('sucesso', `${item.nome} foi ${item.ativo ? 'inativado' : 'reativado'}.`)
    await carregar(cadastro.value)
  } catch (e) {
    avisar('erro', (e as Error).message)
  }
}

watch(cadastro, () => { editando.value = null; busca.value = '' })
onMounted(() => { carregar('colaboradores'); carregar('instituicoes') })
</script>

<style scoped>
.abas {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--cor-borda);
}

.aba {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 4px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--cor-texto-suave);
  font-weight: 500;
}

.aba--ativa {
  border-bottom-color: var(--cor-primaria);
  color: var(--cor-primaria);
  font-weight: 600;
}

.contador {
  padding: 0 7px;
  border-radius: 10px;
  background: var(--cor-neutro-suave);
  font-size: 12px;
}

.aba--ativa .contador {
  background: var(--cor-primaria);
  color: #fff;
}

.barra {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.busca {
  display: flex;
  flex: 0 1 390px;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  color: var(--cor-texto-suave);
}

.busca input {
  flex: 1;
  border: 0;
  outline: 0;
  font: inherit;
}

.segmentos {
  display: flex;
  padding: 3px;
  border-radius: var(--raio);
  background: var(--cor-neutro-suave);
}

.segmentos button {
  padding: 0 12px;
  border: 0;
  border-radius: var(--raio);
  background: none;
  color: var(--cor-texto-suave);
}

.segmentos .segmento--ativo {
  background: var(--cor-superficie);
  color: var(--cor-texto);
  font-weight: 600;
  box-shadow: var(--sombra);
}

.tabela-cartao {
  padding: 0;
  overflow: hidden;
}

.ficha-tabela td {
  vertical-align: middle;
}

.acoes {
  text-align: right;
  white-space: nowrap;
}

.icone {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  margin-left: 6px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  color: var(--cor-texto);
}

.icone--perigo {
  color: var(--cor-primaria);
}

.campo {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
}

.vazio {
  padding: 32px !important;
  text-align: center;
  color: var(--cor-texto-suave);
}
</style>
