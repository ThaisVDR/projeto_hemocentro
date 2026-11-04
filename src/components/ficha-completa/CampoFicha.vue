<template>
  <div class="campo">
    <dt>{{ rotulo }}</dt>
    <dd :class="{ 'campo__vazio': vazio }">{{ vazio ? textoVazio : valor }}</dd>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

// Um par "rótulo + valor". Campo sem informação mostra o texto padrão das telas de consulta:
// ausência de dado não é resultado negativo nem normalidade clínica.
export default defineComponent({
  name: 'CampoFicha',
  props: {
    rotulo: { type: String, required: true },
    valor: { type: [String, Number] as PropType<string | number | null>, default: null },
    textoVazio: { type: String, default: 'Não informado nos registros validados' }
  },
  setup(props) {
    const vazio = computed(() => props.valor === null || props.valor === undefined || props.valor === '')
    return { vazio }
  }
})
</script>

<style scoped>
dt {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--cor-texto-suave);
}

dd {
  margin: 4px 0 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.campo__vazio {
  font-size: 13px;
  font-weight: 400;
  color: var(--cor-texto-fraco);
}
</style>