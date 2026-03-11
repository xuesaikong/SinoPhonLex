from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import openai
import os
import json

app = FastAPI()

def get_base_path():
    """获取程序运行时的基础路径，兼容 PyInstaller 打包后的环境"""
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

base_path = os.path.dirname(os.path.abspath(__file__))#获取当前页面
static_dir = os.path.join(base_path, "static")

app.mount("/static", StaticFiles(directory=static_dir), name="static") #挂载静态文件夹，提供前端页面和资源

class SearchRequest(BaseModel):#定义数据结构模型
    query: str#用户输入的查询内容，可中文或拼音
    api_key: str = None # 可选的 API 密钥，否则默认

class WordInfoRequest(BaseModel):
    word: str
    api_key: str = None

default_api_key = "sk-xxxx"#默认的 DeepSeek API 密钥，用户可以在前端设置中修改

@app.post("/api/search")
def search(req: SearchRequest):
    api_key = req.api_key if req.api_key else default_api_key

    client = openai.OpenAI(
        api_key=api_key,
        base_url="https://api.deepseek.com"#指定 DeepSeek API 的基础 URL
    )

    prompt = f"""
用户输入了发音提示内容（中文或拼音）：'{req.query}'。
请你找出发音与这个输入最相似的 5 个最可能的法语单词。
要求:这5个单词必须完全不同(不重复），且必须是真实存在的法语单词。
仅返回JSON格式:
{{
  "candidates": ["单词1", "单词2", "单词3", "单词4", "单词5"]
}}
"""#提示语，返回5个发音接近的法语单词，JSON 格式返回

    try:
        response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
                {"role": "system", "content": "You are a helpful French dictionary agent. Think about the French phonetics that sound like the user's Chinese/pinyin input. Ensure all 5 candidate words are strictly unique. Respond in ONLY valid JSON exactly matching the requested schema. Do not include markdown ticks."},
                {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3#生成更确定性的结果
    )

        reply = response.choices[0].message.content
        import json
        data = json.loads(reply)#将返回的 JSON 字符串解析为 Python 数据
        return {"candidates": data.get("candidates", [])}
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {"candidates": []}

@app.post("/api/word_info")
def get_word_info(req: WordInfoRequest):
    word = req.word.strip()#去除单词前后的空格
    api_key = req.api_key if req.api_key else default_api_key

    client = openai.OpenAI(
    api_key=api_key,
    base_url="https://api.deepseek.com"
)

    prompt = f"""
请提供法语单词 '{word}' 的字典信息。
包含且仅包含以下信息,以JSON格式返回: 
{{
  "word": "单词",
  "pronunciation": "音标",
  "meaning": "中文意思",
  "sentences": ["例句1(法文原文 - 中文翻译）", "例句2(法文原文 - 中文翻译）", "例句3(法文原文 - 中文翻译）"]
}}
请提供2到3个例句。
"""
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a French dictionary agent. You must respond in ONLY valid JSON exactly matching the requested schema. Do not include markdown ticks."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3#确保信息准确
        )

        reply = response.choices[0].message.content
        import json
        data = json.loads(reply)
        return data
    
    except Exception as e:
        print(f"LLM API Error: {e}")
        return {
            "word":word,
            "pronunciation": "/",
            "meaning": "加载失败",
            "sentences": [str(e)]
        }#发生错误，返回一个包含错误信息的字典，供前端显示错误提示

@app.get("/", response_class=HTMLResponse)
def read_root():
    index_path = os.path.join(base_path, "static", "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        return f.read()#读取并返回前端


    