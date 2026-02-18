// ============================================================
// MOTOR DE IA — ExpedFontes (Simulação para Protótipo)
//
// ARQUITETURA DE MIGRAÇÃO PARA IA REAL:
// Cada função tem comentário ⚡ indicando como conectar
// à Claude API real. Trocar a implementação aqui,
// nenhuma page/component precisa ser alterada.
//
// Funcionalidades:
//   1. Classificação do campo OBS (NLP)
//   2. Extração de dados de imagem (Vision)
//   3. Score de urgência de rupturas (ML)
//   4. Briefing executivo (LLM)
//   5. Geração de mensagem para cliente (LLM)
// ============================================================

import type { ClassificacaoOBS, ExtracacaoImagem, Ruptura } from '@/types'

// Simula latência da API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms))

// ── 1. Classificação do campo OBS ────────────────────────────
// ⚡ Real: anthropic.messages.create({ model: 'claude-sonnet-4-5-20250929',
//   messages: [{ role: 'user', content: `Classifique este OBS de logística: "${obs}"` }]})

export async function classificarOBS(obs: string): Promise<ClassificacaoOBS> {
  await delay(800 + Math.random() * 400)

  const texto = obs.toLowerCase()

  // Padrões detectados
  if (/cancelar|cancela|cancelamento|pode cancel/.test(texto)) {
    return {
      intent: 'cancelar',
      acao_tomada: 'cliente_solicitou_cancelamento',
      status_sugerido: 'cancelada',
      proximo_passo: 'Baixar NF no sistema e cancelar no Bling',
      confianca: 92,
    }
  }

  if (/etiqueta enviada|etiqueta ok|etiqueta liberada|rastreio liberado/.test(texto)) {
    return {
      intent: 'etiqueta_recebida',
      acao_tomada: 'etiqueta_disponivel',
      status_sugerido: 'etiqueta_liberada',
      proximo_passo: 'Incluir NF na próxima derrubada disponível',
      confianca: 95,
    }
  }

  if (/expedido|expedida|saiu|despachou/.test(texto)) {
    return {
      intent: 'expedido',
      acao_tomada: 'mercadoria_expedida',
      status_sugerido: 'expedida',
      proximo_passo: 'Registrar data de expedição e fechar ruptura',
      confianca: 88,
    }
  }

  if (/correios|jadlog|total express|mercado envios|loggi/.test(texto)) {
    const transportadoras: Record<string, string> = {
      'correios': 'Correios',
      'jadlog': 'Jadlog',
      'total express': 'Total Express',
      'mercado envios': 'Mercado Envios',
      'loggi': 'Loggi',
    }
    const transportadora = Object.entries(transportadoras).find(([key]) => texto.includes(key))?.[1]

    return {
      intent: 'aguardando_etiqueta',
      transportadora_inferida: transportadora,
      acao_tomada: 'aguardando_geracao_etiqueta',
      status_sugerido: 'aguardando_etiqueta',
      proximo_passo: `Contatar cliente para liberar etiqueta ${transportadora} no Bling`,
      confianca: 85,
    }
  }

  if (/sinalizado|avisado|notificado|contatado|cliente avisou/.test(texto)) {
    return {
      intent: 'contato_realizado',
      acao_tomada: 'cliente_notificado',
      status_sugerido: 'aguardando_etiqueta',
      proximo_passo: 'Aguardar retorno do cliente. Follow-up em 24h se sem resposta.',
      confianca: 78,
    }
  }

  // Default
  return {
    intent: 'outros',
    acao_tomada: 'sem_acao_identificada',
    status_sugerido: 'ruptura',
    proximo_passo: 'Revisar manualmente e definir próximo passo',
    confianca: 45,
  }
}

// ── 2. Extração de dados de imagem ───────────────────────────
// ⚡ Real: anthropic.messages.create({
//   model: 'claude-sonnet-4-5-20250929',
//   messages: [{ role: 'user', content: [
//     { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 }},
//     { type: 'text', text: 'Extraia os dados desta DANFE/etiqueta logística em JSON' }
//   ]}]})

export async function extrairDadosImagem(
  imageBase64: string,
  tipoHint?: 'danfe' | 'etiqueta' | 'produto'
): Promise<ExtracacaoImagem> {
  await delay(1500 + Math.random() * 1000)

  // Simula diferentes resultados baseados no tipo de hint
  if (tipoHint === 'danfe' || Math.random() > 0.6) {
    const nfNums = ['141779', '302475', '550200', '450001', '142150']
    const clientes = ['ByteDance (TikTok Shop)', 'GUDAY', 'MAISMU', 'BM Beauty']
    const transportadoras = ['Correios', 'Jadlog', 'Total Express']
    const destinatarios = ['João Silva - São Paulo/SP', 'Maria Santos - Rio de Janeiro/RJ', 'Pedro Costa - Belo Horizonte/MG']

    const nf = nfNums[Math.floor(Math.random() * nfNums.length)]
    const cliente = clientes[Math.floor(Math.random() * clientes.length)]
    const transp = transportadoras[Math.floor(Math.random() * transportadoras.length)]
    const dest = destinatarios[Math.floor(Math.random() * destinatarios.length)]
    const valor = (100 + Math.random() * 400).toFixed(2)

    return {
      tipo_documento: 'danfe',
      numero_nf: nf,
      numero_pedido: `PED-${165000 + Math.floor(Math.random() * 500)}`,
      cliente: cliente,
      destinatario: dest,
      transportadora: transp,
      valor: `R$ ${valor}`,
      confianca: 88 + Math.floor(Math.random() * 10),
      campos_detectados: ['numero_nf', 'numero_pedido', 'cliente', 'destinatario', 'transportadora', 'valor'],
    }
  }

  if (tipoHint === 'etiqueta') {
    const codigos = ['BR123456789BR', 'JD00123456789', 'TE987654321BR']
    const codigo = codigos[Math.floor(Math.random() * codigos.length)]

    return {
      tipo_documento: 'etiqueta_rastreio',
      codigo_rastreio: codigo,
      destinatario: 'Carlos Lima - Fortaleza/CE',
      transportadora: codigo.startsWith('BR') ? 'Correios' : codigo.startsWith('JD') ? 'Jadlog' : 'Total Express',
      confianca: 94,
      campos_detectados: ['codigo_rastreio', 'destinatario', 'transportadora'],
    }
  }

  if (tipoHint === 'produto') {
    const eans = ['7896056800068', '7891150047430', '7896045105059']
    const produtos = ['Kit Beleza Premium', 'Cápsula Café Especial', 'Body Splash Floral', 'Loção Hidratante']

    return {
      tipo_documento: 'produto',
      ean: eans[Math.floor(Math.random() * eans.length)],
      produto: produtos[Math.floor(Math.random() * produtos.length)],
      quantidade: String(50 + Math.floor(Math.random() * 300)),
      confianca: 82,
      campos_detectados: ['ean', 'produto', 'quantidade'],
    }
  }

  return {
    tipo_documento: 'desconhecido',
    confianca: 20,
    campos_detectados: [],
  }
}

// ── 3. Score de urgência de rupturas ─────────────────────────
// ⚡ Real: modelo scikit-learn (RandomForest) servido via FastAPI
//   ou cálculo direto no frontend com pesos configuráveis

export function calcularScoreUrgencia(ruptura: {
  dias_pendente: number
  transportadora: string
  cliente_nome: string
  valor_estimado?: number
}): { score: number; nivel: 'normal' | 'atencao' | 'urgente' | 'critico'; explicacao: string } {
  let score = 0
  const explicacoes: string[] = []

  // Peso 1: Dias pendente (0-50 pontos)
  const pontoDias = Math.min(ruptura.dias_pendente * 7, 50)
  score += pontoDias
  if (ruptura.dias_pendente >= 5) explicacoes.push(`${ruptura.dias_pendente} dias em aberto (crítico)`)
  else if (ruptura.dias_pendente >= 3) explicacoes.push(`${ruptura.dias_pendente} dias em aberto`)

  // Peso 2: Transportadora (Correios tem prazo mais rígido)
  if (ruptura.transportadora === 'Correios') {
    score += 20
    explicacoes.push('Correios: prazo mais crítico')
  } else if (ruptura.transportadora === 'Total Express') {
    score += 12
  } else {
    score += 5
  }

  // Peso 3: Histórico do cliente (simula reincidência)
  const clientesReincidentes = ['BM Beauty', 'GUDAY', 'SONOCOMSONO']
  if (clientesReincidentes.some(c => ruptura.cliente_nome.includes(c))) {
    score += 15
    explicacoes.push('Cliente com histórico de demora na resolução')
  }

  // Peso 4: Valor da NF
  if (ruptura.valor_estimado && ruptura.valor_estimado > 300) {
    score += 10
    explicacoes.push('NF de alto valor')
  }

  score = Math.min(100, score)

  let nivel: 'normal' | 'atencao' | 'urgente' | 'critico'
  if (score >= 86) nivel = 'critico'
  else if (score >= 61) nivel = 'urgente'
  else if (score >= 31) nivel = 'atencao'
  else nivel = 'normal'

  return {
    score,
    nivel,
    explicacao: explicacoes.join(' | ') || 'Ruptura recente, monitorar',
  }
}

// ── 4. Briefing executivo ─────────────────────────────────────
// ⚡ Real: anthropic.messages.create({ model: 'claude-sonnet-4-5-20250929',
//   system: 'Você é um analista de operações logísticas...',
//   messages: [{ role: 'user', content: JSON.stringify(dashboardData) }]})

export async function gerarBriefing(dados: {
  rupturas_ativas: number
  criticas: number
  derrubadas_hoje: number
  nfs_pendentes: number
}): Promise<string> {
  await delay(2000 + Math.random() * 1000)

  const { rupturas_ativas, criticas, derrubadas_hoje, nfs_pendentes } = dados

  if (criticas >= 3) {
    return `⚠️ **Situação Crítica** — ${criticas} NFs ultrapassaram o SLA de 5 dias. Das ${rupturas_ativas} rupturas ativas, ${criticas} exigem ação imediata da gestão. ${derrubadas_hoje} derrubadas foram criadas hoje com ${nfs_pendentes} NFs aguardando etiqueta. **Recomendação:** Acionar clientes BM Beauty e GUDAY hoje antes das 17h para evitar cancelamentos pelo destinatário final.`
  }

  if (rupturas_ativas >= 5) {
    return `📊 **Operação Normal com Pontos de Atenção** — ${rupturas_ativas} rupturas ativas, ${criticas} classificada(s) como crítica(s). Volume dentro da média para esta época do mês. ${derrubadas_hoje} derrubadas em andamento. **Tendência:** Quinta-feira historicamente aumenta volume 18-25%. Recomendo verificar capacidade da equipe para amanhã.`
  }

  return `✅ **Operação Tranquila** — ${rupturas_ativas} rupturas ativas, sem situações críticas. ${derrubadas_hoje} derrubadas criadas hoje. ${nfs_pendentes} NFs aguardando etiqueta (normal para este período). **Previsão:** Volume estável para os próximos 2 dias. Boa semana operacionalmente.`
}

// ── 5. Geração de mensagem para cliente ──────────────────────
// ⚡ Real: anthropic.messages.create({ model: 'claude-sonnet-4-5-20250929',
//   messages: [{ role: 'user', content: `Gere mensagem profissional para: ${contexto}` }]})

export async function gerarMensagemCliente(contexto: {
  cliente: string
  numero_nf: string
  dias_pendente: number
  transportadora: string
}): Promise<string> {
  await delay(1200 + Math.random() * 600)

  const { cliente, numero_nf, dias_pendente, transportadora } = contexto

  if (dias_pendente <= 1) {
    return `Olá equipe ${cliente}! Identificamos que a NF ${numero_nf} (${transportadora}) está aguardando a etiqueta de rastreio. Poderia verificar a liberação no Bling? Assim que disponível, já incluímos na próxima derrubada. Qualquer dúvida estamos à disposição!`
  }

  if (dias_pendente <= 3) {
    return `Olá equipe ${cliente}! Gostaríamos de informar que a NF ${numero_nf} (${transportadora}) está aguardando a etiqueta de rastreio há ${dias_pendente} dias. Para não prejudicar o prazo de entrega ao consumidor final, solicitamos urgência na liberação via Bling. Agradecemos a atenção!`
  }

  return `Prezada equipe ${cliente}, retomamos contato referente à NF ${numero_nf} (${transportadora}) que está pendente há ${dias_pendente} dias. A situação está impactando o SLA de entrega ao destinatário final. Solicitamos a liberação imediata da etiqueta de rastreio no Bling para que possamos regularizar a expedição. Em caso de cancelamento, precisaremos de confirmação por escrito. Atenciosamente, Equipe ExpedFontes.`
}

// ── 6. Detecção de tipo de documento ─────────────────────────
export async function detectarTipoDocumento(filename: string): Promise<'danfe' | 'etiqueta' | 'produto' | undefined> {
  const nome = filename.toLowerCase()
  if (nome.includes('danfe') || nome.includes('nf') || nome.includes('nota')) return 'danfe'
  if (nome.includes('etiqueta') || nome.includes('rastreio') || nome.includes('label')) return 'etiqueta'
  if (nome.includes('produto') || nome.includes('ean') || nome.includes('cod')) return 'produto'
  return undefined
}
