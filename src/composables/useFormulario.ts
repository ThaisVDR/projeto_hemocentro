import { reactive, ref } from 'vue'
import type { Regra } from '@/utils/validacao'
import { ErroApi } from '@/services/api'

function extrairMensagemAmigavel(e: unknown): string {
    if (e instanceof ErroApi) {
    if (e.status === 409) return 'E-mail ou registro já cadastrado no sistema.'
    if (e.status === 401) return 'E-mail ou senha incorretos.'
    if (e.status === 500) return 'Serviço temporariamente indisponível.'
    return e.message || 'Não foi possível concluir. Tente novamente.'
  }
  if (e instanceof Error && e.message.trim()) return e.message
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
    } catch (e) {
      erroGeral.value = extrairMensagemAmigavel(e)
      return false
    } finally {
      enviando.value = false
    }
  }

  return { valores, erros, enviando, erroGeral, validarCampo, enviar }
}