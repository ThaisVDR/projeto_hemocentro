import { reactive, ref } from 'vue'
import type { Regra } from '@/utils/validacao'

function extrairMensagemAmigavel(e: any): string {
  const mensagem = e?.response?.data?.message || e?.response?.data?.mensagem || e?.message || ''
  if (
    typeof mensagem === 'string' &&
    (mensagem.includes('prisma') || mensagem.includes('C:\\Users') || mensagem.includes('invocation in'))
  ) {
    return 'Ocorreu um erro interno de processamento. Tente mais tarde.'
  }

  const status = e?.response?.status
  if (status === 409) return 'E-mail ou registro já cadastrado no sistema.'
  if (status === 401) return 'E-mail ou senha incorretos.'
  if (status === 500) return 'Serviço temporariamente indisponível.'

  if (typeof mensagem === 'string' && mensagem.trim().length > 0) {
    return mensagem
  }
  return 'Não foi possível concluir. Tente novamente.'
}

export function useFormulario<T extends Record<string, string>>(
  inicial: T,
  regras: Partial<Record<keyof T, Regra[]>>
) {
  const valores = reactive({ ...inicial }) as T
  const erros = reactive<Record<string, string>>({})
  const enviando = ref(false)
  const erroGeral = ref('')

  function validarCampo(campo: keyof T & string): boolean {
    for (const regra of regras[campo] ?? []) {
      const mensagem = regra(valores[campo], valores)
      if (mensagem) {
        erros[campo] = mensagem
        return false
      }
    }
    erros[campo] = ''
    return true
  }

  function validar(): boolean {
    const campos = Object.keys(regras) as Array<keyof T & string>
    return campos.map((c) => validarCampo(c)).every(Boolean)
  }

  async function enviar(acao: (dados: T) => Promise<unknown>): Promise<boolean> {
    erroGeral.value = ''
    if (!validar()) return false
    enviando.value = true
    try {
      await acao({ ...valores })
      return true
    } catch (e: any) {
      erroGeral.value = extrairMensagemAmigavel(e)
      return false
    } finally {
      enviando.value = false
    }
  }

  return { valores, erros, enviando, erroGeral, validarCampo, enviar }
}