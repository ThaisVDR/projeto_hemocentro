<template>
  <article class="cartao cabecalho">
    <div class="cabecalho__topo">
      <span class="cabecalho__avatar">{{ iniciais(paciente.nome) }}</span>
      <div>
        <h2>{{ paciente.nome }}</h2>
        <p class="cabecalho__resumo">{{ resumo }}</p>
      </div>
    </div>

    <dl class="destaques">
      <div class="destaque destaque--raca">
        <dt>Raça/cor</dt>
        <dd>{{ traduzirRaca(paciente.racaCor) }}</dd>
      </div>

      <div class="destaque">
        <dt>Grupo ABO/Rh</dt>
        <dd>{{ traduzirAboRh(paciente.aboRh) }}</dd>
      </div>

      <div class="destaque destaque--antigenos">
        <dt>Antígenos negativos</dt>
        <dd v-if="paciente.antigenosNegativos.length > 0" class="destaque__lista">
          <span v-for="antigeno in paciente.antigenosNegativos" :key="antigeno" class="selo selo--neutro">
            {{ antigeno }}
          </span>
        </dd>
        <dd v-else class="destaque__vazio">Fenotipagem não informada</dd>
      </div>
    </dl>

    <dl class="identificacao">
      <div>
        <dt>Data de nascimento</dt>
        <dd>{{ formatarData(paciente.dataNascimento) || 'Não informada' }}</dd>
      </div>
      <div>
        <dt>Nome da mãe</dt>
        <dd>{{ paciente.nomeMae || 'Não informado' }}</dd>
      </div>
      <div>
        <dt>CPF</dt>
        <dd>{{ paciente.cpf || 'Não disponível' }}</dd>
      </div>
      <div>
        <dt>Município</dt>
        <dd>{{ paciente.municipio || 'Não informado' }}</dd>
      </div>
      <div>
        <dt>Sexo</dt>
        <dd>{{ traduzirSexo(paciente.sexo) }}</dd>
      </div>
    </dl>

    <p v-if="paciente.ultimaValidacao" class="cabecalho__validacao">
      <CheckCircle :size="14" />
      Cadastro conferido por {{ paciente.ultimaValidacao.por }} em {{ dataHora(paciente.ultimaValidacao.em) }}
    </p>
  </article>
</template>

<script lang="ts">
import { traduzirAboRh, traduzirRaca, traduzirSexo } from '@/domain/traducao'
import { computed, defineComponent, PropType } from 'vue'
import { CheckCircle } from 'lucide-vue-next'
import { PacienteDetalheApi } from '@/services/api'
import { calcularIdade, formatarData, iniciais } from '@/utils/formatacao'

export default defineComponent({
  name: 'CabecalhoPaciente',
  components: { CheckCircle },
  props: {
    paciente: { type: Object as PropType<PacienteDetalheApi>, required: true }
  },
  setup(props) {
    const resumo = computed(() => {
      const partes: string[] = []
      if (props.paciente.prontuario) partes.push(`Prontuário ${props.paciente.prontuario}`)

      const idade = calcularIdade(props.paciente.dataNascimento)
      if (idade !== null) partes.push(`${idade} anos`)

      return partes.join(' • ')
    })

    function dataHora(iso: string): string {
      const data = new Date(iso)
      return isNaN(data.getTime())
        ? iso
        : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    }

    return { resumo, dataHora, iniciais, traduzirRaca, traduzirAboRh, traduzirSexo, formatarData }
  }
})
</script>

<style scoped>
.cabecalho {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cabecalho__topo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cabecalho__avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--cor-primaria-suave);
  color: var(--cor-primaria);
  font-size: 17px;
  font-weight: 700;
}

h2 {
  font-size: 22px;
}

.cabecalho__resumo {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--cor-texto-suave);
}

dl {
  margin: 0;
}

dt {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--cor-texto-suave);
}

dd {
  margin: 4px 0 0;
}

.destaques {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: 12px;
}

.destaque {
  padding: 12px 14px;
  border-radius: var(--raio);
  background: var(--cor-fundo);
}

.destaque dd {
  font-size: 16px;
  font-weight: 600;
}

.destaque--raca {
  background: var(--cor-primaria-suave);
}

.destaque--raca dt,
.destaque--raca dd {
  color: var(--cor-primaria);
}

.destaque__lista {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.destaque__lista .selo::before {
  display: none;
}

.destaque__vazio {
  font-size: 13px !important;
  font-weight: 400 !important;
  color: var(--cor-texto-fraco);
}

.identificacao {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--cor-borda);
}

.identificacao dd {
  font-weight: 600;
}

.cabecalho__validacao {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--cor-sucesso);
}
</style>