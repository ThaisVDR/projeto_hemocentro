// src/domain/usuario.ts
export type PerfilUsuario = 'GESTOR' | 'COLABORADOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string | null;
  perfil: PerfilUsuario;
  // REMOVA esta linha se ela existir: permissoes: string[];
  ativo: boolean;
}