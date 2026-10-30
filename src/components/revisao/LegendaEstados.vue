<template>
  <ul class="legenda-estados" aria-label="Legenda dos ícones">
    <li v-for="item in estados" :key="item.estado" :class="`legenda-estados__item--${item.estado}`">
      <component :is="item.icone" :size="13" />
      {{ item.rotulo }}
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { ESTADOS_CAMPO } from './estadosCampo'

export default defineComponent({
  name: 'LegendaEstados',
  setup() {
    return { estados: ESTADOS_CAMPO }
  }
})
</script>

<style scoped>
.legenda-estados {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0 0 20px;
  padding: 10px 12px;
  list-style: none;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.legenda-estados li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legenda-estados svg {
  color: var(--cor-texto-fraco);
}

.legenda-estados__item--conferido svg,
.legenda-estados__item--editado svg {
  color: var(--cor-sucesso);
}

.legenda-estados__item--incerto svg {
  color: var(--cor-alerta);
}
</style>
