with open('product.html', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '  <!-- PURE VANILLA JAVASCRIPT LOGIC -->'
end_marker = '</body>'

idx_start = content.find(start_marker)
idx_end = content.find(end_marker, idx_start)

if idx_start != -1 and idx_end != -1:
    new_script = """  <!-- Scripts -->
  <script src="assets/products_data.js"></script>
  <script src="assets/store_core.js"></script>
  <script src="assets/pdp_controller.js"></script>
"""
    new_content = content[:idx_start] + new_script + content[idx_end:]
    with open('product.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print('Successfully updated product.html!')
else:
    print('Markers not found:', idx_start, idx_end)
