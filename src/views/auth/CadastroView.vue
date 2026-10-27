<template>
  <div v-if="enviado" class="form">
     <header class="form__cabecalho">
       <h1>Conta criada</h1>
     </header>
     <p class="form__sucesso" role="status">
      Cadastro de <strong>{{ valores.email }}</strong> concluído. Você já pode entrar.
     </p>
    <router-link class="form__link" :to="{ name: 'login' }">Ir para o login</router-link>
  </div>

  <form v-else class="form" novalidate @submit.prevent="aoEnviar">
    <header class="form__cabecalho">
      <h1>Solicitar cadastro</h1>
      <p>Seu acesso é liberado após aprovação do gestor.</p>
    </header>

    <p v-if="erroGeral" class="form__aviso" role="alert">{{ erroGeral }}</p>

    <CampoTexto v-model="valores.nome" rotulo="Nome completo" autocomplete="name"
      :erro="erros.nome" @blur="validarCampo('nome')" />
    <CampoTexto v-model="valores.email" rotulo="E-mail institucional" tipo="email" autocomplete="email"
      :erro="erros.email" @blur="validarCampo('email')" />
    <CampoTexto v-model="valores.senha" rotulo="Senha" tipo="password" autocomplete="new-password"
      dica="Mínimo de 8 caracteres, com letras e números."
      :erro="erros.senha" @blur="validarCampo('senha')" />
    <CampoTexto v-model="valores.confirmacao" rotulo="Confirmar senha" tipo="password" autocomplete="new-password"
      :erro="erros.confirmacao" @blur="validarCampo('confirmacao')" />

    <button class="botao botao--primario form__botao" :disabled="enviando">
      {{ enviando ? 'Cadastrando…' : 'Cadastrar' }}
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
import { cadastrar } from '@/services/api'
import { email, igualA, letrasENumeros, minimo, obrigatorio } from '@/utils/validacao'

export default defineComponent({
  name: 'CadastroView',
  components: { CampoTexto },
  setup() {
    const enviado = ref(false)

    const { valores, erros, enviando, erroGeral, validarCampo, enviar } = useFormulario(
      { nome: '', email: '', senha: '', confirmacao: '' },
      {
        nome: [obrigatorio('Informe seu nome completo.')],
        email: [obrigatorio('Informe seu e-mail.'), email()],
        senha: [obrigatorio('Crie uma senha.'), minimo(8), letrasENumeros()],
        confirmacao: [obrigatorio('Confirme a senha.'), igualA('senha', 'As senhas não coincidem.')]
      }
    )

    async function aoEnviar() {
      enviado.value = await enviar(({ nome, email, senha }) => cadastrar({ nome, email, senha }))
    }

    return { enviado, valores, erros, enviando, erroGeral, validarCampo, aoEnviar }
  }
})
</script>

<style src="./auth-form.css" scoped></style>