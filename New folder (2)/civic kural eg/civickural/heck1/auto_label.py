from ultralytics import YOLO

# Load pretrained YOLOv8 model
model = YOLO("yolov8n.pt")

# Folder containing your images
SOURCE_DIR = "auto_images"

# Run auto-labeling
model(
    source=SOURCE_DIR,
    save=True,
    save_txt=True,
    save_conf=True
)

print("✅ Auto-labeling complete.")
print("Check runs/detect/predict/labels/")
