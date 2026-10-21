<template>
  <section class="secao">
    <header class="secao__cabecalho">
      <div>
        <h3>{{ titulo }} <span v-if="pagina" class="secao__pagina">— Pág. {{ pagina }}</span></h3>
        <p v-if="subtitulo">{{ subtitulo }}</p>
      </div>
      <span v-if="etiqueta" class="secao__etiqueta">{{ etiqueta }}</span>
    </header>
    <slot />
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SecaoRevisao',
  props: {
    titulo: { type: String, required: true },
    subtitulo: { type: String, default: '' },
    pagina: { type: Number, default: 0 },
    etiqueta: { type: String, default: '' }
  }
})
</script>

<style scoped>
.secao {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 0;
  border-top: 1px solid var(--cor-borda);
}

.secao:first-of-type {
  border-top: 0;
  padding-top: 8px;
}

.secao__cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

h3 {
  font-size: 16px;
}

.secao__pagina {
  color: var(--cor-texto-suave);
}

p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.secao__etiqueta {
  font-size: 11px;
  color: var(--cor-texto-suave);
  white-space: nowrap;
}
</style>
