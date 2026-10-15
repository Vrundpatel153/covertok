import subprocess, time, json, urllib.request, base64, os
import websocket

print('Starting Chrome headless with CDP...')

cmd = [
    r'C:\Program Files\Google\Chrome\Application\chrome.exe',
    '--headless=new',
    '--remote-debugging-port=9222',
    '--remote-allow-origins=*',
    '--disable-gpu',
    '--hide-scrollbars',
    r'--user-data-dir=c:\Users\vrund\OneDrive\Desktop\covertok\covertok\.temp_cdp'
]

proc = subprocess.Popen(cmd)
time.sleep(2.5)

msg_id = 1

try:
    tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
    ws_url = tabs[0]['webSocketDebuggerUrl']
    ws = websocket.create_connection(ws_url, timeout=30)

    def send_cmd(method, params=None):
        global msg_id
        payload = {'id': msg_id, 'method': method}
        if params:
            payload['params'] = params
        ws.send(json.dumps(payload))
        curr_id = msg_id
        msg_id += 1
        while True:
            raw = ws.recv()
            res = json.loads(raw)
            if res.get('id') == curr_id:
                return res.get('result', {})

    send_cmd('Page.enable')
    send_cmd('DOM.enable')

    tasks = [
        {
            'name': 'Homepage PC',
            'url': 'http://localhost:5183/index.html',
            'width': 1440,
            'mobile': False,
            'dpr': 1.5,
            'dest': 'assets/full_homepage_pc.png'
        },
        {
            'name': 'Homepage Mobile',
            'url': 'http://localhost:5183/index.html',
            'width': 390,
            'mobile': True,
            'dpr': 2.0,
            'dest': 'assets/full_homepage_mobile.png'
        },
        {
            'name': 'Product Page PC',
            'url': 'http://localhost:5183/product.html',
            'width': 1440,
            'mobile': False,
            'dpr': 1.5,
            'dest': 'assets/full_product_pc.png'
        },
        {
            'name': 'Product Page Mobile',
            'url': 'http://localhost:5183/product.html',
            'width': 390,
            'mobile': True,
            'dpr': 2.0,
            'dest': 'assets/full_product_mobile.png'
        }
    ]

    for t in tasks:
        print(f"Capturing {t['name']} ({t['width']}px)...")
        # 1. Set initial viewport
        send_cmd('Emulation.setDeviceMetricsOverride', {
            'width': t['width'],
            'height': 900 if not t['mobile'] else 844,
            'deviceScaleFactor': t['dpr'],
            'mobile': t['mobile']
        })

        # 2. Navigate and wait
        send_cmd('Page.navigate', {'url': t['url']})
        time.sleep(3.5)

        # 3. Get layout metrics
        metrics = send_cmd('Page.getLayoutMetrics')
        content_size = metrics.get('cssContentSize', metrics.get('contentSize', {}))
        page_height = int(content_size.get('height', 3500))
        print(f"  Page height detected: {page_height}px")

        # 4. Set full height
        send_cmd('Emulation.setDeviceMetricsOverride', {
            'width': t['width'],
            'height': page_height,
            'deviceScaleFactor': t['dpr'],
            'mobile': t['mobile']
        })
        time.sleep(1.5)

        # 5. Capture screenshot
        shot = send_cmd('Page.captureScreenshot', {
            'format': 'png',
            'captureBeyondViewport': True
        })

        if 'data' in shot:
            data = base64.b64decode(shot['data'])
            with open(t['dest'], 'wb') as f:
                f.write(data)
            print(f"  Saved {t['dest']} ({len(data)} bytes)")
        else:
            print(f"  Error capturing {t['name']}:", shot)

    ws.close()
    print('All full-page snapshots captured successfully!')

finally:
    proc.terminate()
