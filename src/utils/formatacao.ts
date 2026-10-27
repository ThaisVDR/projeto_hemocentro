import { formatarRacaCor } from '@/domain/paciente'
import { lerCodigoRacaCor } from '@/domain/resumoImunohematologico'

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

export function textoRacaCor(valor: string | null): string {
  const codigo = lerCodigoRacaCor(valor)
  if (codigo) return formatarRacaCor(codigo)
  return valor || 'Não informada'
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