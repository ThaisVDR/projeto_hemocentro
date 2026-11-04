<template>
  <section class="cartao bloco">
    <header>
      <h3>Atividade recente</h3>
      <p>Últimos eventos registrados</p>
    </header>

    <p v-if="carregando" class="bloco__estado">Carregando atividade…</p>
    <p v-else-if="erro" class="bloco__estado bloco__estado--erro">{{ erro }}</p>
    <p v-else-if="eventos.length === 0" class="bloco__estado">Nenhum evento registrado ainda.</p>

    <ul v-else class="lista">
      <li v-for="evento in eventos" :key="evento.id">
        <strong>{{ descreverEvento(evento) }}</strong>
        <small>{{ evento.usuario?.nome || 'Sistema' }} • {{ formatarQuando(evento.ocorridoEm) }}</small>
      </li>
    </ul>

    <router-link :to="{ name: 'auditoria' }" class="link">Consultar trilha de auditoria →</router-link>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { EventoAuditoriaApi } from '@/services/api'
import { descreverEvento } from '@/domain/dashboard'
import { formatarQuando } from '@/utils/formatacao'

export default defineComponent({
  name: 'AtividadeRecente',
  props: {
    eventos: { type: Array as PropType<EventoAuditoriaApi[]>, required: true },
    carregando: { type: Boolean, default: false },
    erro: { type: String as PropType<string | null>, default: null }
  },
  setup() {
    return { descreverEvento, formatarQuando }
  }
})
</script>

<style scoped>
.bloco {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h3 {
  font-size: 17px;
}

header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.bloco__estado {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-fraco);
}

.bloco__estado--erro {
  color: var(--cor-primaria);
}

.lista {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lista li {
  padding-left: 12px;
  border-left: 3px solid var(--cor-borda);
}

.lista strong {
  display: block;
  font-size: 13px;
}

.lista small {
  color: var(--cor-texto-suave);
}

.link {
  color: var(--cor-info);
  font-size: 13px;
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}
</style>