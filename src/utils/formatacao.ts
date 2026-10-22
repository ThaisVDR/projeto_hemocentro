/** "2026-08-14" → "14/08/2026". Outros formatos são devolvidos sem alteração. */
export function formatarData(iso?: string | null): string {
  if (!iso) return ''
  const encontrado = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return encontrado ? `${encontrado[3]}/${encontrado[2]}/${encontrado[1]}` : iso
}
