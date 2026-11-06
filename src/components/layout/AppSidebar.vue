<template>
  <aside class="menu" :class="{ 'menu--recolhido': recolhido }">
    <button
      type="button"
      class="menu__alternar"
      :title="recolhido ? 'Expandir menu' : 'Recolher menu'"
      :aria-label="recolhido ? 'Expandir menu' : 'Recolher menu'"
      :aria-expanded="!recolhido"
      @click="alternar"
    >
      <PanelLeft :size="20" />
    </button>

    <div class="menu__marca">
      <span class="menu__logo"><Droplet :size="18" /></span>
      <span class="menu__titulo">
        <strong>Hemocentro MT</strong>
        <small>PRONTUÁRIO DIGITAL</small>
      </span>
    </div>

    <p class="menu__secao">ÁREA DE TRABALHO</p>
    <nav class="menu__itens">
      <router-link
        v-for="item in itens"
        :key="item.rota"
        :to="{ name: item.rota }"
        class="menu__item"
        active-class="menu__item--ativo"
        :title="recolhido ? item.rotulo : undefined"
      >
        <component :is="item.icone" :size="16" />
        <span class="menu__rotulo">{{ item.rotulo }}</span>
      </router-link>

      <!-- Link exclusivo do Gestor -->
      <router-link
        v-if="ehGestor"
        :to="{ name: 'usuarios' }"
        class="menu__item"
        active-class="menu__item--ativo"
        :title="recolhido ? 'Usuários' : undefined"
      >
        <Users :size="16" />
        <span class="menu__rotulo">Usuários</span>
      </router-link>
    </nav>
  </aside>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { ehGestor } from '@/services/sessao'
import {
  CircleAlert,
  CircleHelp,
  Droplet,
  FolderHeart,
  History,
  LayoutGrid,
  ListChecks,
  PanelLeft,
  Upload,
  Users
} from 'lucide-vue-next'

const CHAVE_RECOLHIDO = 'hmt:menu-recolhido'

// Lembra a preferência da pessoa neste navegador (o try/catch cobre navegação privada).
function lerPreferencia(): boolean {
  try {
    return localStorage.getItem(CHAVE_RECOLHIDO) === '1'
  } catch {
    return false
  }
}

export default defineComponent({
  name: 'AppSidebar',
  components: { CircleHelp, Droplet, PanelLeft, Users },
  setup() {
    const todos: { rota: string; rotulo: string; icone: unknown; requerGestor?: boolean }[] = [
      { rota: 'dashboard', rotulo: 'Dashboard', icone: LayoutGrid },
      { rota: 'upload', rotulo: 'Upload de documentos', icone: Upload },
      { rota: 'leituras', rotulo: 'Leituras com problema', icone: CircleAlert },
      { rota: 'fila', rotulo: 'Fila de revisão', icone: ListChecks },
      { rota: 'prontuarios', rotulo: 'Prontuários', icone: FolderHeart },
      { rota: 'auditoria', rotulo: 'Auditoria', icone: History }
    ]

    const itens = computed(() => todos.filter((item) => !item.requerGestor || ehGestor.value))

    const recolhido = ref(lerPreferencia())

    function alternar() {
      recolhido.value = !recolhido.value
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, recolhido.value ? '1' : '0')
      } catch {
        // Sem armazenamento: o menu recolhe/expande, só não lembra na próxima visita.
      }
    }

    return { itens, ehGestor, recolhido, alternar }
  }
})
</script>

<style scoped>
/*
 * Animação: tudo fica sempre no DOM e só muda largura/opacidade/posição.
 * Os ícones ficam parados (centro em x = 36px nas duas larguras), então nada "pula" de lado.
 */
.menu {
  --ease: cubic-bezier(0.2, 0, 0, 1);

  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 240px;
  height: 100vh;
  padding: 20px 12px;
  overflow: hidden;
  background: var(--cor-superficie);
  border-right: 1px solid var(--cor-borda);
  transition: width 0.18s var(--ease);
}

.menu--recolhido {
  width: 72px;
}

.menu__marca {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
  transition: padding-bottom 0.18s var(--ease);
}

/* Abre espaço para o botão, que desce para baixo do logo */
.menu--recolhido .menu__marca {
  padding-bottom: 62px;
}

.menu__titulo {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  transition: opacity 0.14s ease 0.05s;
}

.menu--recolhido .menu__titulo {
  opacity: 0;
  pointer-events: none;
  transition-delay: 0s;
  transition-duration: 0.08s;
}

.menu__titulo strong {
  display: block;
  font-weight: 500;
  font-size: 15px;
}

.menu__titulo small {
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--cor-texto-suave);
}

.menu__logo {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--raio);
  background: var(--cor-primaria);
  color: #fff;
}

/* Ícone simples (como no Gemini). Desliza do canto direito para baixo do logo. */
.menu__alternar {
  position: absolute;
  top: 18px;
  right: 12px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--cor-texto-suave);
  cursor: pointer;
  outline: none;
  transition:
    top 0.18s var(--ease),
    right 0.18s var(--ease),
    background 0.15s ease,
    color 0.15s ease;
}

.menu--recolhido .menu__alternar {
  top: 62px;
  right: 18px;
}

.menu__alternar:hover {
  background: var(--cor-fundo);
  color: var(--cor-primaria);
}

.menu__alternar:focus-visible {
  box-shadow: 0 0 0 3px var(--cor-primaria-suave);
}

.menu__secao {
  max-height: 20px;
  margin: 0 0 8px;
  padding: 0 8px;
  overflow: hidden;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--cor-texto-suave);
  white-space: nowrap;
  transition:
    opacity 0.14s ease 0.05s,
    max-height 0.18s var(--ease),
    margin 0.18s var(--ease);
}

.menu--recolhido .menu__secao {
  max-height: 0;
  margin-bottom: 0;
  opacity: 0;
  transition-delay: 0s;
  transition-duration: 0.08s, 0.18s, 0.18s;
}

.menu__itens {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 13px;
  color: var(--cor-texto-suave);
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.menu__item svg {
  flex-shrink: 0;
}

.menu__rotulo {
  transition: opacity 0.14s ease 0.05s;
}

.menu--recolhido .menu__rotulo {
  opacity: 0;
  transition-delay: 0s;
  transition-duration: 0.08s;
}

.menu__item:hover {
  background: var(--cor-fundo);
}

.menu__item--ativo {
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}

.menu__rodape {
  margin-top: auto;
}

@media (prefers-reduced-motion: reduce) {
  .menu,
  .menu * {
    transition: none !important;
  }
}
</style>