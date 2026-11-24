# VOTEX 🎙️⚡

> **Next-Generation Multilingual Speech, Voice Studio & Autonomous Translation Platform**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-votex--iljx.onrender.com-success?style=for-the-badge&logo=render)](https://votex-iljx.onrender.com/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%20%2B%20Tailwind-61DAFB?style=for-the-badge&logo=react)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python%203.11+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

🌐 **Live Application:** [https://votex-iljx.onrender.com/](https://votex-iljx.onrender.com/)  
📖 **API Documentation (Swagger UI):** [https://votex-iljx.onrender.com/docs](https://votex-iljx.onrender.com/docs)

---

## 🌟 Overview

**VOTEX** is an enterprise-grade multilingual translation and voice intelligence suite engineered to eliminate linguistic barriers across **70+ global languages** and **22 official Indian scheduled languages** (Hindi, Kannada, Gujarati, Tamil, Telugu, Marathi, Bengali, Punjabi, Malayalam, Urdu, Odia, Assamese, Sanskrit, Nepali, and more).

Unlike static translators that only swap text in a box, VOTEX is an **autonomous multimodal platform** equipped with:
- **Speech Synthesis (TTS) Engine**: High-fidelity regional audio streaming and MP3 synthesis for Indian languages with instant browser playback.
- **Voice Intelligence Studio**: Microphone recording with browser audio visualizers, background noise reduction (spectral gating FFT), and side-by-side comparison.
- **Autonomous Document Agent**: Ingests files (`.txt`, `.pdf`, `.docx`, etc.), processes custom user directives (formal legal tone, clause preservation, colloquial), and streams translated files.
- **Saved Phrasebook & Terminology Memory**: Instant client-side persistence for glossary terms and translation history with zero data leakage.
- **Production-Ready Architecture**: Self-contained single-container deployment serving both the FastAPI backend and optimized React SPA on Render with zero external storage requirements.

---

## 🚀 Key Features

### 1. 🌐 Neural Text Translation
- Fast, accurate multi-language translation supporting auto-detection across 70+ languages.
- High-priority focus on Indian languages with native scripts (Devanagari, Kannada, Gujarati, Tamil, Telugu, Gurmukhi, Bengali, Malayalam, Nastaliq).
- Formal/Casual tone shifts, terminology override glossary, and copy/share capabilities.

### 2. 🔊 Indian Regional Speech Synthesis (TTS)
- Dedicated audio streaming endpoint (`GET /api/v1/studio/tts?text=...&lang=...`) delivering authentic native accents and cadence.
- Supported regional Indian synthesis:
  - **Hindi (`hi`)**, **Kannada (`kn`)**, **Gujarati (`gu`)**, **Tamil (`ta`)**, **Telugu (`te`)**, **Marathi (`mr`)**, **Bengali (`bn`)**, **Punjabi (`pa`)**, **Malayalam (`ml`)**, **Urdu (`ur`)**, **Nepali (`ne`)**, **Assamese (`as`)**, and **English (`en`)**.
- Built-in MP3 generation and one-click audio download.

### 3. 🎙️ Voice Studio & Noise Cancellation
- Speak directly into your microphone with live visual amplitude meters.
- Spectral gating noise reduction filters out ambient room rumble, fan noise, and background static hiss without degrading speech clarity.
- Direct speech-to-speech cross-lingual translation workflows.

### 4. 📄 Agentic Document Translation
- Drag-and-drop document upload for real user files.
- Directive-driven execution: guide the translation agent with natural instructions (e.g., *"Translate legal contract into formal Kannada, preserving clause numbering and section headers"*).
- Instant export and download of translated files.

### 5. 🔒 Client-Side Privacy & Zero Commercial Key Lock-In
- No mandatory OpenAI, Google Cloud, or Azure paid API keys required.
- User translation history and saved phrasebook are stored securely in browser `localStorage`, ensuring complete tenant privacy and zero server-side credential persistence.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VOTEX SYSTEM ARCHITECTURE                       │
└────────────────────────────────────────────────────────────────────────┘

  Client Browser (React 18 + TypeScript + Tailwind CSS)
   │
   ├── Live Text Translation UI & Language Flag Pickers
   ├── Audio Studio: Microphone Recording + Waveform Meters
   ├── Document Agent: Directive Prompts & Drag-and-Drop Files
   └── Phrasebook & Glossary (Private LocalStorage Memory)
   │
   ▼ HTTPS / WSS
  FastAPI Production Server (Python 3.11+)
   ├── Static Files Mount (React Production SPA at /)
   ├── Security Headers Middleware (OWASP, Strict CSP, Permissions-Policy)
   ├── Routers:
   │   ├── /api/v1/studio/tts        ── On-demand regional speech streaming
   │   ├── /api/v1/studio/translate  ── Neural text translation engine
   │   ├── /api/v1/studio/denoise    ── Spectral noise reduction filter
   │   └── /health                   ── Liveness & Readiness probe
   └── Audio Engine & Bodhan Agent Orchestrator
```

---

## 📁 Repository Structure

```text
VOTEX/
├── src/                               # Python Backend Engine & Agent
│   ├── bodhan_agent/                  # Autonomous task execution loop & planner
│   ├── bodhan_core/                   # Language definitions, normalization & cost tracking
│   ├── bodhan_mcp/                    # Agent tools (transcribe, translate, denoise, synthesize)
│   └── votex_api/                     # FastAPI Application
│       ├── routers/studio.py          # Voice Studio & TTS streaming routes
│       ├── services/audio_engine.py   # Multi-engine translation & audio synthesis
│       ├── middleware/                # Security headers, CSP & body limits
│       └── main.py                    # Server entry point & SPA mount
├── frontend/                          # Modern React 18 SPA
│   ├── src/
│   │   ├── App.tsx                    # Main VOTEX application interface
│   │   ├── lib/api.ts                 # Type-safe API client
│   │   └── index.css                  # Tailwind styles & typography
│   ├── index.html                     # HTML entry point with regional fonts
│   ├── package.json                   # Frontend dependencies
│   └── vite.config.ts                 # Vite bundler configuration
├── tests/                             # Automated test suite (unit & integration)
├── build.sh                           # Production build script (Vite + Python)
├── render.yaml                        # 1-Click Render cloud deployment blueprint
├── requirements.txt                   # Production Python package manifest
└── README.md
```

---

## ⚡ Quickstart & Local Setup

### Prerequisites
- **Python**: 3.11+
- **Node.js**: 18+ (Node 20+ recommended)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Rahulbharvadiya/VOTEX.git
cd VOTEX
```

### 2. Backend Setup
```bash
# Windows PowerShell
$env:PYTHONPATH="src"
python -m pip install -r requirements.txt
python -m uvicorn votex_api.main:app --host 127.0.0.1 --port 8000 --reload

# Linux / macOS
export PYTHONPATH="src"
pip install -r requirements.txt
python -m uvicorn votex_api.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🌐 Deploy to Render (1-Click)

VOTEX is packaged with a native [`render.yaml`](./render.yaml) specification for unified deployment:

1. Fork or push this repository to your GitHub account.
2. In [Render Dashboard](https://dashboard.render.com/), click **New** ➔ **Blueprint**.
3. Select your repository. Render reads `render.yaml`, executes `build.sh` (builds the React frontend and installs Python wheels), and boots the FastAPI server:
   ```bash
   uvicorn votex_api.main:app --host 0.0.0.0 --port $PORT
   ```
4. Your application will be live instantly with zero manual cloud storage setup required!

---

## 🛡️ Security & Privacy

- **OWASP Compliant Security Headers**: Emits strict `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and `Referrer-Policy: strict-origin-when-cross-origin`.
- **Content Security Policy (CSP)**: Secure policy allowing verified CDNs (`flagcdn.com`, Google Fonts) while guarding against cross-site scripting (XSS).
- **Sanitized Audio I/O**: File uploads validate magic MIME bytes and cap sizes to prevent memory flooding.
- **Tenant Isolation**: Terminology memories and history remain strictly client-side on the user's device.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
