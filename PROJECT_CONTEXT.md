# CBCF Metrics App - Contexto do Projeto (Atualizado)

## Visão Geral
Aplicação Desktop (Electron + React) com Backend Python (FastAPI). Foco em análise estratégica de redes sociais para o Dr. Rafael Evaristo.

## Status Atual: Infraestrutura Sólida, Pronto para v1.1.6 🚀

### 🏆 Conquistas (v1.1.6)
1.  **Correção Crítica de Crash:** Removido campo inexistente `email` na criação de usuário (`main.py`) que impedia a inicialização do executável.
2.  **Blindagem Total de Imports:** Implementada lógica híbrida em todos os serviços e adicionados *hidden imports* (uvicorn, sqlalchemy, sqlite3) no `main.spec`.
3.  **Infraestrutura de Banco de Dados:** Banco SQLite agora é redirecionado automaticamente para `%APPDATA%` quando em modo executável.
4.  **Instalação Moderna (One-Click):** Instalador configurado para modo rápido e limpo, sem wizard estilo Windows 98.

### 🏆 Conquistas (Sessão Atual - v1.1.4)
1.  **Automação de Build Completa:**
    *   **Workflow unificado:** O comando `npm run dist` agora orquestra automaticamente o build do React, a compilação do Python via PyInstaller e o empacotamento final NSIS.
    *   **Correção de ENOENT:** Alinhados os caminhos do `extraResources` no Electron Builder para garantir que o executável do backend seja incluído corretamente na pasta de destino esperada.
2.  **Estabilidade e Infraestrutura:**
    *   **Backend Blindado:** Lógica de imports e carregamento de certificados SSL/Env consolidada para modo executável (correção de `attempted relative import`).
    *   **UX Refinada:** Splash screen orgânico e correção de carregamento de fontes.
    *   **Diagnóstico:** Implementado popup de erro no Electron para capturar falhas do Python.
    *   **Versão v1.1.4:** Atualizada e pronta para distribuição.

### 🚧 Ponto de Bloqueio (PERSISTENTE)
1.  **Erro no Executável Final (v1.1.4):**
    *   *Sintoma:* Mesmo após todas as correções de caminho, imports e automação de build, o app final ainda apresenta erro (janela em branco ou falha de conexão).
    *   *Hipótese:* O PyInstaller pode estar deixando de fora alguma DLL crítica, ou o caminho dos certificados/banco de dados ainda não está 100% resolvido dentro do ambiente congelado `_MEIPASS`. Pode ser também um problema de permissão de escrita no banco de dados (`cbcf_metrics.db`) se ele estiver tentando criar na pasta `Program Files` (que é somente leitura).
    *   *Ação Prioritária (Próxima Sessão):*
        *   Rodar o executável instalado via terminal (Powershell) para ver o output real se o popup não aparecer.
        *   Verificar se o banco de dados SQLite está sendo criado em um local gravável (`%APPDATA%`) e não na pasta de instalação.

## Como Iniciar
### Modo Desenvolvimento (Para criar novas features)
1.  Backend: `python -m backend.main` (na raiz)
2.  Frontend: `npm run dev` (em `frontend/`)
3.  Electron: `npx electron electron/main.js` (na raiz)

### Modo Produção (Para gerar versão para cliente)
1.  Comando único: `npm run dist`
2.  O instalador estará em `dist-app/`.

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
