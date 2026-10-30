<template>
  <div class="conferencia" :class="`conferencia--${conferencia.estado}`">
    <span>
      <component :is="icone" :size="14" />
      {{ texto }}
    </span>
    <button v-if="conferencia.estado === 'sugerido'" type="button" class="botao" @click="$emit('confirmar')">
      <Check :size="14" /> Confirmar tabela
    </button>
    <button v-if="conferencia.estado === 'conferido'" type="button" class="botao" @click="$emit('desfazer')">
      <Undo2 :size="14" /> Desfazer
    </button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { Check, Circle, Sparkles, Undo2 } from 'lucide-vue-next'
import { Conferencia } from '@/domain/revisao'

export default defineComponent({
  name: 'ConferenciaTabela',
  components: { Check, Undo2 },
  props: {
    conferencia: { type: Object as PropType<Conferencia>, required: true }
  },
  emits: ['confirmar', 'desfazer'],
  setup(props) {
    const texto = computed(() => {
      const { rotulo, pagina, estado } = props.conferencia
      if (estado === 'vazio') return `${rotulo}: não preenchida • original, p. ${pagina}`
      if (estado === 'sugerido') return `${rotulo}: sugestão da IA • conferir linha a linha antes de aprovar`
      if (estado === 'editado') return `${rotulo}: preenchida na revisão • p. ${pagina}`
      return `${rotulo}: conferida • original, p. ${pagina}`
    })
    const icone = computed(() => ({
      vazio: Circle,
      sugerido: Sparkles
    } as Record<string, unknown>)[props.conferencia.estado] ?? Check)
    return { texto, icone }
  }
})
</script>

<style scoped>
.conferencia {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.conferencia span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.conferencia--conferido,
.conferencia--editado {
  color: var(--cor-sucesso);
}

.conferencia .botao {
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
}
</style>
