# Developer Guide

## Prerequisites

- Python virtual environment set up inside the `backend/` directory
- Node.js installed

---

## Backend Setup

### 1. Activate the Virtual Environment

From the **project root**, activate your venv:

```bash
.\backend\<venv-name>\Scripts\activate
```

**Example:**

```bash
.\backend\medical-ai-venv\Scripts\activate
```

### 2. Start the Backend API

With the venv active, run the following from the **project root**:

```bash
uvicorn backend.api.main:app --reload
```

The API will be available locally with hot-reloading enabled.

### 3. Authorize via Swagger UI (Dev Only)

To authenticate for a session during local development:

1. Look up the user's `auth_provider_user_id` in the `users` table
2. Open the Swagger UI (typically at `http://localhost:8000/docs`)
3. Click the **Authorize** button
4. Enter the user ID

You are now authorized for that session.

---

## Frontend Setup

### Start the React App

Navigate to the app directory inside `frontend/medilabel-ai` and start the dev server:

```bash
cd frontend/medilabel-ai
npm run dev
```
