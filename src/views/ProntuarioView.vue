<template>
  <section>
    <PageHeader titulo="Consulta de prontuário"
      subtitulo="Consulte informações conferidas, histórico e documentos de origem.">
      <router-link v-if="pacienteId" :to="{ name: 'prontuarios' }" class="botao">
        <ArrowLeft :size="16" /> Voltar à busca
      </router-link>
    </PageHeader>

    <template v-if="!pacienteId">

      <form class="cartao busca" @submit.prevent="buscar">
        <label>
          Nome do Paciente
          <input v-model="nome" type="text" placeholder="Digite o nome do paciente" />
        </label>

        <label>
          Data de nascimento
          <CampoData v-model="dataNascimento" />
        </label>

        <label>
          Nome da Mãe
          <input v-model="nomeMae" type="text" />
        </label>

        <button type="submit" class="botao botao--primario" :disabled="!nome.trim() || carregando">Buscar
          paciente</button>

      </form>

      <p v-if="carregando" class="estado">Buscando pacientes…</p>
      <p v-else-if="erro" class="estado estado--erro">{{ erro }}</p>
      <p v-else-if="pacientes && pacientes.length === 0" class="estado">
        Nenhum paciente encontrado. Confira a grafia do nome ou busque também pelo nome da mãe.
      </p>
      <div v-else-if="pacientes" class="cartao resultados">
        <p class="resultados__titulo">{{ pacientes.length }} paciente(s) encontrado(s)</p>

        <ul class="resultados__lista">
          <li v-for="paciente in pacientes" :key="paciente.id">
            <router-link :to="{ name: 'prontuarios', params: { pacienteId: paciente.id } }" class="resultado">
              <span class="resultado__avatar">{{ iniciais(paciente.nome) }}</span>

              <span class="resultado__dados">
                <strong>{{ paciente.nome }}</strong>
                <small>
                  Nascimento: {{ formatarData(paciente.dataNascimento) || 'não informado' }}
                  • Mãe: {{ paciente.nomeMae || 'não informada' }}
                </small>
              </span>

              <span class="resultado__destaques">
                <span class="selo selo--perigo">{{ textoRacaCor(paciente.racaCor) }}</span>
                <span class="selo selo--neutro">{{ paciente.aboRh || 'ABO/Rh não informado' }}</span>
              </span>

              <ChevronRight :size="18" class="resultado__seta" />
            </router-link>
          </li>
        </ul>
      </div>
    </template>
    <template v-else>
      <p v-if="carregandoPaciente" class="estado">Carregando prontuário…</p>
      <p v-else-if="erroPaciente" class="estado estado--erro">{{ erroPaciente }}</p>
      <CabecalhoPaciente v-else-if="paciente" :paciente="paciente" />
    </template>
  </section>
</template>


<script lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import { computed, defineComponent, ref, watch } from 'vue'
import CampoData from '@/components/CampoData.vue'
import { buscarPaciente, buscarPacientes, PacienteDetalheApi, PacienteResumoApi } from '@/services/api'
import { ChevronRight, ArrowLeft } from 'lucide-vue-next'
import { formatarData, textoRacaCor, iniciais } from '@/utils/formatacao'
import { useRoute } from 'vue-router'
import CabecalhoPaciente from '@/components/prontuario/CabecalhoPaciente.vue'

export default defineComponent({
  name: 'ProntuarioView',
  components: { PageHeader, CampoData, ChevronRight, ArrowLeft, CabecalhoPaciente },
  setup() {
    const nome = ref('');
    const dataNascimento = ref('');
    const nomeMae = ref('');
    const carregando = ref(false)
    const erro = ref<string | null>(null)
    const pacientes = ref<PacienteResumoApi[] | null>(null)
    const rota = useRoute()
    const pacienteId = computed(() => (rota.params.pacienteId as string | undefined) || null)
    const paciente = ref<PacienteDetalheApi | null>(null)
    const carregandoPaciente = ref(false)
    const erroPaciente = ref<string | null>(null)

    async function buscar() {
      carregando.value = true
      erro.value = null

      try {
        pacientes.value = await buscarPacientes({
          nome: nome.value.trim(),
          dataNascimento: dataNascimento.value,
          nomeMae: nomeMae.value.trim()
        })
      } catch (e) {
        erro.value = (e as Error).message
        pacientes.value = null
      } finally {
        carregando.value = false
      }
    }

    async function carregarPaciente(id: string | null) {
      paciente.value = null
      erroPaciente.value = null
      if (!id) return

      carregandoPaciente.value = true
      try {
        paciente.value = await buscarPaciente(id)
      } catch (e) {
        erroPaciente.value = (e as Error).message
      } finally {
        carregandoPaciente.value = false
      }
    }

    watch(pacienteId, carregarPaciente, { immediate: true })


    return { nome, dataNascimento, nomeMae, carregando, erro, pacientes, buscar, textoRacaCor, iniciais, formatarData, pacienteId, paciente, carregandoPaciente, erroPaciente }
  }
});

</script>

<style scoped>
.busca {
  display: grid;
  grid-template-columns: 2fr 1fr 2fr auto;
  gap: 12px;
  align-items: end;
}

.busca label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.busca input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  font: inherit;
}

.resultados {
  margin-top: 16px;
  padding: 8px 0;
}

.resultados__titulo {
  margin: 8px 20px 4px;
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.resultados__lista {
  margin: 0;
  padding: 0;
  list-style: none;
}

.resultado {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  border-top: 1px solid var(--cor-borda);
}

.resultado:hover {
  background: var(--cor-fundo);
}

.resultado__avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 13px;
  font-weight: 700;
}

.resultado__dados {
  flex: 1;
  min-width: 0;
}

.resultado__dados strong {
  display: block;
  font-weight: 600;
}

.resultado__dados small {
  font-size: 12px;
  color: var(--cor-texto-suave);
}

.resultado__destaques {
  display: flex;
  gap: 6px;
}

.resultado__seta {
  color: var(--cor-texto-fraco);
}
</style>