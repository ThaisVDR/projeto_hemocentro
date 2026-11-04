export function formatarData(iso?: string | null): string {
  if (!iso) return ''
  const encontrado = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return encontrado ? `${encontrado[3]}/${encontrado[2]}/${encontrado[1]}` : iso
}

export function dataBrasileiraParaIso(texto: string): string {
  const partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!partes) return ''

  const [, dia, mes, ano] = partes
  const data = new Date(`${ano}-${mes}-${dia}T00:00:00`)
  const existe =
    data.getFullYear() === Number(ano) &&
    data.getMonth() + 1 === Number(mes) &&
    data.getDate() === Number(dia)

  return existe ? `${ano}-${mes}-${dia}` : ''
}
export function iniciais(nomeCompleto: string): string {
  const palavras = nomeCompleto.trim().split(' ').filter(palavra => palavra !== '')
  const primeira = palavras[0]

  if (palavras.length === 1) {
    return primeira[0].toUpperCase()
  }

  const ultima = palavras[palavras.length - 1]
  return (primeira[0] + ultima[0]).toUpperCase()
}

export function calcularIdade(iso?: string | null, hoje = new Date()): number | null {
  if (!iso) return null
  const [ano, mes, dia] = iso.split('-').map(Number)
  if (!ano || !mes || !dia) return null

  let idade = hoje.getFullYear() - ano
  const mesAtual = hoje.getMonth() + 1
  const aindaNaoFezAniversario = mesAtual < mes || (mesAtual === mes && hoje.getDate() < dia)
  if (aindaNaoFezAniversario) idade = idade - 1

  return idade
}

// Para comparar nomes sem diferenciar maiúsculas nem acentos: "Cuiabá" e "cuiaba" ficam iguais.
export function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// "2026-10-09T13:10:05.000Z" → "09/10/2026 10:10" (horário local). Se não der para ler, devolve o texto como veio.
export function formatarDataHora(iso?: string | null): string {
  if (!iso) return ''
  const data = new Date(iso)
  return isNaN(data.getTime()) ? iso : data.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// "hoje, 10:18", "ontem, 22:05" ou "09/10, 14:30" (horário local). Para listas de atividade recente.
export function formatarQuando(iso?: string | null, agora: Date = new Date()): string {
  if (!iso) return ''
  const data = new Date(iso)
  if (isNaN(data.getTime())) return iso
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const ontem = new Date(agora)
  ontem.setDate(agora.getDate() - 1)
  if (data.toDateString() === agora.toDateString()) return `hoje, ${hora}`
  if (data.toDateString() === ontem.toDateString()) return `ontem, ${hora}`
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}, ${hora}`
}