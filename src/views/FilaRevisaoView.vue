<template>
  <section>
    <PageHeader
      titulo="Fila de revisão humana"
      subtitulo="Confira lacunas, corrija extrações e valide cada ficha antes do salvamento."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'FilaRevisaoView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
