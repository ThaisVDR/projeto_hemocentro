<template>
  <aside class="menu">
    <div class="menu__marca">
      <span class="menu__logo"><Droplet :size="18" /></span>
      <span>
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
      >
        <component :is="item.icone" :size="16" />
        <span>{{ item.rotulo }}</span>
      </router-link>
    </nav>

    <div class="menu__acervo">
      <p>Acervo em papel</p>
      <strong>≈ 850</strong>
      <small>pacientes ativos previstos na base do projeto</small>
    </div>

    <div class="menu__rodape">
      <a class="menu__item" href="#"><CircleHelp :size="16" /> Guia de conferência</a>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import {
  CircleHelp,
  Droplet,
  FileCheck,
  FolderHeart,
  History,
  LayoutGrid,
  ListChecks,
  Upload
} from 'lucide-vue-next'

export default defineComponent({
  name: 'AppSidebar',
  components: { CircleHelp, Droplet },
  setup() {
    const itens = [
      { rota: 'dashboard', rotulo: 'Dashboard', icone: LayoutGrid },
      { rota: 'upload', rotulo: 'Upload de documentos', icone: Upload },
      { rota: 'fila', rotulo: 'Fila de revisão', icone: ListChecks },
      { rota: 'revisar', rotulo: 'Revisar ficha', icone: FileCheck },
      { rota: 'prontuarios', rotulo: 'Prontuários', icone: FolderHeart },
      { rota: 'auditoria', rotulo: 'Auditoria', icone: History }
    ]
    return { itens }
  }
})
</script>

<style scoped>
.menu {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  width: var(--largura-menu);
  height: 100vh;
  padding: 20px 12px;
  background: var(--cor-superficie);
  border-right: 1px solid var(--cor-borda);
}

.menu__marca {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 20px;
}

.menu__marca strong {
  display: block;
  font-weight: 500;
  font-size: 15px;
}

.menu__marca small {
  font-size: 9px;
  letter-spacing: 0.04em;
  color: var(--cor-texto-suave);
}

.menu__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--raio);
  background: var(--cor-primaria);
  color: #fff;
}

.menu__secao {
  margin: 0 0 8px;
  padding: 0 8px;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: var(--cor-texto-suave);
}

.menu__itens {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--raio);
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.menu__item:hover {
  background: var(--cor-fundo);
}

.menu__item--ativo {
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}

.menu__acervo {
  margin-top: 24px;
  padding: 14px 12px;
  border-radius: var(--raio);
  background: var(--cor-fundo);
}

.menu__acervo p {
  margin: 0 0 6px;
  font-size: 12px;
}

.menu__acervo strong {
  display: block;
  font-size: 22px;
  font-weight: 600;
}

.menu__acervo small {
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.menu__rodape {
  margin-top: auto;
}
</style>
