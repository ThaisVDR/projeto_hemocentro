<template>
  <section>
    <PageHeader
      titulo="Upload de documentos"
      subtitulo="Envie fichas digitalizadas em lote. A extração só se torna registro após revisão humana."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'UploadView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
