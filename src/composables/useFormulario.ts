import { reactive, ref } from 'vue'
import type { Regra } from '@/utils/validacao'

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
      erroGeral.value = e instanceof Error ? e.message : 'Não foi possível concluir. Tente novamente.'
      return false
    } finally {
      enviando.value = false
    }
  }

  return { valores, erros, enviando, erroGeral, validarCampo, enviar }
}