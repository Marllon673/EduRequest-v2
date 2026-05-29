export type UserType = 'Estudante' | 'Admin';
export type RequestStatus = 'Pendente' | 'Em análise' | 'Concluída';
export type RequestPriority = 'Baixa' | 'Média' | 'Alta';
export type RequestCategory = 'Acadêmico' | 'Financeiro' | 'Outros';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  tipo: UserType;
  telefone?: string;
  matricula?: string;
  curso?: string;
  fotoPerfil?: string;
  preferenciaTema: 'Claro' | 'Escuro';
  notificacoesAtivas: boolean;
}

export interface RequestHistoryItem {
  id?: string;
  data: string;
  mensagem: string;
  usuario: string;
  tipo?: 'comentario' | 'sistema';
  editado?: boolean;
}

export interface RequestEvaluation {
  nota: number;
  comentario: string;
  dataAvaliacao: string;
}

export interface AcademicRequest {
  id: string;
  titulo: string;
  descricao: string;
  dataCriacao: string;
  status: RequestStatus;
  prioridade: RequestPriority;
  categoria: RequestCategory;
  usuarioId: string;
  comentarioAdmin?: string;
  historico: RequestHistoryItem[];
  importante: boolean;
  arquivos: string[];
  avaliacao?: RequestEvaluation;
}

export interface AppNotification {
  id: string;
  usuarioId: string;
  titulo: string;
  mensagem: string;
  data: string;
  lida: boolean;
  solicitacaoId?: string;
}
