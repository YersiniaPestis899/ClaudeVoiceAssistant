@echo off
start cmd /k "cd backend && conda activate voice-assistant-env && uvicorn main:app --reload"
start cmd /k "cd frontend && npm start"