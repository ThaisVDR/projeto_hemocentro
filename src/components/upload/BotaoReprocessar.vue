<template>
  <span class="reprocessar">
    <button type="button" class="link" :disabled="!liberado || enviando" @click="reprocessar">
      {{ enviando ? 'Reprocessando…' : 'Reprocessar' }}
    </button>
    <small v-if="!liberado" class="reprocessar__espera">Disponível em {{ textoEspera }}</small>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import { avisar } from '@/composables/useAvisos'
import { reprocessarDocumento } from '@/services/api'

// Depois de uma falha, espera 5 minutos antes de deixar reprocessar
const ESPERA_MS = 5 * 60 * 1000

export default defineComponent({
  name: 'BotaoReprocessar',
  props: {
    documentoId: { type: Number, required: true },
    // Hora em que a leitura falhou (ISO). Sem ela, o botão fica liberado.
    falhouEm: { type: String as PropType<string | null>, default: null }
  },
  emits: ['reprocessado'],
  setup(props, { emit }) {
    const agora = ref(Date.now())
    const enviando = ref(false)

    let relogio: number | undefined
    onMounted(() => { relogio = window.setInterval(() => { agora.value = Date.now() }, 1000) })
    onUnmounted(() => window.clearInterval(relogio))

    const restanteMs = computed(() => {
      if (!props.falhouEm) return 0
      const liberaEm = new Date(props.falhouEm).getTime() + ESPERA_MS
      return Math.max(0, liberaEm - agora.value)
    })

    const liberado = computed(() => restanteMs.value === 0)

    // "4 min" enquanto falta mais de um minuto; depois "45 s".
    const textoEspera = computed(() => {
      const segundos = Math.ceil(restanteMs.value / 1000)
      return segundos > 60 ? `${Math.ceil(segundos / 60)} min` : `${segundos} s`
    })

    async function reprocessar() {
      enviando.value = true
      try {
        await reprocessarDocumento(props.documentoId)
        avisar('sucesso', 'Ficha devolvida para a fila da IA.')
        emit('reprocessado')
      } catch (e) {
        avisar('erro', (e as Error).message)
      } finally {
        enviando.value = false
      }
    }

    return { enviando, liberado, textoEspera, reprocessar }
  }
})
</script>

<style scoped>
.reprocessar {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.link {
  border: 0;
  background: none;
  padding: 0;
  font-weight: 600;
  color: var(--cor-primaria);
  cursor: pointer;
}

.link:disabled {
  color: var(--cor-texto-fraco);
  cursor: not-allowed;
}

.reprocessar__espera {
  color: var(--cor-texto-fraco);
  font-size: 12px;
}
</style>