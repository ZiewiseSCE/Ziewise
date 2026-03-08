import os
from PIL import Image

files = [
    r"C:\Users\Kennyyang\.gemini\antigravity\brain\34cfc258-4c90-4901-9f28-57a438d8866f\media__1772972410566.png",
    r"C:\Users\Kennyyang\.gemini\antigravity\brain\34cfc258-4c90-4901-9f28-57a438d8866f\media__1772972408002.png",
    r"C:\Users\Kennyyang\.gemini\antigravity\brain\34cfc258-4c90-4901-9f28-57a438d8866f\media__1772972404135.png",
    r"C:\Users\Kennyyang\.gemini\antigravity\brain\34cfc258-4c90-4901-9f28-57a438d8866f\media__1772971333771.png",
    r"C:\Users\Kennyyang\.gemini\antigravity\brain\34cfc258-4c90-4901-9f28-57a438d8866f\media__1772971333737.png",
]

for f in files:
    try:
        img = Image.open(f)
        print(f"{os.path.basename(f)}: {img.size}")
    except Exception as e:
        print(f"Error on {f}: {e}")
