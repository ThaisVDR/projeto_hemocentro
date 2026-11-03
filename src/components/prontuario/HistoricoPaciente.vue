<template>
  <section class="cartao historico">
    <header>
      <h3>Histórico e documentos de origem</h3>
      <p class="historico__aviso">Fichas validadas deste paciente, da mais recente para a mais antiga.</p>
    </header>

    <p v-if="carregando" class="historico__estado">Carregando histórico…</p>
    <p v-else-if="erro" class="historico__estado historico__estado--erro">{{ erro }}</p>
    <p v-else-if="itens.length === 0" class="historico__estado">
      Nenhuma ficha validada para este paciente ainda.
    </p>

    <table v-else class="tabela">
      <thead>
        <tr>
          <th>Ficha</th>
          <th>Atendimento</th>
          <th>Documento de origem</th>
          <th>Páginas</th>
          <th>Lote</th>
          <th>Validação</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itens" :key="item.ficha.id">
          <td><span class="selo selo--sucesso">{{ item.ficha.codigo }}</span></td>
          <td>{{ formatarData(item.dataAtendimento) || '—' }}</td>
          <td>
            <a :href="urlArquivo(item.documento.id)" target="_blank" rel="noopener" class="historico__link">
              <FileText :size="14" /> {{ item.documento.nomeOriginal }}
            </a>
          </td>
          <td>{{ item.documento.totalPaginas ?? '—' }}</td>
          <td>{{ item.documento.loteCodigo }}</td>
          <td>
            {{ item.validacao.validadoPor || 'Revisor não identificado' }}
            <small>{{ formatarDataHora(item.validacao.validadoEm) }}</small>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { FileText } from 'lucide-vue-next'
import { buscarHistorico, HistoricoItemApi, urlArquivoDocumento } from '@/services/api'
import { formatarData, formatarDataHora } from '@/utils/formatacao'

export default defineComponent({
  name: 'HistoricoPaciente',
  components: { FileText },
  props: {
    pacienteId: { type: String, required: true }
  },
  setup(props) {
    const itens = ref<HistoricoItemApi[]>([])
    const carregando = ref(false)
    const erro = ref<string | null>(null)

    async function carregar(id: string) {
      itens.value = []
      erro.value = null
      carregando.value = true
      try {
        itens.value = await buscarHistorico(id)
      } catch (e) {
        // Paciente inexistente: o backend responde 404 com "Paciente não encontrado."
        erro.value = (e as Error).message
      } finally {
        carregando.value = false
      }
    }

    // Recarrega sozinho se a pessoa trocar de paciente sem sair da tela.
    watch(() => props.pacienteId, carregar, { immediate: true })

    // Usa o API_URL do front em vez do `url` que o backend manda ("/api/documentos/…"),
    // senão o prefixo /api seria repetido.
    const urlArquivo = urlArquivoDocumento

    return { itens, carregando, erro, formatarData, formatarDataHora, urlArquivo }
  }
})
</script>

<style scoped>
.historico {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

h3 {
  font-size: 17px;
}

.historico__aviso {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.historico__estado {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-fraco);
}

.historico__estado--erro {
  color: var(--cor-primaria);
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

.tabela small {
  display: block;
  color: var(--cor-texto-suave);
}

.historico__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--cor-info);
  font-weight: 600;
}

.historico__link:hover {
  text-decoration: underline;
}
</style>