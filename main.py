from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import openai
import os
import json

app = FastAPI()

base_path = os.path.dirname(os.path.abspath(__file__))#获取当前页面
static_dir = os.path.join(base_path, "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static") #挂载静态文件夹，提供前端页面和资源

class SearchRequest(BaseModel):#定义数据结构模型
    query: str#用户输入的查询内容，可中文或拼音
    api_key: str = None # 可选的 API 密钥，否则默认

class WordInfoRequest(BaseModel):
    word: str
    api_key: str = None

default_api_key = "sk-xxxx"

@app.post("/api/search")
def search(req: SearchRequest):
    api_key = req.api_key if req.api_key else default_api_key

    client = openai.OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"#指定 DeepSeek API 的基础 URL
    )

    prompt = f"""
用户输入：{req.query}
请返回5个发音接近的法语单词,并用JSON格式返回:
{{
  "candidates": ["单词1", "单词2", "单词3", "单词4", "单词5"]
}}
"""#提示语，返回5个发音接近的法语单词，JSON 格式返回

    try:
        response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )

        reply = response.choices[0].message.content
        data = json.loads(reply)#将返回的 JSON 字符串解析为 Python 数据
        return {"candidates": data.get("candidates", [])}
    except Exception as e:
        print(e)
        return {"candidates": []}

@app.post("/api/word_info")
def get_word_info(req: WordInfoRequest):
    api_key = req.api_key if req.api_key else default_api_key

client = openai.OpenAI(
    api_key=api_key,
    base_url="https://api.deepseek.com"
)

prompt = f"""
请提供法语单词 '{req.word}' 的信息,并返回JSON:
{{
  "word": "单词",
  "pronunciation": "音标",
  "meaning": "中文意思",
  "sentences": ["例句1", "例句2", "例句3"]
}}
"""
try:
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
        )
    reply = response.choices[0].message.content
    data = json.loads(reply)
    return data
except Exception as e:
    print(e)
    return {
            "word": req.word,
            "pronunciation": "/",
            "meaning": "加载失败",
            "sentences": []
        }#暂留bug -  "meaning": "加载失败，请检查API Key或网络", --- IGNORE ---


    