<template>
  <div class="cabecalho">
    <div>
      <h1>{{ titulo }}</h1>
      <p v-if="subtitulo">{{ subtitulo }}</p>
    </div>
    <div class="cabecalho__acoes">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PageHeader',
  props: {
    titulo: { type: String, required: true },
    subtitulo: { type: String, default: '' }
  }
})
</script>

<style scoped>
.cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

h1 {
  font-size: 26px;
}

p {
  margin: 6px 0 0;
  color: var(--cor-texto-suave);
}

.cabecalho__acoes {
  display: flex;
  gap: 12px;
}
</style>
