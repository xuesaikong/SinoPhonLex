from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import openai
import os
import json

app = FastAPI()

base_path = os.path.dirname(os.path.abspath(__file__))#获取当前页面

class SearchRequest(BaseModel):#定义数据结构模型
    query: str#用户输入的查询内容，可中文或拼音
    api_key: str = None # 可选的 API 密钥，否则默认

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
请返回5个发音接近的法语单词，并用JSON格式返回：
{{
  "candidates": ["单词1", "单词2", "单词3", "单词4", "单词5"]
}}
"""#提示语，返回5个发音接近的法语单词，JSON 格式返回

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "user", "content": prompt}
        ],
        temperature=0.5
    )

    reply = response.choices[0].message.content
    data = json.loads(reply)#将返回的 JSON 字符串解析为 Python 数据

    return data

@app.get("/", response_class=HTMLResponse)
def read_root():
    index_path = os.path.join(base_path, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read() 