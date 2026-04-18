# EduMentor — Adaptive Learning Platform

A full-stack web application for adaptive student performance analysis with AI-powered quiz generation, analytics, and an AI Mentor chatbot.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vite + React 18 + Tailwind CSS + Recharts |
| Backend | FastAPI (Python) |
| Database | MongoDB (via Motor async driver) |
| AI | Groq API (`llama-3.1-8b-instant`) |
| Auth | JWT (python-jose) + bcrypt |

## Folder Structure

```
FinalIPD4/
├── .env                        ← root environment variables
├── backend/
│   ├── main.py                 ← FastAPI app entry point
│   ├── database.py             ← MongoDB connection + settings
│   ├── models.py               ← Pydantic v2 schemas
│   ├── deps.py                 ← JWT auth dependencies
│   ├── utils.py                ← Password hash + token creation
│   ├── ai_service.py           ← Groq API integration
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py             ← /auth/register, /auth/login, /auth/me
│       ├── admin.py            ← /admin/* (overview, students, risk, assign-quiz, chat-logs)
│       ├── student.py          ← /student/dashboard, /student/analytics
│       ├── quiz.py             ← /quiz/* (get, submit)
│       └── chat.py             ← /chat/ (AI mentor)
└── frontend/
    ├── index.html
    ├── vite.config.js          ← Dev proxy to FastAPI
    ├── tailwind.config.js
    └── src/
        ├── App.jsx             ← Router with role-based protected routes
        ├── main.jsx
        ├── index.css           ← Global Tailwind + design tokens
        ├── api/client.js       ← Axios + JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   └── UIComponents.jsx
        └── pages/
            ├── LoginPage.jsx
            ├── RegisterPage.jsx
            ├── admin/
            │   ├── AdminDashboard.jsx
            │   ├── AdminOverview.jsx
            │   ├── AssignQuiz.jsx
            │   ├── StudentsPage.jsx
            │   ├── RiskAnalysis.jsx
            │   └── ChatLogsPage.jsx
            └── student/
                ├── StudentDashboard.jsx
                ├── StudentHome.jsx
                ├── MyQuizzes.jsx
                ├── AnalyticsPage.jsx
                ├── AIMentorPage.jsx
                └── QuizAttemptPage.jsx
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017`
- A Groq API Key from [console.groq.com](https://console.groq.com)

## 1. Configure Environment Variables

Edit **`c:\FinalIPD4\.env`**:

```env
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your_strong_secret_here
GROQ_API_KEY=gsk_your_groq_api_key_here
```

> ⚠️ **Replace `GROQ_API_KEY`** with your actual key from [console.groq.com](https://console.groq.com) — quiz generation and AI mentor will fail without it.

## 2. Start the Backend (FastAPI)

Open a terminal in `c:\FinalIPD4\backend`:

```bash
# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate          # Windows CMD
# OR
venv\Scripts\Activate.ps1     # PowerShell (if execution policy allows)

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --reload --port 8000
```

The backend will be live at **http://localhost:8000**  
Swagger API docs: **http://localhost:8000/docs**

## 3. Start the Frontend (Vite React)

Open a **second terminal** in `c:\FinalIPD4\frontend`:

```bash
# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

The frontend will be live at **http://localhost:5173**

## 4. First-Time Setup Flow

1. Go to **http://localhost:5173/register**
2. Create an **Admin** account (select "Admin / Teacher" role)
3. Create one or more **Student** accounts (select "Student" role)
4. Log in as **Admin** → go to **Assign Quiz**
5. Enter a subject, topic, difficulty, select students, set deadline → click **Generate & Assign Quiz**
   - Groq will automatically generate MCQ questions
6. Log in as **Student** → go to **My Quizzes** → click **Start Quiz**
7. Answer questions → Submit → view score
8. Go to **Analytics** to see subject-wise charts and AI summary
9. Use **AI Mentor** to ask academic questions

## API Endpoints Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login (returns JWT) |
| GET | `/auth/me` | Any | Current user info |
| GET | `/admin/overview` | Admin | Dashboard stats |
| GET | `/admin/students` | Admin | All students list |
| GET | `/admin/risk-students` | Admin | At-risk students |
| GET | `/admin/chat-logs` | Admin | AI chat logs |
| POST | `/admin/assign-quiz` | Admin | Generate + assign quiz via Groq |
| GET | `/student/dashboard/{id}` | Student | Dashboard data |
| GET | `/student/analytics/{id}` | Student | Analytics + risk update |
| GET | `/quiz/student/{id}` | Student | Student's assigned quizzes |
| GET | `/quiz/{quiz_id}` | Student | Single quiz details |
| POST | `/quiz/{quiz_id}/submit` | Student | Submit answers, auto-score |
| POST | `/chat/` | Student | AI Mentor chat via Groq |

## PowerShell Execution Policy (if venv won't activate)

If `venv\Scripts\Activate.ps1` fails with a security error, run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then retry activating the venv.
