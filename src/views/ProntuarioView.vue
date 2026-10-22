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

    <button type="submit" class="botao botao--primario" :disabled="!nome.trim()">Buscar paciente</button>

    </form>
    
  </section>
</template>


<script lang="ts">
import PageHeader from '@/components/PageHeader.vue'
import { defineComponent, ref } from 'vue'
import CampoData from '@/components/CampoData.vue'

export default defineComponent({
  name: 'ProntuarioView',
  components: { PageHeader, CampoData },
  setup() {
    const nome = ref('');
    const dataNascimento = ref('');
    const nomeMae = ref('');


    function buscar() {
      console.log('Buscar', nome.value, dataNascimento.value, nomeMae.value);
      
    }

    return { nome, dataNascimento, nomeMae, buscar };
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