<template>
  <dialog ref="caixa" class="dialogo" @close="$emit('fechar')">
    <form class="dialogo__corpo" @submit.prevent="confirmar">
      <h3>{{ titulo }}</h3>
      <p>{{ texto }}</p>

      <label v-if="campoTexto" class="dialogo__campo">
        {{ campoTexto }}
        <textarea v-model="resposta" rows="3" :placeholder="placeholder" />
      </label>

      <div class="dialogo__botoes">
        <button type="button" class="botao" @click="fechar">Cancelar</button>
        <button type="submit" class="botao botao--primario">{{ rotuloConfirmar }}</button>
      </div>
    </form>
  </dialog>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

// Pergunta de confirmação do sistema, no lugar de window.confirm / window.prompt.
// Com campoTexto, também pede um texto opcional (enviado em "confirmar"; vazio vira null).
export default defineComponent({
  name: 'DialogoConfirmacao',
  props: {
    titulo: { type: String, required: true },
    texto: { type: String, default: '' },
    rotuloConfirmar: { type: String, default: 'Confirmar' },
    campoTexto: { type: String, default: '' },
    placeholder: { type: String, default: '' }
  },
  emits: ['confirmar', 'fechar'],
  setup(_props, { emit }) {
    const caixa = ref<HTMLDialogElement | null>(null)
    const resposta = ref('')

    onMounted(() => caixa.value?.showModal())

    function fechar() {
      caixa.value?.close()
    }

    function confirmar() {
      emit('confirmar', resposta.value.trim() || null)
      fechar()
    }

    return { caixa, resposta, fechar, confirmar }
  }
})
</script>

<style scoped>
.dialogo {
  width: min(440px, calc(100vw - 32px));
  padding: 0;
  border: 0;
  border-radius: var(--raio-grande);
  box-shadow: 0 16px 48px rgba(31, 35, 40, 0.25);
}

.dialogo::backdrop {
  background: rgba(31, 35, 40, 0.45);
}

.dialogo__corpo {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
}

.dialogo__corpo h3 {
  margin: 0;
  font-size: 17px;
}

.dialogo__corpo p {
  margin: 0;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

.dialogo__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.dialogo__campo textarea {
  padding: 8px;
  border: 1px solid var(--cor-borda);
  border-radius: 6px;
  font: inherit;
  font-weight: 400;
  resize: vertical;
}

.dialogo__botoes {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
