# CBCF Metrics App - Contexto do Projeto (11/01/2026 - Encerramento)

## Visão Geral
Aplicação Desktop (Electron + React) com Backend Python (FastAPI). Foco em análise estratégica de redes sociais para o Dr. Rafael Evaristo, **Especialista Mundial em Remoção de Papada**.

## Status Atual: Memória Conversacional & UI Padronizada

### 🚀 Conquistas Recentes (11/01 - Madrugada)
1.  **Memória de Elefante (Chat Contextual):**
    *   **Arquitetura "Start Chat":** O backend (`gemini_service`, `main.py`) e o banco de dados (`messages` JSON) foram atualizados para suportar conversas contínuas. A IA agora lembra do contexto anterior.
    *   **Frontend Inteligente:** `AIChatView.jsx` gerencia `conversationId` e envia o histórico corretamente.
    *   **Estilo Elite:** Botões de histórico (editar/excluir) receberam visual glassmorphic/gradiente para não quebrar a imersão.

2.  **Biblioteca & Cards (Padronização Universal):**
    *   **O "Quarteto Fantástico":** Todos os cards (YouTube, Shorts, TikTok) agora exibem a mesma barra de métricas: **Views, Likes, Comentários e Shares**.
    *   **Limpeza Visual:** Indicadores inconsistentes (tempo médio/inscritos zerados) foram removidos dos cards para manter a elegância e paridade entre plataformas.
    *   **Correção de Bug:** Resolvido erro de referência `colors` que causava tela branca.

3.  **Backend & Sync (Melhorias Invisíveis):**
    *   **Analytics Cirúrgico:** O `youtube_service.py` foi aprimorado para buscar dados de **Lifetime** (desde 2006) e usar filtros exatos de ID, garantindo que o backend tenha os dados reais (mesmo que o frontend opte por não mostrar tudo agora).

### 🚧 Próximos Passos (Backlog)
1.  **Testar Sync Profundo:** Verificar se na próxima sincronização os dados de "Lifetime" estão sendo populados corretamente no banco (mesmo que ocultos nos cards).
2.  **Instagram Integration:** Módulo de captura de Reels (ainda pendente).
3.  **Refinamento de Métricas:** Validar cálculos de "Eficiência Real".

## Como Iniciar
1.  **Backend:** `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --ssl-keyfile localhost+2-key.pem --ssl-certfile localhost+2.pem`
2.  **Frontend:** No diretório `frontend`, rode `npm run dev`.