// Textos do Dashboard: alertas das fichas e descrição dos eventos da auditoria.
// Se o backend ganhar um alerta ou tipo de evento novo, basta acrescentar uma linha no mapa certo.

export const ALERTA_FICHA: Record<string, { rotulo: string; classe: string }> = {
  NASCIMENTO_AUSENTE: { rotulo: 'Nascimento ausente', classe: 'selo--alerta' },
  CAMPOS_OBRIGATORIOS_AUSENTES: { rotulo: 'Campos obrigatórios ausentes', classe: 'selo--alerta' },
  POSSIVEL_DUPLICIDADE: { rotulo: 'Possível duplicidade', classe: 'selo--info' }
}

export function descreverAlerta(alerta: string): { rotulo: string; classe: string } {
  return ALERTA_FICHA[alerta] ?? { rotulo: alerta, classe: 'selo--neutro' }
}

interface EventoParaTexto {
  tipo: string
  ficha: { codigo: string } | null
  lote: { codigo: string } | null
  paciente: { nome: string } | null
}

/** "Ficha FIC-0317 validada", "Lote DEM-012 recebido"... Tipo desconhecido volta como veio. */
export function descreverEvento(e: EventoParaTexto): string {
  const ficha = e.ficha?.codigo ?? 'sem código'
  const lote = e.lote?.codigo ?? 'sem código'
  switch (e.tipo) {
    case 'LOTE_ENVIADO': return `Lote ${lote} recebido`
    case 'LEITURA_CONCLUIDA': return `Leitura da ficha ${ficha} concluída`
    case 'LEITURA_FALHOU': return `Falha na leitura da ficha ${ficha}`
    case 'REPROCESSAMENTO': return `Ficha ${ficha} enviada para nova leitura`
    case 'REVISAO_INICIADA': return `Revisão da ficha ${ficha} iniciada`
    case 'REVISAO_ASSUMIDA': return `Revisão da ficha ${ficha} assumida`
    case 'CAMPO_EDITADO': return `Cadastro ${ficha} corrigido`
    case 'PENDENCIA_SINALIZADA': return `Pendência sinalizada na ficha ${ficha}`
    case 'FICHA_VALIDADA': return `Ficha ${ficha} validada`
    case 'FICHA_RECUSADA': return `Ficha ${ficha} recusada`
    case 'VINCULO_CONFIRMADO': return `Vínculo da ficha ${ficha} confirmado`
    case 'CONSULTA': return e.paciente ? `Prontuário de ${e.paciente.nome} consultado` : 'Prontuário consultado'
    default: return e.tipo
  }
}