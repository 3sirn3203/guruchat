import os
import json
import requests
import time
from dotenv import load_dotenv

# 1. 환경 변수 및 설정 로드
load_dotenv()

FLOCK_API_KEY = os.getenv("FLOCK_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
FLOCK_BASE_URL = "https://api.flock.io/v1"
MODEL_ID = "qwen3-235b-a22b-instruct-2507" 

# ==========================================    
# [Part 1] 뉴스 검색 및 처리 도구 (Tools)
# ==========================================

def generate_search_query(user_question):
    """사용자 질문을 구글 검색용 영어 키워드로 변환"""
    url = f"{FLOCK_BASE_URL}/chat/completions"
    headers = {"Content-Type": "application/json", "x-litellm-api-key": FLOCK_API_KEY}
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": "You are a Search Query Generator. Output ONLY the best English search query for the user's question."},
            {"role": "user", "content": user_question}
        ],
        "temperature": 0.1
    }
    try:
        response = requests.post(url, headers=headers, json=payload)
        data = response.json()
        if 'choices' not in data: return user_question
        return data['choices'][0]['message']['content'].strip().strip('"')
    except:
        return user_question

def search_news_api(keyword):
    """Serper.dev API 호출"""
    url = "https://google.serper.dev/search"
    headers = {"X-API-KEY": SERPER_API_KEY, "Content-Type": "application/json"}
    payload = {"q": keyword, "gl": "us", "hl": "en", "num": 3, "tbs": "qdr:d"}
    try:
        response = requests.post(url, headers=headers, json=payload)
        return response.json().get("organic", [])
    except:
        return []

def get_formatted_news(user_question):
    """질문 -> 검색어 변환 -> 뉴스 검색 -> 텍스트 포맷팅"""
    print(f"   🔎 [System] 뉴스 검색 중... (질문: {user_question})")
    query = generate_search_query(user_question)
    results = search_news_api(query)
    
    if not results: return "No relevant news found."

    text = "<LATEST_MARKET_NEWS>\n"
    for i, item in enumerate(results):
        text += f"{i+1}. {item.get('title')} (Source: {item.get('source', 'Web')})\n"
        text += f"   Summary: {item.get('snippet')}\n\n"
    text += "</LATEST_MARKET_NEWS>"
    return text

# ==========================================
# [Part 2] 핵심 엔진 (The Guru Engine)
# ==========================================

def generate_guru_response(user_query, mode, character_profile):
    """
    [범용 함수] 어떤 캐릭터든 프로필만 넣으면 그 사람처럼 연기함.
    
    Args:
        user_query (str): 사용자 질문
        mode (str): 'hot' 또는 'cold'
        character_profile (dict): 캐릭터 설정이 담긴 JSON 객체
    
    Returns:
        str: AI의 최종 답변
    """
    
    # 1. 뉴스 처리 로직 (Cold일 때만 뉴스 가져옴)
    news_context = ""
    if mode == "cold":
        news_context = get_formatted_news(user_query)
    else:
        print("   🔥 [System] Hot 모드: 뉴스 검색 생략")
        news_context = "No external news provided. Rely on your intuition and philosophy."

    # 2. 시스템 프롬프트 조립 (외부에서 받은 character_profile 사용)
    system_instruction = f"""
    You are an AI roleplaying as the character defined in the JSON below.
    Internalize all attributes, especially the 'tone' and 'signature_phrases'.

    [CHARACTER PROFILE]
    {json.dumps(character_profile, ensure_ascii=False)}

    [CURRENT MODE: {mode.upper()}]
    """

    # 모드별 세부 지침 (공통 로직)
    if mode == "cold":
        system_instruction += """
        - Be polite, wise, and calm.
        - Use honorifics (존댓말).
        - Base your advice on the provided <LATEST_MARKET_NEWS>.
        - Use phrases from 'signature_phrases_cold'.
        """
        temperature = 0.4
    else: # hot
        system_instruction += """
        - Be sarcastic, blunt, and aggressive.
        - Talk like a strict grandfather (or crazy genius) scolding a reckless newbie.
        - IGNORE polite tones. Use memes or slang if appropriate.
        - Use phrases from 'signature_phrases_hot'.
        - Don't rely on news; rely on your gut feeling and philosophy.
        """
        temperature = 1.0

    # 3. 메시지 구성
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": f"News Context:\n{news_context}\n\nUser Question: {user_query}"}
    ]

    # 4. Qwen API 호출
    url = f"{FLOCK_BASE_URL}/chat/completions"
    headers = {"Content-Type": "application/json", "x-litellm-api-key": FLOCK_API_KEY}
    payload = {
        "model": MODEL_ID,
        "messages": messages,
        "temperature": temperature
    }
    
    print(f"   💬 [Engine] {character_profile['name']} ({mode.upper()}) 답변 생성 중...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        data = response.json()

        if 'choices' not in data:
            return f"❌ API Error: {json.dumps(data, ensure_ascii=False)}"

        return data['choices'][0]['message']['content']
    except Exception as e:
        return f"System Error: {e}"

