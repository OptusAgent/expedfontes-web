# DOCUMENTAÇÃO — ExpedFontes Protótipo
**Sistema de Gestão Operacional Logística**
*Versão 1.0 — Protótipo com dados mock | 18/02/2026*

---

## ACESSO RÁPIDO

**URL:** http://localhost:3000

| Usuário | E-mail | Senha | Nível de Acesso |
|---------|--------|-------|----------------|
| Admin Master | admin@expedfontes.com | 123456 | Administrador (tudo) |
| João Gestor | joao@expedfontes.com | 123456 | Gestor (analytics, aprovações) |
| Brendo Henrique | brendo@expedfontes.com | 123456 | Operador (derrubadas, NFs) |
| Tatiane Fernandes | tatiane@expedfontes.com | 123456 | Atendimento (rupturas, clientes) |

---

## COMO INICIAR

```bash
cd /home/valmir/Documentos/PONTES/expedfontes-web
npm run dev
# Acesse: http://localhost:3000
```

---

## MÓDULOS E FUNCIONALIDADES

---

### 1. LOGIN (`/login`)

**O que faz:**
- Autenticação por e-mail e senha
- 4 acessos rápidos para demonstração (botões coloridos)
- Proteção de rotas: usuário não autenticado é redirecionado para login
- Cada nível de acesso vê apenas as rotas permitidas na sidebar

**Como testar:**
1. Acesse http://localhost:3000
2. Clique nos botões coloridos de acesso rápido (Admin, Gestor, Operador, Atendimento)
3. Observe a sidebar mudar conforme o nível de acesso

**Nota de migração Supabase:** Substituir `authStorage.login()` por `supabase.auth.signInWithPassword()`

---

### 2. DASHBOARD (`/dashboard`)

**O que faz:**
- 4 cards de métricas em tempo real (NFs Pendentes, Derrubadas, Serviços, Valor Pendente)
- Gráfico de barras: volume da semana (NFs, rupturas, expedidas)
- Gráfico de pizza: rupturas por transportadora
- Ranking das 5 rupturas mais urgentes (ordenadas por score de IA)
- **Briefing Executivo com IA**: narrativa automática em linguagem natural
  - Clique em "Atualizar" para gerar novo briefing com streaming de texto (efeito digitando)
- Previsão para amanhã (volume, rupturas estimadas, recomendação)
- Gráfico de SLA histórico com linha de meta (3 dias)

**Dados exibidos:**
- Baseados em situações reais do mês de setembro/2025
- Clientes: ByteDance, GUDAY, LETZ, BM Beauty, MAISMU
- 2 rupturas críticas (8 e 7 dias) propositalmente para demonstrar alertas

---

### 3. DERRUBADAS (`/derrubadas`)

**O que faz:**
- Lista todos os lotes de expedição com status visual
- 4 cards de resumo no topo (total, expedidas, em andamento, NFs disponíveis)
- Banner de destaque quando há NFs prontas para derrubada

**Como criar uma derrubada:**
1. Clique em "Nova Derrubada"
2. Selecione o cliente (ByteDance, LETZ, GUDAY, etc.)
3. Selecione a transportadora
4. NFs disponíveis aparecem automaticamente (apenas com etiqueta liberada)
5. Filtre por transportadora se necessário
6. Clique "Selecionar todas disponíveis" ou selecione manualmente
7. Veja o resumo (quantidade, valor total)
8. Clique "Criar Derrubada"

**Detalhe da Derrubada (`/derrubadas/[id]`):**
- Lista todas as NFs do lote com valor e transportadora
- Avanço de status: Preparando → Aguardando Impressão → Expedida
- Botão de impressão (abre diálogo de impressão do browser)
- Remover NF: cria ruptura automaticamente com motivo informado

**Regra de negócio:**
- Apenas NFs com `status = etiqueta_liberada` podem entrar em derrubadas
- NF removida → cria Ruptura automática

---

### 4. RUPTURAS / PENDÊNCIAS (`/rupturas`)

**O que faz:**
- Painel com todas as NFs problemáticas
- 4 cards: total ativas, críticas, urgentes, atenção
- Filtros: busca livre, nível de urgência, cliente, apenas ativas

**Indicadores visuais de SLA:**
| Cor | Dias Pendente | Nível |
|-----|:---:|-------|
| Azul 🔵 | 0-2 dias | Normal |
| Amarelo 🟡 | 3-5 dias | Atenção |
| Laranja 🟠 | 5+ dias | Urgente |
| Vermelho 🔴 | 5+ com score alto | Crítico |

**Score de Urgência (IA):**
- Calculado automaticamente com base em: dias pendente (50%), transportadora (20%), histórico do cliente (15%), valor da NF (15%)
- Score 86-100: Crítico | 61-85: Urgente | 31-60: Atenção | 0-30: Normal
- Exibido visualmente com barra de progresso colorida

**Detalhe da Ruptura (`/rupturas/[id]`):**
- Informações completas da ruptura
- Timeline de todas as ações realizadas (com data, usuário, tipo)
- Registrar nova ação (Contato Cliente, Atualização, Escalonamento, Observação)
- **IA — Análise do OBS:** clique "Analisar" para classificar o texto livre do campo OBS
  - Detecta intenção (cancelar, etiqueta recebida, aguardando, etc.)
  - Infere transportadora mencionada
  - Sugere próximo passo
- **IA — Mensagem para Cliente:** clique "Gerar" para criar mensagem profissional personalizada
  - Adapta tom e urgência com base nos dias pendentes
  - Copie a mensagem com 1 clique para enviar no WhatsApp
- **Resolver Ruptura:** marca como resolvida e libera NF para derrubada

---

### 5. SERVIÇOS EXTRAS (`/servicos`)

**O que faz:**
- Lista de Ordens de Serviço com status e valores
- Destaque para OS com prazo vencido
- Filtros por status, mês de referência, busca

**Criar nova OS (`/servicos/nova`):**
1. **IA Vision** (destacada no topo): arraste uma foto do produto
   - Simula extração de: EAN, produto, quantidade
   - Preenche automaticamente o formulário
2. Selecione cliente, responsável, tipo de serviço
3. Tipos disponíveis com preço/unidade: Etiquetagem (R$ 1,50), Montagem Kit (R$ 4,00), Rebatimento Palete (R$ 4,50), Outros (R$ 2,00)
4. Informe quantidade, unidade e prazo
5. Sistema calcula valor total automaticamente
6. Ao criar: gera link único de aprovação digital
7. Copie o link e envie ao cliente

**Aprovação Digital (`/aprovar/[token]`):**
- Página pública (sem login necessário)
- Cliente vê: descrição, quantidade, valor, prazo
- Botões: Aprovar / Recusar / Observações
- Aprovação registrada com timestamp e IP simulado
- Prova jurídica de aprovação (substitui WhatsApp)

**Detalhe da OS (`/servicos/[id]`):**
- Timeline completa: solicitação → aprovação → início → prazo → finalização
- Status pode ser avançado: Aprovado → Em Andamento → Finalizado
- Link de aprovação com botão de copiar e visualizar

---

### 6. CHAT INTERNO (`/chat`)

**O que faz:**
- Sistema de mensagens internas para a equipe
- 3 canais pré-configurados:
  - **Geral — ExpedFontes** (todos os usuários)
  - **Equipe Atendimento** (admin + atendimento)
  - **Operação — Galpão** (operadores + gestores)
- Mensagens armazenadas em localStorage
- Notificações do sistema aparecem no canal Geral
- Alertas operacionais destacados no topo da conversa
- Lista de usuários com indicador de status online

**Como usar:**
1. Acesse `/chat`
2. Selecione um canal na sidebar esquerda
3. Digite sua mensagem e pressione Enter
4. Mensagens do sistema aparecem em formato de notificação azul

---

### 7. RELATÓRIOS (`/relatorios`)

**O que faz:**
5 abas de análise:

1. **Visão Geral:** Métricas de setembro/2025, gráfico semanal, SLA histórico
2. **Por Cliente:** Comparativo histórico de rupturas por cliente (Set/Out/Nov/Fev)
3. **Por Transportadora:** Pizza de distribuição, ranking com SLA e risco
4. **SLA:** Evolução mensal, comparação com meta de 3 dias
5. **Previsão IA:** Briefing completo com:
   - Previsão de volume para amanhã
   - Alertas da IA
   - Tendências identificadas
   - Ações sugeridas

---

### 8. CLIENTES (`/clientes`)

**O que faz:**
- Lista de todas as marcas clientes
- Status de integração Bling (configurado / não configurado)
- Botão "Conectar Bling" simula o fluxo OAuth
- Criar novo cliente
- Botão "Sincronizar" para clientes com Bling configurado

---

### 9. CONFIGURAÇÕES (`/configuracoes`)

**O que faz:**

4 abas:

1. **Usuários:** CRUD completo de usuários, ativar/desativar, definir nível de acesso
2. **Bling / Integrações:** Configurações do sync (5 min, webhook, resolução automática)
3. **IA / Alertas:** Status de cada funcionalidade de IA (Simulado vs Ativo)
4. **Dados:**
   - Botão "Resetar para dados iniciais" — volta tudo ao estado original dos mocks
   - Guia de migração para Supabase (6 passos)

---

## FUNCIONALIDADES DE IA

### IA Vision — Análise de Imagem
**Onde aparece:** Nova OS (`/servicos/nova`)

**Como testar:**
1. Acesse `/servicos/nova`
2. No topo, veja o componente "IA Vision"
3. Arraste qualquer imagem (JPG, PNG) ou clique para selecionar
4. Aguarde ~2 segundos de "análise"
5. Veja os campos detectados e clique "Preencher formulário"

**Em produção:** Usa Claude API com vision para analisar DANFE, etiqueta de rastreio ou foto de produto e extrair dados reais.

### Análise de OBS (NLP)
**Onde aparece:** Detalhe da Ruptura (`/rupturas/[id]`)

**Como testar:**
1. Acesse qualquer ruptura com campo OBS (ex: NF 302475)
2. Na sidebar, clique "Analisar" ao lado de "IA — Análise do OBS"
3. Veja: intenção detectada, confiança, próximo passo sugerido

**Padrões detectados:** cancelamento, etiqueta recebida, expedido, aguardando etiqueta, contato realizado

### Mensagem para Cliente (LLM)
**Onde aparece:** Detalhe da Ruptura

**Como testar:**
1. Acesse a ruptura NF 450001 (BM Beauty — 8 dias)
2. Clique "Gerar" em "Mensagem para Cliente (IA)"
3. Aguarde a mensagem personalizada aparecer
4. Clique "Copiar mensagem"

A mensagem adapta o tom conforme os dias pendentes: cordial (1 dia), urgente (2-3 dias), formal/crítico (5+ dias).

### Briefing Executivo
**Onde aparece:** Dashboard

**Como testar:**
1. Acesse `/dashboard`
2. Clique "Atualizar" no card "Briefing IA"
3. Observe o efeito de streaming (texto aparece progressivamente)

### Score de Urgência (ML Rules)
**Ativo automaticamente** em todas as rupturas.
- Cálculo em tempo real ao carregar rupturas
- Visível na coluna "Score IA" na tabela
- Visível na barra de progresso colorida no detalhe

---

## ARQUITETURA DE MIGRAÇÃO PARA SUPABASE

### Ponto único de mudança: `lib/storage/index.ts`

Todo o acesso a dados passa por este arquivo. Para migrar:

```typescript
// HOJE (localStorage):
export const nfsStorage = {
  getAll: () => getAll<NF>(KEYS.nfs),
  // ...
}

// SUPABASE (apenas trocar a implementação):
export const nfsStorage = {
  getAll: async () => {
    const { data } = await supabase
      .from('nfs')
      .select('*')
      .eq('tenant_id', getTenantId())
    return data ?? []
  },
  // ...
}
```

**Nenhuma página ou componente precisa ser alterado.**

### Mapeamento de funções

| localStorage | Supabase equivalente |
|------------|---------------------|
| `getAll<T>(key)` | `supabase.from(table).select('*')` |
| `getById<T>(key, id)` | `.eq('id', id).single()` |
| `create<T>(key, item)` | `.insert(item)` |
| `update<T>(key, id, patch)` | `.update(patch).eq('id', id)` |
| `remove(key, id)` | `.delete().eq('id', id)` |
| `authStorage.login()` | `supabase.auth.signInWithPassword()` |
| `authStorage.logout()` | `supabase.auth.signOut()` |

### Realtime (substituir polling por push)

```typescript
// Alerts em tempo real com Supabase Realtime
supabase
  .channel('alertas')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alertas' },
    payload => setAlertas(prev => [payload.new, ...prev])
  )
  .subscribe()
```

---

## ESTRUTURA DE ARQUIVOS

```
expedfontes-web/
├── app/
│   ├── globals.css              ← Estilos globais + animações
│   ├── layout.tsx               ← HTML root, fonts
│   ├── page.tsx                 ← Redirect → /dashboard ou /login
│   ├── login/page.tsx           ← Tela de login
│   ├── aprovar/[token]/page.tsx ← Aprovação pública de OS (sem auth)
│   └── (dashboard)/
│       ├── layout.tsx           ← Sidebar + Header (verifica auth)
│       ├── page.tsx             ← Dashboard principal
│       ├── derrubadas/          ← Lista + Nova + Detalhe
│       ├── rupturas/            ← Lista + Detalhe com IA
│       ├── servicos/            ← Lista + Nova (IA Vision) + Detalhe
│       ├── chat/page.tsx        ← Chat interno
│       ├── relatorios/page.tsx  ← Analytics 5 abas
│       ├── clientes/page.tsx    ← CRUD clientes
│       └── configuracoes/       ← Usuários, Bling, IA, Dados
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          ← Navegação lateral (por nível de acesso)
│   │   └── Header.tsx           ← Cabeçalho com alertas
│   └── ui/
│       └── ImageAnalyzer.tsx    ← Componente IA Vision (drag&drop + simulação)
│
├── lib/
│   ├── storage/index.ts         ← CAMADA DE DADOS (trocar por Supabase aqui)
│   ├── data/mockData.ts         ← Dados mock (clientes, NFs, rupturas reais)
│   ├── ai/index.ts              ← Motor de IA (simulado → Claude API real)
│   └── utils/index.ts           ← Utilitários, formatação, cores
│
└── types/index.ts               ← Todos os tipos TypeScript do sistema
```

---

## DADOS MOCK UTILIZADOS

Baseados em dados reais das planilhas fornecidas:

**Clientes (12):** ByteDance (TikTok Shop), GUDAY, LETZ, BM Beauty, MAISMU, AURA, HEYMU, Mellow Body, SONOCOMSONO, Zacca, Cafellow, Saucy Foods

**NFs:** 22 NFs com números reais (141779, 302475, 302480, 450001...) em vários status

**Rupturas:** 6 rupturas ativas simulando cenários reais:
- NF 450001 (BM Beauty): **8 dias** — crítico, 3 tentativas de contato
- NF 302475 (GUDAY): **7 dias** — crítico, escalonado para gestor
- NF 302480 (LETZ): **5 dias** — urgente, cliente prometeu resolver
- NF 141779 (ByteDance): **1 dia** — normal, recém detectada
- NF 550200 (MAISMU): **2 dias** — possível cancelamento

**Derrubadas:** 4 derrubadas em diferentes status (preparando, expedida, aguardando impressão)

**Serviços:** 6 OS em diferentes status, incluindo:
- OS-2026-001: Etiquetagem 383un ByteDance (finalizado, R$ 574,50)
- OS-2026-002: Montagem Kit 380un LETZ (em andamento, vence amanhã)
- OS-2026-004: Etiquetagem 850un Cafellow (aguardando aprovação)
- OS-2026-005: Montagem Kit 240un Mellow Body (aprovado, aguardando início)

**Mensagens de chat:** 10 mensagens realistas entre a equipe

---

## PRÓXIMOS PASSOS (APÓS VALIDAÇÃO COM CLIENTE)

1. **Setup Supabase** via MCP — criar projeto, tabelas, RLS
2. **Trocar storage layer** — 1 arquivo (`lib/storage/index.ts`)
3. **Deploy:** Frontend → Vercel | Backend Python → Railway
4. **Backend Python (FastAPI):** workers Celery, integração Bling real, IA Claude real
5. **Migração de dados históricos** — script Python com pandas + Claude API
6. **Capacitor** — empacotamento para iOS/Android

---

*ExpedFontes Protótipo v1.0 | 18/02/2026*
