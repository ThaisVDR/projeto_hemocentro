import { Component } from 'vue'
import { AlertCircle, Check, Circle, Minus, Pencil, Sparkles } from 'lucide-vue-next'
import { EstadoCampo } from '@/domain/revisao'

// Ícone e significado de cada estado de conferência, usados no campo e na legenda.
export const ESTADOS_CAMPO: { estado: EstadoCampo; icone: Component; rotulo: string }[] = [
  { estado: 'sugerido', icone: Sparkles, rotulo: 'Sugerido pela IA: conferir com o original' },
  { estado: 'conferido', icone: Check, rotulo: 'Conferido com o original' },
  { estado: 'editado', icone: Pencil, rotulo: 'Preenchido ou corrigido na revisão' },
  { estado: 'incerto', icone: AlertCircle, rotulo: 'Leitura incerta: bloqueia a aprovação' },
  { estado: 'vazio', icone: Circle, rotulo: 'Ainda não preenchido' },
  { estado: 'nao_consta', icone: Minus, rotulo: 'Em branco no original' }
]

export function estadoCampo(estado: EstadoCampo) {
  return ESTADOS_CAMPO.find(e => e.estado === estado) ?? ESTADOS_CAMPO[0]
}
