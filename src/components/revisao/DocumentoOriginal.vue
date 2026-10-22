<template>
  <div ref="raiz" class="documento cartao">
    <header class="documento__barra">
      <strong>Documento original</strong>
      <div v-if="arquivo && ehImagem" class="documento__ferramentas">
        <button type="button" title="Diminuir zoom" @click="ajustarZoom(-0.1)"><Minus :size="16" /></button>
        <span>{{ Math.round(zoom * 100) }}%</span>
        <button type="button" title="Aumentar zoom" @click="ajustarZoom(0.1)"><Plus :size="16" /></button>
        <button type="button" title="Girar" @click="rotacao = (rotacao + 90) % 360"><RotateCw :size="16" /></button>
        <button type="button" title="Tela cheia" @click="telaCheia"><Maximize :size="16" /></button>
      </div>
    </header>

    <label
      v-if="!arquivo"
      class="documento__envio"
      :class="{ 'documento__envio--arrastando': arrastando }"
      @dragover.prevent="arrastando = true"
      @dragleave="arrastando = false"
      @drop.prevent="aoSoltar"
    >
      <UploadCloud :size="28" />
      <strong>Selecione ou arraste a ficha digitalizada</strong>
      <small>PDF, JPG ou PNG • o arquivo fica ao lado dos campos durante a conferência</small>
      <span class="botao botao--primario">Selecionar arquivo</span>
      <input type="file" :accept="TIPOS_ACEITOS" hidden @change="aoEscolher" />
    </label>

    <template v-else>
      <div class="documento__area">
        <iframe
          v-if="ehPdf"
          :key="pagina"
          :src="`${arquivo.url}#page=${pagina}`"
          :title="arquivo.nome"
          class="documento__pdf"
        />
        <div v-else class="documento__imagem">
          <img :src="arquivo.url" :alt="arquivo.nome" :style="{ transform: `scale(${zoom}) rotate(${rotacao}deg)` }" />
        </div>
      </div>

      <nav v-if="ehPdf" class="documento__paginas">
        <button type="button" :disabled="pagina <= 1" @click="$emit('mudar-pagina', pagina - 1)"><ChevronLeft :size="16" /></button>
        <span>Página {{ pagina }} • {{ documentoDaPagina }}</span>
        <button type="button" :disabled="pagina >= documentos.length" @click="$emit('mudar-pagina', pagina + 1)"><ChevronRight :size="16" /></button>
      </nav>

      <p class="documento__origem">
        <FileText :size="14" />
        <span>{{ arquivo.nome }}</span>
        <label class="documento__trocar">
          Trocar arquivo
          <input type="file" :accept="TIPOS_ACEITOS" hidden @change="aoEscolher" />
        </label>
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import {
  ChevronLeft, ChevronRight, FileText, Maximize, Minus, Plus, RotateCw, UploadCloud
} from 'lucide-vue-next'
import { DOCUMENTOS_DA_FICHA } from '@/domain/revisao'

export interface ArquivoDocumento {
  nome: string
  tipo: string
  url: string
}

const TIPOS_ACEITOS = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

export default defineComponent({
  name: 'DocumentoOriginal',
  components: { ChevronLeft, ChevronRight, FileText, Maximize, Minus, Plus, RotateCw, UploadCloud },
  props: {
    arquivo: { type: Object as PropType<ArquivoDocumento | null>, default: null },
    pagina: { type: Number, required: true }
  },
  emits: ['selecionar', 'mudar-pagina'],
  setup(props, { emit }) {
    const raiz = ref<HTMLElement | null>(null)
    const zoom = ref(1)
    const rotacao = ref(0)
    const arrastando = ref(false)

    const ehPdf = computed(() => props.arquivo?.tipo === 'application/pdf')
    const ehImagem = computed(() => !!props.arquivo && !ehPdf.value)
    const documentoDaPagina = computed(() => DOCUMENTOS_DA_FICHA[props.pagina - 1] ?? '')

    function selecionar(arquivo?: File | null) {
      if (!arquivo) return
      zoom.value = 1
      rotacao.value = 0
      emit('selecionar', arquivo)
    }

    function aoEscolher(evento: Event) {
      const entrada = evento.target as HTMLInputElement
      selecionar(entrada.files?.[0])
      entrada.value = ''
    }

    function aoSoltar(evento: DragEvent) {
      arrastando.value = false
      selecionar(evento.dataTransfer?.files?.[0])
    }

    function ajustarZoom(passo: number) {
      zoom.value = Math.min(3, Math.max(0.5, Math.round((zoom.value + passo) * 10) / 10))
    }

    function telaCheia() {
      raiz.value?.requestFullscreen?.()
    }

    return {
      raiz, zoom, rotacao, arrastando, ehPdf, ehImagem, documentoDaPagina,
      documentos: DOCUMENTOS_DA_FICHA, TIPOS_ACEITOS,
      aoEscolher, aoSoltar, ajustarZoom, telaCheia
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
  min-height: 52px;
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

.documento__envio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 20px;
  padding: 56px 24px;
  border: 1.5px dashed #d8b4bb;
  border-radius: var(--raio-grande);
  background: #fcf7f8;
  text-align: center;
  color: var(--cor-primaria);
  cursor: pointer;
}

.documento__envio--arrastando {
  background: var(--cor-primaria-suave);
}

.documento__envio strong {
  color: var(--cor-texto);
  font-size: 15px;
}

.documento__envio small {
  color: var(--cor-texto-suave);
}

.documento__area {
  height: 760px;
  background: #e9ebef;
}

.documento__pdf {
  width: 100%;
  height: 100%;
  border: 0;
}

.documento__imagem {
  height: 100%;
  overflow: auto;
  padding: 16px;
}

.documento__imagem img {
  display: block;
  max-width: 100%;
  margin: 0 auto;
  transform-origin: top center;
  transition: transform 0.15s;
}

.documento__paginas {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-top: 1px solid var(--cor-borda);
  font-size: 13px;
}

.documento__origem {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 12px 20px;
  border-top: 1px solid var(--cor-borda);
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.documento__origem span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.documento__trocar {
  color: var(--cor-primaria);
  font-weight: 600;
  cursor: pointer;
}
</style>
