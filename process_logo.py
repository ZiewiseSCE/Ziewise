import os
import glob
from PIL import Image

# Find the latest media PNG
media_files = glob.glob(r"C:\Users\Kennyyang\.gemini\antigravity\brain\**\media_*.png", recursive=True)
media_files = sorted(media_files, key=os.path.getmtime, reverse=True)
if not media_files:
    print("No media files found")
    exit()

latest_media = media_files[0]
print(f"Processing {latest_media}")

img = Image.open(latest_media).convert("RGBA")
bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

width, height = img.size

pixels = img.load()

# Find the horizontal split line (a completely transparent row) around the middle
split_y = height // 2
found_split = False
for y in range(height // 3, height * 2 // 3):
    is_transparent = True
    for x in range(width):
        if pixels[x, y][3] > 0:
            is_transparent = False
            break
    if is_transparent:
        split_y = y
        found_split = True
        break

# If we couldn't find a perfect empty row, just split it at ~60% height
# The symbol is usually bigger and on top.
if not found_split:
    split_y = int(height * 0.6)

# Crop the two parts and trim their empty spaces
symbol_crop = img.crop((0, 0, width, split_y))
symbol_bbox = symbol_crop.getbbox()
if symbol_bbox:
    symbol = symbol_crop.crop(symbol_bbox)
else:
    symbol = symbol_crop

text_crop = img.crop((0, split_y, width, height))
text_bbox = text_crop.getbbox()
if text_bbox:
    text = text_crop.crop(text_bbox)
else:
    text = text_crop

# Create a horizontal layout
gap = 30
new_width = symbol.width + text.width + gap
new_height = max(symbol.height, text.height)

new_img = Image.new("RGBA", (new_width, new_height), (0, 0, 0, 0))

# Vertically center
symbol_y = (new_height - symbol.height) // 2
text_y = (new_height - text.height) // 2

new_img.paste(symbol, (0, symbol_y), symbol)
new_img.paste(text, (symbol.width + gap, text_y), text)

out_path = r"C:\Users\Kennyyang\.gemini\antigravity\scratch\ziewise-renewal\logo.png"
new_img.save(out_path)
print(f"Saved correctly formatted horizontal logo to {out_path}")
