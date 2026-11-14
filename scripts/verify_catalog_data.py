import json

with open('assets/products_data.json', 'r', encoding='utf-8') as f:
    data_json = json.load(f)
print(f"products_data.json count: {len(data_json)}")

with open('assets/products_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# products_data.js starts with: window.CovertokProducts = [ ... ];
# find start of array
start = text.find('[')
end = text.rfind(']')
if start != -1 and end != -1:
    js_arr_str = text[start:end+1]
    js_data = json.loads(js_arr_str)
    print(f"products_data.js count: {len(js_data)}")
else:
    print("Could not parse products_data.js array")
