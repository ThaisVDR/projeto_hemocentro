export type Regra = (valor: string, todos: Record<string, string>) => string
export const obrigatorio = (msg = 'Preencha este campo.'): Regra => (v) => (v.trim() ? '' : msg)
export const email = (msg = 'Informe um e-mail válido.'): Regra => (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : msg)
export const minimo = (n: number): Regra => (v) => v.length >= n ? '' : `Informe pelo menos ${n} caracteres.`
export const letrasENumeros = (msg = 'Combine letras e números.'): Regra => (v) =>
  /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : msg
export const igualA = (outroCampo: string, msg: string): Regra => (v, todos) =>
  v === todos[outroCampo] ? '' : msg

// Mesma regra do backend: de 8 a 64 caracteres (frases com espaço são bem-vindas).
export const politicaSenha = (): Regra => (v) => {
  const tamanho = Array.from(v).length
  return tamanho >= 8 && tamanho <= 64 ? '' : 'A senha deve ter entre 8 e 64 caracteres.'
}
