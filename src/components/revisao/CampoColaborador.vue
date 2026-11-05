<template>
  <div class="campo-colaborador">
    <CampoBusca :model-value="modelValue" :opcoes="nomes" placeholder="Digite 2 letras…"
      @update:model-value="valor => $emit('update:modelValue', valor)" @foco="emFoco = true" @sair="aoSair" />
    <button v-if="podeCadastrar && !emFoco" type="button" class="campo-colaborador__cadastrar" :disabled="cadastrando"
      @click="confirmando = true">
      + Cadastrar
    </button>
    <DialogoConfirmacao v-if="confirmando" titulo="Cadastrar colaborador"
      :texto="`Cadastrar &quot;${nomeDigitado}&quot; como colaborador? Confira a grafia: o cadastro não pode ser editado depois.`"
      rotulo-confirmar="Cadastrar" @confirmar="cadastrar" @fechar="confirmando = false" />
    <small v-if="erro" class="campo-colaborador__erro">{{ erro }}</small>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { buscarColaboradores, cadastrarColaborador, ColaboradorApi } from '@/services/api'
import { semAcento } from '@/utils/formatacao'
import CampoBusca from './CampoBusca.vue'
import DialogoConfirmacao from '@/components/DialogoConfirmacao.vue'

// Avisa todos os campos de responsável da tela quando alguém é cadastrado,
// para o "+ Cadastrar" sumir também nas outras linhas com o mesmo nome.
const cadastrosFeitos = ref(0)

export default defineComponent({
  name: 'CampoColaborador',
  components: { CampoBusca, DialogoConfirmacao },
  props: {
    modelValue: { type: String as PropType<string | null>, default: null }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const sugestoes = ref<ColaboradorApi[]>([])
    const cadastrando = ref(false)
    const erro = ref<string | null>(null)
    const confirmando = ref(false)
    // O "+ Cadastrar" só aparece depois que a pessoa sai do campo, para não cadastrar um nome pela metade.
    const emFoco = ref(false)
    let espera: number | undefined

    const nomeDigitado = computed(() => (props.modelValue ?? '').trim())
    const nomes = computed(() => sugestoes.value.map(c => c.nome))

    // Já cadastrado = algum nome da lista igual ao digitado (sem diferenciar maiúsculas nem acentos).
    const podeCadastrar = computed(() =>
      nomeDigitado.value.length >= 2 &&
      !sugestoes.value.some(c => semAcento(c.nome) === semAcento(nomeDigitado.value))
    )

    async function procurar(termo: string) {
      try {
        sugestoes.value = await buscarColaboradores(termo)
      } catch {
        sugestoes.value = []
      }
    }

    // Espera a pessoa parar de digitar por 300 ms antes de perguntar ao backend.
    watch(nomeDigitado, termo => {
      window.clearTimeout(espera)
      erro.value = null
      if (termo.length < 2) {
        sugestoes.value = []
        return
      }
      espera = window.setTimeout(() => procurar(termo), 300)
    }, { immediate: true })

    watch(cadastrosFeitos, () => {
      if (nomeDigitado.value.length >= 2) procurar(nomeDigitado.value)
    })

    // Ao sair do campo: "marcia" vira "Márcia", igual ao cadastro.
    function aoSair() {
      emFoco.value = false
      const cadastrado = sugestoes.value.find(c => semAcento(c.nome) === semAcento(nomeDigitado.value))
      if (cadastrado && cadastrado.nome !== props.modelValue) emit('update:modelValue', cadastrado.nome)
    }

    async function cadastrar() {
      confirmando.value = false
      cadastrando.value = true
      erro.value = null
      try {
        const novo = await cadastrarColaborador(nomeDigitado.value)
        sugestoes.value = [novo, ...sugestoes.value]
        emit('update:modelValue', novo.nome)
        cadastrosFeitos.value++
      } catch (e) {
        // Já existe (cadastrado em outra linha ou por outra pessoa): busca de novo e usa o cadastro.
        await procurar(nomeDigitado.value)
        if (podeCadastrar.value) erro.value = (e as Error).message
        else aoSair()
      } finally {
        cadastrando.value = false
      }
    }

    return { nomes, nomeDigitado, cadastrando, confirmando, erro, emFoco, podeCadastrar, aoSair, cadastrar }
  }
})
</script>

<style scoped>
.campo-colaborador {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.campo-colaborador__cadastrar {
  align-self: flex-start;
  border: 0;
  background: none;
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--cor-primaria);
  cursor: pointer;
}

.campo-colaborador__erro {
  font-size: 11px;
  color: var(--cor-primaria);
}
</style>