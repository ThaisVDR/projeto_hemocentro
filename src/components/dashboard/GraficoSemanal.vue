<template>
  <section class="cartao grafico">
    <header class="grafico__cabecalho">
      <div>
        <h3>Evolução da digitalização</h3>
        <p>Fichas recebidas por semana</p>
      </div>
      <span v-if="semanas.length > 0" class="selo selo--neutro">{{ total.toLocaleString('pt-BR') }} fichas no período</span>
    </header>

    <p v-if="semanas.length === 0" class="grafico__vazio">Nenhuma semana no período selecionado.</p>
    <template v-else>
      <div class="grafico__area" role="img" :aria-label="`Fichas recebidas por semana: ${resumoAcessivel}`">
        <div v-for="(s, i) in semanas" :key="s.semana" class="coluna" :title="`Semana de ${formatarData(s.semana)}`">
          <span class="coluna__valor">{{ s.fichas }}</span>
          <div class="coluna__trilho">
            <div
              class="coluna__barra"
              :class="{ 'coluna__barra--atual': i === semanas.length - 1 }"
              :style="{ height: altura(s.fichas) }"
            ></div>
          </div>
          <span class="coluna__semana">{{ formatarData(s.semana).slice(0, 5) }}</span>
        </div>
      </div>
      <p class="grafico__nota">
        Cada barra é uma semana, começando na segunda-feira. A primeira e a última podem estar incompletas.
      </p>
    </template>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { formatarData } from '@/utils/formatacao'

export default defineComponent({
  name: 'GraficoSemanal',
  props: {
    semanas: { type: Array as PropType<{ semana: string; fichas: number }[]>, required: true }
  },
  setup(props) {
    const total = computed(() => props.semanas.reduce((soma, s) => soma + s.fichas, 0))
    const maximo = computed(() => Math.max(1, ...props.semanas.map(s => s.fichas)))

    // Semana sem fichas fica com uma linha fina, para a coluna não "sumir".
    function altura(fichas: number): string {
      return fichas === 0 ? '2px' : `${Math.round((fichas / maximo.value) * 100)}%`
    }

    const resumoAcessivel = computed(() =>
      props.semanas.map(s => `semana de ${formatarData(s.semana)}, ${s.fichas}`).join('; ')
    )

    return { total, altura, resumoAcessivel, formatarData }
  }
})
</script>

<style scoped>
.grafico {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grafico__cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

h3 {
  font-size: 17px;
}

.grafico__cabecalho p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.grafico__area {
  display: flex;
  align-items: stretch;
  gap: 10px;
  height: 190px;
}

.coluna {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.coluna__valor {
  font-size: 12px;
  font-weight: 600;
}

.coluna__trilho {
  display: flex;
  flex: 1;
  align-items: flex-end;
  width: 100%;
  max-width: 56px;
}

.coluna__barra {
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: var(--cor-primaria);
  opacity: 0.3;
}

.coluna__barra--atual {
  opacity: 1;
}

.coluna__semana {
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.grafico__nota,
.grafico__vazio {
  margin: 0;
  font-size: 12px;
  color: var(--cor-texto-fraco);
}
</style>