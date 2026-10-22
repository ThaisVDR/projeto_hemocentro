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