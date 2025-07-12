# from transformers import TrOCRProcessor, VisionEncoderDecoderModel
# import torch
# from PIL import Image
# import requests
# import os

# os.environ["HF_HOME"] = r"D:\hf_cache"

# url = 'https://www.va.gov/HEALTH/images/20150126_Prescription-Label.jpg'
# image = Image.open(requests.get(url, stream=True).raw).convert("RGB")

# processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-printed")
# model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-printed")

# pixel_values = processor(image, return_tensors="pt").pixel_values
# generated_ids = model.generate(pixel_values)

# generated_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
# print(generated_text)

from inference_sdk import InferenceHTTPClient

CLIENT = InferenceHTTPClient(
    api_url="https://detect.roboflow.com",
    api_key="VBDhflHgLu72kReVh3KR"
)

result = CLIENT.infer("https://www.va.gov/HEALTH/images/20150126_Prescription-Label.jpg", model_id="medilabel_ai/1")

print(f"result: {result}")
