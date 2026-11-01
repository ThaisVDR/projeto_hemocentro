<template>
  <dialog ref="caixa" class="dialogo" @close="$emit('fechar')">
    <form class="dialogo__corpo" @submit.prevent="confirmar">
      <h3>Sinalizar pendência</h3>
      <p>A ficha volta para a fila, sem revisor, para ser resolvida depois. O motivo fica registrado na auditoria.</p>

      <label class="dialogo__motivo">
        Qual é a pendência?
        <textarea v-model="motivo" rows="3" required placeholder="Ex.: falta a página 3 da ficha" />
      </label>

      <div class="dialogo__botoes">
        <button type="button" class="botao" @click="fechar">Cancelar</button>
        <button type="submit" class="botao botao--primario" :disabled="!motivo.trim()">Sinalizar pendência</button>
      </div>
    </form>
  </dialog>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'DialogoPendencia',
  emits: ['confirmar', 'fechar'],
  setup(_props, { emit }) {
    const caixa = ref<HTMLDialogElement | null>(null)
    const motivo = ref('')

    onMounted(() => caixa.value?.showModal())

    function fechar() {
      caixa.value?.close()
    }

    function confirmar() {
      const texto = motivo.value.trim()
      if (!texto) return
      emit('confirmar', texto)
      fechar()
    }

    return { caixa, motivo, fechar, confirmar }
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

.dialogo__motivo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.dialogo__motivo textarea {
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