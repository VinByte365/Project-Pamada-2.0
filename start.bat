@echo off
echo Starting Backend and Mobile App...

start "FastAPI Backend" cmd /k "cd backend && .\.venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"
start "Mobile App" cmd /k "cd frontend && npx expo start"