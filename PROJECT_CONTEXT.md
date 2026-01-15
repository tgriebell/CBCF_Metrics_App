# CBCF Metrics App - Contexto do Projeto (Atualizado)

## Visão Geral
Aplicação Desktop (Electron + React) com Backend Python (FastAPI). Foco em análise estratégica de redes sociais para o Dr. Rafael Evaristo.

## Status Atual: Infraestrutura Sólida, Bug de Frontend em Prod 🚧

### 🏆 Conquistas (Sessão Anterior)
1.  **Login OAuth Profissional (Deep Linking):**
    *   Protocolo `cbcfmetrics://` registrado e funcional.
    *   Backend redireciona corretamente para o App Desktop.
    *   Frontend configurado para ouvir o Deep Link.
2.  **Instalador Premium (NSIS):**
    *   Assistente de instalação visual (não mais silencioso) implementado.
    *   Inicialização do Electron (`main.js`) corrigida na v1.0.4.
3.  **Assets:** Caminhos relativos configurados.

### ⚠️ Pontos de Atenção (PRIORIDADE MÁXIMA - Próxima Sessão)
1.  **Bug Crítico no Frontend (Produção):**
    *   Erro: `ReferenceError: Cannot access 'B' before initialization` (Tela Azul da Morte).
    *   Causa Provável: Dependência circular ou ordem de importação errada em componentes React ao serem minificados pelo Vite (Build de Produção).
    *   *Ação:* Debugar imports no `App.jsx` e componentes (possivelmente Recharts ou ícones Lucide).
2.  **Integração Instagram:**
    *   Pendente implementação completa.
3.  **Setup White-Label:**
    *   Planejado para futuro.

## Como Iniciar
### Modo Desenvolvimento (Para criar novas features)
1.  Backend: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --ssl-keyfile localhost+2-key.pem --ssl-certfile localhost+2.pem`
2.  Frontend: `npm run dev` (em `frontend/`)
3.  Electron: `npx electron electron/main.js` (na raiz)

### Modo Produção (Para gerar versão para cliente)
1.  **Resolver o Bug de Frontend primeiro!**
2.  Atualizar versão no `package.json`.
3.  Commitar mudanças.
4.  Terminal Admin: `npm run dist`
5.  Publicar `.exe`, `latest.yml` e `blockmap` no GitHub Releases.

## Próximos Passos Prioritários
1.  Corrigir caminhos de imagens (Assets).
2.  Debugar fluxo de OAuth do YouTube no executável final.
