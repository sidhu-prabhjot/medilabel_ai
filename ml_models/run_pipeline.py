from object_detection import run_ocr
from image_to_text import image_to_text
from model_training.qa_chat_test import test_qa_chat

img_path = input("Enter path to a medical label image: ")

img_detection_results = run_ocr(img_path)
medicine_label_dict = image_to_text(img_detection_results)

# Build dynamic prompt
prompt_parts = []

if medicine_label_dict.get("medicine_name") and medicine_label_dict["medicine_name"].get("text"):
    prompt_parts.append(f"The medicine is called **{medicine_label_dict['medicine_name']['text']}**.")

if medicine_label_dict.get("composition") and medicine_label_dict["composition"].get("text"):
    prompt_parts.append(f"It contains the following active ingredients: {medicine_label_dict['composition']['text']}.")

if medicine_label_dict.get("uses") and medicine_label_dict["uses"].get("text"):
    prompt_parts.append(f"It is typically used for: {medicine_label_dict['uses']['text']}.")

if medicine_label_dict.get("dosage_amount") and medicine_label_dict["dosage_amount"].get("text"):
    prompt_parts.append(f"The recommended dosage amount is: {medicine_label_dict['dosage_amount']['text']}.")

if medicine_label_dict.get("dosage_form") and medicine_label_dict["dosage_form"].get("text"):
    prompt_parts.append(f"It comes in the form of: {medicine_label_dict['dosage_form']['text']}.")

if medicine_label_dict.get("quantity") and medicine_label_dict["quantity"].get("text"):
    prompt_parts.append(f"The quantity provided is: {medicine_label_dict['quantity']['text']}.")

context = " ".join(prompt_parts)

prompt = f"This is the context of the medicine: {context} Please summarize in plain English and in a casual tone: what is this medicine used for?"

test_qa_chat(prompt)



