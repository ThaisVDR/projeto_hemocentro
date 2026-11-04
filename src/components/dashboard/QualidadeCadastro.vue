<template>
  <section class="cartao qualidade">
    <header>
      <h3>Qualidade do cadastro</h3>
      <p>Considera apenas as {{ qualidade.validadas.toLocaleString('pt-BR') }} fichas validadas</p>
    </header>

    <p v-if="qualidade.validadas === 0" class="qualidade__vazio">Nenhuma ficha validada no período.</p>
    <template v-else>
      <div class="qualidade__numero">
        <strong>{{ percentualTexto }}%</strong>
        <span>{{ qualidade.completas.toLocaleString('pt-BR') }} completas</span>
      </div>

      <div
        class="qualidade__barra"
        role="progressbar"
        aria-label="Cadastros completos"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="qualidade.percentual"
      >
        <span :style="{ width: `${Math.min(100, qualidade.percentual)}%` }"></span>
      </div>

      <p class="qualidade__nota">
        {{ lacunas.toLocaleString('pt-BR') }} ficha(s) com lacunas cadastrais. A ausência de CPF não impede a validação.
      </p>
    </template>

    <small>
      Completo = nome, nascimento, sexo, raça/cor, ABO/Rh, prontuário, cartão SUS, diagnóstico, nome da mãe,
      nome do pai e município.
    </small>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { DashboardApi } from '@/services/api'

export default defineComponent({
  name: 'QualidadeCadastro',
  props: {
    qualidade: { type: Object as PropType<DashboardApi['qualidadeCadastro']>, required: true }
  },
  setup(props) {
    const percentualTexto = computed(() =>
      props.qualidade.percentual.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    )
    const lacunas = computed(() => props.qualidade.validadas - props.qualidade.completas)
    return { percentualTexto, lacunas }
  }
})
</script>

<style scoped>
.qualidade {
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

.qualidade__numero {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.qualidade__numero strong {
  font-size: 32px;
  line-height: 1.1;
}

.qualidade__numero span {
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.qualidade__barra {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--cor-neutro-suave);
}

.qualidade__barra span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--cor-sucesso);
}

.qualidade__nota {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.qualidade__vazio {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-fraco);
}

small {
  font-size: 11px;
  color: var(--cor-texto-fraco);
}
</style>