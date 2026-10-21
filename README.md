# InterviewAI

InterviewAI is a full-stack interview-practice app. Choose guided mock interviews with per-answer feedback or a one-on-one AI chat interviewer with follow-up questions and a full-session review. Enter any job title: question generation is tailored to that role and can cover IT, banking, government/public service exams, healthcare, education, sales, operations, engineering, and other professions. Chat transcripts are saved to the backend database and can be resumed or revisited from **AI Chats**.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- Python 3.11+

## Run locally

Open **two PowerShell terminals**. Paste the first block into Terminal 1 from any folder; it creates the backend environment if needed, installs its dependencies, then starts the API. It does not rely on PowerShell script activation being enabled:

```powershell
$repo = "C:\Vijay docs\works\ai-interview-coach"
Set-Location $repo
if (-not (Test-Path ".\backend\.venv\Scripts\python.exe")) {
    py -3 -m venv ".\backend\.venv"
}
& ".\backend\.venv\Scripts\python.exe" -m pip install -r ".\backend\requirements.txt"
if ($LASTEXITCODE -ne 0) { throw "Backend dependency installation failed." }
Set-Location ".\backend"
& ".\.venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Paste the second block into Terminal 2. It installs the locked frontend dependencies and starts Vite:

```powershell
$repo = "C:\Vijay docs\works\ai-interview-coach"
Set-Location "$repo\frontend"
npm ci
if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Keep both terminals open while using the app; press **Ctrl+C** in each terminal to stop its server. Vite proxies `/api` requests to the backend on port 8000.

The backend works without an AI key using built-in interview questions, conversational replies, and local estimated scoring. To enable AI-generated questions, conversational follow-ups, fact-aware answer evaluation, and detailed interview reviews, set `OPENAI_API_KEY` in `backend/.env` using `backend/.env.example` as a template. Never commit the `.env` file. Without a key, scores use relevance and answer-detail heuristics only, cannot verify professional facts, and are capped at 8/10 to avoid implying a fact-check.

Guided practice and chat reviews use a calibrated 1-10 rubric for relevance, accuracy, reasoning, and evidence. AI scoring uses the role, seniority, job description, question, and answer; feedback calls out answer-specific strengths and corrections. Chat interviews start in text mode. Answers are checked against the current question; off-topic or too-short answers are not saved and the interviewer asks you to try the same question again. With `OPENAI_API_KEY`, the AI also checks role relevance and factual correctness for knowledge questions. Without a key, local fallback scores are estimates based on relevance and answer detail, not fact-checks. Optional voice mode speaks the interviewer questions and listens for your answer, then speaks the next response and listens again. It offers a gentle male/female voice preference using the voices available in your browser; exact voice choices depend on your operating system and browser. Microphone support may require permission. Text chat remains available if voice input is unsupported or denied. AI-generated role questions and dynamic follow-ups require `OPENAI_API_KEY`; role-aware, varied question banks provide a fallback without it. By default, interview data is stored in `backend/interview.db`; set `DATABASE_URL` to use another supported database.

For a split-origin deployment, set `VITE_API_URL` to the backend API URL ending in `/api`, and set `FRONTEND_ORIGINS` on the backend to a comma-separated list of allowed frontend origins. Local development uses the Vite proxy and localhost CORS defaults.

## Useful commands

```powershell
npm --prefix frontend run build
npm --prefix frontend run lint
```

The backend exposes its interactive API documentation at `http://localhost:8000/docs` and a health check at `http://localhost:8000/health`.
