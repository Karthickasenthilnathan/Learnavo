-- ============================================================
-- LearnAvo — Seed Data for Demo / Jury Presentation
-- ============================================================
-- Password for all demo accounts: "learnavo123"
-- bcrypt hash of "learnavo123"

-- USERS
INSERT INTO users (name, email, password_hash, role, department, student_id) VALUES
-- Professors
('Dr. Ananya Sharma',   'ananya@university.edu',  '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'professor', 'Computer Science', NULL),
('Dr. Rajesh Kumar',    'rajesh@university.edu',  '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'professor', 'Computer Science', NULL),
-- HOD
('Dr. Priya Menon',     'priya@university.edu',   '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'hod',       'Computer Science', NULL),
-- Students
('Arjun Patel',         'arjun@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023001'),
('Meera Reddy',         'meera@student.edu',       '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023002'),
('Vikram Singh',        'vikram@student.edu',     '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023003'),
('Deepa Nair',          'deepa@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023004'),
('Rohan Gupta',         'rohan@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023005'),
('Sneha Iyer',          'sneha@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023006'),
('Amit Joshi',          'amit@student.edu',       '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023007'),
('Kavya Pillai',        'kavya@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023008'),
('Harsh Mehta',         'harsh@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023009'),
('Priyanka Das',        'priyanka@student.edu',   '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023010'),
('Siddharth Roy',       'siddharth@student.edu',  '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023011'),
('Nandini Rao',         'nandini@student.edu',    '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023012'),
('Karthik Verma',       'karthik@student.edu',    '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023013'),
('Ayesha Khan',         'ayesha@student.edu',     '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023014'),
('Varun Mishra',        'varun@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023015'),
('Divya Saxena',        'divya@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023016'),
('Nikhil Agarwal',      'nikhil@student.edu',     '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023017'),
('Tanvi Bhatia',        'tanvi@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023018'),
('Rahul Kapoor',        'rahul@student.edu',      '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023019'),
('Ishika Tiwari',       'ishika@student.edu',     '$2b$10$xJ8kFzL9QmR4v5u6wE3yHe7zN1sK2dA0pG4hF6jL8mN0qR2tU4wX6', 'student',   'Computer Science', 'CS2023020');

-- CLASSROOMS
INSERT INTO classrooms (name, building, room_number, capacity, floor) VALUES
('CS Lab 101',   'Block A', '101', 60, 1),
('Lecture Hall B', 'Block B', '201', 120, 2),
('Seminar Room C', 'Block A', '305', 40, 3);

-- BEACONS
INSERT INTO beacons (classroom_id, mac_address, uuid, tx_power, rssi_threshold, status, last_calibrated) VALUES
(1, 'AA:BB:CC:01:01:01', 'f7826da6-4fa2-4e98-8024-bc5b71e0893e', -59, -75, 'active', NOW() - INTERVAL '5 days'),
(2, 'AA:BB:CC:02:02:02', 'f7826da6-4fa2-4e98-8024-bc5b71e0893f', -59, -75, 'active', NOW() - INTERVAL '10 days'),
(3, 'AA:BB:CC:03:03:03', 'f7826da6-4fa2-4e98-8024-bc5b71e08940', -59, -75, 'active', NOW() - INTERVAL '2 days');

-- COURSES
INSERT INTO courses (name, code, professor_id, department, semester, year, credits) VALUES
('Data Structures & Algorithms', 'CS301', 1, 'Computer Science', 'Fall', 2026, 4),
('Database Management Systems',  'CS302', 1, 'Computer Science', 'Fall', 2026, 3),
('Operating Systems',             'CS303', 2, 'Computer Science', 'Fall', 2026, 4);

-- ENROLLMENTS (all 20 students in CS301, 15 in CS302, 18 in CS303)
INSERT INTO enrollments (student_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.role = 'student' AND c.code = 'CS301';

INSERT INTO enrollments (student_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.role = 'student' AND c.code = 'CS302' AND u.id <= 18;

INSERT INTO enrollments (student_id, course_id)
SELECT u.id, c.id FROM users u, courses c
WHERE u.role = 'student' AND c.code = 'CS303' AND u.id <= 21;

-- ============================================================
-- STUDENT SCHEDULES (timetable for all 20 students)
-- ============================================================

-- Period 1: 09:00 - 10:00 — CS301 Data Structures (all 20 students)
INSERT INTO student_schedules (student_id, course_id, classroom_id, staff_id, subject_name, day_of_week, class_start_time, class_end_time)
SELECT u.id, 1, 1, 1, 'Data Structures & Algorithms', EXTRACT(DOW FROM CURRENT_DATE)::INTEGER, '09:00', '10:00'
FROM users u WHERE u.role = 'student';

-- Period 2: 10:15 - 11:15 — CS302 DBMS (first 15 students)
INSERT INTO student_schedules (student_id, course_id, classroom_id, staff_id, subject_name, day_of_week, class_start_time, class_end_time)
SELECT u.id, 2, 2, 1, 'Database Management Systems', EXTRACT(DOW FROM CURRENT_DATE)::INTEGER, '10:15', '11:15'
FROM users u WHERE u.role = 'student' AND u.id <= 18;

-- Period 3: 11:30 - 12:30 — CS303 OS (first 18 students)
INSERT INTO student_schedules (student_id, course_id, classroom_id, staff_id, subject_name, day_of_week, class_start_time, class_end_time)
SELECT u.id, 3, 3, 2, 'Operating Systems', EXTRACT(DOW FROM CURRENT_DATE)::INTEGER, '11:30', '12:30'
FROM users u WHERE u.role = 'student' AND u.id <= 21;

-- Afternoon period: 14:00 - 15:00 — CS301 Lab (all 20 students)
INSERT INTO student_schedules (student_id, course_id, classroom_id, staff_id, subject_name, day_of_week, class_start_time, class_end_time)
SELECT u.id, 1, 1, 1, 'DSA Lab', EXTRACT(DOW FROM CURRENT_DATE)::INTEGER, '14:00', '15:00'
FROM users u WHERE u.role = 'student';

-- Also add schedules for tomorrow so the app doesn't look empty
INSERT INTO student_schedules (student_id, course_id, classroom_id, staff_id, subject_name, day_of_week, class_start_time, class_end_time)
SELECT u.id, 2, 2, 1, 'Database Management Systems', ((EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1) % 7), '09:00', '10:00'
FROM users u WHERE u.role = 'student' AND u.id <= 18;

INSERT INTO student_schedules (student_id, course_id, classroom_id, staff_id, subject_name, day_of_week, class_start_time, class_end_time)
SELECT u.id, 3, 3, 2, 'Operating Systems', ((EXTRACT(DOW FROM CURRENT_DATE)::INTEGER + 1) % 7), '10:15', '11:15'
FROM users u WHERE u.role = 'student' AND u.id <= 21;

-- ============================================================
-- HISTORICAL SESSIONS (14 days of attendance data)
-- ============================================================
DO $$
DECLARE
  v_course_ids INT[] := ARRAY[1, 2, 3];
  v_classroom_ids INT[] := ARRAY[1, 2, 3];
  v_professor_ids INT[] := ARRAY[1, 1, 2];
  v_enrolled INT[] := ARRAY[20, 15, 18];
  v_day INT;
  v_course INT;
  v_session_id INT;
  v_student RECORD;
  v_verified INT;
  v_flagged INT;
  v_rejected INT;
  v_status TEXT;
  v_rssi REAL;
  v_rand REAL;
BEGIN
  -- Create 14 days × 3 courses = 42 sessions
  FOR v_day IN 1..14 LOOP
    FOR v_course IN 1..3 LOOP
      v_verified := 0;
      v_flagged := 0;
      v_rejected := 0;

      INSERT INTO sessions (course_id, classroom_id, professor_id, qr_secret, status, started_at, ended_at, total_enrolled, total_verified, total_flagged, total_rejected)
      VALUES (
        v_course_ids[v_course],
        v_classroom_ids[v_course],
        v_professor_ids[v_course],
        'qr-secret-' || v_day || '-' || v_course,
        'completed',
        NOW() - (v_day || ' days')::INTERVAL + (8 + v_course)::TEXT::INTERVAL * INTERVAL '1 hour',
        NOW() - (v_day || ' days')::INTERVAL + (9 + v_course)::TEXT::INTERVAL * INTERVAL '1 hour',
        v_enrolled[v_course],
        0, 0, 0
      ) RETURNING id INTO v_session_id;

      -- Create attendance records for each enrolled student
      FOR v_student IN
        SELECT u.id as student_id FROM users u
        JOIN enrollments e ON e.student_id = u.id AND e.course_id = v_course_ids[v_course]
        ORDER BY u.id
      LOOP
        v_rand := random();
        IF v_rand < 0.75 THEN
          v_status := 'verified';
          v_verified := v_verified + 1;
        ELSIF v_rand < 0.88 THEN
          v_status := 'flagged';
          v_flagged := v_flagged + 1;
        ELSIF v_rand < 0.95 THEN
          v_status := 'rejected';
          v_rejected := v_rejected + 1;
        ELSE
          -- Absent student — skip creating a record
          CONTINUE;
        END IF;

        v_rssi := -(45 + random() * 30)::REAL;

        INSERT INTO attendance_records (session_id, student_id, rssi_median, qr_verified, ble_verified, status, scan_attempts, scanned_at, verified_at)
        VALUES (
          v_session_id,
          v_student.student_id,
          v_rssi,
          v_status != 'rejected',
          v_status = 'verified',
          v_status::attendance_status,
          CASE WHEN v_status = 'rejected' THEN 2 + floor(random() * 2)::INT ELSE 1 END,
          NOW() - (v_day || ' days')::INTERVAL + (8 + v_course)::TEXT::INTERVAL * INTERVAL '1 hour' + (60 + random() * 2400)::INT * INTERVAL '1 second',
          CASE WHEN v_status = 'verified' THEN NOW() - (v_day || ' days')::INTERVAL + (8 + v_course)::TEXT::INTERVAL * INTERVAL '1 hour' + (120 + random() * 2400)::INT * INTERVAL '1 second' ELSE NULL END
        );
      END LOOP;

      -- Update session totals
      UPDATE sessions SET
        total_verified = v_verified,
        total_flagged = v_flagged,
        total_rejected = v_rejected
      WHERE id = v_session_id;

    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- ANOMALY FLAGS (from recent sessions)
-- ============================================================
INSERT INTO anomaly_flags (session_id, student_id, flag_type, severity, details, resolved, created_at)
SELECT
  ar.session_id,
  ar.student_id,
  'weak_presence'::flag_type,
  0.65 + random() * 0.3,
  jsonb_build_object('message', 'QR passed but BLE below threshold', 'rssi_median', ar.rssi_median),
  random() < 0.3,
  ar.scanned_at
FROM attendance_records ar
WHERE ar.status = 'flagged'
ORDER BY ar.scanned_at DESC
LIMIT 15;

-- Cluster sync flags
INSERT INTO anomaly_flags (session_id, student_id, flag_type, severity, details, resolved, created_at)
SELECT DISTINCT ON (ar.session_id)
  ar.session_id,
  ar.student_id,
  'cluster_sync'::flag_type,
  0.5 + random() * 0.3,
  jsonb_build_object('message', 'Multiple students scanned within 3s window', 'student_count', 4 + floor(random() * 4)::INT),
  random() < 0.2,
  ar.scanned_at
FROM attendance_records ar
WHERE ar.status = 'verified'
ORDER BY ar.session_id, ar.scanned_at
LIMIT 8;

-- Duplicate device flags
INSERT INTO anomaly_flags (session_id, student_id, flag_type, severity, details, resolved, created_at)
SELECT
  ar.session_id,
  ar.student_id,
  'duplicate_device'::flag_type,
  0.8 + random() * 0.2,
  jsonb_build_object('message', 'Same device fingerprint used by multiple students'),
  false,
  ar.scanned_at
FROM attendance_records ar
WHERE ar.status = 'rejected'
ORDER BY ar.scanned_at DESC
LIMIT 5;

-- ============================================================
-- RISK SCORES (per-student, per-course aggregates)
-- ============================================================
INSERT INTO risk_scores (student_id, course_id, session_id, score, factors, calculated_at)
SELECT
  ar.student_id,
  s.course_id,
  ar.session_id,
  LEAST(1.0, (
    CASE WHEN ar.status = 'flagged' THEN 0.4 ELSE 0.1 END
    + CASE WHEN ar.status = 'rejected' THEN 0.5 ELSE 0.0 END
    + CASE WHEN ar.rssi_median < -70 THEN 0.2 ELSE 0.05 END
    + random() * 0.15
  ))::REAL,
  jsonb_build_object(
    'rssi_consistency', round((random() * 0.8 + 0.1)::numeric, 2),
    'scan_timing', round((random() * 0.6 + 0.1)::numeric, 2),
    'attempt_count', round((CASE WHEN ar.scan_attempts > 1 THEN 0.5 + random() * 0.4 ELSE random() * 0.3 END)::numeric, 2),
    'historical_flags', round((random() * 0.5)::numeric, 2),
    'cluster_score', round((random() * 0.4)::numeric, 2)
  ),
  ar.scanned_at
FROM attendance_records ar
JOIN sessions s ON ar.session_id = s.id
WHERE ar.status IN ('flagged', 'rejected')
   OR random() < 0.15;
