<template>
  <section>
    <PageHeader
      titulo="Ficha completa do paciente"
      subtitulo="Consulta consolidada da ficha atualizada, com base exclusiva nos registros validados."
    >
      <span class="selo selo--neutro somente-leitura">Somente leitura</span>
      <router-link :to="{ name: 'prontuarios', params: { pacienteId } }" class="botao">
        <ArrowLeft :size="16" /> Voltar ao prontuário
      </router-link>
    </PageHeader>

    <p v-if="carregando" class="estado">Carregando ficha completa…</p>
    <p v-else-if="erro" class="estado estado--erro">{{ erro }}</p>

    <div v-else-if="ficha" class="pagina">
      <!-- Identificação -->
      <article class="cartao identificacao">
        <div class="identificacao__topo">
          <span class="identificacao__avatar">{{ iniciais(paciente.nome) }}</span>
          <div>
            <h2>{{ paciente.nome }}</h2>
            <p class="identificacao__resumo">{{ resumo }}</p>
          </div>
        </div>

        <dl class="ficha-grade">
          <CampoFicha rotulo="Data de nascimento" :valor="formatarData(paciente.dataNascimento)" />
          <CampoFicha rotulo="Nome da mãe" :valor="paciente.nomeMae" />
          <CampoFicha rotulo="CPF" :valor="paciente.cpf" textoVazio="Não disponível" />
          <CampoFicha rotulo="Município / UF" :valor="paciente.municipio" />
        </dl>

        <p v-if="ficha.ultimaValidacao" class="identificacao__conferido">
          <CheckCircle :size="14" />
          Cadastro conferido por {{ ficha.ultimaValidacao.validadoPor || 'revisor não identificado' }}
          em {{ formatarDataHora(ficha.ultimaValidacao.validadoEm) }} • fonte: {{ ficha.ultimaValidacao.fichaCodigo }}
        </p>

        <dl class="ficha-grade">
          <CampoFicha rotulo="Sexo" :valor="paciente.sexo ? traduzirSexo(paciente.sexo) : null" />
          <CampoFicha rotulo="Pai" :valor="paciente.nomePai" />
          <CampoFicha rotulo="Apelido / Nome social" :valor="paciente.nomeSocial" />
          <CampoFicha rotulo="Cartão SUS" :valor="paciente.cartaoSus" />
        </dl>
      </article>

      <!-- Resumo da atualização e validação -->
      <section class="cartao bloco">
        <header>
          <h3>Resumo da atualização e validação</h3>
          <p>A atualização consolidada corresponde à última validação disponível, não à ficha em revisão.</p>
        </header>

        <dl v-if="ficha.ultimaValidacao" class="ficha-grade">
          <div>
            <dt class="rotulo">Última validação</dt>
            <dd class="valor">
              <span class="selo selo--sucesso">Registro validado</span>
              {{ formatarDataHora(ficha.ultimaValidacao.validadoEm) }}
            </dd>
          </div>
          <CampoFicha rotulo="Validado por" :valor="ficha.ultimaValidacao.validadoPor" />
          <CampoFicha rotulo="Ficha de referência" :valor="ficha.ultimaValidacao.fichaCodigo" />
        </dl>
        <p v-else class="ficha-vazio">Este paciente ainda não tem nenhuma ficha validada.</p>

        <p class="ficha-aviso">
          <strong>Registro validado não significa dados completos.</strong>
          A validação confirma a conferência do registro. Campos sem evidência permanecem como
          “Não informado nos registros validados”; isso não representa resultado negativo nem normalidade clínica.
        </p>
      </section>

      <!-- Quatro famílias documentais -->
      <section class="clinico">
        <header>
          <h2>Informações clínicas e transfusionais</h2>
          <p>Quatro famílias documentais • campos organizados para consulta, sem edição. Resultados não são presumidos.</p>
        </header>

        <SecaoTransfusoes :paciente="paciente" :transfusoes="ficha.transfusoes" />
        <SecaoKits tipo="DIACELL" :kits="ficha.kitsDiaCell" />
        <SecaoKits tipo="DIAPANEL" :kits="ficha.kitsDiaPanel" />
        <SecaoPesquisas :pesquisas="ficha.pesquisasImunoHematologicas" />

        <p v-if="semEvidenciaClinica" class="ficha-aviso ficha-aviso--info">
          Não há evidência validada para preencher estes resultados. Nenhum grupo sanguíneo, antígeno,
          resultado negativo ou interpretação clínica foi inferido.
        </p>
      </section>

      <!-- Documentos e histórico validado -->
      <section class="cartao bloco">
        <header>
          <h3>Documentos e histórico validado</h3>
          <p>
            {{ ficha.documentos.length }} ficha(s) validada(s) • {{ ficha.documentos.length }} documento(s) de origem •
            {{ totalPaginas }} página(s). Apenas estes registros compõem a consolidação.
          </p>
        </header>

        <p v-if="linhasDocumentos.length === 0" class="ficha-vazio">Nenhum documento validado para este paciente.</p>
        <div v-else class="tabela-rolagem">
          <table class="ficha-tabela">
            <thead>
              <tr>
                <th>Ficha / atendimento</th>
                <th>Documento original</th>
                <th>Validação humana</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in linhasDocumentos" :key="d.fichaCodigo">
                <td>
                  <strong>{{ d.fichaCodigo }}</strong>
                  <small>{{ formatarData(d.dataAtendimento) || 'Atendimento não informado' }}</small>
                </td>
                <td>
                  <a :href="urlArquivoDocumento(d.documentoId)" target="_blank" rel="noopener" class="link">
                    <FileText :size="14" /> {{ d.nomeOriginal }}
                  </a>
                  <small>
                    {{ d.totalPaginas ?? '—' }} página(s)<template v-if="d.loteCodigo"> • lote {{ d.loteCodigo }}</template>
                  </small>
                </td>
                <td>
                  {{ d.validadoPor || 'Revisor não identificado' }}
                  <small>{{ formatarDataHora(d.validadoEm) }}</small>
                </td>
                <td><span class="selo selo--sucesso">Validada</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Autoria e rastreabilidade -->
      <section class="cartao bloco">
        <header>
          <h3>Autoria e rastreabilidade</h3>
          <p>A conferência documental é distinta da autoria clínica e da execução dos exames.</p>
        </header>

        <dl class="ficha-grade">
          <CampoFicha
            rotulo="Última conferência humana"
            :valor="ficha.ultimaValidacao
              ? `${ficha.ultimaValidacao.validadoPor || 'Revisor não identificado'} • ${formatarDataHora(ficha.ultimaValidacao.validadoEm)}`
              : null"
          />
          <CampoFicha rotulo="Fichas de origem" :valor="fichasDeOrigem" />
          <CampoFicha rotulo="Responsável clínico / pelos exames" :valor="responsaveis" />
        </dl>
      </section>

      <p class="rodape-nota">
        Esta tela apresenta a ficha completa disponível para consulta, inclusive as lacunas dos registros validados.
        Não permite edição, nova validação nem inclusão automática de documentos em revisão.
      </p>
    </div>
  </section>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, CheckCircle, FileText } from 'lucide-vue-next'
import PageHeader from '@/components/PageHeader.vue'
import CampoFicha from '@/components/ficha-completa/CampoFicha.vue'
import SecaoTransfusoes from '@/components/ficha-completa/SecaoTransfusoes.vue'
import SecaoKits from '@/components/ficha-completa/SecaoKits.vue'
import SecaoPesquisas from '@/components/ficha-completa/SecaoPesquisas.vue'
import {
  buscarFichaCompleta,
  buscarHistorico,
  FichaCompletaApi,
  HistoricoItemApi,
  urlArquivoDocumento
} from '@/services/api'
import { traduzirSexo } from '@/domain/traducao'
import { formatarData, formatarDataHora, iniciais } from '@/utils/formatacao'

export default defineComponent({
  name: 'FichaCompletaView',
  components: {
    PageHeader,
    CampoFicha,
    SecaoTransfusoes,
    SecaoKits,
    SecaoPesquisas,
    ArrowLeft,
    CheckCircle,
    FileText
  },
  setup() {
    const rota = useRoute()
    const pacienteId = computed(() => rota.params.pacienteId as string)

    const ficha = ref<FichaCompletaApi | null>(null)
    const historico = ref<HistoricoItemApi[]>([])
    const carregando = ref(false)
    const erro = ref<string | null>(null)

    async function carregar(id: string) {
      ficha.value = null
      historico.value = []
      erro.value = null
      carregando.value = true
      try {
        // O histórico só completa a tabela de documentos (data do atendimento, lote, quem validou).
        // Se ele falhar, a ficha completa continua aparecendo com o que veio em `documentos`.
        const [dados, linhas] = await Promise.all([
          buscarFichaCompleta(id),
          buscarHistorico(id).catch(() => [] as HistoricoItemApi[])
        ])
        ficha.value = dados
        historico.value = linhas
      } catch (e) {
        // Paciente inexistente: o backend responde 404 com "Paciente não encontrado."
        erro.value = (e as Error).message
      } finally {
        carregando.value = false
      }
    }

    watch(pacienteId, carregar, { immediate: true })

    // Só é lido dentro de blocos protegidos por v-else-if="ficha".
    const paciente = computed(() => (ficha.value as FichaCompletaApi).paciente)

    const totalPaginas = computed(() =>
      (ficha.value?.documentos ?? []).reduce((soma, d) => soma + (d.totalPaginas ?? 0), 0)
    )

    const resumo = computed(() => {
      const partes: string[] = []
      if (paciente.value.prontuario) partes.push(`Prontuário ${paciente.value.prontuario}`)
      partes.push(`${paciente.value.idade} anos`)
      const fichas = ficha.value?.documentos.length ?? 0
      partes.push(`${fichas} ficha(s) validada(s)`)
      partes.push(`${totalPaginas.value} página(s) de origem`)
      return partes.join(' • ')
    })

    const linhasDocumentos = computed(() =>
      (ficha.value?.documentos ?? []).map(d => {
        const h = historico.value.find(item => item.ficha.codigo === d.fichaCodigo)
        return {
          ...d,
          loteCodigo: h?.documento.loteCodigo ?? null,
          dataAtendimento: h?.dataAtendimento ?? null,
          validadoPor: h?.validacao.validadoPor ?? null
        }
      })
    )

    const semEvidenciaClinica = computed(() => {
      const f = ficha.value
      return (
        !!f &&
        f.transfusoes.length === 0 &&
        f.kitsDiaCell.length === 0 &&
        f.kitsDiaPanel.length === 0 &&
        f.pesquisasImunoHematologicas.length === 0
      )
    })

    const fichasDeOrigem = computed(() => {
      const codigos = (ficha.value?.documentos ?? []).map(d => d.fichaCodigo)
      return codigos.length > 0 ? codigos.join(', ') : null
    })

    const responsaveis = computed(() => {
      const f = ficha.value
      if (!f) return null
      const nomes = [
        ...f.pesquisasImunoHematologicas.map(p => p.responsavel),
        ...f.transfusoes.map(t => t.responsavelLiberacao)
      ].filter((nome): nome is string => !!nome)
      const unicos = Array.from(new Set(nomes))
      return unicos.length > 0 ? unicos.join(', ') : null
    })

    return {
      pacienteId,
      ficha,
      carregando,
      erro,
      paciente,
      resumo,
      totalPaginas,
      linhasDocumentos,
      semEvidenciaClinica,
      fichasDeOrigem,
      responsaveis,
      traduzirSexo,
      formatarData,
      formatarDataHora,
      iniciais,
      urlArquivoDocumento
    }
  }
})
</script>

<style scoped>
.estado {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.estado--erro {
  color: var(--cor-primaria);
  font-weight: 600;
}

.somente-leitura::before {
  display: none;
}

.pagina {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.identificacao {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.identificacao__topo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.identificacao__avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 17px;
  font-weight: 700;
}

h2 {
  font-size: 22px;
}

.identificacao__resumo {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.identificacao__conferido {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--cor-sucesso);
}

.bloco {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bloco h3 {
  font-size: 17px;
}

.bloco header p,
.clinico header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.clinico {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rotulo {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--cor-texto-suave);
}

.valor {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
  font-weight: 600;
}

.tabela-rolagem {
  overflow-x: auto;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--cor-info);
  font-weight: 600;
}

.link:hover {
  text-decoration: underline;
}

.rodape-nota {
  margin: 0;
  font-size: 12px;
  color: var(--cor-texto-suave);
}
</style>