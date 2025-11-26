import os
import requests
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# API 키 및 설정
FLOCK_API_KEY = os.getenv("FLOCK_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

FLOCK_BASE_URL = "https://api.flock.io/v1"
MODEL_ID = "qwen3-235b-a22b-instruct-2507"

def generate_search_query(user_question):
    """
    1단계: 사용자 질문을 '구글 검색용 영어 키워드'로 변환 (Qwen 이용)
    """
    url = f"{FLOCK_BASE_URL}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "x-litellm-api-key": FLOCK_API_KEY
    }
    payload = {
        "model": MODEL_ID,
        "messages": [
            {
                "role": "system",
                "content": "You are a Google Search Query Generator. Analyze the user's question about cryptocurrency/finance and output ONLY the best English search query to find the latest news. Include keywords like 'latest news'. Do not output any explanation, just the query string."
            },
            {
                "role": "user",
                "content": user_question
            }
        ],
        "temperature": 0.1
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        # 검색어 추출 및 따옴표 제거
        query = response.json()['choices'][0]['message']['content'].strip().strip('"')
        return query
    except Exception as e:
        print(f"⚠️ 검색어 변환 실패 (원본 사용): {e}")
        return user_question

def search_news_api(keyword):
    """
    2단계: Serper.dev API 호출 (실제 검색)
    """
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "q": keyword,
        "gl": "us",   # 미국 기준 (코인 뉴스는 미국이 빠름)
        "hl": "en",   # 영어 결과
        "num": 3,     # 뉴스 4개만 가져옴
        "tbs": "qdr:d" # 지난 24시간 이내 뉴스만 (최신성 유지)
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        return response.json().get("organic", [])
    except Exception as e:
        print(f"⚠️ 뉴스 검색 실패: {e}")
        return []

def get_formatted_news(user_question):
    """
    [메인 함수] 질문 -> 검색 -> 포맷팅된 텍스트 반환
    이 함수의 리턴값을 나중에 LLM 프롬프트에 넣으면 됩니다.
    """
    # 1. 검색어 최적화
    print(f"🔍 원본 질문: '{user_question}' 분석 중...")
    search_query = generate_search_query(user_question)
    print(f"🇺🇸 변환된 검색어: '{search_query}'")

    # 2. 뉴스 검색
    results = search_news_api(search_query)

    if not results:
        return "No relevant news found regarding this topic."

    # 3. 포맷팅 (Clean Format)
    formatted_text = "<LATEST_NEWS>\n"
    
    for i, item in enumerate(results):
        title = item.get('title', 'No Title')
        snippet = item.get('snippet', 'No summary available.')
        date = item.get('date', 'Recent')
        source = item.get('source', 'Web')
        
        # 가독성 좋은 포맷으로 조립
        formatted_text += f"{i+1}. [{date}] {title} (Source: {source})\n"
        formatted_text += f"   - Summary: {snippet}\n\n"
        
    formatted_text += "</LATEST_NEWS>"
    
    return formatted_text

# --- 테스트 실행용 코드 ---
if __name__ == "__main__":
    question = "도지코인 왜 떨어져?"
    
    news_output = get_formatted_news(question)
    
    print("\n---------- [함수 출력 결과] ----------")
    print(news_output)
    print("--------------------------------------")