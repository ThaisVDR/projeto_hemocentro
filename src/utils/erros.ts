// Mensagens técnicas (banco, ORM, IA) nunca devem chegar à tela: o detalhe vai para o console.
const PADROES_TECNICOS = [
  /prisma/i, /\$queryRaw/i, /raw query/i, /invalid `/i, /does not exist/i, /syntax error/i, /sqlstate/i,
  /\bunaccent\b/i, /\bSELECT\b|\bINSERT\b|\bUPDATE\b.+\bSET\b/, /GoogleGenerativeAI/i, /googleapis\.com/i,
  /ECONNREFUSED|ECONNRESET|ETIMEDOUT/, /internal server error/i, /\bat \S+ \(.+:\d+:\d+\)/
]

export const MENSAGEM_ERRO_GENERICA =
  'Não foi possível concluir a operação no servidor. Seus dados foram mantidos; tente novamente. ' +
  'Se o problema continuar, avise o suporte.'

export function ehErroTecnico(mensagem: string): boolean {
  return PADROES_TECNICOS.some(padrao => padrao.test(mensagem))
}

// Texto seguro para mostrar à pessoa. Mensagens de validação em português passam como vieram.
export function mensagemSegura(mensagem: string): string {
  return ehErroTecnico(mensagem) ? MENSAGEM_ERRO_GENERICA : mensagem
}

// Traduz o erro bruto da leitura pela IA (cota, sobrecarga, tempo, resposta inválida).
export function mensagemErroLeitura(erro: string): string {
  if (erro.includes('429') || /quota/i.test(erro)) {
    return 'A cota diária da IA acabou. Tente reprocessar amanhã.'
  }
  if (erro.includes('503') || /high demand|overloaded/i.test(erro)) {
    return 'A IA está sobrecarregada no momento. Tente reprocessar em alguns minutos.'
  }
  if (/aborted|timeout|tempo/i.test(erro)) {
    return 'A leitura demorou demais e foi interrompida. Tente reprocessar.'
  }
  if (/JSON/.test(erro)) {
    return 'A IA devolveu uma resposta incompleta. Tente reprocessar.'
  }
  return 'Não foi possível ler esta ficha. Tente reprocessar.'
}
