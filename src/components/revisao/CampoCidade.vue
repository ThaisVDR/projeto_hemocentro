<template>
  <div class="campo-cidade">
    <CampoBusca :model-value="modelValue" :opcoes="nomes" placeholder="Cidade / UF"
      @update:model-value="valor => $emit('update:modelValue', valor)" @foco="emFoco = true" @sair="aoSair" />
    <small v-if="naoEncontrada && !emFoco" class="campo-cidade__aviso">Cidade não encontrada na lista</small>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { buscarCidades, CidadeApi } from '@/services/api'
import { semAcento } from '@/utils/formatacao'
import CampoBusca from './CampoBusca.vue'

function nomeComUf(cidade: CidadeApi): string {
  return `${cidade.nomeCidade} / ${cidade.estados.uf}`
}

export default defineComponent({
  name: 'CampoCidade',
  components: { CampoBusca },
  props: {
    modelValue: { type: String as PropType<string | null>, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const sugestoes = ref<CidadeApi[]>([])
    const buscou = ref(false)
    const emFoco = ref(false)
    let espera: number | undefined

    const nomeDigitado = computed(() => (props.modelValue ?? '').split('/')[0].trim())

    const naoEncontrada = computed(() =>
      buscou.value && nomeDigitado.value.length >= 2 &&
      !sugestoes.value.some(c => semAcento(c.nomeCidade) === semAcento(nomeDigitado.value))
    )
    const nomes = computed(() => sugestoes.value.map(nomeComUf))

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

    // Ao sair do campo: "cuiaba" vira "Cuiabá / MT", igual à lista oficial.
    function aoSair() {
      emFoco.value = false
      const cidade = sugestoes.value.find(c => semAcento(c.nomeCidade) === semAcento(nomeDigitado.value))
      if (cidade && nomeComUf(cidade) !== props.modelValue) emit('update:modelValue', nomeComUf(cidade))
    }

    return { nomes, emFoco, naoEncontrada, aoSair }
  }
})
</script>

<style scoped>
.campo-cidade {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.campo-cidade__aviso {
  font-size: 11px;
  color: var(--cor-alerta);
}
</style>