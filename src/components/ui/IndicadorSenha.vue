<template>
  <p class="indicador" aria-live="polite">
    <span class="parte" :class="{ 'parte--ok': ok.tamanho }">De 8 a 64 caracteres</span>,
    <span class="parte" :class="{ 'parte--ok': ok.maiuscula }">com maiúscula</span>,
    <span class="parte" :class="{ 'parte--ok': ok.minuscula }">minúscula</span>,
    <span class="parte" :class="{ 'parte--ok': ok.numero }">número</span>
    <span class="parte" :class="{ 'parte--ok': ok.especial }"> e caractere especial (ex.: ! @ # $)</span>.
  </p>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

// Mesma regra do backend (utils/politica-senha.ts) e de politicaSenha() em utils/validacao.ts.
export default defineComponent({
  name: 'IndicadorSenha',
  props: {
    senha: { type: String, default: '' }
  },
  setup(props) {
    const ok = computed(() => {
      const s = props.senha
      const tamanho = Array.from(s).length
      return {
        tamanho: tamanho >= 8 && tamanho <= 64,
        maiuscula: /\p{Lu}/u.test(s),
        minuscula: /\p{Ll}/u.test(s),
        numero: /\d/.test(s),
        especial: /[^\p{L}\p{N}\s]/u.test(s)
      }
    })
    return { ok }
  }
})
</script>

<style scoped>
.indicador {
  margin: -1px 0 4px;
  font-size: 12.5px;
  line-height: 1.5;
  color: #64748b;
}
.parte {
  transition: color 0.2s ease;
}
.parte--ok {
  color: #16a34a;
  font-weight: 600;
}
</style>