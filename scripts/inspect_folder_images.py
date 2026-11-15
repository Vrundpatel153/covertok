import os, glob

folders = [
    'assets/products/9871354528042',
    'assets/products/9982201299242',
    'assets/products/9981786390826',
    'assets/products/9870558036266',
    'assets/products/9870550761770',
    'assets/products/9873114038570',
    'assets/products/9989730304298'
]

for d in folders:
    print(f"\n=== {d} ===")
    if os.path.exists(d):
        files = os.listdir(d)
        print(f"Total files: {len(files)}")
        # print first 15 files
        for f in sorted(files)[:15]:
            print(" ", f)
    else:
        print("Directory does not exist")
