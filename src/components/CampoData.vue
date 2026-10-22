<template>
  <input
    :value="texto"
    type="text"
    inputmode="numeric"
    placeholder="dd/mm/aaaa"
    maxlength="10"
    @input="digitar"
  />
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { dataBrasileiraParaIso, formatarData } from '@/utils/formatacao'

export default defineComponent({
  name: 'CampoData',
  props: {
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const texto = ref(formatarData(props.modelValue))

    watch(() => props.modelValue, valor => {
      if (valor !== dataBrasileiraParaIso(texto.value)) texto.value = formatarData(valor)
    })

    function digitar(evento: Event) {
      const entrada = evento.target as HTMLInputElement
      const numeros = entrada.value.replace(/\D/g, '').slice(0, 8)

      texto.value = [numeros.slice(0, 2), numeros.slice(2, 4), numeros.slice(4, 8)]
        .filter(parte => parte !== '')
        .join('/')
      entrada.value = texto.value

      emit('update:modelValue', dataBrasileiraParaIso(texto.value))
    }

    return { texto, digitar }
  }
})
</script>