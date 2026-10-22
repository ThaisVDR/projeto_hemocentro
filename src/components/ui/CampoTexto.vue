<template>
  <div class="campo" :class="{ 'campo--erro': erro }">
    <label class="campo__rotulo" :for="id">{{ rotulo }}</label>
    <div class="campo__caixa">
      <input
        :id="id"
        class="campo__controle"
        :class="{ 'campo__controle--senha': ehSenha }"
        :type="tipoReal"
        :value="modelValue"
        :aria-invalid="erro ? 'true' : 'false'"
        :aria-describedby="erro ? `${id}-erro` : undefined"
        v-bind="$attrs"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @blur="$emit('blur')"
      />
      <button
        v-if="ehSenha"
        type="button"
        class="campo__olho"
        :aria-label="visivel ? 'Ocultar senha' : 'Mostrar senha'"
        @click="visivel = !visivel"
      >
        <component :is="visivel ? 'EyeOff' : 'Eye'" :size="16" />
      </button>
    </div>
    <p v-if="erro" :id="`${id}-erro`" class="campo__erro" role="alert">{{ erro }}</p>
    <p v-else-if="dica" class="campo__dica">{{ dica }}</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

let contador = 0

export default defineComponent({
  name: 'CampoTexto',
  components: { Eye, EyeOff },
  inheritAttrs: false, 
  props: {
    modelValue: { type: String, default: '' },
    rotulo: { type: String, required: true },
    tipo: { type: String, default: 'text' },
    erro: { type: String, default: '' },
    dica: { type: String, default: '' }
  },
  emits: ['update:modelValue', 'blur'],
  setup(props) {
    const id = `campo-${++contador}`
    const visivel = ref(false)
    const ehSenha = computed(() => props.tipo === 'password')
    const tipoReal = computed(() => (ehSenha.value && visivel.value ? 'text' : props.tipo))
    return { id, visivel, ehSenha, tipoReal }
  }
})
</script>

<style scoped>
.campo { 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
}
.campo__rotulo { 
  font-size: 13px; 
  font-weight: 500; 
}
.campo__caixa { 
  position: relative; 
}
.campo__controle {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  font: inherit;
  color: var(--cor-texto);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(31, 35, 40, 0.16);
  border-radius: var(--raio);
}
.campo__controle:-webkit-autofill,
.campo__controle:-webkit-autofill:hover {
  -webkit-text-fill-color: var(--cor-texto);
  box-shadow: 0 0 0 1000px #fff inset;
}
.campo__controle:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--cor-texto);
  box-shadow: 0 0 0 1000px #fff inset, 0 0 0 3px rgba(142, 27, 44, 0.18);
}
.campo__controle--senha { 
  padding-right: 40px; 
}
.campo__controle:focus {
  outline: none;
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px rgba(142, 27, 44, 0.18);
}
.campo--erro .campo__controle { 
  border-color: var(--cor-primaria); 
}
.campo__olho {
  position: absolute; top: 0; right: 0;
  display: grid; place-items: center;
  width: 42px; height: 42px;
  color: var(--cor-texto-suave);
  background: none; border: 0;
}
.campo__olho:hover { 
  color: var(--cor-primaria); 
}
.campo__erro { 
  margin: 0; 
  font-size: 12px; 
  color: var(--cor-primaria);
 }
.campo__dica { 
  margin: 0; 
  font-size: 12px; 
  color: var(--cor-texto-fraco); 
  }
</style>