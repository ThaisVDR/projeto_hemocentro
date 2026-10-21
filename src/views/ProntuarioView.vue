<template>
  <section>
    <PageHeader
      titulo="Consulta de prontuário"
      subtitulo="Consulte informações conferidas, histórico e documentos de origem."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'ProntuarioView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
