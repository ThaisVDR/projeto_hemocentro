<template>
  <section>
    <PageHeader
      titulo="Visão geral do acervo"
      subtitulo="Da digitalização à conferência: acompanhe o avanço e o que precisa de atenção."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'DashboardView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
