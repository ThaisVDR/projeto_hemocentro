<template>
  <section class="cartao bloco">
    <header class="bloco__cabecalho">
      <div>
        <h3>Prioridades de revisão</h3>
        <p>Pendências da fila humana • sem inferência clínica</p>
      </div>
      <router-link :to="{ name: 'fila' }" class="link">Ver fila →</router-link>
    </header>

    <p v-if="carregando" class="bloco__estado">Carregando prioridades…</p>
    <p v-else-if="erro" class="bloco__estado bloco__estado--erro">{{ erro }}</p>
    <p v-else-if="itens.length === 0" class="bloco__estado">Nenhuma ficha aguardando revisão. A fila está em dia.</p>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Paciente / ficha</th>
          <th>Atenção</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ficha in itens" :key="ficha.id">
          <td>
            <strong>{{ ficha.paciente?.nome || 'Nome não identificado' }}</strong>
            <small>{{ ficha.codigo }} • lote {{ ficha.lote.codigo }}</small>
          </td>
          <td>
            <span v-if="ficha.alertas.length === 0" class="sem-alerta">Sem alerta</span>
            <span v-for="alerta in ficha.alertas" :key="alerta" class="selo" :class="descreverAlerta(alerta).classe">
              {{ descreverAlerta(alerta).rotulo }}
            </span>
          </td>
          <td>
            <router-link :to="{ name: 'revisar', params: { fichaId: ficha.id } }" class="link">Revisar →</router-link>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { FichaFilaApi } from '@/services/api'
import { descreverAlerta } from '@/domain/dashboard'

export default defineComponent({
  name: 'PrioridadesRevisao',
  props: {
    itens: { type: Array as PropType<FichaFilaApi[]>, required: true },
    carregando: { type: Boolean, default: false },
    erro: { type: String as PropType<string | null>, default: null }
  },
  setup() {
    return { descreverAlerta }
  }
})
</script>

<style scoped>
.bloco {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bloco__cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

h3 {
  font-size: 17px;
}

.bloco__cabecalho p {
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

.tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tabela th {
  padding: 8px 10px;
  background: var(--cor-fundo);
  font-size: 11px;
  font-weight: 600;
  text-align: left;
  color: var(--cor-texto-suave);
}

.tabela td {
  padding: 10px;
  border-bottom: 1px solid var(--cor-borda);
  vertical-align: top;
}

.tabela small {
  display: block;
  color: var(--cor-texto-suave);
}

.tabela .selo {
  margin: 0 6px 4px 0;
}

.sem-alerta {
  color: var(--cor-texto-fraco);
}

.link {
  color: var(--cor-info);
  font-weight: 600;
  white-space: nowrap;
}

.link:hover {
  text-decoration: underline;
}
</style>