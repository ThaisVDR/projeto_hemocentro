<template>
  <div class="campo-cidade">
    <CampoBusca :model-value="modelValue" :opcoes="nomes" placeholder="Cidade / UF"
      @update:model-value="valor => $emit('update:modelValue', valor)" @foco="emFoco = true" @sair="aoSair" />
    <small v-if="naoEncontrada && !emFoco" class="campo-cidade__aviso">Cidade não encontrada na lista</small>
    <small v-else-if="erroBusca && !emFoco" class="campo-cidade__aviso">
      Não foi possível consultar a lista de cidades agora. Clique no campo e saia dele para tentar de novo.
    </small>
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
    // Falha da busca (servidor fora do ar, erro no banco) não é o mesmo que "cidade não existe".
    const erroBusca = ref(false)
    const emFoco = ref(false)
    let espera: number | undefined
    let ultimaBusca = 0

    const partes = computed(() => (props.modelValue ?? '').split('/'))
    const nomeDigitado = computed(() => partes.value[0].trim())
    const ufDigitada = computed(() => (partes.value[1] ?? '').trim().toUpperCase())

    // Mesmo nome (sem acento/maiúscula). Com UF completa ("MT"), a UF também precisa bater.
    function acharCidade(): CidadeApi | undefined {
      const mesmoNome = sugestoes.value.filter(c => semAcento(c.nomeCidade) === semAcento(nomeDigitado.value))
      if (ufDigitada.value.length === 2) return mesmoNome.find(c => c.estados.uf.toUpperCase() === ufDigitada.value)
      return mesmoNome[0]
    }

    const naoEncontrada = computed(() =>
      buscou.value && !erroBusca.value && nomeDigitado.value.length >= 2 && !acharCidade()
    )
    const nomes = computed(() => sugestoes.value.map(nomeComUf))

    async function procurar(termo: string) {
      const numero = ++ultimaBusca
      try {
        const cidades = await buscarCidades(termo)
        if (numero !== ultimaBusca) return
        sugestoes.value = cidades
        erroBusca.value = false
      } catch {
        if (numero !== ultimaBusca) return
        sugestoes.value = []
        erroBusca.value = true
      } finally {
        if (numero === ultimaBusca) buscou.value = true
      }
    }

    watch(nomeDigitado, termo => {
      window.clearTimeout(espera)
      buscou.value = false
      erroBusca.value = false
      if (termo.length < 2) {
        ultimaBusca++
        sugestoes.value = []
        return
      }
      espera = window.setTimeout(() => procurar(termo), 300)
    }, { immediate: true })

    // Ao sair do campo: "cuiaba" vira "Cuiabá / MT", igual à lista oficial.
    function aoSair() {
      emFoco.value = false
      if (erroBusca.value && nomeDigitado.value.length >= 2) {
        procurar(nomeDigitado.value)
        return
      }
      const cidade = acharCidade()
      if (cidade && nomeComUf(cidade) !== props.modelValue) emit('update:modelValue', nomeComUf(cidade))
    }

    return { nomes, emFoco, naoEncontrada, erroBusca, aoSair }
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
