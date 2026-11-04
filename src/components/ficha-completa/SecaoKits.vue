<template>
  <FamiliaDocumental :sigla="texto.sigla" :titulo="texto.titulo" :descricao="texto.descricao">
    <p v-if="kits.length === 0" class="ficha-vazio">Nenhum registro {{ texto.nome }} nos registros validados.</p>

    <article v-for="kit in kits" :key="kit.id" class="ficha-registro">
      <header class="ficha-registro__cabecalho">
        <strong>Pesquisa • {{ formatarData(kit.dataPesquisa) }}</strong>
        <span class="ficha-origem">{{ textoOrigem(kit.origem) }}</span>
      </header>

      <dl class="ficha-grade">
        <CampoFicha rotulo="Interpretação" :valor="kit.interpretacao" />
        <CampoFicha v-if="tipo === 'DIAPANEL'" rotulo="Técnica utilizada" :valor="kit.tecnica" />
        <CampoFicha v-else rotulo="Observação (DiaCell)" :valor="kit.observacao" />
        <CampoFicha rotulo="Grupo sanguíneo (GS)" :valor="kit.gs" />
        <CampoFicha rotulo="Fator Rh" :valor="traduzirRh(kit.rh)" />
        <CampoFicha rotulo="TAD" :valor="kit.tad" />
        <CampoFicha rotulo="PAI" :valor="kit.pai" />
        <CampoFicha rotulo="Autocontrole LISS/Coombs" :valor="kit.autocontroleLissCoombs" />
        <CampoFicha rotulo="Autocontrole enzima" :valor="kit.autocontroleEnzima" />
        <CampoFicha rotulo="Autocontrole frio (4 °C)" :valor="kit.autocontroleFrio" />
      </dl>

      <div v-if="kit.resultados.length > 0" class="tabela-rolagem">
        <table class="ficha-tabela">
          <thead>
            <tr><th>Célula</th><th>LISS/Coombs</th><th>Enzima</th><th>Frio (4 °C)</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in kit.resultados" :key="r.celula">
              <td><strong>{{ rotuloCelula(r.celula) }}</strong></td>
              <td>{{ r.lissCoombs || '—' }}</td>
              <td>{{ r.enzima || '—' }}</td>
              <td>{{ r.frio || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </FamiliaDocumental>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { KitIdApi } from '@/services/api'
import { traduzirRh } from '@/domain/traducao'
import { formatarData, textoOrigem } from '@/utils/formatacao'
import CampoFicha from './CampoFicha.vue'
import FamiliaDocumental from './FamiliaDocumental.vue'

const TEXTOS = {
  DIACELL: {
    sigla: 'DC',
    nome: 'ID-DiaCell',
    titulo: 'Pesquisa de anticorpos ID-DiaCell I II',
    descricao: 'Pesquisa de anticorpos irregulares • classificação, resultado e observações.'
  },
  DIAPANEL: {
    sigla: 'DP',
    nome: 'ID-DiaPanel',
    titulo: 'Identificação de anticorpos ID-DiaPanel',
    descricao: 'Interpretação e técnica utilizada.'
  }
} as const

const CELULAS_DIACELL = ['I', 'II']

// Uma mesma seção serve às duas folhas Bio-Rad: o que muda é só o tipo.
export default defineComponent({
  name: 'SecaoKits',
  components: { CampoFicha, FamiliaDocumental },
  props: {
    tipo: { type: String as PropType<'DIACELL' | 'DIAPANEL'>, required: true },
    kits: { type: Array as PropType<KitIdApi[]>, required: true }
  },
  setup(props) {
    const texto = computed(() => TEXTOS[props.tipo])

    // No DiaCell as células são I e II; no DiaPanel, de 1 a 11.
    function rotuloCelula(numero: number): string {
      return props.tipo === 'DIACELL' ? CELULAS_DIACELL[numero - 1] ?? String(numero) : String(numero)
    }

    return { texto, rotuloCelula, traduzirRh, formatarData, textoOrigem }
  }
})
</script>

<style scoped>
.tabela-rolagem {
  overflow-x: auto;
}
</style>