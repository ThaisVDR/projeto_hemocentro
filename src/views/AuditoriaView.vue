<template>
  <section>
    <PageHeader
      titulo="Auditoria e rastreabilidade"
      subtitulo="Acompanhe autoria, origem e alterações do envio à validação de cada ficha."
    />
    <div class="cartao em-construcao">Tela em construção.</div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PageHeader from '@/components/PageHeader.vue'

export default defineComponent({
  name: 'AuditoriaView',
  components: { PageHeader }
})
</script>

<style scoped>
.em-construcao {
  color: var(--cor-texto-suave);
}
</style>
