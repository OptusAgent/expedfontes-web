// ============================================================
// TIPOS CENTRAIS — ExpedFontes
// Prontos para substituição por tipos Supabase quando migrar
// ============================================================

export type NivelAcesso = 'admin' | 'gestor' | 'operador' | 'atendimento'

export type StatusNF =
  | 'aguardando_etiqueta'
  | 'etiqueta_liberada'
  | 'cancelada'
  | 'expedida'
  | 'em_derrubada'

export type MotivoRuptura =
  | 'sem_etiqueta'
  | 'cancelada'
  | 'aguardando_liberacao'
  | 'erro_bling'
  | 'produto_avariado'

export type NivelUrgencia = 'normal' | 'atencao' | 'urgente' | 'critico'

export type StatusDerrubada =
  | 'preparando'
  | 'aguardando_impressao'
  | 'expedida'
  | 'cancelada'

export type TipoServico =
  | 'etiquetagem'
  | 'montagem_kit'
  | 'rebatimento_palete'
  | 'outros'

export type StatusServico =
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'em_andamento'
  | 'finalizado'
  | 'recusado'

// ── Usuário ──────────────────────────────────────────────────
export interface Usuario {
  id: string
  nome: string
  email: string
  senha?: string // não salvar senha real — só para prototype
  nivel_acesso: NivelAcesso
  avatar?: string
  ativo: boolean
  criado_em: string
  // Para multitenancy Supabase: tenant_id, cliente_id
}

// ── Cliente (Marca) ──────────────────────────────────────────
export interface Cliente {
  id: string
  nome: string
  cnpj: string
  email_contato: string
  telefone?: string
  ativo: boolean
  bling_configurado: boolean
  criado_em: string
  // Supabase: bling_client_id, bling_access_token, bling_refresh_token
}

// ── Nota Fiscal ──────────────────────────────────────────────
export interface NF {
  id: string
  numero_nf: string
  id_bling?: string
  numero_pedido: string
  cliente_id: string
  cliente_nome: string
  transportadora: string
  valor_estimado: number
  destinatario?: string
  status: StatusNF
  data_entrada: string
  data_resolucao?: string
  derrubada_id?: string
  criado_em: string
}

// ── Derrubada ────────────────────────────────────────────────
export interface Derrubada {
  id: string
  codigo: string
  cliente_id: string
  cliente_nome: string
  operador_id: string
  operador_nome: string
  transportadora: string
  status: StatusDerrubada
  nfs: string[] // IDs de NFs
  qtd_nfs: number
  qtd_pendentes: number
  data_criacao: string
  data_expedicao?: string
}

// ── Ruptura ──────────────────────────────────────────────────
export interface Ruptura {
  id: string
  nf_id: string
  numero_nf: string
  cliente_id: string
  cliente_nome: string
  transportadora: string
  motivo: MotivoRuptura
  obs?: string
  dias_pendente: number
  score_urgencia: number
  nivel_urgencia: NivelUrgencia
  data_abertura: string
  data_resolucao?: string
  resolvida: boolean
  acoes: AcaoRuptura[]
  // Supabase: resolvida_por_id
}

export interface AcaoRuptura {
  id: string
  ruptura_id: string
  usuario_id: string
  usuario_nome: string
  tipo: 'contato_cliente' | 'atualizacao_status' | 'escalonamento' | 'observacao'
  descricao: string
  criado_em: string
}

// ── Serviço Extra ────────────────────────────────────────────
export interface ServicoExtra {
  id: string
  codigo: string
  cliente_id: string
  cliente_nome: string
  responsavel_id: string
  responsavel_nome: string
  tipo: TipoServico
  descricao: string
  quantidade: number
  quantidade_real?: number
  unidade: string
  valor_unitario: number
  valor_total: number
  status: StatusServico
  data_solicitacao: string
  data_inicio?: string
  prazo?: string
  data_finalizacao?: string
  aprovacao_token?: string
  aprovacao_data?: string
  aprovacao_ip?: string
  mes_referencia: string
  obs?: string
}

// ── Alerta ───────────────────────────────────────────────────
export interface Alerta {
  id: string
  tipo: 'critico' | 'aviso' | 'info' | 'sucesso'
  titulo: string
  mensagem: string
  entidade_tipo?: 'nf' | 'derrubada' | 'ruptura' | 'servico'
  entidade_id?: string
  lido: boolean
  destinatario_id?: string
  criado_em: string
}

// ── Chat ─────────────────────────────────────────────────────
export interface MensagemChat {
  id: string
  conversa_id: string
  remetente_id: string
  remetente_nome: string
  conteudo: string
  tipo: 'texto' | 'sistema' | 'alerta'
  criado_em: string
  lida: boolean
}

export interface Conversa {
  id: string
  participantes: string[] // IDs de usuários
  titulo?: string // para grupos
  ultima_mensagem?: string
  ultima_mensagem_em?: string
  nao_lidas: number
}

// ── IA ───────────────────────────────────────────────────────
export interface ClassificacaoOBS {
  intent: 'cancelar' | 'etiqueta_recebida' | 'aguardando_etiqueta' | 'expedido' | 'contato_realizado' | 'outros'
  transportadora_inferida?: string
  acao_tomada?: string
  status_sugerido: StatusNF | 'ruptura'
  proximo_passo: string
  confianca: number // 0-100
}

export interface ExtracacaoImagem {
  tipo_documento: 'danfe' | 'etiqueta_rastreio' | 'nota_manual' | 'produto' | 'desconhecido'
  numero_nf?: string
  numero_pedido?: string
  cliente?: string
  destinatario?: string
  transportadora?: string
  codigo_rastreio?: string
  valor?: string
  ean?: string
  produto?: string
  quantidade?: string
  confianca: number
  campos_detectados: string[]
}

export interface BriefingIA {
  data_hora: string
  resumo_operacao: string
  alertas_ia: string[]
  tendencia: string
  acao_sugerida: string
  previsao_amanha: {
    volume_estimado: string
    rupturas_estimadas: string
    probabilidade_pico: string
    recomendacao: string
  }
}

// ── Auth Context ─────────────────────────────────────────────
export interface AuthContextType {
  usuario: Usuario | null
  login: (email: string, senha: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

// ── Dashboard ────────────────────────────────────────────────
export interface MetricaDashboard {
  nfs_pendentes_hoje: number
  derrubadas_hoje: number
  derrubadas_expedidas: number
  nfs_criticas: number
  servicos_andamento: number
  taxa_resolucao: number
  sla_medio_dias: number
  volume_semana: number[]
}
