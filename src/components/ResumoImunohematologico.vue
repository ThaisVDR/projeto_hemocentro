<template>
  <section class="resumo">
    <header>
      <h3>Perfil imuno-hematológico</h3>
      <p>Calculado a partir dos dados registrados • referência para conferência, não substitui avaliação técnica</p>
    </header>

    <p v-for="alerta in resumo.alertas" :key="alerta" class="resumo__alerta">
      <AlertTriangle :size="16" /> {{ alerta }}
    </p>

    <dl class="resumo__destaques">
      <div class="resumo__item resumo__item--raca">
        <dt>1. Raça/cor</dt>
        <dd>{{ resumo.racaCor }}</dd>
      </div>
      <div class="resumo__item">
        <dt>2. Grupo ABO/RhD</dt>
        <dd v-if="resumo.tipoSanguineo">{{ resumo.tipoSanguineo }}</dd>
        <dd v-else class="resumo__vazio">
          {{ resumo.tipoNaoInterpretado ? `Não interpretado: "${resumo.tipoNaoInterpretado}"` : 'Não informado' }}
        </dd>
      </div>
    </dl>

    <div class="resumo__bloco">
      <h4>3. Antígenos eritrocitários</h4>
      <p v-if="resumo.sistemas.length === 0" class="resumo__vazio">Fenotipagem não informada.</p>
      <div v-for="sistema in resumo.sistemas" :key="sistema.sistema" class="resumo__sistema">
        <span class="resumo__sistema-nome">{{ sistema.sistema }}</span>
        <span
          v-for="item in sistema.antigenos"
          :key="item.antigeno"
          class="antigeno"
          :class="`antigeno--${item.status}`"
          :title="rotuloStatus[item.status]"
        >
          {{ item.antigeno }} <small>{{ item.reacao ?? '—' }}</small>
        </span>
      </div>
      <p class="resumo__legenda">
        <span class="antigeno antigeno--positivo">positivo</span>
        <span class="antigeno antigeno--negativo">negativo</span>
        <span class="antigeno antigeno--desconhecido">nt / NR / vazio</span>
      </p>
    </div>

    <div class="resumo__bloco">
      <h4>4. Anticorpos irregulares</h4>
      <p v-if="resumo.anticorpos.length === 0" class="resumo__vazio">Nenhum anticorpo registrado.</p>
      <p v-else>
        <span v-for="anticorpo in resumo.anticorpos" :key="anticorpo" class="selo selo--perigo">{{ anticorpo }}</span>
      </p>
    </div>

    <div class="resumo__bloco resumo__exigencias">
      <div>
        <h4>Exige hemácias negativas para</h4>
        <p v-if="resumo.antigenosExigidosNegativos.length === 0" class="resumo__vazio">Sem exigência por anticorpo.</p>
        <p v-else>
          <strong v-for="antigeno in resumo.antigenosExigidosNegativos" :key="antigeno" class="resumo__exigido">
            {{ antigeno }}−
          </strong>
        </p>
      </div>
      <div>
        <h4>Pode receber hemácias ABO/RhD de</h4>
        <p v-if="resumo.podeReceberDe.length === 0" class="resumo__vazio">Depende do grupo ABO/RhD.</p>
        <p v-else>{{ resumo.podeReceberDe.join(', ') }}</p>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { DadosImunohematologicos, montarResumoImunohematologico } from '@/domain/resumoImunohematologico'

export default defineComponent({
  name: 'ResumoImunohematologico',
  components: { AlertTriangle },
  props: {
    dados: { type: Object as PropType<DadosImunohematologicos>, required: true }
  },
  setup(props) {
    const resumo = computed(() => montarResumoImunohematologico(props.dados))
    const rotuloStatus = {
      positivo: 'Positivo',
      negativo: 'Negativo',
      desconhecido: 'Não testado, não realizado ou não informado'
    }
    return { resumo, rotuloStatus }
  }
})
</script>

<style scoped>
.resumo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

h3 {
  font-size: 16px;
}

header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

h4 {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--cor-texto-suave);
}

.resumo__alerta {
  display: flex;
  gap: 10px;
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--raio);
  background: var(--cor-alerta-suave);
  color: var(--cor-alerta);
  font-size: 13px;
}

.resumo__alerta svg {
  flex-shrink: 0;
}

.resumo__destaques {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0;
}

.resumo__item {
  padding: 12px 14px;
  border-radius: var(--raio);
  background: var(--cor-fundo);
}

.resumo__item--raca {
  background: var(--cor-primaria-suave);
}

.resumo__item dt {
  font-size: 11px;
  font-weight: 600;
  color: var(--cor-texto-suave);
}

.resumo__item dd {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
}

.resumo__bloco p {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
}

.resumo__sistema {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.resumo__sistema-nome {
  width: 64px;
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.antigeno {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.antigeno small {
  font-weight: 400;
}

.antigeno--positivo { background: var(--cor-sucesso-suave); color: var(--cor-sucesso); }
.antigeno--negativo { background: var(--cor-neutro-suave); color: var(--cor-texto); }
.antigeno--desconhecido { background: transparent; border: 1px dashed var(--cor-borda); color: var(--cor-texto-fraco); }

.resumo__legenda {
  margin-top: 8px !important;
}

.resumo__legenda .antigeno {
  font-size: 10px;
  font-weight: 400;
}

.resumo__exigencias {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--cor-borda);
}

.resumo__exigido {
  font-size: 16px;
  color: var(--cor-primaria);
}

.resumo__vazio {
  color: var(--cor-texto-fraco);
  font-size: 12px;
}
</style>
