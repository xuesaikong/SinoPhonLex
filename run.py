import threading
import time
import socket
import uvicorn
import webview
from main import app

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

port = get_free_port()

def start_server():
    uvicorn.run(app, host='127.0.0.1', port=port, log_level="info")

if __name__ == '__main__':
    t = threading.Thread(target=start_server)
    t.daemon = True
    t.start()#在独立线程中启动 FastAPI 
    
    time.sleep(1)
    
    webview.create_window(
        title='中法谐音词汇查询系统',
        url=f'http://127.0.0.1:{port}',
        width=800,
        height=700,
        resizable=True
    )#创建应用程序窗口，加载本地服务器的 URL，并设置窗口的标题、
    
    webview.start()#启动 webview 应用程序