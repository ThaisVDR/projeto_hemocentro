<template>
  <section class="cartao perfil">
    <header>
      <h3>Perfil transfusional</h3>
      <p class="perfil__aviso">
        Calculado a partir dos dados validados • referência para conferência,
        não substitui avaliação técnica nem prova cruzada
      </p>
    </header>

    <div class="perfil__colunas">
      <div>
        <h4>Anticorpos irregulares</h4>
        <table v-if="paciente.anticorpos.length > 0" class="tabela">
          <thead>
            <tr><th>Especificidade</th><th>Data</th><th>Classe</th></tr>
          </thead>
          <tbody>
            <tr v-for="(anticorpo, indice) in paciente.anticorpos" :key="indice">
              <td><strong>{{ anticorpo.especificidade }}</strong></td>
              <td>{{ formatarData(anticorpo.data) || '—' }}</td>
              <td>{{ anticorpo.classe || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="perfil__vazio">Nenhum anticorpo registrado nas fichas validadas.</p>
      </div>

      <div>
        <h4>Exige hemácias negativas para</h4>
        <p v-if="exigidos.length > 0" class="perfil__lista">
          <span v-for="antigeno in exigidos" :key="antigeno" class="perfil__exigido">{{ antigeno }}−</span>
        </p>
        <p v-else class="perfil__vazio">Sem exigência por anticorpo registrado.</p>

        <h4>Pode receber hemácias ABO/RhD de</h4>
        <p v-if="podeReceberDe.length > 0" class="perfil__lista">
          <span v-for="tipo in podeReceberDe" :key="tipo" class="selo selo--neutro">{{ tipo }}</span>
        </p>
        <p v-else class="perfil__vazio">Depende do grupo ABO/RhD, que não está informado ou não foi reconhecido.</p>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { antigenosExigidosNegativos } from '@/domain/fenotipo'
import { doadoresCompativeis, formatarTipoSanguineo, lerTipoSanguineo } from '@/domain/tipoSanguineo'
import { PacienteDetalheApi } from '@/services/api'
import { formatarData } from '@/utils/formatacao'

export default defineComponent({
  name: 'PerfilTransfusional',
  props: {
    paciente: { type: Object as PropType<PacienteDetalheApi>, required: true }
  },
  setup(props) {
    const exigidos = computed(() => {
      const especificidades = props.paciente.anticorpos.map(anticorpo => anticorpo.especificidade)
      return antigenosExigidosNegativos(especificidades)
    })

    const podeReceberDe = computed(() => {
      const tipo = lerTipoSanguineo(props.paciente.aboRh)
      if (!tipo) return []
      return doadoresCompativeis(tipo).map(formatarTipoSanguineo)
    })

    return { exigidos, podeReceberDe, formatarData }
  }
})
</script>

<style scoped>
.perfil {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

h3 {
  font-size: 17px;
}

.perfil__aviso {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.perfil__colunas {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 24px;
}

h4 {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--cor-texto-suave);
}

h4 + .perfil__lista,
h4 + .perfil__vazio {
  margin-bottom: 20px;
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
}

.perfil__lista {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 0;
}

.perfil__lista .selo::before {
  display: none;
}

.perfil__exigido {
  font-size: 18px;
  font-weight: 700;
  color: var(--cor-primaria);
}

.perfil__vazio {
  margin-top: 0;
  font-size: 13px;
  color: var(--cor-texto-fraco);
}
</style>