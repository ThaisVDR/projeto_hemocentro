<template>
  <div ref="raiz" class="documento cartao">
    <header class="documento__barra">
      <strong>Documento original</strong>
      <div class="documento__ferramentas">
        <button type="button" title="Diminuir zoom" @click="ajustarZoom(-0.1)"><Minus :size="16" /></button>
        <span>{{ Math.round(zoom * 100) }}%</span>
        <button type="button" title="Aumentar zoom" @click="ajustarZoom(0.1)"><Plus :size="16" /></button>
        <button type="button" title="Girar" @click="rotacao = (rotacao + 90) % 360"><RotateCw :size="16" /></button>
        <button type="button" title="Tela cheia" @click="telaCheia"><Maximize :size="16" /></button>
      </div>
    </header>

    <div class="documento__area">
      <div class="folha" :style="{ transform: `scale(${zoom}) rotate(${rotacao}deg)` }">
        <div class="folha__topo">
          <div>
            <strong>HEMOCENTRO MT</strong>
            <small>Modelo visual de ficha • não oficial</small>
          </div>
          <Droplet :size="18" />
        </div>
        <div class="folha__aviso">
          <strong>DOCUMENTO FICTÍCIO</strong>
          <small>Exclusivamente para demonstração do fluxo</small>
        </div>
        <h4 class="folha__titulo">{{ tituloPagina }}</h4>

        <template v-if="pagina === 1">
          <div class="folha__grade">
            <div v-for="item in camposPagina1" :key="item.chave" class="folha__campo" :class="{ 'folha__campo--destaque': destacar(item.chave) }">
              <span>{{ item.rotulo }}</span>
              <em>{{ item.valor || '—' }}</em>
            </div>
          </div>
          <table class="folha__tabela">
            <thead>
              <tr><th>Data</th><th>Tipo</th><th>Nº doação</th><th>GR.S/RhD</th><th>Vol</th><th>PAI</th><th>Prova cruz.</th></tr>
            </thead>
            <tbody>
              <tr v-for="linha in original.transfusoes" :key="linha.numeroDoacao ?? ''">
                <td>{{ formatarData(linha.dataEnvio) }}</td><td>{{ linha.tipoHemocomponente }}</td>
                <td>{{ linha.numeroDoacao }}</td><td>{{ linha.grsRhd }}</td><td>{{ linha.volMl }}</td>
                <td>{{ linha.testesPai }}</td><td>{{ linha.provaCruzada }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-else-if="pesquisaDaPagina">
          <div class="folha__grade">
            <div class="folha__campo"><span>Nome</span><em>{{ original.identificacao.nome.valor }}</em></div>
            <div class="folha__campo"><span>Grupo sanguíneo + antígenos</span><em>{{ pesquisaDaPagina.grupoAntigenos.valor }}</em></div>
            <div class="folha__campo"><span>Interpretação</span><em>{{ pesquisaDaPagina.interpretacao.valor }}</em></div>
            <div class="folha__campo"><span>Data</span><em>{{ formatarData(pesquisaDaPagina.data.valor) }}</em></div>
          </div>
          <p class="folha__nota">Matriz de antígenos do reagente impressa pelo fabricante • lote {{ pesquisaDaPagina.loteKit.valor }}</p>
          <table class="folha__tabela">
            <thead><tr><th>Célula</th><th>LISS/Coombs</th><th>Enzima</th><th>4 °C</th></tr></thead>
            <tbody>
              <tr v-for="reacao in pesquisaDaPagina.reacoes" :key="reacao.celula">
                <td>{{ reacao.celula }}</td><td>{{ reacao.coombs ?? '' }}</td><td>{{ reacao.enzima ?? '' }}</td><td>{{ reacao.frio ?? '' }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <template v-else>
          <div class="folha__grade">
            <div v-for="item in camposPagina4" :key="item.rotulo" class="folha__campo">
              <span>{{ item.rotulo }}</span>
              <em>{{ item.valor || '—' }}</em>
            </div>
          </div>
          <table class="folha__tabela folha__tabela--fenotipo">
            <thead><tr><th v-for="antigeno in antigenos" :key="antigeno">{{ antigeno }}</th></tr></thead>
            <tbody><tr><td v-for="antigeno in antigenos" :key="antigeno">{{ original.imunohematologia.fenotipo[antigeno] ?? '' }}</td></tr></tbody>
          </table>
        </template>

        <footer class="folha__rodape">{{ original.id }} • página {{ pagina }} de {{ original.totalPaginas }}</footer>
      </div>
    </div>

    <nav class="documento__paginas">
      <button type="button" :disabled="pagina <= 1" @click="$emit('mudar-pagina', pagina - 1)"><ChevronLeft :size="16" /></button>
      <span>Página {{ pagina }} de {{ original.totalPaginas }}</span>
      <button type="button" :disabled="pagina >= original.totalPaginas" @click="$emit('mudar-pagina', pagina + 1)"><ChevronRight :size="16" /></button>
    </nav>

    <p class="documento__origem">
      <Link2 :size="14" />
      Origem: {{ original.origem }}. Documento: {{ original.arquivo }} • {{ original.totalPaginas }} páginas
      ({{ original.documentosPorPagina.join(', ') }}). Os destaques correspondem aos campos em conferência.
    </p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { ChevronLeft, ChevronRight, Droplet, Link2, Maximize, Minus, Plus, RotateCw } from 'lucide-vue-next'
import { ANTIGENOS_FICHA_FENOTIPAGEM } from '@/domain/fenotipo'
import { FichaEmRevisao, IdentificacaoRevisao } from '@/domain/revisao'
import { formatarData } from '@/utils/formatacao'

export default defineComponent({
  name: 'DocumentoOriginal',
  components: { ChevronLeft, ChevronRight, Droplet, Link2, Maximize, Minus, Plus, RotateCw },
  props: {
    /** Valores como foram lidos do documento; não mudam com as edições da revisão. */
    original: { type: Object as PropType<FichaEmRevisao>, required: true },
    /** Ficha em revisão, usada para destacar os campos ainda incertos. */
    atual: { type: Object as PropType<FichaEmRevisao>, required: true },
    pagina: { type: Number, required: true }
  },
  emits: ['mudar-pagina'],
  setup(props) {
    const raiz = ref<HTMLElement | null>(null)
    const zoom = ref(1)
    const rotacao = ref(0)

    const tituloPagina = computed(() => ({
      1: 'FICHA TRANSFUSIONAL — IMUNO-HEMATOLOGIA RECEPTOR',
      2: 'PESQUISA DE ANTICORPOS — ID-DIACELL I, II',
      3: 'IDENTIFICAÇÃO DE ANTICORPOS — ID-DIAPANEL',
      4: 'PESQUISA IMUNO HEMATOLÓGICA'
    } as Record<number, string>)[props.pagina])

    const camposPagina1 = computed(() => {
      const id = props.original.identificacao
      const chaves: (keyof IdentificacaoRevisao)[] = [
        'nome', 'prontuario', 'racaCor', 'aboRh', 'dataNascimento', 'municipio', 'diagnostico', 'nomeMae'
      ]
      return chaves.map(chave => ({
        chave,
        rotulo: id[chave].rotulo,
        valor: chave === 'dataNascimento' ? formatarData(id[chave].valor) : id[chave].valor
      }))
    })

    const pesquisaDaPagina = computed(() =>
      props.original.pesquisas.find(p => p.pagina === props.pagina) ?? null
    )

    const camposPagina4 = computed(() => {
      const ih = props.original.imunohematologia
      return [ih.grupoSanguineo, ih.fatorRh, ih.dFraco, ih.pai, ih.autocontrole, ih.tad, ih.dcScreening, ih.observacao]
        .map(c => ({ rotulo: c.rotulo, valor: c.valor }))
    })

    function destacar(chave: keyof IdentificacaoRevisao) {
      return props.atual.identificacao[chave].estado === 'incerto'
    }

    function ajustarZoom(passo: number) {
      zoom.value = Math.min(1.6, Math.max(0.6, Math.round((zoom.value + passo) * 10) / 10))
    }

    function telaCheia() {
      raiz.value?.requestFullscreen?.()
    }

    return {
      raiz, zoom, rotacao, tituloPagina, camposPagina1, pesquisaDaPagina, camposPagina4,
      antigenos: ANTIGENOS_FICHA_FENOTIPAGEM, destacar, ajustarZoom, telaCheia, formatarData
    }
  }
})
</script>

<style scoped>
.documento {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.documento__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--cor-borda);
}

.documento__ferramentas {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.documento button {
  display: grid;
  place-items: center;
  padding: 2px;
  border: 0;
  background: none;
  color: var(--cor-texto-suave);
}

.documento button:disabled {
  opacity: 0.4;
  cursor: default;
}

.documento__area {
  overflow: auto;
  max-height: 760px;
  padding: 24px;
  background: #e9ebef;
}

.folha {
  padding: 28px 30px;
  background: #fffdf7;
  box-shadow: 0 2px 8px rgba(16, 24, 40, 0.12);
  transform-origin: top center;
  transition: transform 0.15s;
  font-size: 11px;
}

.folha__topo {
  display: flex;
  justify-content: space-between;
  color: var(--cor-primaria);
}

.folha__topo strong {
  display: block;
  font-size: 15px;
  color: var(--cor-texto);
}

.folha__topo small {
  font-size: 10px;
  color: var(--cor-texto-suave);
}

.folha__aviso {
  margin: 16px 0;
  padding: 10px;
  text-align: center;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
}

.folha__aviso strong,
.folha__aviso small {
  display: block;
}

.folha__titulo {
  margin: 0 0 12px;
  text-align: center;
  font-size: 12px;
}

.folha__grade {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.folha__campo {
  padding: 8px 6px;
  border-bottom: 1px solid #d9d4c7;
}

.folha__campo span {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  color: var(--cor-texto-suave);
}

.folha__campo em {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 14px;
}

.folha__campo--destaque {
  border: 1px solid #e3b341;
  background: var(--cor-alerta-suave);
}

.folha__nota {
  margin: 12px 0 0;
  font-size: 10px;
  color: var(--cor-texto-suave);
}

.folha__tabela {
  width: 100%;
  margin-top: 14px;
  border-collapse: collapse;
}

.folha__tabela th,
.folha__tabela td {
  padding: 4px;
  border: 1px solid #d9d4c7;
  text-align: center;
}

.folha__tabela td {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
}

.folha__tabela--fenotipo th,
.folha__tabela--fenotipo td {
  padding: 4px 1px;
  font-size: 9px;
}

.folha__rodape {
  margin-top: 18px;
  text-align: right;
  font-size: 10px;
  color: var(--cor-texto-suave);
}

.documento__paginas {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #e9ebef;
  font-size: 13px;
}

.documento__origem {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 14px 20px;
  font-size: 11px;
  color: var(--cor-texto-suave);
}
</style>
