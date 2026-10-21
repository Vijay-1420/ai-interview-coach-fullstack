# InterviewAI

InterviewAI is a full-stack interview-practice app. Choose guided mock interviews with per-answer feedback or a one-on-one AI chat interviewer with follow-up questions and a full-session review. Questions are tailored to the job title and can cover technology, banking, government/public service exams, healthcare, education, sales, operations, engineering, and other professions.

## Features

- Guided interviews with answer-by-answer feedback and session analytics
- AI chat interviews with follow-up questions, answer validation, saved history, and session reviews
- Role-aware question generation, with built-in question banks when no AI provider key is configured
- Optional browser speech input and output for voice interviews
- Local SQLite storage by default

## Requirements

- Git
- Node.js 20.19+ (or 22.12+) and npm
- Python 3.11+

## Run locally on Windows

Clone this public repository:

```powershell
git clone https://github.com/Vijay-1420/ai-interview-coach-fullstack.git
Set-Location ai-interview-coach-fullstack
```

Open **two PowerShell terminals** in the cloned project folder.

In Terminal 1, install and start the backend:

```powershell
py -3 -m venv backend\.venv
& .\backend\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }
Set-Location .\backend
& .\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In Terminal 2, install and start the frontend:

```powershell
Set-Location .\frontend
npm ci
if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173>. Keep both terminals open while using the app. Press **Ctrl+C** in each terminal to stop its server. The Vite development server proxies `/api` requests to the backend on port 8000.

## AI configuration

The app works without an API key using built-in interview questions, conversational replies, and local estimated scoring. For AI-generated questions, conversational follow-ups, and more detailed answer evaluation, create `backend/.env` from the example:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Replace the placeholder with your own `OPENAI_API_KEY` in `backend/.env`, then start or restart the backend. Never commit or share this file. AI requests send interview questions and answers to the configured provider; avoid entering sensitive personal or confidential information.

Without an AI key, scores are estimates based on relevance and answer detail. They cannot verify professional facts and are capped at 8/10. Optional voice mode uses the voices and speech recognition supported by the current browser and operating system; microphone permission may be required.

## Data and deployment

By default, interview data is stored in `backend/interview.db` on the machine running the backend. Configure `DATABASE_URL` in the backend environment to use another supported database. This project does not provide authentication or user isolation, so do not expose a local or self-hosted instance to the public internet with real user data without adding appropriate security controls.

For a split-origin deployment, set `VITE_API_URL` to the backend API URL ending in `/api`, and set `FRONTEND_ORIGINS` on the backend to a comma-separated list of allowed frontend origins. Local development uses the Vite proxy and localhost CORS defaults.

The backend API documentation is available at <http://127.0.0.1:8000/docs>, and its health check is at <http://127.0.0.1:8000/health>.

## Useful commands

Run from the project root:

```powershell
npm --prefix frontend run build
npm --prefix frontend run lint
```
