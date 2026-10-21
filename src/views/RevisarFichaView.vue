<template>
  <section>
    <PageHeader
      titulo="Revisar ficha"
      subtitulo="Documento original ao lado dos dados extraídos pela IA."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'RevisarFichaView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
