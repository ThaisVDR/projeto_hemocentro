// Limites do envio de fichas. Espelham src/config/upload.config.ts do backend:
// se mudar lá, mude aqui também.

/** Tamanho máximo por arquivo (multer: limits.fileSize). */
export const LIMITE_TAMANHO_MB = 110

/** Arquivos por requisição (multer: limits.files). Acima disso, o envio é dividido. */
export const MAXIMO_ARQUIVOS_POR_ENVIO = 30

/** Páginas por ficha. O frontend não confere isso (exigiria ler o PDF); o backend valida. */
export const MAXIMO_PAGINAS_POR_ARQUIVO = 30

export const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/png'] as const
