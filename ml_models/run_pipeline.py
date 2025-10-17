from .object_detection import run_ocr
from .image_to_text import image_to_text
from .natural_language_processing import analyze_label
from .errors import NoDetectionsError, ConvertToTextError, GenerateResponseError
import os
from PIL import Image
from io import BytesIO

def process_medical_label(image):
    """
    Process a medical label image and return the AI-generated response.
    
    Args:
        img_path (str): Path to the medical label image.
        
    Returns:
        str: The AI-generated response based on the label analysis.
        
    Raises:
        FileNotFoundError: If the image file does not exist.
        NoDetectionsError: If OCR detects no information.
        ConvertToTextError: If conversion from image detections to text fails.
        GenerateResponseError: If the NLP model fails to generate a response.
        Exception: For other unexpected errors.
    """

    # Run OCR to detect text boxes or information from image
    img_detection_results = run_ocr(image)
    if not img_detection_results:
        raise NoDetectionsError("Unable to detect any information from the image")

    # Convert detected information to text strings
    medicine_label_dict = image_to_text(img_detection_results)
    if not medicine_label_dict:
        raise ConvertToTextError("Unable to convert text in the image to strings")

    # Analyze the text label using NLP model
    response = analyze_label(medicine_label_dict)
    if not response:
        raise GenerateResponseError("AI model was unable to generate a response")

    return response


# For testing or CLI usage, you can keep this part or remove it later
# if __name__ == "__main__":
#     import sys

#     if len(sys.argv) != 2:
#         print("Usage: python your_script.py /path/to/image.jpg")
#         sys.exit(1)

#     input_path = sys.argv[1]

#     try:
#         result = process_medical_label(input_path)
#         print("Analysis result:")
#         print(result)
#     except Exception as e:
#         print(f"Error: {e}")
