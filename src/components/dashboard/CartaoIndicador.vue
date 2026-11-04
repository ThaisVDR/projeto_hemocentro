<template>
  <article class="cartao indicador">
    <span class="indicador__rotulo">{{ rotulo }}</span>
    <strong class="indicador__valor">{{ valor === null ? '—' : valor.toLocaleString('pt-BR') }}</strong>
    <span class="indicador__detalhe">{{ detalhe }}</span>
  </article>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

// Um número grande com rótulo em cima e uma linha de detalhe embaixo.
// `valor` null = ainda carregando ou indisponível (mostra "—", nunca 0).
export default defineComponent({
  name: 'CartaoIndicador',
  props: {
    rotulo: { type: String, required: true },
    valor: { type: Number as PropType<number | null>, default: null },
    detalhe: { type: String, default: '' }
  }
})
</script>

<style scoped>
.indicador {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.indicador__rotulo {
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.indicador__valor {
  font-size: 32px;
  line-height: 1.1;
}

.indicador__detalhe {
  min-height: 32px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}
</style>