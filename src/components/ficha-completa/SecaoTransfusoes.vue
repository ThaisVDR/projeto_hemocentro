<template>
  <FamiliaDocumental
    sigla="FT"
    titulo="Ficha transfusional"
    descricao="Identificação do receptor, último atendimento e informações operacionais."
  >
    <dl class="ficha-grade">
      <CampoFicha rotulo="Grupo sanguíneo ABO/Rh" :valor="paciente.aboRh ? traduzirAboRh(paciente.aboRh) : null" />
      <CampoFicha rotulo="Diagnóstico" :valor="paciente.diagnostico" />
    </dl>

    <p class="ficha-aviso ficha-aviso--info">
      <strong>Alergias:</strong>
      <template v-if="paciente.alergias">{{ paciente.alergias }}</template>
      <template v-else>
        não informado nos registros validados. Ausência de informação não significa ausência de alergias.
      </template>
    </p>

    <p v-if="transfusoes.length === 0" class="ficha-vazio">Nenhuma transfusão nos registros validados.</p>

    <article v-for="t in transfusoes" :key="t.id" class="ficha-registro">
      <header class="ficha-registro__cabecalho">
        <strong>Transfusão • {{ formatarData(t.dataEnvio) }}</strong>
        <span class="ficha-origem">{{ textoOrigem(t.origem) }}</span>
      </header>
      <dl class="ficha-grade">
        <CampoFicha rotulo="Hemocomponente" :valor="t.tipoHemocomponente" />
        <CampoFicha rotulo="Nº da doação" :valor="t.numeroDoacao" />
        <CampoFicha rotulo="Nº Serviço / Vol." :valor="t.numeroServico" />
        <CampoFicha rotulo="Tracejador" :valor="t.tracejador" />
        <CampoFicha rotulo="GR.S / RhD" :valor="traduzirAboRh(t.grsRhd)" />
        <CampoFicha rotulo="Volume" :valor="`${t.volMl} mL`" />
        <CampoFicha rotulo="Testes PAI" :valor="traduzirResultadoTeste(t.testesPai)" />
        <CampoFicha rotulo="Prova cruzada" :valor="traduzirResultadoTeste(t.provaCruzada)" />
        <CampoFicha rotulo="Destino" :valor="t.destino" />
        <CampoFicha rotulo="Responsável pela liberação" :valor="t.responsavelLiberacao" />
      </dl>
    </article>
  </FamiliaDocumental>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { FichaCompletaApi, TransfusaoApi } from '@/services/api'
import { traduzirAboRh, traduzirResultadoTeste } from '@/domain/traducao'
import { formatarData, textoOrigem } from '@/utils/formatacao'
import CampoFicha from './CampoFicha.vue'
import FamiliaDocumental from './FamiliaDocumental.vue'

export default defineComponent({
  name: 'SecaoTransfusoes',
  components: { CampoFicha, FamiliaDocumental },
  props: {
    paciente: { type: Object as PropType<FichaCompletaApi['paciente']>, required: true },
    transfusoes: { type: Array as PropType<TransfusaoApi[]>, required: true }
  },
  setup() {
    return { traduzirAboRh, traduzirResultadoTeste, formatarData, textoOrigem }
  }
})
</script>