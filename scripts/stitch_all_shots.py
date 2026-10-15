import subprocess, time, json, urllib.request, base64, io
from PIL import Image
import websocket

print('Testing full page scroll-and-stitch capture...')

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
time.sleep(2)
msg_id = 1

try:
    tabs = json.loads(urllib.request.urlopen('http://localhost:9222/json').read())
    ws = websocket.create_connection(tabs[0]['webSocketDebuggerUrl'], timeout=60)

    def call(m, p=None):
        global msg_id
        ws.send(json.dumps({'id': msg_id, 'method': m, 'params': p or {}}))
        curr = msg_id
        msg_id += 1
        while True:
            r = json.loads(ws.recv())
            if r.get('id') == curr:
                return r.get('result', {})

    call('Page.enable')
    
    def capture_full_stitched(url, width, is_mobile, output_path):
        print(f'Starting capture for {url} ({width}px)...')
        chunk_h = 1600
        
        # 1. Set viewport
        call('Emulation.setDeviceMetricsOverride', {
            'width': width,
            'height': chunk_h,
            'deviceScaleFactor': 1,
            'mobile': is_mobile
        })
        
        call('Page.navigate', {'url': url})
        time.sleep(3.5)
        
        # Hide any fixed floating elements during chunk scroll capture so they do not repeat
        call('Runtime.evaluate', {'expression': "const bar = document.getElementById('pdpStickyBar'); if(bar) bar.style.display = 'none';"})
        time.sleep(0.5)

        # 2. Get total scroll height
        res = call('Runtime.evaluate', {'expression': 'document.documentElement.scrollHeight'})
        total_h = int(res.get('result', {}).get('value', 3000))
        print(f'Total scroll height: {total_h}px')
        
        # 3. Create master canvas
        master = Image.new('RGB', (width, total_h), (255, 255, 255))
        
        curr_y = 0
        while curr_y < total_h:
            # Scroll window
            call('Runtime.evaluate', {'expression': f'window.scrollTo(0, {curr_y})'})
            time.sleep(0.4)
            
            shot_res = call('Page.captureScreenshot', {'format': 'png'})
            img_data = base64.b64decode(shot_res['data'])
            chunk_img = Image.open(io.BytesIO(img_data))
            
            # If at the very bottom, only paste remaining height
            rem = total_h - curr_y
            if rem < chunk_h:
                crop_box = (0, chunk_h - rem, width, chunk_h)
                cropped_chunk = chunk_img.crop(crop_box)
                master.paste(cropped_chunk, (0, curr_y))
            else:
                master.paste(chunk_img, (0, curr_y))
                
            curr_y += chunk_h
            print(f'  Captured chunk up to {min(curr_y, total_h)}px / {total_h}px')
            
        master.save(output_path, quality=95)
        print(f'Successfully saved {output_path}! Dimensions: {master.size}')

    capture_full_stitched('http://localhost:5183/index.html', 1440, False, 'assets/snapshot_home_pc.png')
    capture_full_stitched('http://localhost:5183/index.html', 390, True, 'assets/snapshot_home_mobile.png')
    
    ws.close()
    print('All 4 full snapshots created!')
finally:
    proc.terminate()
