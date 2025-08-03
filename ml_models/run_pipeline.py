from object_detection import run_ocr
from image_to_text import image_to_text
from model_training.qa_chat_test import test_qa_chat

img_path = input("Enter path to a medical label image: ")

img_detection_results = run_ocr(img_path)
medicine_label_dict = image_to_text(img_detection_results)

# Build dynamic prompt
prompt_parts = []

if medicine_label_dict.get("medicine_name") and medicine_label_dict["medicine_name"].get("text"):
    prompt_parts.append(f"Medicine name: {medicine_label_dict['medicine_name']['text']}")

if medicine_label_dict.get("composition") and medicine_label_dict["composition"].get("text"):
    prompt_parts.append(f"Active ingredients: {medicine_label_dict['composition']['text']}")

if medicine_label_dict.get("uses") and medicine_label_dict["uses"].get("text"):
    prompt_parts.append(f"Uses: {medicine_label_dict['uses']['text']}")

if medicine_label_dict.get("dosage_amount") and medicine_label_dict["dosage_amount"].get("text"):
    prompt_parts.append(f"Recommended dosage: {medicine_label_dict['dosage_amount']['text']}")

if medicine_label_dict.get("dosage_form") and medicine_label_dict["dosage_form"].get("text"):
    prompt_parts.append(f"Form: {medicine_label_dict['dosage_form']['text']}")

if medicine_label_dict.get("quantity") and medicine_label_dict["quantity"].get("text"):
    prompt_parts.append(f"Quantity: {medicine_label_dict['quantity']['text']}")

context = "\n".join(prompt_parts)

# Natural, chat-friendly prompt
prompt = (
    f"Here's some information from a medicine label:\n\n{context}\n\n"
    f"Could you explain in plain, friendly language what this medicine is used for and anything else someone should know?"
)

test_qa_chat(prompt)
