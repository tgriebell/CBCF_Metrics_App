import google.generativeai as genai
from .config import get_settings
import os
import time
import json
from collections import deque
from datetime import datetime, timedelta

# Carrega as configurações
settings = get_settings()

# Configura a API uma única vez
genai.configure(api_key=settings.GEMINI_API_KEY)

USAGE_FILE = "backend/gemini_usage.json"

class GeminiService:
    def __init__(self):
        # Lista de prioridade de modelos REAIS do seu projeto
        self.models_priority = [
            'models/gemini-3-flash-preview',
            'models/gemini-2.5-flash',
            'models/gemini-2.5-flash-lite'
        ]
        
        # Controle de Uso (Memória + Persistência)
        self.request_timestamps = deque() 
        self.current_active_model = self.models_priority[0]
        
        # Carrega contagem diária persistente com regra das 04:00 AM
        self.usage_data = self._load_usage()

    def _get_business_day_key(self):
        """Define o dia útil que reseta às 04:00 AM (Horário de Brasília)."""
        now = datetime.now()
        if now.hour < 4:
            return (now - timedelta(days=1)).strftime("%Y-%m-%d")
        return now.strftime("%Y-%m-%d")

    def _load_usage(self):
        """Carrega o histórico do disco e verifica o reset das 04h."""
        current_key = self._get_business_day_key()
        default_data = {
            "date_key": current_key, 
            "models": {m.split('/')[-1]: 0 for m in self.models_priority}
        }

        if not os.path.exists(USAGE_FILE):
            return default_data
        
        try:
            with open(USAGE_FILE, 'r') as f:
                data = json.load(f)
                if data.get("date_key") != current_key:
                    return default_data
                return data
        except Exception:
            return default_data

    def _save_usage(self):
        """Salva o histórico de uso no disco."""
        try:
            with open(USAGE_FILE, 'w') as f:
                json.dump(self.usage_data, f)
        except Exception as e:
            print(f"Erro ao salvar uso do Gemini: {e}")

    def _register_success(self, model_name):
        """Registra o uso bem-sucedido no modelo ativo."""
        now = time.time()
        
        # 1. RPM (Memória)
        while self.request_timestamps and now - self.request_timestamps[0] > 60:
            self.request_timestamps.popleft()
        self.request_timestamps.append(now)

        # 2. RPD (Disco com Regra das 04h)
        self.usage_data = self._load_usage() # Garante sincronia
        
        clean_name = model_name.split('/')[-1]
        if clean_name not in self.usage_data["models"]:
            self.usage_data["models"][clean_name] = 0
        self.usage_data["models"][clean_name] += 1
        
        self._save_usage()

    def get_quota_status(self):
        """Retorna o status detalhado para a Sidebar."""
        now = time.time()
        while self.request_timestamps and now - self.request_timestamps[0] > 60:
            self.request_timestamps.popleft()
            
        clean_active_name = self.current_active_model.split('/')[-1]
        active_count = self.usage_data["models"].get(clean_active_name, 0)
            
        return {
            "requests_last_minute": len(self.request_timestamps),
            "active_model": self.current_active_model,
            "active_model_usage": active_count,
            "business_day": self.usage_data.get("date_key")
        }

    async def _generate_with_fallback(self, prompt: str, stream: bool = False):
        errors = []
        
        # Tenta o modelo atual primeiro, se falhar tenta os outros em ordem
        priority_order = [self.current_active_model] + [m for m in self.models_priority if m != self.current_active_model]

        for model_name in priority_order:
            print(f"📢 [IA] Tentando motor: {model_name}")
            try:
                model = genai.GenerativeModel(model_name)
                
                if stream:
                    response = await model.generate_content_async(prompt, stream=True)
                    self._register_success(model_name)
                    self.current_active_model = model_name 
                    return response
                else:
                    response = await model.generate_content_async(prompt)
                    self._register_success(model_name)
                    self.current_active_model = model_name 
                    return response
                    
            except Exception as e:
                error_msg = str(e)
                print(f"⚠️ [IA] Falha no modelo {model_name}: {error_msg}")
                errors.append(f"{model_name}: {error_msg}")
                continue

        raise Exception(f"Todos os modelos falharam. Detalhes: {'; '.join(errors)}")

    def _get_dr_persona(self):
        return (
            "--- FRAMEWORK DE CRIAÇÃO: CO-STAR (Context, Objective, Style, Tone, Audience, Response) ---\n\n"
            "1. CONTEXTO (A Realidade CBCF):\n"
            "Você é o Diretor Criativo do Dr. Rafael Evaristo. "
            "POSICIONAMENTO CENTRAL: Ele é o ESPECIALISTA MUNDIAL EM REMOÇÃO DE PAPADA (3.400+ casos). Esta é a bandeira principal. "
            "PROCEDIMENTOS ASSOCIADOS: Deep Plane Facelift e Nanolifting são realizados de forma complementar para maximizar o rejuvenescimento quando o caso exige.\n"
            "ESTAMOS NO TOPO: Cirurgia Facial High-Ticket. Autoridade, Elegância e Resultados Definitivos.\n\n"
            
            "2. OBJETIVO (A Missão):\n"
            "Criar roteiros que vendam a especialidade em PAPADA como a porta de entrada, mostrando como o contorno mandibular perfeito (associado ou não ao lifting) muda a vida da paciente.\n\n"
            
            "3. ESTILO (Cinematográfico):\n"
            "Direção de arte estilo Netflix. Foco em detalhes técnicos da papada, marcações precisas e o 'antes e depois' do contorno mandibular.\n\n"
            
            "4. TOM (Sócio Estrategista):\n"
            "Direto ao ponto com o Thiago (Videomaker). Termos: 'Gancho', 'Retenção', 'B-Roll', 'Deep Plane', 'Contorno'.\n\n"
            
            "5. AUDIÊNCIA:\n"
            "Thiago e Dr. Rafael. Experts. Não explique o básico. Dê o 'pulo do gato'.\n\n"
            
            "6. FORMATO DE RESPOSTA:\n"
            "### 🎬 Ideia 1: [Nome Impactante]\n"
            "**🎯 Objetivo:** [Venda/Autoridade/Viral]\n\n"
            "- **Gancho (0-3s):** [Visual] + Legenda: \"[Texto]\"\n"
            "- **Corpo:** [Takes técnicos de papada/lifting] + Narração.\n"
            "- **CTA:** [Chamada elegante].\n\n"
            "> **💡 Dica de Edição:** [Instrução técnica]\n"
            "--- (Separador)\n"
        )

    async def generate_general_response(self, prompt: str, history: list = None, system_instruction_override: str = None) -> str:
        try:
            # 1. Configura a Persona (System Instruction)
            # Se vier override (do Data Analytics), usa ele. Senão, usa o padrão (Creative Director).
            system_instruction = system_instruction_override if system_instruction_override else self._get_dr_persona()
            
            # 2. Prepara o Histórico para o Formato do Gemini
            chat_history = []
            if history:
                for msg in history:
                    # Mapeia roles: 'user' -> 'user', 'assistant' -> 'model'
                    role = 'user' if msg.get('role') == 'user' else 'model'
                    content = msg.get('content', '')
                    # Ignora mensagens vazias ou de sistema interno se houver
                    if content:
                        chat_history.append({'role': role, 'parts': [content]})

            # 3. Inicia o Chat com o Modelo Ativo
            # Tenta o modelo atual primeiro
            model_name = self.current_active_model
            
            # Se for a primeira mensagem (sem histórico), injetamos a persona no prompt ou history
            # Se tiver histórico, a persona já deve ter sido estabelecida ou reforçamos.
            # Estratégia Híbrida: System Instruction via API (melhor para Flash 1.5/2.0)
            
            # Tenta instanciar com system_instruction (SDKs novos suportam)
            try:
                model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
            except:
                # Fallback: Injeta no início do histórico
                model = genai.GenerativeModel(model_name)
                if not chat_history:
                    chat_history.append({'role': 'user', 'parts': [f"INSTRUÇÃO DO SISTEMA:\n{system_instruction}"]})
                    chat_history.append({'role': 'model', 'parts': ["Entendido. Assumindo a persona do Diretor Criativo."]})
            
            chat = model.start_chat(history=chat_history)
            
            # 4. Envia a Mensagem
            # Adiciona contexto do usuário se for novo chat
            final_prompt = prompt
            if not history:
                final_prompt = f"CONTEXTO INICIAL: O usuário é Thiago (Videomaker/Sócio).\n\nPERGUNTA: {prompt}"

            response = await chat.send_message_async(final_prompt)
            
            # Registra sucesso
            self._register_success(model_name)
            
            return response.text
            
        except Exception as e:
            print(f"Erro Gemini (Chat): {e}")
            # Fallback para geração simples se o chat falhar (ex: erro de histórico inválido)
            return await self._generate_with_fallback(f"{system_instruction}\n\nPERGUNTA: {prompt}", stream=False).text if 'system_instruction' in locals() else await self._generate_with_fallback(prompt, stream=False).text

    async def generate_short_title(self, prompt: str) -> str:
        """Gera um título curtíssimo baseado no prompt sem usar a API (Economia de tokens)."""
        try:
            import re
            date_pattern = r"(\d{1,2}/\d{1,2}(?:/\d{2,4})?)"
            dates = re.findall(date_pattern, prompt)
            
            if len(dates) >= 2:
                return f"Análise {dates[0]} - {dates[1]}"
            elif len(dates) == 1:
                return f"Análise {dates[0]}"

            words = prompt.strip().split()
            if not words: return "Nova Conversa"
            
            clean_words = []
            for w in words[:4]:
                clean = re.sub(r'[^\w\s]', '', w)
                if clean: clean_words.append(clean)
            
            title = " ".join(clean_words).capitalize()
            if len(title) > 30: title = title[:27] + "..."
            
            return title or "Nova Conversa"
        except Exception as e:
            return "Nova Conversa"

    async def generate_general_response_stream(self, prompt: str):
        enhanced_prompt = (
            f"{prompt}\n\n"
            "---"
            "\nApós sua resposta principal, adicione o separador '|||' e, em seguida, "
            "forneça um array JSON com exatamente 3 sugestões de próximas perguntas relevantes."
        )
        try:
            response_stream = await self._generate_with_fallback(enhanced_prompt, stream=True)
            async for chunk in response_stream:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            yield f"Erro no servidor de IA: {e}"

    async def generate_video_insight(self, title: str, description: str, analytics_data: dict) -> str:
        system_prompt = (
            "ATUE COMO: Um algoritmo de análise crítica de YouTube. SEM PERSONA, SEM INTRODUÇÃO.\n"
            "TAREFA: Analise os dados brutos e retorne APENAS um JSON válido.\n\n"
            "DIRETRIZES DE ANÁLISE:\n"
            "1. RETENÇÃO É REI: Se a retenção média for menor que 30% em vídeos longos (>5min) ou menor que 60% em curtos, a análise DEVE ser CRÍTICA (ex: 'Público sai no início').\n"
            "2. BADGE: Use 2-3 palavras de alto impacto (ex: 'Retenção Crítica', 'Viral Potencial', 'Engajamento Baixo').\n"
            "3. AÇÕES: É OBRIGATÓRIO incluir 1 a 2 ações no array 'recommended_actions' baseadas nos problemas identificados.\n"
            "   - Baixa retenção -> 'improve_hook'\n"
            "   - Baixo CTR/Views -> 'update_thumbnail'\n"
            "   - Baixa conversão -> 'optimize_cta'\n"
            "   - Bom desempenho -> 'replicate_format'\n"
            "   - Engajamento alto -> 'community_engage'\n\n"
            "FORMATO DE SAÍDA (JSON PURO):\n"
            "{\"badge\": \"STRING\", \"insight\": \"STRING CURTA E DIRETA (Max 2 frases)\", \"recommended_actions\": [\"STRING_KEY\"]}"
        )
        user_content = f"DADOS:\nTítulo: {title}\nStats: {analytics_data}"
        full_prompt = f"{system_prompt}\n\n{user_content}"
        
        try:
            response = await self._generate_with_fallback(full_prompt, stream=False)
            
            cleaned_text = response.text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.split("```")[1]
                if cleaned_text.startswith("json"):
                    cleaned_text = cleaned_text[4:]
            
            return cleaned_text.strip()
        except Exception as e:
            return "{\"badge\": \"Erro IA\", \"insight\": \"Não foi possível analisar no momento.\", \"recommended_actions\": []}"

    async def generate_pattern_analysis(self, patterns_data: list, platform_context: str = "youtube") -> str:
        if not patterns_data: return '{"error": "Sem dados"}'
        
        context_instruction = ""
        if "tiktok" in platform_context or "shorts" in platform_context:
            context_instruction = (
                "FOCO: TIKTOK/SHORTS (Vídeos Rápidos).\n"
                "Priorize: Loops, Ganchos Visuais (0-3s), Trends, Música e Edição Dinâmica.\n"
                "Ignore: Narrativas longas e introduções lentas."
            )
        else:
            context_instruction = (
                "FOCO: YOUTUBE LONGO (Vídeos Densos).\n"
                "Priorize: Storytelling, Autoridade Médica, Retenção (Meio de vídeo) e Profundidade Técnica.\n"
                "Ignore: Trends passageiras de dancinha."
            )

        system_instruction = (
            f"ATUE COMO: Seu Sócio e Estrategista de Marketing de Elite.\n"
            f"{context_instruction}\n"
            "MISSÃO: Analisar estes vídeos e explicar a estratégia de forma HUMANA, DIRETA e PROFISSIONAL. "
            "Fale como um parceiro de negócios fala com outro. NUNCA use tratamentos formais como 'Dr.', 'Doutor' ou 'Prezado'. "
            "Seja cirúrgico nos insights e foque no que traz faturamento e retenção.\n"
            "FORMATO: JSON ESTRITO (Sem markdown).\n\n"
            "ESTRUTURA JSON OBRIGATÓRIA:\n"
            "{\n"
            "  \"pattern_archetype\": \"Nome Direto (Ex: O Especialista de Resultados Reais)\",\n"
            "  \"virality_score\": 94,\n"
            "  \"executive_summary\": \"Explicação clara e humana sobre por que o vídeo conectou.\",\n"
            "  \"psychological_profile\": [\n"
            "    {\"subject\": \"Confiança\", \"A\": 90},\\n"
            "    {\"subject\": \"Desejo\", \"A\": 85},\\n"
            "    {\"subject\": \"Clareza\", \"A\": 70},\\n"
            "    {\"subject\": \"Autoridade\", \"A\": 95},\\n"
            "    {\"subject\": \"Visual\", \"A\": 80}\n"
            "  ],\n"
            "  \"golden_keywords\": [\"Palavra 1\", \"Palavra 2\", \"Palavra 3\", \"Palavra 4\"],\n"
            "  \"emotional_trigger\": {\"type\": \"Nome do Gatilho\", \"intensity\": 85},\n"
            "  \"visual_style\": \"Descrição curta e direta de como devem ser as capas e o visual (Ex: Cores sóbrias, rosto do médico em close, texto minimalista).\",\n"
            "  \"brand_voice\": \"Definição do tom de voz (Ex: Mentor sofisticado, autoridade calma, sem gírias).\",\n"
            "  \"pacing_structure\": [\n"
            "     {\"phase\": \"Gancho\", \"percent\": 15, \"color\": \"#ef4444\"},\\n"
            "     {\"phase\": \"Explicação\", \"percent\": 55, \"color\": \"#3bf5a5\"},\\n"
            "     {\"phase\": \"Chamada\", \"percent\": 30, \"color\": \"#19e6ff\"}\n"
            "  ],\n"
            "  \"dna_metrics\": [\n"
            "    {\"trait\": \"Impacto Inicial\", \"score\": 95, \"insight\": \"...\"},\\n"
            "    {\"trait\": \"Conexão\", \"score\": 88, \"insight\": \"...\"},\\n"
            "    {\"trait\": \"Autoridade\", \"score\": 92, \"insight\": \"...\"},\\n"
            "    {\"trait\": \"Didática\", \"score\": 80, \"insight\": \"...\"}\n"
            "  ],\n"
            "  \"replication_script\": [\n"
            "    {\"phase\": \"Início\", \"action\": \"...\", \"icon\": \"zap\"},\\n"
            "    {\"phase\": \"Meio\", \"action\": \"...\", \"icon\": \"book-open\"},\\n"
            "    {\"phase\": \"Fim\", \"action\": \"...\", \"icon\": \"target\"}\n"
            "  ],\n"
            "  \"antipatterns\": [ (O que MATA esse tipo de vídeo - Erros a evitar)\n"
            "    \"Introdução lenta sem mostrar o problema visualmente.\",\n"
            "    \"Música de fundo mais alta que a voz.\",\n"
            "    \"Terminar sem dizer o próximo passo claro.\"\n"
            "  ],\n"
            "  \"checklist\": [ (Ações Táticas Específicas - USE ÍCONES VARIADOS)\n"
            "    {\"item\": \"Ação 1\", \"icon\": \"eye\"},\\n"
            "    {\"item\": \"Ação 2\", \"icon\": \"mic\"},\\n"
            "    {\"item\": \"Ação 3\", \"icon\": \"scissors\"},\\n"
            "    {\"item\": \"Ação 4\", \"icon\": \"star\"}\n"
            "  ]\n"
            "}\n"
            "DICA DE ÍCONES: 'eye' (visual), 'mic' (fala), 'scissors' (edição), 'star' (destaque), 'video' (gravação), 'clock' (tempo), 'message-circle' (engajamento), 'zap' (rápido)."
        )
        
        prompt = f"{system_instruction}\n\nDADOS DOS VÍDEOS: {patterns_data}"
        
        try:
            response = await self._generate_with_fallback(prompt, stream=False)
            raw_text = response.text.strip()
            import re
            json_match = re.search(r'\{{.*\}}', raw_text, re.DOTALL)
            cleaned_text = json_match.group(0) if json_match else raw_text
            cleaned_text = cleaned_text.replace("```json", "").replace("```", "").strip()
            return cleaned_text
        except Exception as e:
            print(f"Erro na análise de padrões: {e}")
            return '{"error": "Falha na IA"}'

gemini_service = GeminiService()
