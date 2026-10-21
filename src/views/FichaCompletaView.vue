<template>
  <section>
    <PageHeader
      titulo="Ficha completa do paciente"
      subtitulo="Consulta consolidada da ficha atualizada, com base exclusiva nos registros validados."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'FichaCompletaView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
