<template>
  <div class="avisos" aria-live="polite">
    <div v-for="aviso in avisos" :key="aviso.id" class="aviso" :class="`aviso--${aviso.tipo}`"
      :role="aviso.tipo === 'erro' ? 'alert' : 'status'">
      <component :is="icones[aviso.tipo]" :size="16" class="aviso__icone" />
      <p>{{ aviso.texto }}</p>
      <button type="button" class="aviso__fechar" title="Fechar" @click="fecharAviso(aviso.id)">
        <X :size="14" />
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-vue-next'
import { useAvisos } from '@/composables/useAvisos'

export default defineComponent({
  name: 'AvisosFlutuantes',
  components: { X },
  setup() {
    const { avisos, fecharAviso } = useAvisos()
    const icones = { sucesso: CheckCircle, info: Info, alerta: AlertTriangle, erro: XCircle }
    return { avisos, fecharAviso, icones }
  }
})
</script>

<style scoped>
.avisos {
  position: fixed;
  top: 76px;
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 48px));
}

.aviso {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border: 1px solid var(--cor-borda);
  border-left-width: 4px;
  border-radius: var(--raio);
  background: var(--cor-superficie);
  box-shadow: 0 8px 24px rgba(31, 35, 40, 0.14);
  font-size: 13px;
}

.aviso p {
  flex: 1;
  margin: 0;
}

.aviso__icone {
  flex-shrink: 0;
  margin-top: 1px;
}

.aviso--sucesso { border-left-color: var(--cor-sucesso); }
.aviso--sucesso .aviso__icone { color: var(--cor-sucesso); }
.aviso--info { border-left-color: var(--cor-info); }
.aviso--info .aviso__icone { color: var(--cor-info); }
.aviso--alerta { border-left-color: var(--cor-alerta); }
.aviso--alerta .aviso__icone { color: var(--cor-alerta); }
.aviso--erro { border-left-color: var(--cor-primaria); background: var(--cor-primaria-suave); }
.aviso--erro .aviso__icone { color: var(--cor-primaria); }

.aviso__fechar {
  display: inline-flex;
  padding: 2px;
  border: 0;
  background: none;
  color: var(--cor-texto-suave);
  cursor: pointer;
}
</style>
