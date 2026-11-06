export type Regra = (valor: string, todos: Record<string, string>) => string
export const obrigatorio = (msg = 'Preencha este campo.'): Regra => (v) => (v.trim() ? '' : msg)
export const email = (msg = 'Informe um e-mail válido.'): Regra => (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : msg)
export const minimo = (n: number): Regra => (v) => v.length >= n ? '' : `Informe pelo menos ${n} caracteres.`
export const letrasENumeros = (msg = 'Combine letras e números.'): Regra => (v) =>
  /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : msg
export const igualA = (outroCampo: string, msg: string): Regra => (v, todos) =>
  v === todos[outroCampo] ? '' : msg
export const MSG_REGRA_SENHA =
  'A senha deve ter pelo menos uma letra minúscula, uma maiúscula, um número e um caractere especial.'
export const DICA_REGRA_SENHA =
  'De 8 a 64 caracteres, com maiúscula, minúscula, número e caractere especial (ex.: ! @ # $).'
export const politicaSenha = (): Regra => (v) => {
  const tamanho = Array.from(v).length
  if (tamanho < 8 || tamanho > 64) return 'A senha deve ter entre 8 e 64 caracteres.'
  const ok =
    /\p{Ll}/u.test(v) && /\p{Lu}/u.test(v) && /\d/.test(v) && /[^\p{L}\p{N}\s]/u.test(v)
  return ok ? '' : MSG_REGRA_SENHA
}