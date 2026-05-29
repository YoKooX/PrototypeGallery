#!/usr/bin/env python3
import http.server
import socketserver
import os
import json
import urllib.parse
from http import HTTPStatus

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        elif self.path.startswith('/prototypes/'):
            pass
        elif self.path.startswith('/css/'):
            pass
        elif self.path.startswith('/js/'):
            pass
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        if self.path == '/upload':
            self.handle_upload()
        elif self.path == '/save_list':
            self.handle_save_list()
        else:
            self.send_error(HTTPStatus.NOT_FOUND, "File not found")

    def handle_upload(self):
        content_length = int(self.headers['Content-Length'])
        boundary = self.headers['Content-Type'].split('boundary=')[1].encode()
        
        try:
            data = self.rfile.read(content_length)
            
            parts = data.split(boundary)
            for part in parts:
                if b'Content-Disposition' in part and b'filename=' in part:
                    filename_start = part.find(b'filename="') + 10
                    filename_end = part.find(b'"', filename_start)
                    filename = part[filename_start:filename_end].decode('utf-8')
                    
                    content_start = part.find(b'\r\n\r\n') + 4
                    content_end = part.rfind(b'\r\n--')
                    file_content = part[content_start:content_end]
                    
                    save_path = os.path.join('prototypes', filename)
                    with open(save_path, 'wb') as f:
                        f.write(file_content)
            
            self.send_response(HTTPStatus.OK)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"success": true}')
            
            self.update_list_json(filename)
            
        except Exception as e:
            print(f"上传错误: {e}")
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(e))

    def handle_save_list(self):
        content_length = int(self.headers['Content-Length'])
        data = self.rfile.read(content_length).decode('utf-8')
        
        try:
            list_data = json.loads(data)
            
            with open('prototypes/list.json', 'w', encoding='utf-8') as f:
                json.dump(list_data, f, ensure_ascii=False, indent=2)
            
            self.send_response(HTTPStatus.OK)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"success": true}')
            
        except Exception as e:
            print(f"保存错误: {e}")
            self.send_error(HTTPStatus.INTERNAL_SERVER_ERROR, str(e))

    def update_list_json(self, filename):
        list_path = 'prototypes/list.json'
        
        if os.path.exists(list_path):
            with open(list_path, 'r', encoding='utf-8') as f:
                list_data = json.load(f)
        else:
            list_data = {'folders': [], 'ungrouped': []}
        
        name = filename.replace('.html', '').replace('-', ' ').replace('_', ' ').title()
        size = os.path.getsize(os.path.join('prototypes', filename))
        
        if size < 1024:
            size_str = f"{size} B"
        elif size < 1024 * 1024:
            size_str = f"{size / 1024:.1f} KB"
        else:
            size_str = f"{size / (1024 * 1024):.1f} MB"
        
        import datetime
        modified = datetime.datetime.now().strftime("%Y-%m-%d")
        
        new_proto = {
            'name': name,
            'filename': filename,
            'description': f"{name} - HTML原型",
            'size': size_str,
            'modified': modified
        }
        
        list_data['ungrouped'].append(new_proto)
        
        with open(list_path, 'w', encoding='utf-8') as f:
            json.dump(list_data, f, ensure_ascii=False, indent=2)

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"服务器运行在 http://localhost:{PORT}/")
        print(f"原型目录: {os.path.abspath('prototypes')}")
        print("按 Ctrl+C 停止服务器")
        httpd.serve_forever()
