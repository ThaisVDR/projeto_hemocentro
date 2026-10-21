<template>
  <div class="campo" :class="`campo--${campo.estado}`">
    <div class="campo__rotulo">
      <label :for="id">{{ campo.rotulo }}</label>
      <component :is="icone" :size="14" class="campo__icone" />
    </div>

    <div class="campo__controle">
      <select
        v-if="opcoes"
        :id="id"
        :value="campo.valor ?? ''"
        @change="aoAlterar"
        @focus="$emit('foco', campo.pagina)"
      >
        <option value="">—</option>
        <option v-for="opcao in opcoes" :key="opcao.valor" :value="opcao.valor">
          {{ opcao.rotulo }}
        </option>
      </select>
      <input
        v-else
        :id="id"
        :type="tipo"
        :value="campo.valor ?? ''"
        :placeholder="campo.estado === 'nao_consta' ? 'Não consta no original' : ''"
        @change="aoAlterar"
        @focus="$emit('foco', campo.pagina)"
      />
      <button
        v-if="podeConfirmar"
        type="button"
        class="campo__botao campo__botao--confirmar"
        title="Confirmar conforme o original"
        @click="$emit('confirmar')"
      >
        <Check :size="14" />
      </button>
      <button
        v-if="campo.estado === 'vazio'"
        type="button"
        class="campo__botao"
        title="Marcar como não consta no original"
        @click="$emit('nao-consta')"
      >
        <Minus :size="14" />
      </button>
    </div>

    <p class="campo__nota">{{ nota }}</p>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { AlertCircle, Check, Circle, Minus, Pencil, Sparkles } from 'lucide-vue-next'
import { CampoRevisavel } from '@/domain/revisao'

export interface OpcaoCampo {
  valor: string
  rotulo: string
}

let contador = 0

export default defineComponent({
  name: 'CampoRevisao',
  components: { Check, Minus },
  props: {
    campo: { type: Object as PropType<CampoRevisavel>, required: true },
    tipo: { type: String, default: 'text' },
    opcoes: { type: Array as PropType<OpcaoCampo[]>, default: undefined }
  },
  emits: ['atualizar', 'confirmar', 'nao-consta', 'foco'],
  setup(props, { emit }) {
    const id = `campo-${++contador}`

    const icone = computed(() => ({
      vazio: Circle,
      conferido: Check,
      editado: Pencil,
      incerto: AlertCircle,
      sugerido: Sparkles,
      nao_consta: Minus
    })[props.campo.estado])

    const nota = computed(() => {
      const pagina = `p. ${props.campo.pagina}`
      switch (props.campo.estado) {
        case 'vazio': return `Não preenchido • original, ${pagina}`
        case 'conferido': return `Conferido • original, ${pagina}`
        case 'editado': return `Preenchido na revisão • ${pagina}`
        case 'incerto': return `${props.campo.nota ?? 'Leitura incerta'} • ${pagina}`
        case 'nao_consta': return `Não consta no original • não bloqueia`
        default: return `Sugestão da IA • conferir antes de aprovar`
      }
    })

    const podeConfirmar = computed(() =>
      props.campo.estado === 'incerto' || props.campo.estado === 'sugerido'
    )

    function aoAlterar(evento: Event) {
      emit('atualizar', (evento.target as HTMLInputElement | HTMLSelectElement).value)
    }

    return { id, icone, nota, podeConfirmar, aoAlterar }
  }
})
</script>

<style scoped>
.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.campo__rotulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}

.campo__icone {
  color: var(--cor-texto-fraco);
}

.campo--conferido .campo__icone,
.campo--editado .campo__icone {
  color: var(--cor-sucesso);
}

.campo--incerto .campo__icone {
  color: var(--cor-alerta);
}

.campo__controle {
  display: flex;
  gap: 6px;
}

.campo__controle input,
.campo__controle select {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  font: inherit;
  color: var(--cor-texto);
}

.campo--incerto input,
.campo--incerto select {
  border-color: #e3b341;
  background: var(--cor-alerta-suave);
}

.campo--sugerido input,
.campo--sugerido select,
.campo--nao_consta input {
  color: var(--cor-texto-suave);
}

.campo__botao {
  display: grid;
  place-items: center;
  width: 38px;
  border: 1px solid var(--cor-borda);
  border-radius: var(--raio);
  background: var(--cor-superficie);
  color: var(--cor-texto-suave);
}

.campo__botao:hover {
  background: var(--cor-fundo);
}

.campo__botao--confirmar {
  color: var(--cor-sucesso);
}

.campo__botao--confirmar:hover {
  background: var(--cor-sucesso-suave);
}

.campo__nota {
  margin: 0;
  font-size: 11px;
  color: var(--cor-texto-suave);
}

.campo--incerto .campo__nota {
  color: var(--cor-alerta);
}
</style>
