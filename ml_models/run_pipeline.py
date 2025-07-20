from object_detection import run_ocr
from image_to_text import image_to_text
from model_training.qa_chat_test import test_qa_chat

img_path = input("Enter path to a medical label image: ")

img_detection_results = run_ocr(img_path)
image_to_text_results = image_to_text(img_detection_results)

# Convert list to dict keyed by label
results_dict = {item["label"]: item for item in image_to_text_results if "label" in item}

# Safely extract fields
dosage_amount = results_dict.get("dosage_amount", {}).get("text", "")
medicine_name = results_dict.get("medicine_name", {}).get("text", "")
composition = results_dict.get("composition", {}).get("text", "")
dosage_form = results_dict.get("dosage_form", {}).get("text", "")
quantity = results_dict.get("quantity", {}).get("text", "")
uses = results_dict.get("uses", {}).get("text", "")

# Build dynamic prompt
prompt_parts = []

if medicine_name:
    prompt_parts.append(f"The medicine is called **{medicine_name}**.")
if composition:
    prompt_parts.append(f"It contains the following active ingredients: {composition}.")
if uses:
    prompt_parts.append(f"It is typically used for: {uses}.")
if dosage_amount:
    prompt_parts.append(f"The recommended dosage amount is: {dosage_amount}.")
if dosage_form:
    prompt_parts.append(f"It comes in the form of: {dosage_form}.")
if quantity:
    prompt_parts.append(f"The quantity provided is: {quantity}.")

context = " ".join(prompt_parts)

prompt = f"{context} Please summarize in plain English: what is this medicine used for, and how should it be taken?"

test_qa_chat(prompt)



