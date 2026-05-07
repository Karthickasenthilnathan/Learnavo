/**
 * HistoryScreen — Per-course attendance summary + date log
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { studentApi, demoApi } from '../api/client';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';

export default function HistoryScreen() {
  const [summary, setSummary] = useState([]);
  const [log, setLog] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchHistory = useCallback(async () => {
    try {
      let data;
      try {
        const res = await studentApi.getAttendanceHistory();
        data = res.data;
      } catch {
        const res = await demoApi.getAttendanceHistory();
        data = res.data;
      }
      setSummary(data.summary || []);
      setLog(data.log || []);
    } catch (err) {
      console.warn('History fetch error:', err);
      // Offline mock
      setSummary([
        { course_id: 1, course_name: 'Data Structures & Algorithms', course_code: 'CS301', total_sessions: 14, attended_sessions: 12, attendance_pct: 85.7 },
        { course_id: 2, course_name: 'Database Management Systems', course_code: 'CS302', total_sessions: 14, attended_sessions: 10, attendance_pct: 71.4 },
        { course_id: 3, course_name: 'Operating Systems', course_code: 'CS303', total_sessions: 14, attended_sessions: 13, attendance_pct: 92.9 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getPctColor = (pct) => {
    if (pct >= 85) return Colors.success;
    if (pct >= 75) return Colors.warning;
    return Colors.danger;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
        <Text style={styles.subtitle}>{user?.student_id || 'CS2023001'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchHistory(); }} tintColor={Colors.emerald500} colors={[Colors.emerald500]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Course Summary Cards */}
        <Text style={styles.sectionTitle}>COURSE-WISE SUMMARY</Text>
        {summary.map((course, idx) => {
          const pct = parseFloat(course.attendance_pct) || 0;
          const color = getPctColor(pct);
          const isBelowThreshold = pct < 75;

          return (
            <View key={course.course_id || idx} style={styles.courseCard}>
              <View style={styles.courseHeader}>
                <View>
                  <Text style={styles.courseName}>{course.course_name}</Text>
                  <Text style={styles.courseCode}>{course.course_code}</Text>
                </View>
                <View style={[styles.pctBadge, { backgroundColor: color + '18' }]}>
                  <Text style={[styles.pctText, { color }]}>{pct}%</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]}
                />
                {/* 75% threshold line */}
                <View style={styles.thresholdLine} />
              </View>

              <View style={styles.courseStats}>
                <Text style={styles.statText}>
                  {course.attended_sessions || 0} / {course.total_sessions || 0} sessions
                </Text>
                {isBelowThreshold && (
                  <View style={styles.warningBadge}>
                    <Text style={styles.warningBadgeText}>⚠ Below 75%</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Recent attendance log */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.xxl }]}>
          RECENT ATTENDANCE LOG
        </Text>
        {log.length === 0 ? (
          <View style={styles.emptyLog}>
            <Text style={styles.emptyLogText}>No attendance records yet</Text>
          </View>
        ) : (
          log.slice(0, 15).map((entry, idx) => (
            <View key={entry.id || idx} style={styles.logItem}>
              <View
                style={[
                  styles.logDot,
                  {
                    backgroundColor:
                      entry.status === 'verified' ? Colors.success
                        : entry.status === 'flagged' ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              />
              <View style={styles.logContent}>
                <Text style={styles.logCourse}>
                  {entry.course_name || entry.course_code}
                </Text>
                <Text style={styles.logDate}>
                  {new Date(entry.scanned_at || entry.session_date).toLocaleDateString()} •{' '}
                  {entry.status === 'verified' ? 'Present' : entry.status === 'flagged' ? 'Flagged' : 'Absent'}
                </Text>
              </View>
              <Text
                style={[
                  styles.logStatus,
                  {
                    color:
                      entry.status === 'verified' ? Colors.success
                        : entry.status === 'flagged' ? Colors.warning
                        : Colors.danger,
                  },
                ]}
              >
                {entry.status === 'verified' ? '✓' : entry.status === 'flagged' ? '⚠' : '✕'}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  courseCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  courseName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  courseCode: {
    fontSize: FontSizes.sm,
    color: Colors.emerald400,
    fontWeight: '500',
    marginTop: 2,
  },
  pctBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  pctText: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  thresholdLine: {
    position: 'absolute',
    left: '75%',
    top: -2,
    bottom: -2,
    width: 2,
    backgroundColor: Colors.warning,
    opacity: 0.6,
  },
  courseStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  warningBadge: {
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  warningBadgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.warning,
  },
  emptyLog: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyLogText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.md,
  },
  logContent: {
    flex: 1,
  },
  logCourse: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  logDate: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  logStatus: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginLeft: Spacing.md,
  },
});
