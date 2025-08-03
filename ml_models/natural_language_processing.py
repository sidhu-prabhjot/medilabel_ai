from transformers import AutoModelForCausalLM, BitsAndBytesConfig, AutoTokenizer, pipeline
import torch

# === CONFIGURATION ===
MODEL_PATH = "D:\code\medilabel_ai\ml_models\model_training\qa_chat_qlora"

def build_chat_prompt(context):
    return f"""<|system|>
You are a helpful assistant that explains medical labels in plain English.
<|user|>
Here's some information from a medicine label:

{context}

Please explain:
- What this medicine is made of
- What this medicine is used for
- How to take it safely
- Any important warnings or side effects someone should know

<|assistant|>
"""

_pipe = None

def get_pipeline():
    global _pipe
    if _pipe is None:
        # === 4-BIT QUANTIZATION ===
        quant_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
        )

        # === LOAD MERGED MODEL ===
        print("🔍 Loading merged model...")
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_PATH,
            quantization_config=quant_config,
            device_map="auto",
            torch_dtype=torch.float16
        )
        model.eval()

        # === LOAD TOKENIZER ===
        print("🧠 Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.padding_side = "right"

        # === SETUP PIPELINE ===
        print("⚙️ Setting up inference pipeline...")
        _pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            torch_dtype=torch.float16,
            device_map="auto"
        )

    return _pipe 


def generate_response(prompt):
    pipe = get_pipeline()

    # === GENERATE RESPONSE ===
    print("💬 Generating response...\n")
    outputs = pipe(
        prompt,
        max_new_tokens=500,
        do_sample=True,
        temperature=0.7,
        top_k=50,
        top_p=0.95,
        eos_token_id=pipe.tokenizer.eos_token_id,
    )

    return outputs[0]["generated_text"].replace(prompt, "").strip()

def analyze_label(medicine_label_dict):
    # Build dynamic context from extracted OCR fields
    prompt_parts = []

    if medicine_label_dict.get("medicine_name") and medicine_label_dict["medicine_name"].get("text"):
        prompt_parts.append(f"Medicine name: {medicine_label_dict['medicine_name']['text']}")
    else: prompt_parts.append("")

    if medicine_label_dict.get("composition") and medicine_label_dict["composition"].get("text"):
        prompt_parts.append(f"Active ingredients: {medicine_label_dict['composition']['text']}")
    else: prompt_parts.append("")

    if medicine_label_dict.get("uses") and medicine_label_dict["uses"].get("text"):
        prompt_parts.append(f"Uses: {medicine_label_dict['uses']['text']}")
    else: prompt_parts.append("")

    if medicine_label_dict.get("dosage_amount") and medicine_label_dict["dosage_amount"].get("text"):
        prompt_parts.append(f"Recommended dosage: {medicine_label_dict['dosage_amount']['text']}")
    else: prompt_parts.append("")

    if medicine_label_dict.get("dosage_form") and medicine_label_dict["dosage_form"].get("text"):
        prompt_parts.append(f"Form: {medicine_label_dict['dosage_form']['text']}")
    else: prompt_parts.append("")

    if medicine_label_dict.get("quantity") and medicine_label_dict["quantity"].get("text"):
        prompt_parts.append(f"Quantity: {medicine_label_dict['quantity']['text']}")
    else: prompt_parts.append("")

    context = "\n".join(prompt_parts)
    prompt = build_chat_prompt(context)
    generated_response = generate_response(prompt)
    response_dict = {
        "medicine_name": prompt_parts[0],
        "composition": prompt_parts[1],
        "uses": prompt_parts[2],
        "dosage_amount": prompt_parts[3],
        "dosage_form": prompt_parts[4],
        "quantity": prompt_parts[5],
        "generated_response": generated_response
    }

    return response_dict
