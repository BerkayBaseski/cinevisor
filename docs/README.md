# CineVisor - AI Short Film Platform

## How to Run the Project

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.10+)
3. **PostgreSQL** (running on localhost:5432)

### 1. Database Setup
Ensure PostgreSQL is running and you have a database named `cinevisor`.
Update `backend/.env` if your credentials differ from `postgres:password`.

```bash
# Initialize the database tables
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
```

### 2. Backend (FastAPI)
Run the backend server on port 8000.

```bash
cd backend
# Make sure venv is activated
uvicorn main:app --reload
```
API Documentation: http://localhost:8000/docs

### 3. Frontend (Next.js)
Run the frontend development server on port 3000.

```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:3000 in your browser.

## Project Structure
- `frontend/`: Next.js 14 App Router application
- `backend/`: FastAPI Python application
- `backend/app/models.py`: Database schema
