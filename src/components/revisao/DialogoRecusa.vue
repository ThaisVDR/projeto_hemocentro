<template>
  <dialog ref="caixa" class="dialogo" @close="$emit('fechar')">
    <form class="dialogo__corpo" @submit.prevent="confirmar">
      <h3>Recusar ficha</h3>
      <p>A ficha sai da fila e não entra no prontuário. O motivo fica registrado na auditoria.</p>

      <fieldset class="dialogo__motivos">
        <legend>Motivo</legend>
        <label v-for="opcao in motivos" :key="opcao.valor">
          <input v-model="motivo" type="radio" name="motivo" :value="opcao.valor" />
          {{ opcao.rotulo }}
        </label>
      </fieldset>

      <label class="dialogo__observacao">
        Observação (opcional)
        <textarea v-model="observacao" rows="3" placeholder="Ex.: ficha duplicada da FIC-0003" />
      </label>

      <div class="dialogo__botoes">
        <button type="button" class="botao" @click="fechar">Cancelar</button>
        <button type="submit" class="botao botao--primario" :disabled="!motivo">Recusar ficha</button>
      </div>
    </form>
  </dialog>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import { MOTIVOS_RECUSA, MotivoRecusa } from '@/domain/revisao'

export default defineComponent({
  name: 'DialogoRecusa',
  emits: ['confirmar', 'fechar'],
  setup(_props, { emit }) {
    const caixa = ref<HTMLDialogElement | null>(null)
    const motivo = ref<MotivoRecusa | null>(null)
    const observacao = ref('')

    onMounted(() => caixa.value?.showModal())

    function fechar() {
      caixa.value?.close()
    }

    function confirmar() {
      if (!motivo.value) return
      emit('confirmar', { motivo: motivo.value, observacao: observacao.value.trim() || null })
      fechar()
    }

    return { caixa, motivo, observacao, motivos: MOTIVOS_RECUSA, fechar, confirmar }
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

.dialogo__motivos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 12px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  font-size: 13px;
}

.dialogo__motivos legend {
  padding: 0 4px;
  font-weight: 600;
}

.dialogo__observacao {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.dialogo__observacao textarea {
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