# CBCF Metrics App - Contexto do Projeto (12/01/2026 - Atualização)

## Visão Geral
Aplicação Desktop (Electron + React) com Backend Python (FastAPI). Foco em análise estratégica de redes sociais para o Dr. Rafael Evaristo, **Especialista Mundial em Remoção de Papada**.

## Status Atual: Sync YouTube Blindado & Inteligência de Fuso

### 🚀 Conquistas Recentes (12/01 - Noite)
1.  **Correção Crítica no YouTube Sync:**
    *   Resolvido erro de referência (`NameError`) e chamada de função incorreta (`AttributeError`) no `youtube_service.py`.
    *   Sincronização profunda agora processa 380+ vídeos corretamente, incluindo novos envios.
    *   Garantido que vídeos de hoje (12/01) sejam baixados e indexados imediatamente.

2.  **Inteligência de Fuso Horário (Metas do Dia):**
    *   **Janela de Tolerância UTC:** Ajustada a rota `/dashboard/summary` no `main.py` para incluir posts até as 04:00 AM do dia seguinte (UTC). 
    *   **Resultado:** Vídeos postados à noite no Brasil agora são contabilizados corretamente nas metas do dia atual, resolvendo a divergência de contagem (Ex: 4 shorts postados = 4 shorts contados).

3.  **Ambiente de Desenvolvimento Ágil:**
    *   Implementado o uso do parâmetro `--reload` no Uvicorn. O backend agora reflete qualquer alteração no código instantaneamente sem necessidade de reinício manual.

### 🚧 Próximos Passos (Backlog)
1.  **Testar Sync Profundo:** Verificar persistência de dados de retenção e inscritos ganhos nos novos vídeos.
2.  **Instagram Integration:** Módulo de captura de Reels (em planejamento).
3.  **Organização de Arquivos:** Avaliar limpeza de scripts de debug da raiz para pastas auxiliares.

## Como Iniciar (Modo Desenvolvedor)
1.  **Backend (Com Auto-Reload):** 
    `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --ssl-keyfile localhost+2-key.pem --ssl-certfile localhost+2.pem --reload`
2.  **Frontend:** No diretório `frontend`, rode `npm run dev`.