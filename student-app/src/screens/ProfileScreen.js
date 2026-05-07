/**
 * ProfileScreen — Student info, stats, threshold warnings, logout
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { studentApi, demoApi } from '../api/client';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      let data;
      try {
        const res = await studentApi.getProfile();
        data = res.data;
      } catch {
        const res = await demoApi.getProfile();
        data = res.data;
      }
      setProfile(data);
    } catch (err) {
      console.warn('Profile fetch error:', err);
      // Offline fallback
      setProfile({
        user: user || { name: 'Student', email: 'student@edu', student_id: 'CS2023001', department: 'Computer Science' },
        stats: { totalSessions: 42, attended: 35, enrolledCourses: 3, overallPct: 83.3 },
        warnings: [],
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const stats = profile?.stats || {};
  const warnings = profile?.warnings || [];
  const pctColor = (stats.overallPct || 0) >= 75 ? Colors.success : Colors.danger;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) || 'S'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Student'}</Text>
          <Text style={styles.enrollment}>{user?.student_id || 'CS2023001'}</Text>
          <View style={styles.departmentBadge}>
            <Text style={styles.departmentText}>
              {user?.department || 'Computer Science'}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: pctColor }]}>
              {stats.overallPct || 0}%
            </Text>
            <Text style={styles.statLabel}>Overall Attendance</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.attended || 0}</Text>
            <Text style={styles.statLabel}>Sessions Attended</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSessions || 0}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.enrolledCourses || 0}</Text>
            <Text style={styles.statLabel}>Courses Enrolled</Text>
          </View>
        </View>

        {/* Attendance ring visual */}
        <View style={styles.ringContainer}>
          <View style={styles.ringOuter}>
            <View
              style={[
                styles.ringFill,
                {
                  borderColor: pctColor,
                  borderTopColor: 'rgba(255,255,255,0.06)',
                  transform: [{ rotate: `${((stats.overallPct || 0) / 100) * 360}deg` }],
                },
              ]}
            />
            <View style={styles.ringInner}>
              <Text style={[styles.ringPct, { color: pctColor }]}>
                {stats.overallPct || 0}%
              </Text>
              <Text style={styles.ringLabel}>Attendance</Text>
            </View>
          </View>
        </View>

        {/* Warnings */}
        {warnings.length > 0 && (
          <View style={styles.warningSection}>
            <Text style={styles.sectionTitle}>⚠ ATTENDANCE WARNINGS</Text>
            {warnings.map((w, i) => (
              <View key={i} style={styles.warningCard}>
                <View style={styles.warningHeader}>
                  <Text style={styles.warningCourse}>{w.course_name}</Text>
                  <Text style={styles.warningPct}>{w.pct}%</Text>
                </View>
                <Text style={styles.warningMessage}>
                  Your attendance in {w.course_code} is below the 75% threshold.
                  Attend {Math.ceil(((0.75 * (parseInt(w.total_sessions) + 3)) - parseInt(w.attended)))} more
                  classes to reach safe zone.
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Account info */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
          <View style={styles.infoCard}>
            {[
              { label: 'Email', value: user?.email || 'student@edu' },
              { label: 'Enrollment', value: user?.student_id || 'CS2023001' },
              { label: 'Department', value: user?.department || 'Computer Science' },
              { label: 'Role', value: 'Student' },
            ].map((item, i) => (
              <View key={i} style={[styles.infoRow, i > 0 && styles.infoRowBorder]}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>LearnAvo Student v1.0</Text>
          <Text style={styles.appInfoText}>
            Attendance you can prove. Integrity you can measure.
          </Text>
        </View>

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
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
  },
  avatarLarge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.white,
  },
  name: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  enrollment: {
    fontSize: FontSizes.md,
    color: Colors.emerald400,
    fontWeight: '600',
    marginTop: 4,
  },
  departmentBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  departmentText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  ringOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFill: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
  },
  ringInner: {
    alignItems: 'center',
  },
  ringPct: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  warningSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  warningCard: {
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  warningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  warningCourse: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.warning,
    flex: 1,
  },
  warningPct: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.danger,
  },
  warningMessage: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  infoCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  logoutBtn: {
    marginHorizontal: Spacing.xl,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: BorderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoutBtnText: {
    color: Colors.danger,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  appInfoText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
});
