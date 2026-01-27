import os
from PIL import Image
import shutil

# Configuration
# Configuration
SOURCE_IMAGE_PATH = r"C:\Users\shiva\.gemini\antigravity\brain\412acd42-7243-4f85-98b3-e540e672f8bb\uploaded_media_1769438198203.jpg"
PROJECT_ROOT = r"d:\Users\shiva\Documents\bp-control"
ANDROID_RES_DIR = os.path.join(PROJECT_ROOT, "android", "app", "src", "main", "res")
PUBLIC_DIR = os.path.join(PROJECT_ROOT, "public")

# Android Mipmap sizes (width, height)
MIPMAP_SIZES = {
    "mipmap-mdpi": (48, 48),
    "mipmap-hdpi": (72, 72),
    "mipmap-xhdpi": (96, 96),
    "mipmap-xxhdpi": (144, 144),
    "mipmap-xxxhdpi": (192, 192),
}

ICONS_TO_GENERATE = ["ic_launcher.png", "ic_launcher_round.png"]

def main():
    if not os.path.exists(SOURCE_IMAGE_PATH):
        print(f"Error: Source image not found at {SOURCE_IMAGE_PATH}")
        return

    try:
        img = Image.open(SOURCE_IMAGE_PATH)
        print(f"Loaded source image: {img.size}")
    except Exception as e:
        print(f"Error loading image: {e}")
        return

    # 1. Update Android Icons
    print("Updating Android icons...")
    for folder, size in MIPMAP_SIZES.items():
        folder_path = os.path.join(ANDROID_RES_DIR, folder)
        if not os.path.exists(folder_path):
            print(f"Warning: Directory {folder_path} does not exist. Skipping.")
            continue
        
        # Resize image
        resized_img = img.resize(size, Image.Resampling.LANCZOS)
        
        # Save as both square and round (since we don't have a separate round source, we'll use the same implementation or crop if needed)
        # For this task, we will just use the same image for both but for round we could apply a mask if strict correctness needed.
        # Given the request is just to "update the app icon", simply replacing the files is usually enough.
        # Many modern Android adaptors handle the shape, but legacy needs 'round'.
        # We'll just save the resized image to both names to ensure it updates.
        
        for icon_name in ICONS_TO_GENERATE:
            target_path = os.path.join(folder_path, icon_name)
            resized_img.save(target_path)
            print(f"Saved {target_path} ({size})")
            
        # Also generate adaptive icon parts (foreground = icon, background = white)
        # We start by saving the icon as foreground
        fg_path = os.path.join(folder_path, "ic_launcher_foreground.png")
        resized_img.save(fg_path)
        
        # Create a simple white background
        bg_img = Image.new('RGB', size, (255, 255, 255))
        bg_path = os.path.join(folder_path, "ic_launcher_background.png")
        bg_img.save(bg_path)

    # 2. Save for Web (Public folder)
    print("\nSaving for Web...")
    if not os.path.exists(PUBLIC_DIR):
        os.makedirs(PUBLIC_DIR)
        print(f"Created directory: {PUBLIC_DIR}")

    # Use a reasonable size for web avatar (e.g., 512x512 max or keep original if small)
    web_size = (512, 512)
    img.thumbnail(web_size, Image.Resampling.LANCZOS)
    web_icon_path = os.path.join(PUBLIC_DIR, "app-icon.png")
    img.save(web_icon_path)
    print(f"Saved web icon to {web_icon_path}")

    print("\nIcon update complete!")

if __name__ == "__main__":
    main()
