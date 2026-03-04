# 🧠 MediLabel AI

### AI-Powered Health Intelligence Platform

MediLabel AI is a full-stack AI web application that transforms medication labels into structured insights and combines them with supplement and workout tracking in a unified health dashboard.

It demonstrates production-style architecture, ML integration, and scalable full-stack system design.

---

## 🚀 What It Does

- 📸 Extracts drug information from uploaded medication labels using OCR + NLP
- 💊 Tracks supplement intake and dosage over time
- 🏋️ Logs workouts with structured performance tracking
- 📊 Aggregates everything into a unified analytics dashboard

---

## 🏗 System Architecture

High-level flow:

User → Next.js Frontend → FastAPI Backend → ML Inference Pipeline → PostgreSQL Database

The backend handles:

- Image upload processing
- Transformer-based OCR & NER inference
- Structured data extraction
- Persistent storage
- External API enrichment

---

## ✨ Core Features

### 🧾 AI Medication Scanner

- Image-based medication label parsing
- Transformer-based OCR
- Drug name & dosage extraction
- Usage summarization
- Scan history storage

### 💊 Supplement Tracking

- Daily supplement logging
- Dosage & frequency tracking
- Historical trend storage

### 🏋️ Workout Tracking

- Exercise logging (sets, reps, weight)
- Workout history persistence
- Performance tracking over time
- Workout planning

### 📊 Health Dashboard

- Unified medication + supplement + workout view
- Aggregated historical data
- Structured backend-driven analytics

---

## 🛠 Tech Stack

### Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS

### Backend

- FastAPI
- Python
- PostgreSQL (Supabase)

### Machine Learning

- Hugging Face Transformers
- OCR + Named Entity Recognition
- Text summarization pipeline

### Infrastructure

- Docker
- REST API architecture
- Modular monorepo structure

---

## 🧩 Database Design

Core relational entities:

- Users
- Medication Scans
- Supplements
- Workouts
- Workout Sets

> 📌 Insert ER diagram image here

The schema supports:

- User data isolation
- Historical tracking
- Expandable analytics
- Future AI-driven recommendations

---

## 📈 Engineering Highlights

- Modular monorepo structure (frontend + backend separation)
- Clean RESTful API design
- AI inference pipeline integrated inside backend service
- Structured relational data modeling
- Designed for future cloud deployment (AWS ECS, API-Gateway, SQS, Lambda)

---

## 🔮 Future Enhancements

- Authentication system
- Cloud deployment
- Vector search for medication similarity
- AI-generated health insights
- Supplement interaction warnings
- Performance analytics visualization

---

## 👨‍💻 Author

Prabhjot Sidhu  
BComp Honours Computer Science – University of Guelph  
Full-Stack & AI-Focused Engineer
