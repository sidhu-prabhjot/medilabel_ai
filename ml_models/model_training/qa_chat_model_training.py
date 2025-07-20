import torch
from trl import SFTTrainer, SFTConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
)
import os
import logging
import gc
import json
from typing import List, Dict, Any

print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0))

# Setup logging and memory
logging.basicConfig(level=logging.INFO)
torch.cuda.empty_cache()
gc.collect()

# Setup cache/temp directories
os.environ['HF_HOME'] = 'D:/hf_cache'
os.environ['TRANSFORMERS_CACHE'] = 'D:/hf_cache/transformers'
os.environ['HF_HUB_CACHE'] = 'D:/hf_cache/hub'
os.environ['TMPDIR'] = 'D:/temp'

# Load model with 4-bit quantization
model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)

base_model = AutoModelForCausalLM.from_pretrained(
    model_name,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
    torch_dtype=torch.float16
)

# CRITICAL: Prepare model for k-bit training BEFORE applying LoRA
base_model = prepare_model_for_kbit_training(base_model)

# Tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token
tokenizer.padding_side = "right"

# LoRA config
print([name for name, _ in base_model.named_modules() if "q_proj" in name])
lora_config = LoraConfig(
    task_type="CAUSAL_LM",
    r=64,
    lora_alpha=16,
    lora_dropout=0.1,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    bias="none",
    inference_mode=False,
)

base_model = get_peft_model(base_model, lora_config)

# CRITICAL: Enable training mode and ensure gradients are enabled
base_model.train()

# Verify that LoRA parameters require gradients
for name, param in base_model.named_parameters():
    if param.requires_grad:
        print(f"Trainable parameter: {name}, dtype: {param.dtype}")

base_model.print_trainable_parameters()

# Your existing data processing functions remain the same...
def extract_qa_pairs_from_drug_record(record: Dict[str, Any]) -> List[Dict[str, str]]:
    """Extract Q&A pairs from a single OpenFDA drug record."""
    qa_pairs = []
    
    # Get basic drug info
    openfda = record.get("openfda", {})
    brand_name = openfda.get("brand_name", ["Unknown"])[0] if openfda.get("brand_name") else "Unknown"
    generic_name = openfda.get("generic_name", ["Unknown"])[0] if openfda.get("generic_name") else "Unknown"
    
    # Description Q&A
    if record.get("description"):
        description = " ".join(record["description"])
        qa_pairs.append({
            "prompt": f"What is {brand_name} and what does it contain?",
            "response": f"{brand_name} ({generic_name}) is described as: {description}"
        })
    
    # Indications Q&A
    if record.get("indications_and_usage"):
        indications = " ".join(record["indications_and_usage"])
        qa_pairs.append({
            "prompt": f"What is {brand_name} used for?",
            "response": f"{brand_name} is indicated for: {indications}"
        })
    
    # Dosage Q&A
    if record.get("dosage_and_administration"):
        dosage = " ".join(record["dosage_and_administration"])
        qa_pairs.append({
            "prompt": f"How should {brand_name} be administered?",
            "response": f"Dosage and administration for {brand_name}: {dosage}"
        })
    
    # Contraindications Q&A
    if record.get("contraindications"):
        contraindications = " ".join(record["contraindications"])
        qa_pairs.append({
            "prompt": f"Who should not take {brand_name}?",
            "response": f"Contraindications for {brand_name}: {contraindications}"
        })
    
    # Warnings Q&A
    if record.get("warnings"):
        warnings = " ".join(record["warnings"])
        qa_pairs.append({
            "prompt": f"What are the warnings for {brand_name}?",
            "response": f"Important warnings for {brand_name}: {warnings}"
        })
    
    # Adverse reactions Q&A
    if record.get("adverse_reactions"):
        adverse_reactions = " ".join(record["adverse_reactions"])
        qa_pairs.append({
            "prompt": f"What are the side effects of {brand_name}?",
            "response": f"Adverse reactions for {brand_name}: {adverse_reactions}"
        })
    
    # Mechanism of action Q&A
    if record.get("mechanism_of_action"):
        mechanism = " ".join(record["mechanism_of_action"])
        qa_pairs.append({
            "prompt": f"How does {brand_name} work?",
            "response": f"Mechanism of action for {brand_name}: {mechanism}"
        })
    
    # Pharmacokinetics Q&A
    if record.get("pharmacokinetics"):
        pharmacokinetics = " ".join(record["pharmacokinetics"])
        qa_pairs.append({
            "prompt": f"What is the pharmacokinetics of {brand_name}?",
            "response": f"Pharmacokinetics of {brand_name}: {pharmacokinetics}"
        })
    
    # Drug interactions Q&A
    if record.get("drug_interactions"):
        interactions = " ".join(record["drug_interactions"])
        qa_pairs.append({
            "prompt": f"What drugs interact with {brand_name}?",
            "response": f"Drug interactions for {brand_name}: {interactions}"
        })
    
    # Pregnancy info Q&A
    if record.get("pregnancy"):
        pregnancy = " ".join(record["pregnancy"])
        qa_pairs.append({
            "prompt": f"Is {brand_name} safe during pregnancy?",
            "response": f"Pregnancy information for {brand_name}: {pregnancy}"
        })
    
    # Overdosage Q&A
    if record.get("overdosage"):
        overdosage = " ".join(record["overdosage"])
        qa_pairs.append({
            "prompt": f"What happens if someone takes too much {brand_name}?",
            "response": f"Overdosage information for {brand_name}: {overdosage}"
        })
    
    # Generic questions
    qa_pairs.append({
        "prompt": f"What is the generic name for {brand_name}?",
        "response": f"The generic name for {brand_name} is {generic_name}."
    })
    
    if openfda.get("route"):
        route = openfda["route"][0]
        qa_pairs.append({
            "prompt": f"How is {brand_name} administered?",
            "response": f"{brand_name} is administered via the {route.lower()} route."
        })
    
    return qa_pairs

def process_openfda_files(file_paths: List[str], max_records_per_file: int = 1000) -> List[Dict[str, str]]:
    """Process OpenFDA JSON files and extract Q&A pairs."""
    all_qa_pairs = []
    
    for file_path in file_paths:
        if not os.path.exists(file_path):
            print(f"⚠️  File not found: {file_path}")
            continue
            
        print(f"📁 Processing: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Handle the OpenFDA structure
            if isinstance(data, dict) and "results" in data:
                records = data["results"]
            elif isinstance(data, list):
                records = data
            else:
                print(f"⚠️  Unexpected data structure in {file_path}")
                continue
            
            # Process records (limit to avoid memory issues)
            processed_count = 0
            for record in records:
                if processed_count >= max_records_per_file:
                    break
                    
                try:
                    qa_pairs = extract_qa_pairs_from_drug_record(record)
                    all_qa_pairs.extend(qa_pairs)
                    processed_count += 1
                except Exception as e:
                    print(f"⚠️  Error processing record: {e}")
                    continue
            
            print(f"✅ Processed {processed_count} records from {file_path}")
            
        except Exception as e:
            print(f"❌ Error loading {file_path}: {e}")
            continue
    
    return all_qa_pairs

# Process OpenFDA files
file_paths = [
    f"../../datasets/drug-label-{i:04d}-of-0013.json" for i in range(1, 14)
]

print("🔄 Processing OpenFDA files...")
qa_pairs = process_openfda_files(file_paths, max_records_per_file=500)
print(f"✅ Generated {len(qa_pairs)} Q&A pairs")

# Create dataset
if not qa_pairs:
    raise ValueError("No Q&A pairs were generated. Check your data files.")

dataset = Dataset.from_list(qa_pairs)
print(f"📊 Dataset created with {len(dataset)} examples")

# Formatting function
def format_prompt(example):
    question = example.get("prompt", "").strip()
    answer = example.get("response", "").strip()
    
    # Truncate if too long
    if len(question) > 500:
        question = question[:500] + "..."
    if len(answer) > 1000:
        answer = answer[:1000] + "..."
    
    return {
        "prompt": question,
        "completion": answer
    }


# Apply formatting
formatted_dataset = dataset.map(format_prompt)

# Split dataset for training
train_dataset = formatted_dataset.train_test_split(test_size=0.1, seed=42)["train"]
print(f"📊 Training dataset size: {len(train_dataset)}")

# FIXED: Use SFTConfig instead of TrainingArguments for newer TRL versions
try:
    # Try the newer SFTConfig approach
    sft_config = SFTConfig(
        output_dir="./qa_chat_trained",
        per_device_train_batch_size=1,
        gradient_accumulation_steps=16,
        num_train_epochs=3,
        learning_rate=2e-4,
        lr_scheduler_type="cosine",
        warmup_steps=100,
        bf16=False,  # Use fp16 instead for older GPUs
        fp16=True,
        gradient_checkpointing=False,
        dataloader_pin_memory=False,
        logging_steps=10,
        save_steps=250,
        save_total_limit=3,
        report_to="none",
        remove_unused_columns=False,
        optim="adamw_torch",
        dataloader_num_workers=0,
        max_steps=1000,
        max_grad_norm=1.0,
        weight_decay=0.01,
        max_seq_length=512,  # Move this to config
        packing=False,
    )
    
    trainer = SFTTrainer(
        model=base_model,
        args=sft_config,
        train_dataset=train_dataset,
        tokenizer=tokenizer,  # Try processing_class first
    )
    print("✅ Using SFTConfig with processing_class")
    
except Exception as e:
    print(f"SFTConfig failed: {e}")
    try:
        # Fallback to older approach with TrainingArguments
        training_args = TrainingArguments(
            output_dir="./qa_chat_trained",
            per_device_train_batch_size=1,
            gradient_accumulation_steps=16,
            num_train_epochs=3,
            learning_rate=2e-4,
            lr_scheduler_type="cosine",
            warmup_steps=100,
            fp16=True,
            gradient_checkpointing=False,
            dataloader_pin_memory=False,
            logging_steps=10,
            save_steps=250,
            save_total_limit=3,
            report_to="none",
            remove_unused_columns=False,
            optim="adamw_torch",
            dataloader_num_workers=0,
            max_steps=1000,
            max_grad_norm=1.0,
            weight_decay=0.01,
        )
        
        trainer = SFTTrainer(
            model=base_model,
            args=training_args,
            train_dataset=train_dataset,
            tokenizer=tokenizer,
            packing=False,
        )
        print("✅ Using TrainingArguments with processing_class")
        
    except Exception as e2:
        print(f"processing_class failed: {e2}")
        # Final fallback - basic setup
        training_args = TrainingArguments(
            output_dir="./qa_chat_trained",
            per_device_train_batch_size=1,
            gradient_accumulation_steps=16,
            num_train_epochs=3,
            learning_rate=2e-4,
            lr_scheduler_type="cosine",
            warmup_steps=100,
            fp16=True,
            gradient_checkpointing=False,
            dataloader_pin_memory=False,
            logging_steps=10,
            save_steps=250,
            save_total_limit=3,
            report_to="none",
            remove_unused_columns=False,
            optim="adamw_torch",
            dataloader_num_workers=0,
            max_steps=1000,
            max_grad_norm=1.0,
            weight_decay=0.01,
        )
        
        # Simple trainer setup for compatibility
        trainer = SFTTrainer(
            model=base_model,
            args=training_args,
            train_dataset=train_dataset,
        )
        
        # Set tokenizer manually if needed
        trainer.tokenizer = tokenizer
        print("✅ Using basic SFTTrainer setup")

# Train
print("🚀 Starting training...")
try:
    trainer.train()
    print("✅ Training completed successfully!")
except Exception as e:
    print(f"❌ Training error: {e}")
    print("Trying with gradient checkpointing enabled...")
    
    # Enable gradient checkpointing and try again
    if hasattr(trainer.args, 'gradient_checkpointing'):
        trainer.args.gradient_checkpointing = True
    
    try:
        trainer.train()
        print("✅ Training completed with gradient checkpointing!")
    except Exception as e2:
        print(f"❌ Training failed even with gradient checkpointing: {e2}")
        print("Try reducing batch size or max_seq_length")
        raise e2

# Save
print("💾 Saving trained model...")
try:
    trainer.model.save_pretrained("./qa_chat_qlora", safe_serialization=True)
    tokenizer.save_pretrained("./qa_chat_qlora")
    print("✅ Model saved successfully!")
except Exception as e:
    print(f"❌ Error saving model: {e}")
    # Try alternative saving method
    base_model.save_pretrained("./qa_chat_qlora", safe_serialization=True)
    tokenizer.save_pretrained("./qa_chat_qlora")
    print("✅ Model saved with alternative method!")

print("🎉 Fine-tuning process completed!")