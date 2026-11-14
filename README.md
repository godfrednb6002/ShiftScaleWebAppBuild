# ShiftScale Web App

Monorepo containing React frontend and FastAPI backend.

## Project Structure

```
├── Backend/
│   ├── .venv/                # Python virtual environment (ignored by Git)
│   ├── .env                  # Environment secrets (ignored by Git)
│   ├── .env.example          # Example environment variables
│   ├── requirements.txt      # Python dependencies
│   ├── main.py               # FastAPI / Uvicorn entry point
│   └── app/
│       ├── api/              # API router and endpoint modules
│       └── core/             # Application configuration
├── Frontend/
│   ├── node_modules/         # Node dependencies (ignored by Git)
│   ├── .env                  # Frontend environment variables (ignored by Git)
│   ├── .env.example          # Example frontend environment variables
│   ├── package.json          # Node dependencies & scripts
│   └── src/                  # React source code
└── .gitignore                # Root gitignore protecting secrets & dependencies
```

## Getting Started

### 1. Backend (FastAPI)

1. Navigate to `Backend`:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment, then install dependencies:
   ```bash
   # Windows PowerShell
   py -m venv .venv
   .venv\Scripts\Activate.ps1
   py -m pip install -r requirements.txt
   ```
3. Configure environment and start the server:
   ```powershell
   Copy-Item .env.example .env
   py -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```
   Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend (React + Vite)

1. Navigate to `Frontend`:
   ```bash
   cd Frontend
   ```
2. Install dependencies (already set up, or run `npm install` on a fresh clone).
3. Configure environment:
   - Copy `.env.example` to `.env` if needed.
4. Start development server:
   ```bash
   npm run dev
   ```
