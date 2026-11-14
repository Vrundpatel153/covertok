import http.server
import urllib.request
import socketserver
import os

devtools_port_file = r"C:\Users\vrund\AppData\Local\Google\Chrome\User Data\DevToolsActivePort"
if not os.path.exists(devtools_port_file):
    print("DevToolsActivePort not found")
    exit(1)

with open(devtools_port_file, "r", encoding="utf-8") as f:
    lines = [l.strip() for l in f.readlines() if l.strip()]

port = int(lines[0])
target = lines[1]
print(f"Target Chrome Port: {port}, target path: {target}")

# Test fetching version or connecting
import http.client
conn = http.client.HTTPConnection("127.0.0.1", port)
conn.request("GET", "/json/version")
resp = conn.getresponse()
print("Response status from Chrome /json/version:", resp.status)
print("Response body:", resp.read().decode())

