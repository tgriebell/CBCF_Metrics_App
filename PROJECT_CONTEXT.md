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
### 🏆 Conquistas (Sessão Atual - v1.1.3)
1.  **Estabilidade Visual e UX:**
    *   **Splash Screen Orgânico:** Implementada animação de carregamento fluida com "fake loading" para evitar saltos bruscos.
    *   **Correção de Assets:** Fontes e caminhos de arquivos ajustados para modo relativo.
2.  **Infraestrutura e Backend (FIX CRÍTICO):**
    *   **Blindagem de Imports:** Implementada lógica `try/except ImportError` em todos os serviços (YouTube, TikTok, Gemini, Database) para suportar importações absolutas no modo executável (.exe). Isso resolve o erro `attempted relative import with no known parent package`.
    *   **Limpeza de Cache:** Build realizado após limpeza completa das pastas `build/` e `dist/`.
    *   **Versão v1.1.3:** Registrada e sincronizada.

### 🚧 Status: Pronto para Teste de Produção 🚀
1.  **Erro de Conexão (YouTube/TikTok):**
    *   *Ação realizada:* Ajustado empacotamento e permissões. O app deve agora conectar ao backend HTTPS sem recusa.

### Próximos Passos
1.  Resolver a conexão Backend <-> Frontend (Decisão HTTP vs HTTPS).
2.  Testar o fluxo de OAuth do YouTube e TikTok até o fim.
3.  Iniciar Integração Instagram.
3.  **Testar Fluxo TikTok End-to-End:**
    *   Validar se o token está sendo salvo e os dados carregados corretamente no app final.

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
