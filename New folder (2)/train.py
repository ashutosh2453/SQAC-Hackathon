import tensorflow as tf
import numpy as np

# --------------------
# ADD THIS FUNCTION HERE (TOP)
# --------------------
def add_risk_label(images, labels):
    """
    Converts severity labels into (severity, risk)
    low (0)    -> 20
    medium (1) -> 55
    high (2)   -> 90
    """
    risk = tf.where(
        labels == 0, 20.0,
        tf.where(labels == 1, 55.0, 90.0)
    )
    return images, {"severity": labels, "risk": risk}

# --------------------
# CONFIG
# --------------------
IMG_SIZE = 128
BATCH_SIZE = 32
EPOCHS = 5   # keep small for first test

# --------------------
# LOAD DATA
# --------------------
train_data = tf.keras.preprocessing.image_dataset_from_directory(
    "dataset/train",
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    label_mode="int"
)

val_data = tf.keras.preprocessing.image_dataset_from_directory(
    "dataset/val",
    image_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    label_mode="int"
)

train_data = train_data.map(lambda x, y: (x / 255.0, y))
val_data = val_data.map(lambda x, y: (x / 255.0, y))

train_data = train_data.map(add_risk_label)
val_data = val_data.map(add_risk_label)



def add_risk_label(images, labels):
    """
    Converts severity labels into (severity, risk)
    low (0)    -> 20
    medium (1) -> 55
    high (2)   -> 90
    """
    risk = tf.where(
        labels == 0, 20.0,
        tf.where(labels == 1, 55.0, 90.0)
    )
    return images, {"severity": labels, "risk": risk}


# --------------------
# CNN MODEL
# --------------------
inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))

x = tf.keras.layers.Conv2D(32, (3,3), activation="relu")(inputs)
x = tf.keras.layers.MaxPooling2D(2,2)(x)

x = tf.keras.layers.Conv2D(64, (3,3), activation="relu")(x)
x = tf.keras.layers.MaxPooling2D(2,2)(x)

x = tf.keras.layers.Conv2D(128, (3,3), activation="relu")(x)
x = tf.keras.layers.MaxPooling2D(2,2)(x)

x = tf.keras.layers.Flatten()(x)
x = tf.keras.layers.Dense(128, activation="relu")(x)

severity_output = tf.keras.layers.Dense(3, activation="softmax", name="severity")(x)
risk_output = tf.keras.layers.Dense(1, activation="linear", name="risk")(x)

model = tf.keras.Model(inputs, [severity_output, risk_output])

# --------------------
# COMPILE
# --------------------
model.compile(
    optimizer="adam",
    loss={
        "severity": "sparse_categorical_crossentropy",
        "risk": "mse"
    },
    metrics={
        "severity": "accuracy",
        "risk": "mae"
    }
)

# --------------------
# TRAIN
# --------------------
model.fit(
    train_data,
    validation_data=val_data,
    epochs=EPOCHS
)

# --------------------
# SAVE MODEL
# --------------------
model.save("cnn_risk_model.h5")

print("✅ Training complete. Model saved as cnn_risk_model.h5")
