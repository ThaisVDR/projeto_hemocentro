<template>
  <div class="campo-colaborador">
    <input
      class="campo-colaborador__entrada"
      :value="modelValue ?? ''"
      :list="idLista"
      placeholder="Digite 2 letras…"
      @input="aoDigitar"
      @change="usarGrafiaCadastrada"
      @focus="emFoco = true"
      @blur="emFoco = false"
    />
    <datalist :id="idLista">
      <option v-for="colaborador in sugestoes" :key="colaborador.id" :value="colaborador.nome" />
    </datalist>
    <button v-if="podeCadastrar && !emFoco" type="button" class="campo-colaborador__cadastrar" :disabled="cadastrando"
      @click="cadastrar">
      + Cadastrar
    </button>
    <small v-if="erro" class="campo-colaborador__erro">{{ erro }}</small>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { buscarColaboradores, cadastrarColaborador, ColaboradorApi } from '@/services/api'

let proximoId = 0

export default defineComponent({
  name: 'CampoColaborador',
  props: {
    modelValue: { type: String as PropType<string | null>, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const idLista = `colaboradores-${++proximoId}`
    const sugestoes = ref<ColaboradorApi[]>([])
    const cadastrando = ref(false)
    const erro = ref<string | null>(null)
    // O "+ Cadastrar" só aparece depois que a pessoa sai do campo, para não cadastrar um nome pela metade.
    const emFoco = ref(false)
    let espera: number | undefined

    const nomeDigitado = computed(() => (props.modelValue ?? '').trim())

    // Já cadastrado = algum nome da lista igual ao digitado (sem diferenciar maiúsculas).
    const podeCadastrar = computed(() =>
      nomeDigitado.value.length >= 2 &&
      !sugestoes.value.some(c => c.nome.toLowerCase() === nomeDigitado.value.toLowerCase())
    )

    async function procurar(termo: string) {
      try {
        sugestoes.value = await buscarColaboradores(termo)
      } catch {
        sugestoes.value = []
      }
    }

    // Espera a pessoa parar de digitar por 300 ms antes de perguntar ao backend.
    watch(nomeDigitado, termo => {
      window.clearTimeout(espera)
      erro.value = null
      if (termo.length < 2) {
        sugestoes.value = []
        return
      }
      espera = window.setTimeout(() => procurar(termo), 300)
    }, { immediate: true })

    function aoDigitar(evento: Event) {
      emit('update:modelValue', (evento.target as HTMLInputElement).value)
    }

    // Ao sair do campo: "mauro" vira "Mauro", igual ao cadastro.
    function usarGrafiaCadastrada() {
      const cadastrado = sugestoes.value.find(c => c.nome.toLowerCase() === nomeDigitado.value.toLowerCase())
      if (cadastrado && cadastrado.nome !== props.modelValue) emit('update:modelValue', cadastrado.nome)
    }

    async function cadastrar() {
      if (!window.confirm(`Cadastrar "${nomeDigitado.value}" como colaborador?`)) return
      cadastrando.value = true
      erro.value = null
      try {
        const novo = await cadastrarColaborador(nomeDigitado.value)
        sugestoes.value = [novo, ...sugestoes.value]
        emit('update:modelValue', novo.nome)
      } catch (e) {
        erro.value = (e as Error).message
      } finally {
        cadastrando.value = false
      }
    }

    return { idLista, sugestoes, cadastrando, erro, emFoco, podeCadastrar, aoDigitar, cadastrar, usarGrafiaCadastrada }
  }
})
</script>

<style scoped>
.campo-colaborador {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.campo-colaborador__entrada {
  width: 100%;
  min-width: 110px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font: inherit;
  background: var(--cor-superficie);
}

.campo-colaborador__cadastrar {
  align-self: flex-start;
  border: 0;
  background: none;
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--cor-primaria);
  cursor: pointer;
}

.campo-colaborador__erro {
  font-size: 11px;
  color: var(--cor-primaria);
}
</style>