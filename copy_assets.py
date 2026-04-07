import os
import shutil

src_dir = r"C:\Users\Kennyyang\.gemini\antigravity\brain\34cfc258-4c90-4901-9f28-57a438d8866f"
dest_dir = r"C:\Users\Kennyyang\.gemini\antigravity\scratch\ziewise-renewal"

# The sizes map roughly to:
# 1772971333771.png (332x332) -> Logo symbol
# The other 3 large ones are certs
mapping = {
    "media__1772971333771.png": "logo-symbol.png",
    "media__1772972410566.png": "badge-iso.png",
    "media__1772972408002.png": "badge-venture.png",
    "media__1772972404135.png": "badge-rnd.png",
}

for src_name, dest_name in mapping.items():
    src_path = os.path.join(src_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"Copied {src_name} to {dest_name}")
    else:
        print(f"File not found: {src_path}")
