<template>
  <section>
    <PageHeader
      titulo="Consulta de prontuário"
      subtitulo="Consulte informações conferidas, histórico e documentos de origem."
    />

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

    <button type="submit" class="botao botao--primario" :disabled="!nome.trim() || carregando">Buscar paciente</button>

    </form>

    <p v-if="carregando" class="estado">Buscando pacientes…</p>
    <p v-else-if="erro" class="estado estado--erro">{{ erro }}</p>
    <p v-else-if="pacientes && pacientes.length === 0" class="estado">
      Nenhum paciente encontrado. Confira a grafia do nome ou busque também pelo nome da mãe.
    </p>
    <p v-else-if="pacientes" class="estado">
      {{ pacientes.length }} paciente(s) encontrado(s).
    </p>
    
  </section>
</template>


<script lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import { defineComponent, ref } from 'vue'
import CampoData from '@/components/CampoData.vue'
import { buscarPacientes, PacienteResumoApi } from '@/services/api'

export default defineComponent({
  name: 'ProntuarioView',
  components: { PageHeader, CampoData },
  setup() {
    const nome = ref('');
    const dataNascimento = ref('');
    const nomeMae = ref('');
    const carregando = ref(false)
    const erro = ref<string | null>(null)
    const pacientes = ref<PacienteResumoApi[] | null>(null)

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

    return { nome, dataNascimento, nomeMae, carregando, erro, pacientes, buscar };
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


</style>