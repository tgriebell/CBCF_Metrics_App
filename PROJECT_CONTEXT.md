# CBCF Metrics App - Contexto do Projeto (Atualizado)

## Visão Geral
Aplicação Desktop (Electron + React) com Backend Python (FastAPI). Foco em análise estratégica de redes sociais para o Dr. Rafael Evaristo.

## Status Atual: Infraestrutura de Vendas Pronta (Auto-Update Ativo) 🚀

### 🏆 Conquistas (Sessão Atual)
1.  **Login OAuth Profissional (Desktop Deep Linking):**
    *   Implementado protocolo customizado `cbcfmetrics://` para captura de tokens.
    *   O App agora abre o navegador padrão do sistema para autenticação (YouTube/TikTok), evitando bloqueios de segurança.
    *   Fluxo de retorno automático do navegador para o App Desktop concluído.
2.  **Instalador Premium (NSIS):**
    *   Configurado assistente de instalação com telas de boas-vindas e seleção de diretório.
    *   Fim da instalação "silenciosa" antiprofissional.
3.  **Assets Corrigidos:**
    *   Migração de caminhos absolutos para relativos em todo o Frontend, garantindo que imagens carreguem no modo Produção (`file://`).
4.  **Auto-Update OTA (Over-The-Air):**
    *   Mantida infraestrutura de atualização automática via GitHub Releases.

### ⚠️ Pontos de Atenção (Próxima Sessão)
1.  **Integração Instagram:**
    *   Implementar serviço de API e fluxo de OAuth para Instagram.
2.  **Setup de Customização (White-Label):**
    *   Criar tela inicial de configuração para permitir que o app seja personalizado por cliente (Logo, Cores, APIs).
3.  **Assinatura de Código (Code Signing):**
    *   Considerar aquisição de certificado para remover o alerta de "Editor Desconhecido" do Windows SmartScreen.

## Como Iniciar
### Modo Desenvolvimento (Para criar novas features)
1.  Backend: `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload --ssl-keyfile localhost+2-key.pem --ssl-certfile localhost+2.pem`
2.  Frontend: `npm run dev` (em `frontend/`)
3.  Electron: `npx electron electron/main.js` (na raiz)

### Modo Produção (Para gerar versão para cliente)
1.  Atualizar versão no `package.json`.
2.  Commitar mudanças no Git.
3.  Terminal Admin: `npm run dist`
4.  Publicar `.exe`, `latest.yml` e `blockmap` no GitHub Releases.

## Próximos Passos Prioritários
1.  Corrigir caminhos de imagens (Assets).
2.  Debugar fluxo de OAuth do YouTube no executável final.
