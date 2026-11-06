<template>
    <!-- Estado de token ausente ou inválido no link -->
    <div v-if="!tokenValido" class="form">
        <header class="form__cabecalho">
            <h1>Link inválido ou expirado</h1>
            <p>O link vale por 30 minutos e só pode ser usado uma vez.</p>
        </header>
        <p class="form__aviso" role="alert">
            Solicite um novo link para continuar com a alteração de sua senha.
        </p>
        <nav class="form__links">
            <router-link class="botao botao--primario form__botao" :to="{ name: 'esqueci-senha' }">
                Pedir um novo link
            </router-link>
        </nav>
    </div>

    <!-- Estado de sucesso após redefinição -->
    <div v-else-if="redefinido" class="form">
        <header class="form__cabecalho">
            <h1>Senha redefinida!</h1>
        </header>
        <p class="form__sucesso" role="status">
            Sua senha foi salva. Já pode entrar no sistema com ela.
        </p>
        <nav class="form__links">
            <router-link class="botao botao--primario form__botao" :to="{ name: 'login' }">
                Ir para o login
            </router-link>
        </nav>
    </div>

    <!-- Formulário de nova senha -->
    <form v-else class="form" novalidate @submit.prevent="aoEnviar">
        <header class="form__cabecalho">
            <h1>Criar nova senha</h1>
            <p>Escolha a senha que você vai usar para entrar no sistema.</p>
        </header>

        <p v-if="erroGeral" class="form__aviso" role="alert">{{ erroGeral }}</p>

        <CampoTexto v-model="valores.senha" rotulo="Nova senha" tipo="password" autocomplete="new-password"
            :erro="erros.senha" @blur="validarCampo('senha')" />
        <IndicadorSenha :senha="valores.senha" />

        <CampoTexto v-model="valores.confirmarSenha" rotulo="Confirmar nova senha" tipo="password"
            autocomplete="new-password" :erro="erros.confirmarSenha" @blur="validarCampo('confirmarSenha')" />

        <button class="botao botao--primario form__botao" :disabled="enviando">
            {{ enviando ? 'Salvando…' : 'Redefinir senha' }}
        </button>

        <nav class="form__links">
            <router-link class="form__link" :to="{ name: 'login' }">
                Voltar para o login
            </router-link>
        </nav>
    </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useRoute } from 'vue-router'
import CampoTexto from '@/components/ui/CampoTexto.vue'
import { useFormulario } from '@/composables/useFormulario'
import { redefinirSenha } from '@/services/api'
import { igualA, obrigatorio, politicaSenha } from '@/utils/validacao'

export default defineComponent({
    name: 'RedefinirSenhaView',
    components: { CampoTexto },
    setup() {
        const redefinido = ref(false)

        // Link do e-mail: /redefinir-senha?token=<64 hex>. Guarda o token e tira da URL (histórico, Referer)
        const token = useRoute().query.token
        const tokenValido = ref(typeof token === 'string' && /^[a-f0-9]{64}$/.test(token))
        history.replaceState(history.state, '', location.pathname)

        const { valores, erros, enviando, erroGeral, validarCampo, enviar } = useFormulario(
            { senha: '', confirmarSenha: '' },
            {
                senha: [obrigatorio('Informe a nova senha.'), politicaSenha()],
                confirmarSenha: [obrigatorio('Confirme a nova senha.'), igualA('senha', 'As senhas não coincidem.')],
            }
        )

        async function aoEnviar() {
            redefinido.value = await enviar((dados) => redefinirSenha(token as string, dados.senha))
            // Link expirado ou já usado: mostra a tela de pedir um novo
            if (erroGeral.value.startsWith('Link inválido')) tokenValido.value = false
        }

        return {
            tokenValido,
            redefinido,
            valores,
            erros,
            enviando,
            erroGeral,
            validarCampo,
            aoEnviar,
        }
    },
})
</script>

<style src="./auth-form.css" scoped></style>