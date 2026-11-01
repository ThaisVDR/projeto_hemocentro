<template>
  <div class="campo-busca">
    <input
      ref="entrada"
      class="campo-busca__entrada"
      :value="modelValue ?? ''"
      :placeholder="placeholder"
      role="combobox"
      autocomplete="off"
      :aria-expanded="mostrarLista"
      :aria-controls="idLista"
      :aria-activedescendant="ativo >= 0 ? `${idLista}-${ativo}` : undefined"
      @input="aoDigitar"
      @focus="aoFocar"
      @blur="aoSair"
      @keydown="aoTeclar"
    />
    <Teleport to="body">
      <ul v-if="mostrarLista" :id="idLista" ref="lista" class="campo-busca__lista" role="listbox" :style="posicao">
        <li
          v-for="(opcao, indice) in opcoes"
          :id="`${idLista}-${indice}`"
          :key="opcao"
          role="option"
          class="campo-busca__opcao"
          :class="{ 'campo-busca__opcao--ativa': indice === ativo }"
          :aria-selected="indice === ativo"
          @mousedown.prevent="escolher(opcao)"
          @mouseenter="ativo = indice"
        >
          {{ opcao }}
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'

let proximoId = 0

// Campo com lista de sugestões desenhada logo abaixo dele. A lista mostra todas as opções recebidas
// (quem filtra é o backend) e funciona com o teclado: ↑ ↓ escolhem, Enter confirma, Esc fecha.
export default defineComponent({
  name: 'CampoBusca',
  props: {
    modelValue: { type: String as PropType<string | null>, default: null },
    opcoes: { type: Array as PropType<string[]>, default: () => [] },
    placeholder: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'foco', 'sair'],
  setup(props, { emit }) {
    const idLista = `sugestoes-${++proximoId}`
    const entrada = ref<HTMLInputElement | null>(null)
    const lista = ref<HTMLUListElement | null>(null)
    const aberta = ref(false)
    const ativo = ref(-1)
    const posicao = ref<Record<string, string>>({})

    const mostrarLista = computed(() => aberta.value && props.opcoes.length > 0)

    // A lista fica no <body> (Teleport) para não ser cortada pela tabela que rola de lado,
    // então a posição é calculada a partir do campo na tela.
    function posicionar() {
      const caixa = entrada.value?.getBoundingClientRect()
      if (!caixa) return
      posicao.value = { top: `${caixa.bottom + 4}px`, left: `${caixa.left}px`, minWidth: `${caixa.width}px` }
    }

    function abrir() {
      posicionar()
      aberta.value = true
    }

    function fechar() {
      aberta.value = false
      ativo.value = -1
    }

    function aoFocar() {
      emit('foco')
      abrir()
    }

    function aoDigitar(evento: Event) {
      emit('update:modelValue', (evento.target as HTMLInputElement).value)
      ativo.value = -1
      abrir()
    }

    function escolher(opcao: string) {
      emit('update:modelValue', opcao)
      fechar()
    }

    function aoSair() {
      fechar()
      emit('sair')
    }

    function aoTeclar(evento: KeyboardEvent) {
      const total = props.opcoes.length
      if (!mostrarLista.value) {
        if (evento.key === 'ArrowDown') abrir()
        return
      }
      if (evento.key === 'ArrowDown') {
        evento.preventDefault()
        ativo.value = (ativo.value + 1) % total
      } else if (evento.key === 'ArrowUp') {
        evento.preventDefault()
        ativo.value = ativo.value <= 0 ? total - 1 : ativo.value - 1
      } else if (evento.key === 'Enter' && ativo.value >= 0) {
        evento.preventDefault()
        escolher(props.opcoes[ativo.value])
      } else if (evento.key === 'Escape') {
        fechar()
      }
    }

    // Ao rolar a página ou a tabela, a lista acompanha o campo em vez de ficar solta na tela.
    function aoRolar(evento: Event) {
      if (!aberta.value) return
      if (evento.target instanceof Node && lista.value?.contains(evento.target)) return
      posicionar()
    }

    watch(() => props.opcoes, () => {
      ativo.value = -1
      if (aberta.value) posicionar()
    })

    onMounted(() => window.addEventListener('scroll', aoRolar, true))
    onBeforeUnmount(() => window.removeEventListener('scroll', aoRolar, true))

    return {
      idLista, entrada, lista, ativo, posicao, mostrarLista,
      aoFocar, aoDigitar, aoSair, aoTeclar, escolher
    }
  }
})
</script>

<style scoped>
.campo-busca__entrada {
  width: 100%;
  min-width: 120px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font: inherit;
  background: var(--cor-superficie);
}

.campo-busca__lista {
  position: fixed;
  z-index: 200;
  max-height: 240px;
  margin: 0;
  padding: 4px;
  overflow-y: auto;
  list-style: none;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  box-shadow: 0 8px 24px rgba(31, 35, 40, 0.14);
  font-size: 13px;
}

.campo-busca__opcao {
  padding: 6px 10px;
  border-radius: 6px;
  white-space: nowrap;
  cursor: pointer;
}

.campo-busca__opcao--ativa {
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}
</style>
