// Tipos de evento da trilha de auditoria (enum TipoEvento do backend) → texto e cor do selo.
// Se o backend ganhar um tipo novo, basta acrescentar uma linha em TIPOS_EVENTO.

export type TipoEventoApi =
  | 'LOTE_ENVIADO'
  | 'LEITURA_CONCLUIDA'
  | 'LEITURA_FALHOU'
  | 'REPROCESSAMENTO'
  | 'REVISAO_INICIADA'
  | 'REVISAO_ASSUMIDA'
  | 'CAMPO_EDITADO'
  | 'PENDENCIA_SINALIZADA'
  | 'FICHA_VALIDADA'
  | 'FICHA_RECUSADA'
  | 'VINCULO_CONFIRMADO'
  | 'CONSULTA'

export interface InfoTipoEvento {
  rotulo: string
  classe: string // classe .selo--* do base.css
}

export const TIPOS_EVENTO: Record<TipoEventoApi, InfoTipoEvento> = {
  LOTE_ENVIADO: { rotulo: 'Lote enviado', classe: 'selo--info' },
  LEITURA_CONCLUIDA: { rotulo: 'Leitura concluída', classe: 'selo--neutro' },
  LEITURA_FALHOU: { rotulo: 'Leitura falhou', classe: 'selo--perigo' },
  REPROCESSAMENTO: { rotulo: 'Reprocessamento', classe: 'selo--neutro' },
  REVISAO_INICIADA: { rotulo: 'Revisão iniciada', classe: 'selo--info' },
  REVISAO_ASSUMIDA: { rotulo: 'Revisão assumida', classe: 'selo--info' },
  CAMPO_EDITADO: { rotulo: 'Campo editado', classe: 'selo--alerta' },
  PENDENCIA_SINALIZADA: { rotulo: 'Pendência sinalizada', classe: 'selo--alerta' },
  FICHA_VALIDADA: { rotulo: 'Ficha validada', classe: 'selo--sucesso' },
  FICHA_RECUSADA: { rotulo: 'Ficha recusada', classe: 'selo--perigo' },
  VINCULO_CONFIRMADO: { rotulo: 'Vínculo confirmado', classe: 'selo--sucesso' },
  CONSULTA: { rotulo: 'Consulta', classe: 'selo--neutro' }
}

export const OPCOES_TIPO_EVENTO = (Object.keys(TIPOS_EVENTO) as TipoEventoApi[]).map(valor => ({
  valor,
  rotulo: TIPOS_EVENTO[valor].rotulo
}))

// Tipo desconhecido (enum novo no backend) não quebra a tela: mostra o código cru.
export function infoDoTipo(tipo: string): InfoTipoEvento {
  return TIPOS_EVENTO[tipo as TipoEventoApi] ?? { rotulo: tipo, classe: 'selo--neutro' }
}

// "09/10/2026" e "10:24:08" separados, para a tabela mostrar um embaixo do outro.
export function partesDataHora(iso: string): { data: string; hora: string } {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return { data: iso, hora: '' }
  return {
    data: d.toLocaleDateString('pt-BR'),
    hora: d.toLocaleTimeString('pt-BR', { hour12: false })
  }
}