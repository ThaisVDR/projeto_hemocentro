import { ref } from 'vue'

// Avisos flutuantes: aparecem num canto fixo da tela, onde quer que a pessoa esteja rolada.
// Sucesso, informação e alerta somem sozinhos; erro fica até a pessoa fechar.
export type TipoAviso = 'sucesso' | 'info' | 'alerta' | 'erro'

export interface Aviso {
  id: number
  tipo: TipoAviso
  texto: string
}

const DURACAO_MS = 5000
const avisos = ref<Aviso[]>([])
let proximoId = 0

export function fecharAviso(id: number): void {
  avisos.value = avisos.value.filter(aviso => aviso.id !== id)
}

export function avisar(tipo: TipoAviso, texto: string): void {
  const id = ++proximoId
  avisos.value.push({ id, tipo, texto })
  if (tipo !== 'erro') window.setTimeout(() => fecharAviso(id), DURACAO_MS)
}

export function useAvisos() {
  return { avisos, avisar, fecharAviso }
}
