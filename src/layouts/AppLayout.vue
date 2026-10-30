<template>
  <div class="layout">
    <AppSidebar />
    <div class="layout__principal">
      <AppTopbar />
      <main class="layout__conteudo">
        <router-view />
      </main>
      <footer class="layout__rodape">
        <span>Hemocentro MT • Digitalização e estruturação inteligente</span>
        <span>Conferência humana obrigatória</span>
      </footer>
    </div>
    <AvisosFlutuantes />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import AvisosFlutuantes from '@/components/layout/AvisosFlutuantes.vue'

export default defineComponent({
  name: 'AppLayout',
  components: { AppSidebar, AppTopbar, AvisosFlutuantes }
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.layout__principal {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.layout__conteudo {
  flex: 1;
  padding: 32px 28px;
}

.layout__rodape {
  display: flex;
  justify-content: space-between;
  padding: 16px 28px 24px;
  font-size: 10px;
  color: var(--cor-texto-fraco);
}
</style>
