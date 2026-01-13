# CBCF Metrics App - Contexto do Projeto (Atualizado)

## Visão Geral
Aplicação Desktop (Electron + React) com Backend Python (FastAPI). Foco em análise estratégica de redes sociais para o Dr. Rafael Evaristo.

## Status Atual: Infraestrutura de Vendas Pronta (Auto-Update Ativo) 🚀

### 🏆 Conquistas (Sessão Atual)
1.  **Auto-Update OTA (Over-The-Air):**
    *   Implementado `electron-updater` com GitHub Releases.
    *   O App detecta novas versões, baixa automaticamente e se instala.
    *   Splash Screen inteligente com feedback visual de download.
2.  **Empacotamento Profissional:**
    *   Backend Python compilado (`main.exe`) via PyInstaller.
    *   Instalador Windows (`.exe`) gerado via Electron Builder.
    *   Frontend (Vite) configurado para caminhos relativos (`base: './'`).
    *   Inclusão segura de `.env` e executáveis dentro do pacote.
3.  **Segurança:**
    *   Repositório GitHub configurado como Público para distribuição.
    *   Chaves sensíveis protegidas via `.gitignore`.

### ⚠️ Pontos de Atenção (Correções para Próxima Sessão)
1.  **Assets (Imagens Quebradas):**
    *   Splash Screen e ícones (TikTok) não carregaram no modo Produção.
    *   *Ação:* Migrar carregamento de imagens de `/public` para `import` direto no React.
2.  **OAuth em Produção:**
    *   O botão de conectar YouTube não respondeu no App instalado.
    *   *Provável Causa:* Redirecionamento de callback configurado apenas para `localhost`.
    *   *Ação:* Revisar fluxo de OAuth para suportar o ambiente Desktop (`file://` ou Deep Link).
3.  **Refinamento Visual:**
    *   O título da janela ainda mostra "Vite + React". Ajustar `index.html`.

## Como Iniciar
### Modo Desenvolvimento (Para criar novas features)
1.  Frontend: `npm run dev` (em `frontend/`)
2.  Electron: `npx electron electron/main.js` (na raiz)
*   *Nota: O modo simulação de update foi desativado no `main.js`. Reativar se necessário testar visual.*

### Modo Produção (Para gerar versão para cliente)
1.  Atualizar versão no `package.json`.
2.  Commitar mudanças.
3.  Terminal Admin: `npm run dist`
4.  Publicar `.exe` e `latest.yml` no GitHub Releases.

## Próximos Passos Prioritários
1.  Corrigir caminhos de imagens (Assets).
2.  Debugar fluxo de OAuth do YouTube no executável final.
