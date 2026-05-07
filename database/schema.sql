-- ============================================================
-- LearnAvo — Intelligent Attendance Integrity System
-- Database Schema (PostgreSQL 16+)
-- ============================================================

-- Custom enums
CREATE TYPE user_role AS ENUM ('student', 'professor', 'hod');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('verified', 'rejected', 'flagged', 'pending');
CREATE TYPE flag_type AS ENUM (
    'duplicate_device',
    'token_reuse',
    'cluster_sync',
    'weak_presence',
    'chronic_proxy',
    'trajectory_warning',
    'class_anomaly'
);
CREATE TYPE beacon_status AS ENUM ('active', 'inactive', 'needs_calibration');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(120) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    department      VARCHAR(100),
    student_id      VARCHAR(30) UNIQUE,        -- enrollment number (students only)
    device_id       VARCHAR(255),              -- primary registered device fingerprint
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department);

-- ============================================================
-- CLASSROOMS
-- ============================================================
CREATE TABLE classrooms (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    building        VARCHAR(100),
    room_number     VARCHAR(20),
    capacity        INTEGER DEFAULT 60,
    floor           INTEGER,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BEACONS
-- ============================================================
CREATE TABLE beacons (
    id              SERIAL PRIMARY KEY,
    classroom_id    INTEGER REFERENCES classrooms(id) ON DELETE CASCADE,
    mac_address     VARCHAR(17) UNIQUE NOT NULL,   -- e.g., AA:BB:CC:DD:EE:FF
    uuid            VARCHAR(36) NOT NULL,
    tx_power        INTEGER DEFAULT -59,           -- calibrated tx power in dBm
    rssi_threshold  INTEGER DEFAULT -75,           -- min acceptable RSSI
    status          beacon_status DEFAULT 'active',
    last_calibrated TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beacons_classroom ON beacons(classroom_id);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    professor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    department      VARCHAR(100),
    semester        VARCHAR(20),
    year            INTEGER DEFAULT 2026,
    credits         INTEGER DEFAULT 3,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_professor ON courses(professor_id);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- ============================================================
-- SESSIONS (one per class period)
-- ============================================================
CREATE TABLE sessions (
    id              SERIAL PRIMARY KEY,
    course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    classroom_id    INTEGER REFERENCES classrooms(id) ON DELETE SET NULL,
    professor_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    qr_secret       VARCHAR(128) NOT NULL,         -- per-session HMAC secret
    status          session_status DEFAULT 'active',
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    total_enrolled  INTEGER DEFAULT 0,
    total_verified  INTEGER DEFAULT 0,
    total_flagged   INTEGER DEFAULT 0,
    total_rejected  INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_course ON sessions(course_id);
CREATE INDEX idx_sessions_professor ON sessions(professor_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);

-- ============================================================
-- QR TOKENS (track used tokens for reuse detection)
-- ============================================================
CREATE TABLE qr_tokens (
    id              SERIAL PRIMARY KEY,
    session_id      INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    token_hash      VARCHAR(64) UNIQUE NOT NULL,
    nonce           VARCHAR(32) NOT NULL,
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    used_at         TIMESTAMPTZ,
    used_by         INTEGER REFERENCES users(id),
    is_expired      BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_qr_tokens_session ON qr_tokens(session_id);
CREATE INDEX idx_qr_tokens_hash ON qr_tokens(token_hash);

-- ============================================================
-- ATTENDANCE RECORDS
-- ============================================================
CREATE TABLE attendance_records (
    id                  SERIAL PRIMARY KEY,
    session_id          INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    student_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    qr_token_hash       VARCHAR(64),
    rssi_median         REAL,                     -- median of 10 BLE readings
    rssi_readings       JSONB,                    -- raw array of RSSI values
    device_fingerprint  VARCHAR(255),
    qr_verified         BOOLEAN DEFAULT FALSE,
    ble_verified        BOOLEAN DEFAULT FALSE,
    status              attendance_status DEFAULT 'pending',
    scan_attempts       INTEGER DEFAULT 1,
    scanned_at          TIMESTAMPTZ DEFAULT NOW(),
    verified_at         TIMESTAMPTZ,
    UNIQUE(session_id, student_id)
);

CREATE INDEX idx_attendance_session ON attendance_records(session_id);
CREATE INDEX idx_attendance_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_status ON attendance_records(status);
CREATE INDEX idx_attendance_scanned ON attendance_records(scanned_at);

-- ============================================================
-- ANOMALY FLAGS
-- ============================================================
CREATE TABLE anomaly_flags (
    id              SERIAL PRIMARY KEY,
    attendance_id   INTEGER REFERENCES attendance_records(id) ON DELETE CASCADE,
    session_id      INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    student_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    flag_type       flag_type NOT NULL,
    severity        REAL DEFAULT 0.5 CHECK (severity >= 0 AND severity <= 1),
    details         JSONB DEFAULT '{}',
    resolved        BOOLEAN DEFAULT FALSE,
    resolved_by     INTEGER REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anomaly_session ON anomaly_flags(session_id);
CREATE INDEX idx_anomaly_student ON anomaly_flags(student_id);
CREATE INDEX idx_anomaly_type ON anomaly_flags(flag_type);
CREATE INDEX idx_anomaly_resolved ON anomaly_flags(resolved);

-- ============================================================
-- RISK SCORES (per-student, per-session)
-- ============================================================
CREATE TABLE risk_scores (
    id              SERIAL PRIMARY KEY,
    student_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id       INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    session_id      INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    score           REAL DEFAULT 0.0 CHECK (score >= 0 AND score <= 1),
    factors         JSONB DEFAULT '{}',
    -- factors: { rssi_consistency, scan_timing, attempt_count, historical_flags, cluster_score }
    calculated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_student ON risk_scores(student_id);
CREATE INDEX idx_risk_course ON risk_scores(course_id);
CREATE INDEX idx_risk_score ON risk_scores(score DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    message         TEXT,
    type            VARCHAR(50) DEFAULT 'info',  -- info, warning, critical
    read            BOOLEAN DEFAULT FALSE,
    link            VARCHAR(500),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- STUDENT SCHEDULES (weekly timetable per student)
-- ============================================================
CREATE TABLE student_schedules (
    id               SERIAL PRIMARY KEY,
    student_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id        INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    classroom_id     INTEGER REFERENCES classrooms(id),
    staff_id         INTEGER REFERENCES users(id),
    subject_name     VARCHAR(200) NOT NULL,
    day_of_week      INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    class_start_time TIME NOT NULL,
    class_end_time   TIME NOT NULL,
    semester         VARCHAR(20) DEFAULT 'Fall',
    is_active        BOOLEAN DEFAULT TRUE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schedule_student ON student_schedules(student_id);
CREATE INDEX idx_schedule_day ON student_schedules(day_of_week);
CREATE INDEX idx_schedule_course ON student_schedules(course_id);

-- ============================================================
-- MARKING TOKENS (one-time HMAC tokens — anti-replay)
-- ============================================================
CREATE TABLE marking_tokens (
    id                  SERIAL PRIMARY KEY,
    student_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id          INTEGER REFERENCES sessions(id),
    course_id           INTEGER REFERENCES courses(id),
    token               VARCHAR(64) NOT NULL,
    qr_payload          TEXT NOT NULL,
    rssi_at_generation  REAL,
    device_fingerprint  VARCHAR(255),
    used                BOOLEAN DEFAULT FALSE,
    used_at             TIMESTAMPTZ,
    valid_until         TIMESTAMPTZ NOT NULL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marking_token ON marking_tokens(token);
CREATE INDEX idx_marking_student ON marking_tokens(student_id);
CREATE INDEX idx_marking_valid ON marking_tokens(valid_until);
