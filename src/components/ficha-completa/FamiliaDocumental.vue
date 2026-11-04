<template>
  <section class="cartao familia">
    <header class="familia__cabecalho">
      <span class="familia__sigla">{{ sigla }}</span>
      <div>
        <h3>{{ titulo }}</h3>
        <p>{{ descricao }}</p>
      </div>
    </header>
    <slot />
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

// Moldura de uma das quatro famílias documentais (FT, DC, DP, IH).
export default defineComponent({
  name: 'FamiliaDocumental',
  props: {
    sigla: { type: String, required: true },
    titulo: { type: String, required: true },
    descricao: { type: String, default: '' }
  }
})
</script>

<style scoped>
.familia {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.familia__cabecalho {
  display: flex;
  align-items: center;
  gap: 12px;
}

.familia__sigla {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--raio);
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 12px;
  font-weight: 700;
}

h3 {
  font-size: 16px;
}

p {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}
</style>