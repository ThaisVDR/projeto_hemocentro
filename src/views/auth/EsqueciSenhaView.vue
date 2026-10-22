<template>
  <div v-if="enviado" class="form">
    <header class="form__cabecalho">
      <h1>Verifique seu e-mail</h1>
    </header>
    <p class="form__sucesso" role="status">
      Se houver uma conta para <strong>{{ valores.email }}</strong>, o link para criar uma nova senha chegará em alguns minutos.
    </p>
    <router-link class="form__link" :to="{ name: 'login' }">Voltar para o login</router-link>
  </div>

  <form v-else class="form" novalidate @submit.prevent="aoEnviar">
    <header class="form__cabecalho">
      <h1>Recuperar senha</h1>
      <p>Enviaremos um link para você criar uma nova senha.</p>
    </header>

    <p v-if="erroGeral" class="form__aviso" role="alert">{{ erroGeral }}</p>

    <CampoTexto v-model="valores.email" rotulo="E-mail institucional" tipo="email" autocomplete="email"
      :erro="erros.email" @blur="validarCampo('email')" />

    <button class="botao botao--primario form__botao" :disabled="enviando">
      {{ enviando ? 'Enviando…' : 'Enviar link' }}
    </button>

       <nav class="form__links">
      <router-link class="form__link" :to="{ name: 'login' }">Voltar para o login</router-link>
    </nav>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import CampoTexto from '@/components/ui/CampoTexto.vue'
import { useFormulario } from '@/composables/useFormulario'
import { solicitarRedefinicaoSenha } from '@/services/api'
import { email, obrigatorio } from '@/utils/validacao'

export default defineComponent({
  name: 'EsqueciSenhaView',
  components: { CampoTexto },
  setup() {
    const enviado = ref(false)

    const { valores, erros, enviando, erroGeral, validarCampo, enviar } = useFormulario(
      { email: '' },
      { email: [obrigatorio('Informe seu e-mail.'), email()] }
    )

    async function aoEnviar() {
      enviado.value = await enviar((dados) => solicitarRedefinicaoSenha(dados.email))
    }

    return { enviado, valores, erros, enviando, erroGeral, validarCampo, aoEnviar }
  }
})
</script>

<style src="./auth-form.css" scoped></style>