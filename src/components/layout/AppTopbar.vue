<template>
  <header class="topo">
    <nav class="topo__trilha">
      <span>Gestão de prontuários</span>
      <ChevronRight :size="14" />
      <strong>{{ titulo }}</strong>
    </nav>

    <div class="topo__acoes">
      <span class="topo__data">{{ data }}</span>

      <div v-if="usuario" class="topo__usuario">
        <span class="topo__iniciais">{{ iniciais(usuario.nome) }}</span>
        <span class="topo__nome">
          <small>Logado como</small>
          <strong>{{ usuario.nome }}</strong>
        </span>
        <button type="button" class="topo__sair" title="Sair" @click="sair">
          <LogOut :size="16" />
        </button>
      </div>
      <router-link v-else :to="{ name: 'login' }" class="topo__entrar">
        <LogIn :size="16" /> Sem login • Entrar
      </router-link>
    </div>
  </header>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, LogIn, LogOut } from 'lucide-vue-next'
import { encerrarSessao, usuarioLogado } from '@/services/sessao'
import { iniciais } from '@/utils/formatacao'

export default defineComponent({
  name: 'AppTopbar',
  components: { ChevronRight, LogIn, LogOut },
  setup() {
    const rota = useRoute()
    const roteador = useRouter()
    const titulo = computed(() => rota.meta.titulo as string | undefined)
    const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

    // O login dura só enquanto a aba está aberta (sessionStorage): sair encerra na hora.
    function sair() {
      encerrarSessao()
      roteador.push({ name: 'login' })
    }

    return { titulo, data, usuario: usuarioLogado, iniciais, sair }
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

.topo__usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 14px;
  border-left: 1px solid var(--cor-borda);
}

.topo__iniciais {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 12px;
  font-weight: 700;
}

.topo__nome {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.topo__nome small {
  font-size: 10px;
  color: var(--cor-texto-suave);
}

.topo__nome strong {
  font-size: 13px;
}

.topo__sair {
  display: inline-flex;
  padding: 6px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--cor-texto-suave);
  cursor: pointer;
}

.topo__sair:hover {
  background: var(--cor-fundo);
  color: var(--cor-primaria);
}

.topo__entrar {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--cor-alerta-suave);
  color: var(--cor-alerta);
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
}
</style>
