<template>
  <div class="campo-cidade">
    <input
      class="campo-cidade__entrada"
      :value="modelValue ?? ''"
      :list="idLista"
      placeholder="Cidade / UF"
      @input="aoDigitar"
      @change="usarNomeOficial"
      @focus="emFoco = true"
      @blur="emFoco = false"
    />
    <datalist :id="idLista">
      <option v-for="cidade in sugestoes" :key="cidade.id" :value="nomeComUf(cidade)" />
    </datalist>
    <small v-if="naoEncontrada && !emFoco" class="campo-cidade__aviso">Cidade não encontrada na lista</small>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { buscarCidades, CidadeApi } from '@/services/api'

let proximoId = 0

function nomeComUf(cidade: CidadeApi): string {
  return `${cidade.nomeCidade} / ${cidade.estados.uf}`
}

export default defineComponent({
  name: 'CampoCidade',
  props: {
    modelValue: { type: String as PropType<string | null>, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const idLista = `cidades-${++proximoId}`
    const sugestoes = ref<CidadeApi[]>([])
    const buscou = ref(false)
    const emFoco = ref(false)
    let espera: number | undefined

    const nomeDigitado = computed(() => (props.modelValue ?? '').split('/')[0].trim())

    const naoEncontrada = computed(() =>
      buscou.value && nomeDigitado.value.length >= 2 &&
      !sugestoes.value.some(c => c.nomeCidade.toLowerCase() === nomeDigitado.value.toLowerCase())
    )

    async function procurar(termo: string) {
      try {
        sugestoes.value = await buscarCidades(termo)
      } catch {
        sugestoes.value = []
      } finally {
        buscou.value = true
      }
    }

    watch(nomeDigitado, termo => {
      window.clearTimeout(espera)
      buscou.value = false
      if (termo.length < 2) {
        sugestoes.value = []
        return
      }
      espera = window.setTimeout(() => procurar(termo), 300)
    }, { immediate: true })

    function aoDigitar(evento: Event) {
      emit('update:modelValue', (evento.target as HTMLInputElement).value)
    }

    function usarNomeOficial() {
      const cidade = sugestoes.value.find(c => c.nomeCidade.toLowerCase() === nomeDigitado.value.toLowerCase())
      if (cidade && nomeComUf(cidade) !== props.modelValue) emit('update:modelValue', nomeComUf(cidade))
    }

    return { idLista, sugestoes, emFoco, naoEncontrada, nomeComUf, aoDigitar, usarNomeOficial }
  }
})
</script>

<style scoped>
.campo-cidade {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.campo-cidade__entrada {
  width: 100%;
  min-width: 140px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font: inherit;
  background: var(--cor-superficie);
}

.campo-cidade__aviso {
  font-size: 11px;
  color: var(--cor-alerta);
}
</style>