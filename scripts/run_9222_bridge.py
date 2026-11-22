import http.server
import socketserver
import json
import os

devtools_port_file = r"C:\Users\vrund\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"

class DynamicProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/json/version":
            try:
                with open(devtools_port_file, "r", encoding="utf-8") as f:
                    lines = [l.strip() for l in f.readlines() if l.strip()]
                chrome_port = int(lines[0])
                target_path = lines[1]
                ws_url = f"ws://127.0.0.1:{chrome_port}{target_path}"
                data = {
                    "Browser": "Chrome/133.0.0.0",
                    "Protocol-Version": "1.3",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
                    "V8-Version": "13.3.0",
                    "WebKit-Version": "537.36",
                    "webSocketDebuggerUrl": ws_url
                }
                body = json.dumps(data).encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=UTF-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            except Exception as e:
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", 9222), DynamicProxyHandler)
    print("Dynamic 9222 bridge listening...")
    server.serve_forever()
