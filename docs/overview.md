# VOTEX — Autonomous Indian-Language Processing Platform

VOTEX is an enterprise-ready, autonomous Indian-language task execution platform. It wraps an agentic language workflow engine in a full-stack web application featuring a high-performance FastAPI backend, native SQLite WAL persistence, real-time Server-Sent Events (SSE) progress streaming, and a responsive React + Vite + Tailwind CSS web interface.

---

## 1. System Architecture

```text
[ Browser / Client ]
        │  ▲
        │  │  HttpOnly Cookies (JWT Access 15m + Rotated Refresh 7d + Double-Submit CSRF)
        │  │  SSE Live Progress Stream (/tasks/{id}/events)
        ▼  │
┌────────────────────────────────────────────────────────┐
│                   VOTEX FastAPI Layer                  │
│                                                        │
│  [ Middleware Chain ]                                  │
│   ├─ Request ID Generation & Logging                   │
│   ├─ OWASP Security Headers (CSP, HSTS, NoSniff, DENY) │
│   ├─ Explicit CORS Allow-list                          │
│   ├─ Rate Limiting (Sliding Window per IP/User)        │
│   ├─ Body Size Guards (64KB JSON / 105MB Multipart)    │
│   └─ Standard Error Envelope Handler                   │
│                                                        │
│  [ Services & Control Plane ]                          │
│   ├─ AuthService (Argon2id, Session Family Tracking)   │
│   ├─ FileValidator (Magic Bytes + EXIF Sanitizer)      │
│   ├─ TaskService (Idempotency + Sandboxing)            │
│   ├─ EventBroker (SSE Pub/Sub with Event-ID Replay)    │
│   └─ AgentRunner (Concurrency Semaphore Guard)        │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ SQLite Database (WAL)    │  │ Sandboxed Workspace Disk │
│                          │  │                          │
│ - users                  │  │ workspaces/              │
│ - refresh_tokens         │  │  └── <user_id>/          │
│ - tasks                  │  │       └── <task_id>/     │
│ - task_files             │  │            ├── inputs/   │
│ - task_steps             │  │            └── outputs/  │
│ - task_artifacts         │  │                 ├── rep* │
│ - idempotency_keys       │  │                 └── art* │
│ - audit_logs             │  └──────────────────────────┘
└──────────────────────────┘
```

---

## 2. Capabilities & Tools

VOTEX orchestrates multi-step Indian language automation across 22+ constitutionally recognized Indian languages and English:

| Tool Label | Underlying Capability | Pricing / Unit | Verification Built-in |
|---|---|---|---|
| **Inspect** | Audio, image, PDF, and document inspection | Free (₹0.00) | MIME & format verification |
| **Detect Language** | Script & language detection | Free (₹0.00) | Script confidence score |
| **Transcribe** | Speech-to-text with auto-chunking | ₹0.10 / min | Numeral & subtitle monotonicity check |
| **Translate** | Neural Indic translation | ₹0.20 / 10k tokens | Markdown & table preservation |
| **Speak** | Text-to-speech synthesis with WAV stitching | ₹6.00 / 10k chars | Back-transcription CER check (< 30%) |
| **OCR** | Image and multi-page scanned PDF OCR | ₹0.20 / page | Markdown table formatting |
| **Voices** | Voice and speaking style catalog | Free (₹0.00) | Language code matching |

---

## 3. Strict Budget & Safety Caps

Every task execution is governed by three non-bypassable constraints:
1. **Step Budget:** Maximum 30 tool execution steps per task.
2. **Cost Budget:** Maximum ₹20.00 INR hard cap.
3. **Execution Timeout:** Maximum 300 seconds (5 minutes) total elapsed runtime.

If any limit is hit, the agent immediately halts, saves a partial report, logs the event to `trace.jsonl`, and updates the task status to `halted_budget`.

---

## 4. API Endpoints Reference

### Authentication
* `POST /api/v1/auth/register` — Register new user account.
* `POST /api/v1/auth/login` — Sign in and receive HttpOnly session cookies.
* `POST /api/v1/auth/refresh` — Rotate refresh token with token-family reuse detection.
* `POST /api/v1/auth/logout` — Terminate session and clear cookies.
* `GET /api/v1/auth/me` — Retrieve active user profile.

### Tasks & Workflows
* `POST /api/v1/tasks` — Submit new task with optional files (`multipart/form-data`) and `Idempotency-Key`.
* `GET /api/v1/tasks` — List authenticated user's tasks with pagination and status filter.
* `GET /api/v1/tasks/{id}` — Fetch details, status, and generated markdown summary.
* `DELETE /api/v1/tasks/{id}` — Cancel/delete task and safely purge sandboxed workspace.
* `GET /api/v1/tasks/{id}/events` — Server-Sent Events (SSE) live progress stream.
* `GET /api/v1/tasks/{id}/artifacts/{artifact_id}` — Secure download of output files.

### Observability & Probes
* `GET /health` — Public liveness probe.
* `GET /ready` — Readiness probe verifying database connectivity, workspace permissions, and configuration.
