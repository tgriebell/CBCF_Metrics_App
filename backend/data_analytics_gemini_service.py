from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import re
from fastapi import HTTPException
from .database import get_db
from .models import Post, User, FollowerHistory, Conversation
from .gemini_service import gemini_service
from . import schemas
from .api_services import YoutubeApiService 

class DataAnalyticsGeminiService:

    async def _extract_date_range_from_prompt(self, user_prompt: str) -> dict:
        today = datetime.now()
        prompt_lower = user_prompt.lower()
        start_date = today - timedelta(days=30)
        end_date = today
        date_pattern = r"(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?"
        dates_found = re.findall(date_pattern, prompt_lower)
        if len(dates_found) >= 1:
            try:
                def parse_match(match):
                    day, month, year = match
                    if not year: year = today.year
                    elif len(year) == 2: year = f"20{year}"
                    return datetime(int(year), int(month), int(day))
                d1 = parse_match(dates_found[0])
                if len(dates_found) >= 2:
                    d2 = parse_match(dates_found[1])
                    start_date, end_date = sorted([d1, d2])
                else:
                    start_date = d1
                    end_date = today
            except: pass
        return {"start_date": start_date.strftime('%Y-%m-%d'), "end_date": end_date.strftime('%Y-%m-%d')}

    def _format_comprehensive_data_for_ai(
        self,
        posts: list[Post],
        youtube_growth: list[dict],
        tiktok_history: list[FollowerHistory],
        start_date: str,
        end_date: str
    ) -> str:
        yt_raw = [
            {"date": d['date'], "views": d.get('views',0), "subs": d.get('net_growth',0), "avg_duration": d.get('avg_view_duration',0)}
            for d in youtube_growth
        ]
        tk_raw = [
            {"date": h.date.strftime('%Y-%m-%d'), "followers": h.count, "views": h.views, "likes": h.likes, "shares": h.shares}
            for h in tiktok_history
        ]
        video_details = []
        for p in posts:
            m = p.metrics or {}
            video_details.append({"id": p.id, "platform": p.platform, "title": p.title, "views": m.get('views', 0), "likes": m.get('likes', 0), "shares": m.get('shares', 0), "date": p.published_at.strftime('%Y-%m-%d')})
        
        return json.dumps({
            "period": {"start": start_date, "end": end_date},
            "youtube_history": yt_raw,
            "tiktok_history": tk_raw,
            "videos": video_details
        }, indent=2)

    def _calculate_real_efficiency(self, posts: list[Post], youtube_growth: list[dict], tiktok_history: list[FollowerHistory]) -> list[dict]:
        """Calcula a Eficiência Real: (Engajamento / Views) e (Novos Seguidores / Views)."""
        
        # 1. Agregação YouTube
        yt_views = sum(d.get('views', 0) for d in youtube_growth)
        yt_subs = sum(d.get('net_growth', 0) for d in youtube_growth)
        # Engajamento YouTube (precisamos dos posts para likes/comments, pois youtube_growth é follower history)
        # Mas youtube_growth do YoutubeApiService tem likes/comments diários também se vier do Analytics
        # Para garantir, usamos os posts, mas cuidado: posts são publicações, growth é diário
        # O ideal é usar o acumulado dos posts do período para engajamento de CONTEÚDO
        
        yt_posts = [p for p in posts if 'youtube' in p.platform]
        yt_likes = sum(p.metrics.get('likes', 0) for p in yt_posts)
        yt_comments = sum(p.metrics.get('comments', 0) for p in yt_posts)
        yt_shares = sum(p.metrics.get('shares', 0) for p in yt_posts)
        
        # Se yt_views do growth for 0 (sem dados de analytics), tenta somar views dos posts
        if yt_views == 0:
             yt_views = sum(p.metrics.get('views', 0) for p in yt_posts)

        yt_eng_rate = ((yt_likes + yt_comments + yt_shares) / yt_views * 100) if yt_views > 0 else 0
        yt_conv_rate = (yt_subs / yt_views * 100) if yt_views > 0 else 0

        # 2. Agregação TikTok
        # TikTok History já tem likes/views diários acumulados ou delta?
        # FollowerHistory tem 'views', 'likes' do dia (delta).
        tk_views = sum(h.views for h in tiktok_history)
        tk_likes = sum(h.likes for h in tiktok_history)
        tk_comments = sum(h.comments for h in tiktok_history)
        tk_shares = sum(h.shares for h in tiktok_history)
        
        # Crescimento de seguidores TikTok (Final - Inicial)
        tk_subs = 0
        if tiktok_history:
            tk_subs = tiktok_history[-1].count - tiktok_history[0].count
            
        tk_eng_rate = ((tk_likes + tk_comments + tk_shares) / tk_views * 100) if tk_views > 0 else 0
        tk_conv_rate = (tk_subs / tk_views * 100) if tk_views > 0 else 0

        return [
            {
                "platform": "YouTube",
                "engagement_rate": round(yt_eng_rate, 2),
                "conversion_rate": round(yt_conv_rate, 3) # Conversão é geralmente menor, precisa de mais precisão
            },
            {
                "platform": "TikTok",
                "engagement_rate": round(tk_eng_rate, 2),
                "conversion_rate": round(tk_conv_rate, 3)
            }
        ]

    async def analyze_data_with_context(self, user_prompt: str, db: Session, custom_system_instruction: str = None, history: list = None) -> dict:
        user = db.query(User).filter(User.username == "testuser").first()
        if not user: raise HTTPException(status_code=404, detail="User not found")

        # --- MODO CUSTOMIZADO (Ex: Insight de Post Único) ---
        if custom_system_instruction:
            final_prompt = f"{user_prompt}\n\n--- JSON RESPOSTA ---"
            response_text = await gemini_service.generate_general_response(
                prompt=final_prompt, 
                history=history, 
                system_instruction_override=custom_system_instruction
            )
            try:
                # Tenta extrair JSON limpo
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                json_str = json_match.group(0) if json_match else response_text
                # Remove blocos de código markdown se existirem
                json_str = json_str.replace("```json", "").replace("```", "").strip()
                return json.loads(json_str)
            except Exception as e:
                print(f"Erro ao parsear JSON customizado: {e}. Texto recebido: {response_text[:100]}...")
                return {"error": "Falha ao gerar JSON estruturado.", "raw_text": response_text}

        # --- MODO PADRÃO (Dashboard Geral) ---
        date_range = await self._extract_date_range_from_prompt(user_prompt)
        start_date = datetime.fromisoformat(date_range["start_date"]).date()
        end_date = datetime.fromisoformat(date_range["end_date"]).date()

        yt_service = YoutubeApiService(user_id=user.id)
        yt_growth = yt_service.get_daily_subscriber_growth(db, start_date, end_date)
        tk_history = db.query(FollowerHistory).filter(
            FollowerHistory.user_id == user.id,
            FollowerHistory.platform == 'tiktok',
            FollowerHistory.date >= datetime.combine(start_date, datetime.min.time()),
            FollowerHistory.date <= datetime.combine(end_date, datetime.max.time())
        ).all()
        
        # BUSCA COMPLETA SEM LIMITES
        posts = db.query(Post).filter(
            Post.published_at >= datetime.combine(start_date, datetime.min.time()),
            Post.published_at <= datetime.combine(end_date, datetime.max.time())
        ).order_by(Post.published_at.desc()).all() 

        # --- ENRIQUECIMENTO QUALITATIVO (TOP/FLOP CONTEXT) ---
        # Identifica os 5 melhores e 5 piores por views para enviar contexto completo (descrição/tags)
        sorted_by_views = sorted(posts, key=lambda p: p.metrics.get('views', 0), reverse=True)
        top_5 = sorted_by_views[:5]
        flop_5 = sorted_by_views[-5:] if len(sorted_by_views) > 5 else []
        
        qualitative_context = []
        for p in (top_5 + flop_5):
            qualitative_context.append({
                "id": p.id,
                "type": "TOP PERFORMER" if p in top_5 else "LOW PERFORMER",
                "title": p.title,
                "tags": p.tags,
                "full_description": p.description[:1000] if p.description else ""
            })

        full_raw_data = self._format_comprehensive_data_for_ai(posts, yt_growth, tk_history, date_range["start_date"], date_range["end_date"])
        
        # Anexa o contexto qualitativo ao JSON de dados brutos
        full_raw_data_json = json.loads(full_raw_data)
        full_raw_data_json["qualitative_deep_dive"] = qualitative_context
        full_raw_data = json.dumps(full_raw_data_json, indent=2)

        # --- CÁLCULO REAL DE EFICIÊNCIA ---
        real_efficiency = self._calculate_real_efficiency(posts, yt_growth, tk_history)
        # ----------------------------------

        system_instruction = (
            "--- FRAMEWORK DE INTELIGÊNCIA: CO-STAR ---\n\n"
            "1. CONTEXTO (Realidade CBCF):\n"
            "Você é o Estrategista do Dr. Rafael Evaristo. "
            "FOCO CENTRAL: ESPECIALISTA EM REMOÇÃO DE PAPADA (Recordista Mundial - 3.400+ casos). "
            "PROCEDIMENTOS ASSOCIADOS: Deep Plane Facelift, Nanolifting e Lifting Facial (Realizados conforme necessidade clínica).\n"
            "Não estamos vendendo 'procedimentos', estamos vendendo o CONTORNO MANDIBULAR PERFEITO e a SEGURANÇA de quem mais opera isso no mundo.\n\n"
            
            "2. OBJETIVO:\n"
            "Dar inteligência ao Thiago (Videomaker). Descobrir:\n"
            "- Quais ganchos sobre 'Papada' estão parando o scroll?\n"
            "- Quando mencionamos 'Deep Plane' como associado, a retenção sobe (interesse técnico) ou desce (medo)?\n"
            "- Identificar vídeos que provam a autoridade mundial do Dr. Rafael.\n\n"
            
            "3. ESTILO / 4. TOM:\n"
            "Executivo, cirúrgico, sem enrolação. Fale sobre 'Conversão', 'Autoridade' e 'Direção Artística'.\n\n"
            
            "5. AUDIÊNCIA:\n"
            "Thiago e Dr. Rafael. Eles são experts. Fale de igual para igual.\n\n"
            
            "--- INSTRUÇÕES DE RACIOCÍNIO (CHAIN OF THOUGHT) ---\n"
            "Analise se o conteúdo está focado no 'Carro-Chefe' (Papada) ou nos 'Complementos' (Lifting) e qual traz mais ROI real.\n"
            "SE O USUÁRIO PEDIR SUGESTÕES, IDEIAS OU TÓPICOS DE VÍDEO: Você É OBRIGADO a listar cada ideia como um item dentro de 'executive_decisions' e NÃO apenas no texto corrido. Use ícones como 'rocket' ou 'target' para essas ideias. O título do card deve ser o TEMA DO VÍDEO.\n"
            "IMPORTANTE: Na descrição (desc) de cada sugestão, você deve OBRIGATORIAMENTE usar o formato: 'GANCHO: [texto do gancho para prender a atenção] ESTRATÉGIA: [direção técnica para o Thiago]'. Isso é crucial para a estética da interface.\n\n"

            "--- FORMATO DE SAÍDA (JSON PURO) ---\n"
            "{\n"
            "  'conversational_response': 'Resumo de impacto (máx 3 linhas).',\n"
            "  'diagnostic_cards': [\n"
            "     {\n"
            "       'title': 'TITULO',\n"
            "       'content': 'Análise técnica citando #ID.',\n"
            "       'type': 'positive|warning|neutral',\n"
            "       'metric': 'Dado Prova',\n"
            "       'reference_id': '#ID'\n"
            "     }\n"
            "  ],\n"
            "  'executive_decisions': [\n"
            "     {\n"
            "       'title': 'DIREÇÃO / ESTRATÉGIA',\n"
            "       'desc': 'Ordem clara pro Thiago. Ex: Mais B-Roll de contorno mandibular.',\n"
            "       'icon': 'rocket|zap|target|activity|users|layers',\n"
            "       'reference_id': '#ID'\n"
            "     }\n"
            "  ],\n"
            "  'charts': {\n"
            "     'platform_share': [...],\n"
            "     'narrative_ranking': [{'theme': 'Papada', 'efficiency_score': 95, 'volume': 80}, ...]\n"
            "  },\n"
            "  'insights_hierarchy': {\n"
            "     'master': 'Insight Mestre',\n"
            "     'delayed_youtube': {...},\n"
            "     'delayed_tiktok': {...},\n"
            "     'behavioral': 'Análise comportamental'\n"
            "  },\n"
            "  'dominant_channel': 'CANAL',\n"
            "  'best_posting_day': {...},\n"
            "  'money_equivalence': {...}\n"
            "}"
        )

        final_prompt = f"--- DADOS BRUTOS ---\n{full_raw_data}\n\n--- PERGUNTA/CONTEXTO ---\n{user_prompt}\n\n--- JSON RESPOSTA ---"
        
        # Passa a instrução de sistema ESPECÍFICA de Analytics e o histórico
        response_text = await gemini_service.generate_general_response(
            prompt=final_prompt,
            history=history,
            system_instruction_override=system_instruction
        )
        
        try:
            # --- CORREÇÃO DE ROBUSTEZ (v2) ---
            # A IA pode enviar texto antes do JSON (devido à persona criativa).
            # Buscamos explicitamente onde começa o objeto JSON '{' e onde termina '}'.
            
            # Limpeza básica de markdown
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            
            start_idx = clean_text.find('{')
            end_idx = clean_text.rfind('}')
            
            if start_idx != -1 and end_idx != -1:
                json_str = clean_text[start_idx : end_idx + 1]
                json_response = json.loads(json_str)
            else:
                # Fallback: Tenta parsear direto caso não ache as chaves (raro)
                json_response = json.loads(clean_text)

            # Garante campos críticos para o novo Frontend
            insights = json_response.get("insights_hierarchy", {})
            if not insights.get("master"):
                insights["master"] = "Análise estratégica concluída. Aqui estão os pontos chave do período:"

            # INJETAR DADOS REAIS DE EFICIÊNCIA
            if 'charts' not in json_response: json_response['charts'] = {}
            json_response['charts']['efficiency_comparison'] = real_efficiency
            
            return {
                "conversational_response": json_response.get("conversational_response", ""),
                "diagnostic_cards": json_response.get("diagnostic_cards", []),
                "executive_decisions": json_response.get("executive_decisions", []),
                "charts": json_response.get("charts", {}),
                "insights_hierarchy": insights,
                "dominant_channel": json_response.get("dominant_channel", "TIKTOK"),
                "best_posting_day": json_response.get("best_posting_day", {}),
                "money_equivalence": json_response.get("money_equivalence", {}),
                "referenced_post": None,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            }
        except Exception as e:
            # Adicione logs se possível, ou apenas retorne o erro formatado
            print(f"Erro no parsing JSON: {e}")
            print(f"Texto recebido: {response_text}")
            return {
                "conversational_response": f"Não foi possível processar os dados: {str(e)}",
                "diagnostic_cards": [{"title": "Erro na Análise", "content": f"A IA retornou um formato inválido. Tente novamente.", "type": "warning"}], 
                "executive_decisions": [], "charts": {}, "insights_hierarchy": {}, "dominant_channel": "N/A",
                "period": {"start": start_date.isoformat(), "end": end_date.isoformat()}
            }

# Instância única
data_analytics_service = DataAnalyticsGeminiService()