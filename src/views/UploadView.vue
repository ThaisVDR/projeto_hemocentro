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
              <span v-if="envio.estado === 'enviando'" class="selo selo--info">Enviando e lendo com IA…</span>
              <span v-else-if="envio.estado === 'erro'" class="selo selo--perigo" :title="envio.erro">Falhou</span>
              <span v-else-if="envio.ficha" class="selo" :class="status[envio.ficha.status].classe">
                {{ status[envio.ficha.status].rotulo }}
              </span>
              <small v-if="envio.erro" class="erro">{{ envio.erro }}</small>
            </td>
            <td>
              <router-link v-if="envio.ficha && envio.ficha.status !== 'ENVIADA' && envio.ficha.status !== 'LENDO'"
                :to="{ name: 'revisar', params: { fichaId: envio.ficha.id } }" class="link">
                Revisar →
              </router-link>
              <button v-else-if="envio.estado === 'erro'" type="button" class="link" @click="enviar(envio)">Tentar de
                novo</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import { ListChecks, Plus, UploadCloud } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import { STATUS_FICHA } from '@/domain/revisao'
import { enviarFicha, FichaResumoApi } from '@/services/api'

interface Envio {
  chave: number
  arquivo: File
  nome: string
  tamanho: string
  estado: 'enviando' | 'enviado' | 'erro'
  ficha: FichaResumoApi | null
  erro: string | null
}

// Mesmo limite e tipos aceitos pelo backend (src/config/upload.config.ts).
const LIMITE_MB = 20
const TIPOS = ['application/pdf', 'image/jpeg', 'image/png']

export default defineComponent({
  name: 'UploadView',
  components: { ListChecks, Plus, UploadCloud, PageHeader },
  setup() {
    const envios = reactive<Envio[]>([])
    const arrastando = ref(false)
    let proximaChave = 0

    function tamanhoLegivel(bytes: number) {
      return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`
    }

    async function enviar(envio: Envio) {
      envio.estado = 'enviando'
      envio.erro = null
      try {
        envio.ficha = await enviarFicha(envio.arquivo)
        envio.estado = 'enviado'
      } catch (erro) {
        envio.estado = 'erro'
        envio.erro = (erro as Error).message
      }
    }

    async function adicionar(arquivos: FileList | null | undefined) {
      const novos: Envio[] = Array.from(arquivos ?? []).map(arquivo => {
        let erro: string | null = null
        if (!TIPOS.includes(arquivo.type)) erro = 'Tipo não aceito. Envie PDF, JPG ou PNG.'
        else if (arquivo.size > LIMITE_MB * 1024 * 1024) erro = `Arquivo maior que ${LIMITE_MB} MB.`
        return {
          chave: ++proximaChave,
          arquivo,
          nome: arquivo.name,
          tamanho: tamanhoLegivel(arquivo.size),
          estado: erro ? 'erro' : 'enviando',
          ficha: null,
          erro
        }
      })
      envios.unshift(...novos)
      // Um envio por vez: cada ficha passa pela IA no backend.
      for (const envio of envios.filter(e => novos.some(n => n.chave === e.chave) && e.estado === 'enviando')) {
        await enviar(envio)
      }
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
      envios, arrastando, enviar, aoEscolher, aoSoltar,
      status: STATUS_FICHA, limiteMb: LIMITE_MB, tiposAceitos: TIPOS.join(',')
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
