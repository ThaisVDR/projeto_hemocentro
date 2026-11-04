<template>
  <FamiliaDocumental
    sigla="IH"
    titulo="Pesquisa imuno-hematológica e fenotipagem eritrocitária"
    descricao="Fator Rh, anticorpos irregulares, TAD e fenotipagem eritrocitária."
  >
    <p v-if="pesquisas.length === 0" class="ficha-vazio">
      Nenhuma pesquisa imuno-hematológica nos registros validados.
    </p>

    <article v-for="p in pesquisas" :key="p.id" class="ficha-registro">
      <header class="ficha-registro__cabecalho">
        <strong>Pesquisa • {{ formatarData(p.dataPesquisa) }}</strong>
        <span class="ficha-origem">{{ textoOrigem(p.origem) }}</span>
      </header>

      <dl class="ficha-grade">
        <CampoFicha rotulo="Grupo sanguíneo (GS)" :valor="p.gs" />
        <CampoFicha rotulo="Fator Rh" :valor="traduzirRh(p.rh)" />
        <CampoFicha rotulo="D fraco" :valor="p.dFraco" />
        <CampoFicha rotulo="Anticorpos irregulares (PAI)" :valor="traduzirResultadoTeste(p.pai)" />
        <CampoFicha rotulo="Autocontrole" :valor="traduzirResultadoTeste(p.autocontrole)" />
        <CampoFicha rotulo="Globulina monoespecífica (DC Screening I)" :valor="traduzirResultadoTeste(p.dcScreening)" />
        <CampoFicha rotulo="Globulina humana TAD" :valor="traduzirResultadoTeste(p.tad)" />
        <CampoFicha rotulo="Método" :valor="p.metodologia" />
        <CampoFicha rotulo="Amostra" :valor="p.amostra" />
        <CampoFicha rotulo="Responsável" :valor="p.responsavel" />
        <CampoFicha rotulo="Especificidade de anticorpos irregulares" :valor="p.especificidade" />
        <CampoFicha rotulo="Interpretação" :valor="p.interpretacao" />
        <CampoFicha rotulo="Observação" :valor="p.observacao" />
      </dl>

      <div>
        <h4>Fenotipagem eritrocitária</h4>
        <div v-if="p.fenotipagem.length > 0" class="ficha-chips">
          <span v-for="f in p.fenotipagem" :key="f.antigeno" class="selo" :class="classeReacao(f.resultado)">
            {{ f.antigeno }}: {{ f.resultado }}
          </span>
        </div>
        <p v-else class="ficha-vazio">Não informado nos registros validados</p>
      </div>
    </article>
  </FamiliaDocumental>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { PesquisaImunoApi } from '@/services/api'
import { Reacao, interpretarReacao } from '@/domain/fenotipo'
import { traduzirResultadoTeste, traduzirRh } from '@/domain/traducao'
import { formatarData, textoOrigem } from '@/utils/formatacao'
import CampoFicha from './CampoFicha.vue'
import FamiliaDocumental from './FamiliaDocumental.vue'

export default defineComponent({
  name: 'SecaoPesquisas',
  components: { CampoFicha, FamiliaDocumental },
  props: {
    pesquisas: { type: Array as PropType<PesquisaImunoApi[]>, required: true }
  },
  setup() {
    // Só destaca o que foi lido como positivo; "nt", "NR" ou vazio nunca é tratado como negativo.
    function classeReacao(resultado: string): string {
      return interpretarReacao(resultado as Reacao) === 'positivo' ? 'selo--info' : 'selo--neutro'
    }

    return { classeReacao, traduzirResultadoTeste, traduzirRh, formatarData, textoOrigem }
  }
})
</script>

<style scoped>
h4 {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--cor-texto-suave);
}
</style>