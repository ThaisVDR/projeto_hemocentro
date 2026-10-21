<template>
  <div class="conferencia" :class="`conferencia--${conferencia.estado}`">
    <span>
      <component :is="conferencia.estado === 'sugerido' ? Sparkles : Check" :size="14" />
      {{ texto }}
    </span>
    <button v-if="conferencia.estado === 'sugerido'" type="button" class="botao" @click="$emit('confirmar')">
      <Check :size="14" /> Confirmar tabela
    </button>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { Check, Sparkles } from 'lucide-vue-next'
import { Conferencia } from '@/domain/revisao'

export default defineComponent({
  name: 'ConferenciaTabela',
  components: { Check },
  props: {
    conferencia: { type: Object as PropType<Conferencia>, required: true }
  },
  emits: ['confirmar'],
  setup(props) {
    const texto = computed(() => {
      if (props.conferencia.estado === 'sugerido') {
        return `${props.conferencia.rotulo}: sugestão da IA • conferir linha a linha antes de aprovar`
      }
      return `${props.conferencia.rotulo}: conferida • original, p. ${props.conferencia.pagina}`
    })
    return { texto, Check, Sparkles }
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
