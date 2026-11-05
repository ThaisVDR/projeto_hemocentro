<template>
  <section>
    <PageHeader titulo="Upload de documentos"
      subtitulo="Envie as fichas digitalizadas. A leitura pela IA só se torna registro após a revisão humana.">
      <router-link :to="{ name: 'fila' }" class="botao">
        <ListChecks :size="16" /> Ver fila de revisão
      </router-link>
    </PageHeader>

    <div class="upload">
      <div class="cartao">
        <h2>Novas fichas</h2>
        <p class="suave">Um arquivo por ficha: PDF com as páginas na ordem original, ou imagem avulsa.</p>

        <label class="envio" :class="{ 'envio--arrastando': arrastando }" @dragover.prevent="arrastando = true"
          @dragleave="arrastando = false" @drop.prevent="aoSoltar">
          <UploadCloud :size="28" />
          <strong>Arraste os documentos para cá</strong>
          <small>PDF, JPG ou PNG • até {{ limiteMb }} MB por arquivo</small>
          <span class="botao botao--primario">
            <Plus :size="16" /> Selecionar arquivos
          </span>
          <input type="file" multiple :accept="tiposAceitos" hidden @change="aoEscolher" />
        </label>
      </div>

      <aside class="cartao dicas">
        <h2>Antes de enviar</h2>
        <ol>
          <li><strong>Confira a legibilidade</strong><span>Evite cortes, sombras e páginas invertidas.</span></li>
          <li><strong>Mantenha a sequência</strong><span>No PDF, as páginas devem seguir a ordem da ficha física.</span>
          </li>
          <li><strong>Revise o resultado</strong><span>Textos manuscritos exigem conferência campo a campo.</span></li>
        </ol>
        <p class="suave">O arquivo original fica vinculado à ficha durante toda a revisão.</p>
      </aside>
    </div>

    <div v-if="envios.length" class="cartao envios">
      <h2>Enviados nesta sessão</h2>
      <table class="tabela">
        <thead>
          <tr>
            <th>Arquivo original</th>
            <th>Tamanho</th>
            <th>Situação</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="envio in envios" :key="envio.chave">
            <td><strong>{{ envio.nome }}</strong></td>
            <td>{{ envio.tamanho }}</td>
            <td>
              <span v-if="envio.estado === 'enviando'" class="selo selo--info">Enviando…</span>
              <span v-else-if="envio.estado === 'erro'" class="selo selo--perigo"
                :title="envio.erro ?? undefined">Falhou</span>
              <span v-else-if="situacao(envio)" class="selo" :class="situacao(envio)?.classe">
                {{ situacao(envio)?.rotulo }}
              </span>
              <small v-if="envio.erro" class="erro">{{ envio.erro }}</small>
              <small v-if="envio.documento?.erro" class="erro">
                {{ erroDeLeitura(envio.documento.erro) }}
              </small>
              <small v-else-if="demorando(envio)" class="erro">
                A leitura está demorando mais que o normal. Você pode reprocessar.
              </small>
            </td>
            <td>
              <router-link v-if="envio.documento?.status === 'AGUARDANDO_REVISAO'"
                :to="{ name: 'revisar', params: { fichaId: envio.documento.fichaId } }" class="link">
                Revisar →
              </router-link>
              <BotaoReprocessar v-else-if="podeReprocessar(envio) && envio.documento"
                :documento-id="envio.documento.id" :falhou-em="envio.documento.falhouEm"
                @reprocessado="aoReprocessar(envio)" />
              <button v-else-if="envio.estado === 'erro'" type="button" class="link"
                @click="enviarGrupo([envio])">Tentar de novo</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ListChecks, Plus, UploadCloud } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import BotaoReprocessar from '@/components/upload/BotaoReprocessar.vue'
import { STATUS_FICHA } from '@/domain/revisao'
import { buscarLote, DocumentoLoteApi, enviarLote } from '@/services/api'
import { mensagemErroLeitura } from '@/utils/erros'

interface Envio {
  chave: number
  arquivo: File
  nome: string
  tamanho: string
  estado: 'enviando' | 'enviado' | 'erro'
  documento: DocumentoLoteApi | null
  loteId: number | null
  erro: string | null
  enviadoEm: number | null
}

// Mesmo limite e tipos aceitos pelo backend (src/config/upload.config.ts).
const LIMITE_MB = 50
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png']
// Passado esse tempo na fila/lendo sem resposta, a pessoa pode reprocessar.
const DEMORA_MS = 3 * 60 * 1000

// Fora do componente: ao sair da tela e voltar, a lista e o acompanhamento continuam.
const envios = reactive<Envio[]>([])
let proximaChave = 0

export default defineComponent({
  name: 'UploadView',
  components: { ListChecks, Plus, UploadCloud, PageHeader, BotaoReprocessar },
  setup() {
    const arrastando = ref(false)
    const agora = ref(Date.now())
    let consultando = false

    function tamanhoLegivel(bytes: number) {
      return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
    }

    async function enviarGrupo(grupo: Envio[]) {
      grupo.forEach(envio => {
        envio.estado = 'enviando'
        envio.erro = null
      })
      try {
        const lote = await enviarLote(grupo.map(envio => envio.arquivo))
        lote.documentos.forEach((documento, i) => {
          grupo[i].documento = documento
          grupo[i].loteId = lote.id
          grupo[i].enviadoEm = Date.now()
          grupo[i].estado = 'enviado'
        })
      } catch (e) {
        grupo.forEach(envio => {
          envio.estado = 'erro'
          envio.erro = (e as Error).message
        })
      }
    }

    const EM_ANDAMENTO = ['ENVIADA', 'LENDO']

    // A IA lê depois do envio: enquanto houver arquivo na fila ou sendo lido, pergunta de novo.
    async function atualizarSituacao() {
      if (consultando) return
      consultando = true
      try {
        const emLeitura = envios.filter(e => e.documento?.status && EM_ANDAMENTO.includes(e.documento.status))
        const lotes = Array.from(new Set(emLeitura.map(e => e.loteId)))

        for (const loteId of lotes) {
          if (loteId === null) continue
          try {
            const lote = await buscarLote(loteId)
            lote.documentos.forEach(documento => {
              const envio = envios.find(e => e.documento?.id === documento.id)
              if (!envio) return
              // Enquanto o backend não manda a hora da falha, usamos a hora em que a tela viu a falha.
              // Guarda a primeira hora vista: se o polling continuar, a espera de reprocessar não reinicia.
              const leituraFalhou = documento.status === 'FALHA_LEITURA' ||
                (!!documento.erro && !!documento.status && EM_ANDAMENTO.includes(documento.status))
              const falhouEm = leituraFalhou
                ? documento.falhouEm ?? envio.documento?.falhouEm ?? new Date().toISOString()
                : null
              envio.documento = { ...documento, falhouEm }
            })
          } catch {
            // Sem conexão agora: tenta de novo na próxima rodada.
          }
        }
      } finally {
        consultando = false
      }
    }

    // Falhou de verdade, ou o backend registrou erro mas ainda não mudou o status.
    function falhou(envio: Envio): boolean {
      const doc = envio.documento
      if (!doc) return false
      if (doc.status === 'FALHA_LEITURA') return true
      return !!doc.erro && !!doc.status && EM_ANDAMENTO.includes(doc.status)
    }

    function demorando(envio: Envio): boolean {
      const doc = envio.documento
      if (!doc || !doc.status || !EM_ANDAMENTO.includes(doc.status) || falhou(envio) || !envio.enviadoEm) return false
      return agora.value - envio.enviadoEm > DEMORA_MS
    }

    function podeReprocessar(envio: Envio): boolean {
      return falhou(envio) || demorando(envio)
    }

    // Selo da situação; nunca quebra se o backend mandar um status desconhecido.
    function situacao(envio: Envio): { rotulo: string; classe: string } | null {
      if (falhou(envio)) return STATUS_FICHA.FALHA_LEITURA
      if (demorando(envio)) return { rotulo: 'Leitura demorando', classe: 'selo--alerta' }
      const status = envio.documento?.status
      return status ? STATUS_FICHA[status] ?? null : null
    }

    let relogio: number | undefined
    onMounted(() => {
      atualizarSituacao()
      relogio = window.setInterval(() => { agora.value = Date.now(); atualizarSituacao() }, 4000)
    })
    onUnmounted(() => window.clearInterval(relogio))

    function aoReprocessar(envio: Envio) {
      if (!envio.documento) return
      envio.documento.status = 'ENVIADA'
      envio.documento.erro = null
      envio.documento.falhouEm = null
      envio.enviadoEm = Date.now()
    }

    async function adicionar(arquivos: FileList | null | undefined) {
      const novos: Envio[] = Array.from(arquivos ?? []).map((arquivo): Envio => {
        let erro: string | null = null
        if (!TIPOS.includes(arquivo.type)) erro = 'Tipo não aceito. Envie PDF, JPG ou PNG.'
        else if (arquivo.size > LIMITE_MB * 1024 * 1024) erro = `Arquivo maior que ${LIMITE_MB} MB.`
        return {
          chave: ++proximaChave,
          arquivo,
          nome: arquivo.name,
          tamanho: tamanhoLegivel(arquivo.size),
          estado: erro ? 'erro' : 'enviando',
          documento: null,
          loteId: null,
          erro,
          enviadoEm: null
        }
      })
      envios.unshift(...novos)
      // Todos os arquivos válidos vão juntos, num único lote.
      const validos = envios.filter(e => novos.some(n => n.chave === e.chave) && e.estado === 'enviando')
      if (validos.length) await enviarGrupo(validos)
    }

    function aoEscolher(evento: Event) {
      const entrada = evento.target as HTMLInputElement
      adicionar(entrada.files)
      entrada.value = ''
    }

    function aoSoltar(evento: DragEvent) {
      arrastando.value = false
      adicionar(evento.dataTransfer?.files)
    }

    return {
      envios, arrastando, enviarGrupo, aoEscolher, aoSoltar, aoReprocessar, erroDeLeitura: mensagemErroLeitura,
      situacao, demorando, podeReprocessar, limiteMb: LIMITE_MB, tiposAceitos: TIPOS.join(',')
    }
  }
})
</script>

<style scoped>
.upload {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

h2 {
  font-size: 16px;
}

.suave {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.envio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 40px 24px;
  border: 1.5px dashed #d8b4bb;
  border-radius: var(--raio-grande);
  background: #fcf7f8;
  text-align: center;
  color: var(--cor-primaria);
  cursor: pointer;
}

.envio--arrastando {
  background: var(--cor-primaria-suave);
}

.envio strong {
  font-size: 16px;
  color: var(--cor-texto);
}

.envio small {
  color: var(--cor-texto-suave);
}

.dicas ol {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 16px 0;
  padding-left: 18px;
}

.dicas li strong,
.dicas li span {
  display: block;
  font-size: 13px;
}

.dicas li span {
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.envios {
  margin-top: 20px;
}

.tabela {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
  font-size: 13px;
}

.tabela th {
  padding: 10px 12px;
  background: var(--cor-fundo);
  font-size: 11px;
  font-weight: 600;
  text-align: left;
  color: var(--cor-texto-suave);
}

.tabela td {
  padding: 12px;
  border-bottom: 1px solid var(--cor-borda);
  vertical-align: top;
}

.erro {
  display: block;
  margin-top: 4px;
  color: var(--cor-primaria);
}

.link {
  border: 0;
  background: none;
  padding: 0;
  font-weight: 600;
  color: var(--cor-primaria);
}

@media (max-width: 1000px) {
  .upload {
    grid-template-columns: 1fr;
  }
}
</style>