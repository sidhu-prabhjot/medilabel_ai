from inference_sdk import InferenceHTTPClient
from PIL import Image, ImageDraw
from dotenv import load_dotenv
import numpy as np
import cv2
import os

def deskew_image(pil_img):
    # Convert to grayscale numpy array
    gray = np.array(pil_img.convert("L"))

    # Binarize and invert (text becomes white)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    binary = 255 - binary

    # Get coordinates of non-zero pixels (i.e., text)
    coords = np.column_stack(np.where(binary > 0))
    if coords.shape[0] == 0:
        return pil_img  # No text found

    # Determine rotation angle
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Rotate around center
    (h, w) = gray.shape
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    rotated = cv2.warpAffine(np.array(pil_img), M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    return Image.fromarray(rotated)

def run_ocr(img_path):
    load_dotenv()
    api_key = os.getenv("ROBOFLOW_API_KEY")

    CLIENT = InferenceHTTPClient(
        api_url="https://detect.roboflow.com",
        api_key=api_key
    )

    # Load and deskew original image
    original_img = Image.open(img_path)
    deskewed_img = deskew_image(original_img)

    # Resize to match Roboflow's input size (stretched 640x640)
    resized_img = deskewed_img.resize((640, 640))

    # Save temporary image for inference
    temp_resized_path = "resized_temp_image.jpg"
    resized_img.save(temp_resized_path)

    # Inference on resized + deskewed image
    result = CLIENT.infer(temp_resized_path, model_id="medilabel_ai/1")

    draw = ImageDraw.Draw(resized_img)
    formatted_result = []

    for bounding_box in result["predictions"]:
        x = bounding_box["x"]
        y = bounding_box["y"]
        w = bounding_box["width"]
        h = bounding_box["height"]

        left = int(x - w / 2)
        top = int(y - h / 2)
        right = int(x + w / 2)
        bottom = int(y + h / 2)

        draw.rectangle([left, top, right, bottom], outline="red", width=3)

        cropped_img = resized_img.crop((left, top, right, bottom))

        formatted_result.append({
            "bounding_box": (left, top, right, bottom),
            "label_attribute": bounding_box["class"],
            "confidence": bounding_box["confidence"],
            "cropped_img_obj": cropped_img,
            "detection_id": bounding_box["detection_id"]
        })

    resized_img.show()
    return formatted_result
