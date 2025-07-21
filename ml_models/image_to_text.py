from PIL import Image, ImageOps, ImageFilter
import numpy as np
import pytesseract
import easyocr
import re
from pytesseract import Output

# Initialize EasyOCR reader (only once)
easyocr_reader = easyocr.Reader(lang_list=['en', 'fr'], gpu=False)

def is_low_quality_text(text):
    """
    Return True if text is likely garbage: too short or lacks alphabetic content.
    """
    return len(re.findall(r'[A-Za-z]', text)) <= 5

def preprocess_for_ocr(pil_img):
    img = pil_img.convert("L")  # Grayscale
    img = img.resize((img.width * 2, img.height * 2), Image.Resampling.LANCZOS)
    img = ImageOps.autocontrast(img)
    img = img.filter(ImageFilter.SHARPEN)
    img = img.filter(ImageFilter.MedianFilter(size=3))  # Light denoising
    return img

def run_easyocr_fallback(image):
    img_np = np.array(image)
    results = easyocr_reader.readtext(img_np)
    combined_text = " ".join([res[1] for res in results])
    return combined_text.strip()

def get_best_text_from_rotations(processed_img, verbose=True):
    best_text = ""
    best_score = -1
    best_angle = 0

    for angle in [0, 90, 180, 270]:
        rotated = processed_img.rotate(angle, expand=True)
        data = pytesseract.image_to_data(
            rotated,
            config='--oem 1 --psm 6',
            lang='eng+fra',
            output_type=Output.DICT
        )

        text = " ".join([w for w in data["text"] if w.strip()])
        confidences = [int(str(conf)) for conf in data["conf"] if str(conf).isdigit()]
        avg_conf = np.mean(confidences) if confidences else 0

        if is_low_quality_text(text):
            if verbose:
                print(f"⚠️ Skipping angle {angle}° due to low-quality text: {text}")
            continue

        alpha_score = len(re.findall(r'[A-Za-z]', text))
        combined_score = avg_conf + 0.3 * alpha_score

        if verbose:
            print(f"text at {angle} degrees: {text}")
            print(f" → avg_conf={avg_conf:.1f}, alpha_score={alpha_score}, combined_score={combined_score:.1f}")

        if combined_score > best_score:
            best_score = combined_score
            best_text = text
            best_angle = angle

    return best_text.strip(), best_angle

def image_to_text(img_detection_results, verbose=True):
    # Define all expected labels upfront
    medicine_label_data = {
        "medicine_name": None,
        "composition": None,
        "uses": None,
        "dosage_amount": None,
        "dosage_form": None,
        "quantity": None
    }

    if verbose:
        print(f"img_detection_results: {img_detection_results}")

    # Process available detection results and populate actual data
    for img_data in img_detection_results:
        attribute = img_data["label_attribute"].lower()

        if attribute in medicine_label_data:  # Prevent invalid keys
            confidence = img_data.get("confidence", 0.0)
            bounding_box = img_data.get("bounding_box", None)
            raw_crop_img = img_data["cropped_img_obj"]
            processed_img = preprocess_for_ocr(raw_crop_img)

            tesseract_text, best_angle = get_best_text_from_rotations(processed_img, verbose=verbose)

            medicine_label_data[attribute] = {
                "text": tesseract_text,
                "confidence": confidence,
                "bounding_box": bounding_box,
                "angle": best_angle
            }

    return medicine_label_data

