<template>
  <header class="topo">
    <nav class="topo__trilha">
      <span>Gestão de prontuários</span>
      <ChevronRight :size="14" />
      <strong>{{ titulo }}</strong>
    </nav>

    <div class="topo__acoes">
      <span class="topo__data">{{ data }}</span>
    </div>
  </header>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'

export default defineComponent({
  name: 'AppTopbar',
  components: { ChevronRight },
  setup() {
    const rota = useRoute()
    const titulo = computed(() => rota.meta.titulo as string | undefined)
    const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    return { titulo, data }
  }
})
</script>

<style scoped>
.topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 28px;
  background: var(--cor-superficie);
  border-bottom: 1px solid var(--cor-borda);
}

.topo__trilha {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.topo__trilha strong {
  color: var(--cor-texto);
  font-weight: 600;
}

.topo__acoes {
  display: flex;
  align-items: center;
  gap: 14px;
}

.topo__data {
  font-size: 12px;
  color: var(--cor-texto-suave);
}
</style>
