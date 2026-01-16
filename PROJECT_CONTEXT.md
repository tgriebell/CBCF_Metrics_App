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
### 🏆 Conquistas (Sessão Atual - v1.1.1)
1.  **Estabilidade Visual e Funcional:**
    *   **Tela Azul (Recharts) Resolvida:** Downgrade para v2.12.7 + limpeza de build Vite eliminou o erro crítico de inicialização.
    *   **Visual Premium:** Implementado modo *Frameless* (sem moldura Windows) com barra de título customizada e funcional (Minimizar/Maximizar/Fechar).
    *   **App Maximizado:** Configurado para iniciar em tela cheia.
    *   **Versão e Data:** Tela de login agora mostra a versão real (`v1.1.1`) e a data de compilação congelada (`15/01/2026`).
2.  **Infraestrutura e Conectividade (FIX CRÍTICO):**
    *   **Correção de SSL no Executável:** Adicionada lógica de `sys._MEIPASS` no backend para encontrar certificados `.pem` e arquivo `.env` dentro do `.exe`.
    *   **Build NSIS (main.spec):** Configurado para incluir arquivos de segurança no pacote final.
    *   **Permissões Electron:** Adicionada flag `allow-insecure-localhost` para aceitar a conexão segura local.

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
