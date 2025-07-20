from transformers import AutoModelForCausalLM, BitsAndBytesConfig, AutoTokenizer, pipeline
import torch

# === CONFIGURATION ===
MODEL_PATH = "D:\code\medilabel_ai\ml_models\model_training\qa_chat_qlora"


def test_qa_chat(prompt):
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
    pipe = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        torch_dtype=torch.float16,
        device_map="auto"
    )

    # === GENERATE RESPONSE ===
    print("💬 Generating response...\n")
    outputs = pipe(
        prompt,
        max_new_tokens=1000,
        do_sample=True,
        temperature=0.7,
        top_k=50,
        top_p=0.95,
        eos_token_id=tokenizer.eos_token_id,
    )

    # === OUTPUT ===
    print("🧾 Response:\n")
    print(outputs)
    response_text = outputs[0]["generated_text"]
    print(response_text.replace(prompt, "").strip())
