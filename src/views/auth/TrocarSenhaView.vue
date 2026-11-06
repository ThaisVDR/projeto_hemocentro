<template>
  <form class="form" novalidate @submit.prevent="aoEnviar">
    <header class="form__cabecalho">
      <h1>Crie a sua senha</h1>
      <p>Você entrou com uma senha provisória. Escolha uma senha só sua para continuar.</p>
    </header>

    <p v-if="erroGeral" class="form__aviso" role="alert">{{ erroGeral }}</p>

    <CampoTexto v-model="valores.senhaAtual" rotulo="Senha provisória (atual)" tipo="password"
      autocomplete="current-password" :erro="erros.senhaAtual" @blur="validarCampo('senhaAtual')" />
    <CampoTexto v-model="valores.senha" rotulo="Nova senha" tipo="password" autocomplete="new-password"
      dica="De 8 a 64 caracteres. Pode ser uma frase." :erro="erros.senha" @blur="validarCampo('senha')" />
    <CampoTexto v-model="valores.confirmarSenha" rotulo="Confirmar nova senha" tipo="password"
      autocomplete="new-password" :erro="erros.confirmarSenha" @blur="validarCampo('confirmarSenha')" />

    <button class="botao botao--primario form__botao" :disabled="enviando">
      {{ enviando ? 'Salvando…' : 'Salvar nova senha' }}
    </button>

    <nav class="form__links">
      <a class="form__link" href="#" @click.prevent="sairDaConta">Sair</a>
    </nav>
  </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import CampoTexto from '@/components/ui/CampoTexto.vue'
import { useFormulario } from '@/composables/useFormulario'
import { sair, trocarSenha } from '@/services/api'
import { encerrarSessao, marcarTrocaDeSenha } from '@/services/sessao'
import { igualA, obrigatorio, politicaSenha } from '@/utils/validacao'

export default defineComponent({
  name: 'TrocarSenhaView',
  components: { CampoTexto },
  setup() {
    const roteador = useRouter()

    const { valores, erros, enviando, erroGeral, validarCampo, enviar } = useFormulario(
      { senhaAtual: '', senha: '', confirmarSenha: '' },
      {
        senhaAtual: [obrigatorio('Informe a senha provisória.')],
        senha: [obrigatorio('Informe a nova senha.'), politicaSenha()],
        confirmarSenha: [obrigatorio('Confirme a nova senha.'), igualA('senha', 'As senhas não coincidem.')]
      }
    )

    async function aoEnviar() {
      const ok = await enviar((dados) => trocarSenha(dados.senhaAtual, dados.senha))
      if (ok) {
        marcarTrocaDeSenha(false)
        roteador.push({ name: 'dashboard' })
      }
    }

    async function sairDaConta() {
      try { await sair() } catch { /* a tela sai de qualquer jeito */ }
      encerrarSessao()
      roteador.push({ name: 'login' })
    }

    return { valores, erros, enviando, erroGeral, validarCampo, aoEnviar, sairDaConta }
  }
})
</script>

<style src="./auth-form.css" scoped></style>