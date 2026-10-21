<template>
  <header class="topo">
    <nav class="topo__trilha">
      <span>Gestão de prontuários</span>
      <ChevronRight :size="14" />
      <strong>{{ titulo }}</strong>
    </nav>

    <div class="topo__acoes">
      <span class="topo__data">{{ data }}</span>
      <Bell :size="16" class="topo__sino" />
      <span class="topo__separador" />
      <span class="topo__avatar">{{ usuario.iniciais }}</span>
      <span class="topo__usuario">
        <strong>{{ usuario.nome }}</strong>
        <small>{{ usuario.perfil }} • usuário fictício</small>
      </span>
      <ChevronDown :size="16" class="topo__sino" />
    </div>
  </header>
  <div class="aviso-demo">
    <FlaskConical :size="14" />
    Dados fictícios: pacientes, documentos e indicadores são exemplos de demonstração.
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, ChevronDown, ChevronRight, FlaskConical } from 'lucide-vue-next'
import { dataDemonstracao, usuarioAtual } from '@/mocks/sessao'

export default defineComponent({
  name: 'AppTopbar',
  components: { Bell, ChevronDown, ChevronRight, FlaskConical },
  setup() {
    const rota = useRoute()
    const titulo = computed(() => rota.meta.titulo as string | undefined)
    return { titulo, usuario: usuarioAtual, data: dataDemonstracao }
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

.topo__sino {
  color: var(--cor-texto-suave);
}

.topo__separador {
  width: 1px;
  height: 28px;
  background: var(--cor-borda);
}

.topo__avatar {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 11px;
  font-weight: 700;
}

.topo__usuario strong {
  display: block;
  font-size: 12px;
  font-weight: 600;
}

.topo__usuario small {
  font-size: 10px;
  color: var(--cor-texto-suave);
}

.aviso-demo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 28px;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 11px;
}
</style>
