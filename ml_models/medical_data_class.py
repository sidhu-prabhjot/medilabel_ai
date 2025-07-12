import json
from PIL import Image
from torch.utils.data import Dataset

class MedicalLabelCocoDataset(Dataset):
    def __init__(self, annotations_file, img_dir, processor):
        self.img_dir = img_dir
        self.processor = processor
        
        with open(annotations_file, 'r') as f:
            self.coco = json.load(f)
        
        self.images = {img['id']: img for img in self.coco['images']}
        self.annotations = self.coco['annotations']
        self.categories = {cat['id']: cat['name'] for cat in self.coco['categories']}
        
        # Group annotations by image_id for easy lookup
        self.annotations_per_image = {}
        for ann in self.annotations:
            self.annotations_per_image.setdefault(ann['image_id'], []).append(ann)

        self.image_ids = list(self.images.keys())

    def __len__(self):
        return len(self.image_ids)

    def __getitem__(self, idx):
        image_id = self.image_ids[idx]
        image_info = self.images[image_id]
        img_path = f"{self.img_dir}/{image_info['file_name']}"
        image = Image.open(img_path).convert("RGB")

        anns = self.annotations_per_image.get(image_id, [])

        # Here you decide how to prepare labels from anns for your task (e.g., OCR text, bounding boxes)
        # For now, just returning image and raw annotations
        return image, anns
