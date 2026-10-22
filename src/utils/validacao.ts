export type Regra = (valor: string, todos: Record<string, string>) => string
export const obrigatorio = (msg = 'Preencha este campo.'): Regra => (v) => (v.trim() ? '' : msg)
export const email = (msg = 'Informe um e-mail válido.'): Regra => (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : msg)
export const minimo = (n: number): Regra => (v) => v.length >= n ? '' : `Informe pelo menos ${n} caracteres.`
export const letrasENumeros = (msg = 'Combine letras e números.'): Regra => (v) =>
  /[A-Za-z]/.test(v) && /\d/.test(v) ? '' : msg
export const igualA = (outroCampo: string, msg: string): Regra => (v, todos) =>
  v === todos[outroCampo] ? '' : msg