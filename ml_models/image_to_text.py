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
    img = ImageOps.exif_transpose(img)  # Handle EXIF rotation
    img = img.resize((img.width * 3, img.height * 3), Image.Resampling.LANCZOS)
    img = ImageOps.autocontrast(img)
    img = img.filter(ImageFilter.MedianFilter(size=3))  # Denoise
    img = ImageOps.invert(img) if np.mean(np.array(img)) > 127 else img  # Optional invert for light text
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

    for angle in [0, 45, 90, 135, 180, 225, 270]:
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

def clean_text(text):
    return re.sub(r'[\u2018\u2019\u201C\u201D]', "'", text).strip().replace("\n", " ")

def correct_common_ocr_mistakes(text):
    substitutions = [
        (r'(?<!\w)[IiLl][2Zz]', '12'),            # I2 / l2 / L2 → 12
        (r'\bmgm\b', 'mg'),                       # mgm → mg
        (r'\b([0-9]+)[oO](mg|mcg|g)\b', r'\1 0\2'),# 10mg misread as 1omg → 10mg
        (r'\b([Oo])(?=\d)', '0'),                 # O500mg → 0500mg
    ]

    for pattern, replacement in substitutions:
        text = re.sub(pattern, replacement, text)

    return text

def image_to_text(img_detection_results, verbose=True):
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

    for img_data in img_detection_results:
        attribute = img_data["label_attribute"].lower()

        if attribute in medicine_label_data:
            confidence = img_data.get("confidence", 0.0)
            bounding_box = img_data.get("bounding_box", None)
            raw_crop_img = img_data["cropped_img_obj"]
            processed_img = preprocess_for_ocr(raw_crop_img)

            tesseract_text, best_angle = get_best_text_from_rotations(processed_img, verbose=verbose)

            cleaned_text = clean_text(tesseract_text)
            corrected_text = correct_common_ocr_mistakes(cleaned_text)

            if corrected_text:
                previous_entry = medicine_label_data[attribute]
                should_set = (
                    previous_entry is None or
                    confidence > previous_entry["confidence"]
                )

                if should_set:
                    medicine_label_data[attribute] = {
                        "text": corrected_text,
                        "confidence": confidence,
                        "bounding_box": bounding_box,
                        "angle": best_angle
                    }
                    if verbose:
                        print(f"✅ Set {attribute} = '{corrected_text}' (conf={confidence:.2f}, angle={best_angle})")

    if verbose:
        print("\n📦 Final extracted label data:")
        for key, value in medicine_label_data.items():
            print(f" - {key}: {value}")

    return medicine_label_data
