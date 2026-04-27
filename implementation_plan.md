# LearnAvo — Full-Stack Implementation Plan

> **An Intelligent Attendance Integrity System**
> Two-gate verification · Three-layer anomaly engine · Real-time dashboards

---

## Overview

Build the complete LearnAvo system as described in the abstract: a dual-factor attendance verification platform combining **HMAC-signed dynamic QR codes** and **BLE proximity sensing**, powered by a **three-layer anomaly detection engine**, with real-time dashboards for Professors and HODs.

**Tech Stack:**
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 (Vite) · React Router · Recharts · Socket.IO Client |
| Backend | Node.js · Express · Socket.IO · JWT · node-cron |
| Database | PostgreSQL 16 · pg (node-postgres) |
| Auth | JWT (access + refresh tokens) |
| QR Engine | `qrcode` npm + HMAC-SHA256 signing |

---

## Proposed Changes

### 1. Database Layer (PostgreSQL)

#### [NEW] `database/schema.sql`

Complete schema covering all entities:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users      │     │   courses     │     │  classrooms   │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │──┐  │ id (PK)      │     │ id (PK)      │
│ name         │  │  │ name         │     │ name         │
│ email        │  │  │ code         │     │ building     │
│ password_hash│  ├──│ professor_id │     │ room_number  │
│ role (enum)  │  │  │ department   │     │ capacity     │
│ department   │  │  │ semester     │     └──────┬───────┘
│ student_id   │  │  └──────┬───────┘            │
│ device_id    │  │         │                    │
└──────┬───────┘  │  ┌──────┴───────┐     ┌──────┴───────┐
       │          │  │ enrollments  │     │   beacons     │
       │          │  │──────────────│     │──────────────│
       │          │  │ student_id   │     │ id (PK)      │
       │          └──│ course_id    │     │ classroom_id │
       │             └──────────────┘     │ mac_address  │
       │                                  │ uuid         │
       │          ┌──────────────┐        │ tx_power     │
       │          │   sessions    │        │ rssi_thresh  │
       │          │──────────────│        │ status       │
       └─────────>│ professor_id │        └──────────────┘
                  │ course_id    │
                  │ classroom_id │
                  │ qr_secret    │
                  │ status       │
                  │ started_at   │
                  └──────┬───────┘
                         │
              ┌──────────┴──────────┐
              │  attendance_records  │
              │─────────────────────│
              │ session_id          │
              │ student_id          │
              │ qr_token            │
              │ rssi_median         │
              │ device_fingerprint  │
              │ qr_verified (bool)  │
              │ ble_verified (bool) │
              │ status (enum)       │
              │ scanned_at          │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │   anomaly_flags      │
              │─────────────────────│
              │ attendance_id       │
              │ flag_type (enum)    │
              │ severity            │
              │ details (JSONB)     │
              │ resolved (bool)     │
              └─────────────────────┘

              ┌─────────────────────┐
              │    risk_scores       │
              │─────────────────────│
              │ student_id          │
              │ course_id           │
              │ session_id          │
              │ score (0.0–1.0)     │
              │ factors (JSONB)     │
              └─────────────────────┘
```

**Key enums:**
- `user_role`: `student`, `professor`, `hod`
- `session_status`: `active`, `completed`, `cancelled`
- `attendance_status`: `verified`, `rejected`, `flagged`, `pending`
- `flag_type`: `duplicate_device`, `token_reuse`, `cluster_sync`, `weak_presence`, `chronic_proxy`

#### [NEW] `database/seed.sql`
Demo data: 2 professors, 1 HOD, 20 students, 3 courses, 2 classrooms, sample sessions & attendance records with realistic anomaly scenarios.

---

### 2. Backend (Node.js + Express)

#### Project Structure
```
backend/
├── server.js                    # Entry point, Express + Socket.IO setup
├── package.json
├── .env.example
├── config/
│   └── db.js                    # PostgreSQL connection pool
├── middleware/
│   ├── auth.js                  # JWT verification middleware
│   └── roleGuard.js             # Role-based access control
├── routes/
│   ├── auth.routes.js           # Login, register, refresh
│   ├── session.routes.js        # Start/end/list sessions
│   ├── qr.routes.js             # Generate & validate dynamic QR
│   ├── attendance.routes.js     # Verify attendance (dual-gate)
│   ├── anomaly.routes.js        # Flags, risk scores, patterns
│   └── dashboard.routes.js      # Stats, analytics endpoints
├── services/
│   ├── qr.service.js            # HMAC-SHA256 QR generation, 30s rotation
│   ├── ble.service.js           # RSSI validation, median calculation
│   ├── anomaly.service.js       # Three-layer anomaly engine
│   ├── risk.service.js          # Per-student risk score computation
│   └── session.service.js       # Session lifecycle management
├── websocket/
│   └── liveSession.js           # Real-time session broadcasting
└── utils/
    ├── hmac.js                  # HMAC-SHA256 helpers
    └── constants.js             # Thresholds, timeouts
```

#### Key API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | — | Login with email/password |
| `POST` | `/api/auth/register` | — | Register student/professor |
| `GET` | `/api/sessions` | Prof/HOD | List sessions |
| `POST` | `/api/sessions/start` | Prof | Start a live session |
| `POST` | `/api/sessions/:id/end` | Prof | End active session |
| `GET` | `/api/qr/:sessionId` | Prof | Get current dynamic QR (rotates 30s) |
| `POST` | `/api/attendance/verify` | Student | Submit QR token + BLE RSSI readings |
| `GET` | `/api/attendance/session/:id` | Prof/HOD | All records for a session |
| `GET` | `/api/anomaly/flags/:sessionId` | Prof/HOD | Real-time anomaly flags |
| `GET` | `/api/anomaly/risk-scores` | HOD | Cross-session risk scores |
| `GET` | `/api/dashboard/stats` | Prof/HOD | Aggregate stats |
| `GET` | `/api/dashboard/hod` | HOD | HOD-level analytics |

#### QR Engine (Core Innovation)
```
Every 30 seconds:
  1. Generate nonce
  2. payload = { sessionId, timestamp, nonce }
  3. token = HMAC-SHA256(payload, session_secret)
  4. QR = encode(payload + token)
  5. Broadcast new QR via WebSocket to professor's screen
  6. Invalidate previous token
```

#### Anomaly Engine (Three Layers)

**Layer 1 — Real-Time (on each scan):**
- Duplicate device detection (same student, 2 device IDs, < 5 min)
- Token reuse detection (QR token already consumed)
- Cluster sync alert (5+ scans in 3-second window)
- Weak presence flag (QR passes but RSSI below threshold)

**Layer 2 — Session-Level (on session end):**
- Per-student proxy risk score = weighted function of:
  - RSSI consistency (σ), scan timing deviation, attempt count, Layer 1 flags
- Beacon health prediction (RSSI variance trending)

**Layer 3 — Cross-Session (via cron job):**
- Chronic proxy detection (high attendance + high risk scores → escalate)
- Attendance trajectory prediction (approaching 75% threshold → warn)
- Class-level anomaly (slot-wise low attendance → systemic issue flag)

#### WebSocket Events
- `session:qr_update` — New QR code pushed to professor
- `session:student_verified` — Student successfully marked
- `session:anomaly_flag` — Real-time anomaly alert
- `session:stats_update` — Live count updates

---

### 3. Frontend (React + Vite)

#### Project Structure
```
frontend/
├── index.html
├── vite.config.js
├── package.json
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css                # Design system & global styles
│   ├── api/
│   │   └── client.js            # Axios instance + interceptors
│   ├── context/
│   │   └── AuthContext.jsx       # JWT auth context
│   ├── hooks/
│   │   ├── useSocket.js          # Socket.IO hook
│   │   └── useAuth.js            # Auth hook
│   ├── layouts/
│   │   └── DashboardLayout.jsx   # Sidebar + topbar shell
│   ├── pages/
│   │   ├── Login.jsx             # Auth page
│   │   ├── Dashboard.jsx         # Professor main view
│   │   ├── LiveSession.jsx       # Active session with QR display
│   │   ├── SessionHistory.jsx    # Past sessions list
│   │   ├── SessionDetail.jsx     # Single session deep-dive
│   │   ├── AnomalyCenter.jsx     # Anomaly flags & alerts
│   │   ├── HodDashboard.jsx      # HOD cross-session analytics
│   │   ├── Students.jsx          # Student roster & risk profiles
│   │   └── Settings.jsx          # Profile, beacon config
│   └── components/
│       ├── Sidebar.jsx
│       ├── TopBar.jsx
│       ├── QRDisplay.jsx         # Live rotating QR
│       ├── AttendanceFeed.jsx    # Real-time verification stream
│       ├── AnomalyCard.jsx       # Flag display card
│       ├── RiskGauge.jsx         # Risk score visualization
│       ├── StatsCard.jsx         # KPI card
│       ├── AttendanceChart.jsx   # Recharts line/bar
│       ├── StudentTable.jsx      # Searchable student table
│       ├── SessionCard.jsx       # Session summary card
│       └── BeaconStatus.jsx      # Beacon health indicator
```

#### Page Breakdown

**Login Page:**
- Clean, premium auth screen with LearnAvo branding
- Role-based redirect (professor → Dashboard, HOD → HodDashboard)

**Professor Dashboard:**
- KPI cards: Today's Sessions, Total Students, Avg Attendance %, Active Flags
- Quick action: "Start New Session" button
- Recent sessions list with status badges
- Attendance trend chart (last 30 days)

**Live Session Page (⭐ KEY PAGE):**
- Large QR code display (auto-rotates every 30s with visual countdown timer)
- Real-time attendance feed (students appearing as they verify)
- Live anomaly alerts panel (flags appear instantly)
- Session stats bar: Verified / Total / Flagged / Rejected
- Dual-gate status indicators per student (QR ✓ / BLE ✓)

**HOD Dashboard:**
- Department-wide analytics
- Chronic proxy risk leaderboard (students with consistently high risk)
- Attendance trajectory warnings (students approaching 75%)
- Class-level anomaly flags (slot-based patterns)
- Course comparison charts

**Anomaly Center:**
- Filterable anomaly flag list with severity badges
- Flag type breakdown (pie chart)
- Drill-down to specific attendance record
- Resolve/dismiss workflow

**Session Detail:**
- Full attendance roster for completed session
- Per-student risk scores with factor breakdown
- Anomaly flags timeline
- RSSI distribution chart

#### Design System
- **Color Palette**: Deep navy (#0A0E27) background, emerald green (#10B981) primary accents, amber (#F59E0B) for warnings, red (#EF4444) for critical flags
- **Typography**: Inter (Google Fonts)
- **Style**: Dark mode, glassmorphism cards, subtle glow effects
- **Animations**: QR rotation pulse, attendance feed slide-in, flag shake alerts, smooth page transitions

---

## User Review Required

> [!IMPORTANT]
> **Database choice**: The plan uses PostgreSQL as specified in the abstract. Do you have PostgreSQL installed locally, or should I include Docker setup instructions?

> [!IMPORTANT]
> **Mobile student app**: The abstract mentions Flutter PWA for student-side scanning. This plan focuses on the **web dashboard** (professor/HOD facing) + full backend API. The student verification flow will be built as API endpoints that a mobile app would call, but the frontend will include a **student simulation panel** for demo/testing. Is this acceptable?

> [!WARNING]
> **BLE beacon hardware**: Since we don't have physical ESP32 beacons, the backend will include a **BLE simulation service** that generates realistic RSSI readings for demo purposes. The real BLE integration points will be clearly documented for future hardware connection.

---

## Open Questions

1. **PostgreSQL**: Do you have it installed? If not, should I set it up or use SQLite for prototyping?
2. **Port preferences**: Any specific ports for frontend (default: 5173) and backend (default: 3000)?
3. **Demo scenario**: Should the seed data include a pre-built "jury demo moment" scenario (one gate fail → rejected, both gates pass → verified)?

---

## Verification Plan

### Automated Tests
- Start the backend server and verify all API endpoints return correct responses
- Run database migrations and verify schema creation
- Test QR generation and HMAC validation logic
- Test anomaly detection with simulated edge cases

### Browser Verification
- Navigate through all frontend pages and verify rendering
- Test the live session flow: start session → QR display → simulate student verification → see real-time feed
- Verify anomaly flags appear correctly
- Test HOD dashboard with cross-session data
- Verify responsive design and animations

### Integration Test
- Full end-to-end: Login → Start Session → Generate QR → Verify Attendance → Check Anomaly Flags → End Session → View History
