<template>
  <section class="secao" :id="numero ? `secao-${numero}` : undefined">
    <header class="secao__cabecalho">
      <div class="secao__titulo">
        <span v-if="numero" class="secao__numero">{{ numero }}</span>
        <div>
          <h3>{{ titulo }} <span v-if="pagina" class="secao__pagina">— Pág. {{ pagina }}</span></h3>
          <p v-if="subtitulo">{{ subtitulo }}</p>
        </div>
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
    numero: { type: Number, default: 0 },
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
  margin-top: 20px;
  padding: 0 18px 20px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio-grande);
  scroll-margin-top: 72px;
}

.secao__cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin: 0 -18px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--cor-borda);
  border-radius: var(--raio-grande) var(--raio-grande) 0 0;
  background: var(--cor-primaria-suave);
}

.secao__titulo {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.secao__numero {
  display: inline-grid;
  flex-shrink: 0;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--cor-primaria);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

h3 {
  font-size: 17px;
  color: var(--cor-primaria-escura);
}

.secao__pagina {
  font-weight: 500;
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
