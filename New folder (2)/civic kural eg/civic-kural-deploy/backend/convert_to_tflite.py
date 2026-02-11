import tensorflow as tf

# Load your trained model
model = tf.keras.models.load_model("civic_issue_severity_model.h5")

# Convert to TFLite with FP16
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.float16]

tflite_model = converter.convert()

# Save new model
with open("civic_issue_severity_model_fp16.tflite", "wb") as f:
    f.write(tflite_model)

print("FP16 TFLite model saved")
