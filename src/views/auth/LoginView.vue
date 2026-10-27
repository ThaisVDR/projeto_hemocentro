<template>
  <form class="form" novalidate @submit.prevent="aoEnviar">
    <header class="form__cabecalho">
      <h1>Entrar</h1>
      <p>Acesse a área de trabalho do gestor.</p>
    </header>

    <p v-if="erroGeral" class="form__aviso" role="alert">{{ erroGeral }}</p>

    <CampoTexto
      v-model="valores.email"
      rotulo="E-mail institucional"
      tipo="email"
      autocomplete="username"
      :erro="erros.email"
      @blur="validarCampo('email')"
    />
    <CampoTexto
      v-model="valores.senha"
      rotulo="Senha"
      tipo="password"
      autocomplete="current-password"
      :erro="erros.senha"
      @blur="validarCampo('senha')"
    />

 <button class="botao botao--primario form__botao" :disabled="enviando">
  {{ enviando ? 'Entrando…' : 'Entrar' }}
</button>

    
    <nav class="form__links">
      <router-link class="form__link" :to="{ name: 'esqueci-senha' }">Esqueci minha senha</router-link>
      <router-link class="form__link" :to="{ name: 'cadastro' }">Cadastra-se</router-link>
    </nav>

  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CampoTexto from '@/components/ui/CampoTexto.vue'
import { useFormulario } from '@/composables/useFormulario'
import { entrar } from '@/services/api'
import { iniciarSessao } from '@/services/sessao'
import { email, obrigatorio } from '@/utils/validacao'

export default defineComponent({
  name: 'LoginView',
  components: { CampoTexto },
  setup() {
    const rota = useRoute()
    const roteador = useRouter()
    const destino = typeof rota.query.redirect === 'string' ? rota.query.redirect : ''


    const { valores, erros, enviando, erroGeral, validarCampo, enviar } = useFormulario(
      { email: '', senha: '' },
      {
        email: [obrigatorio('Informe seu e-mail.'), email()],
        senha: [obrigatorio('Informe sua senha.')]
      }
    )

    async function aoEnviar() {
      const ok = await enviar(async (dados) => {
        iniciarSessao(await entrar(dados))
      })
      if (ok) roteador.push(destino.startsWith('/') && !destino.startsWith('//') ? destino : { name: 'dashboard' })
    }

    return { valores, erros, enviando, erroGeral, validarCampo, aoEnviar }
  }
})
</script>

<style src="./auth-form.css" scoped></style>