import tensorflow as tf
import os

MODEL_PATH = "civic_issue_severity_model.h5"

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model file not found: {MODEL_PATH}")

print("✅ Found model, starting conversion...")

model = tf.keras.models.load_model(MODEL_PATH)

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

OUTPUT_PATH = "civic_issue_severity_model_fp16.tflite"

with open(OUTPUT_PATH, "wb") as f:
    f.write(tflite_model)

print(f"🎉 Conversion complete! Saved as {OUTPUT_PATH}")
