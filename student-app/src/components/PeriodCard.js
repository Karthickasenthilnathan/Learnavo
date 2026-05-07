/**
 * PeriodCard — Individual schedule card with state-based styling
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';

const STATE_CONFIG = {
  upcoming: {
    borderColor: 'rgba(255,255,255,0.06)',
    bgColor: 'rgba(255,255,255,0.02)',
    badge: null,
    badgeColor: null,
    buttonEnabled: false,
    opacity: 0.5,
  },
  active: {
    borderColor: Colors.emerald500,
    bgColor: 'rgba(16,185,129,0.08)',
    badge: 'IN PROGRESS',
    badgeColor: Colors.emerald500,
    buttonEnabled: true,
    opacity: 1,
  },
  marked: {
    borderColor: Colors.emerald600,
    bgColor: 'rgba(16,185,129,0.06)',
    badge: 'MARKED',
    badgeColor: Colors.emerald500,
    buttonEnabled: false,
    opacity: 1,
  },
  absent: {
    borderColor: 'rgba(239,68,68,0.2)',
    bgColor: 'rgba(239,68,68,0.04)',
    badge: 'ABSENT',
    badgeColor: Colors.danger,
    buttonEnabled: false,
    opacity: 0.6,
  },
  flagged: {
    borderColor: 'rgba(245,158,11,0.3)',
    bgColor: 'rgba(245,158,11,0.06)',
    badge: 'FLAGGED',
    badgeColor: Colors.warning,
    buttonEnabled: false,
    opacity: 0.8,
  },
};

export default function PeriodCard({ period, onMarkAttendance, isDemo }) {
  // In demo mode, force the card to appear as 'active' so button is always visible
  const effectiveState = isDemo && period.state !== 'marked' ? 'active' : period.state;
  const config = STATE_CONFIG[effectiveState] || STATE_CONFIG.upcoming;

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: config.borderColor,
          backgroundColor: config.bgColor,
          opacity: config.opacity,
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {period.startTime} – {period.endTime}
          </Text>
        </View>
        {config.badge && (
          <View style={[styles.badge, { backgroundColor: config.badgeColor + '20' }]}>
            <View style={[styles.badgeDot, { backgroundColor: config.badgeColor }]} />
            <Text style={[styles.badgeText, { color: config.badgeColor }]}>
              {config.badge}
            </Text>
          </View>
        )}
        {isDemo && effectiveState === 'active' && (
          <View style={[styles.badge, { backgroundColor: Colors.emerald500 + '20', marginLeft: 6 }]}>
            <Text style={[styles.badgeText, { color: Colors.emerald400 }]}>
              DEMO
            </Text>
          </View>
        )}
      </View>

      {/* Subject name */}
      <Text style={styles.subjectName}>{period.subjectName}</Text>
      <Text style={styles.courseCode}>{period.courseCode}</Text>

      {/* Details row */}
      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>🏫</Text>
          <Text style={styles.detailText}>
            {period.classroomName} • {period.building}
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>👩‍🏫</Text>
          <Text style={styles.detailText}>{period.staffName}</Text>
        </View>
      </View>

      {/* Marked time */}
      {period.state === 'marked' && period.markedAt && (
        <View style={styles.markedRow}>
          <Text style={styles.markedIcon}>✓</Text>
          <Text style={styles.markedText}>
            Marked at {new Date(period.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      )}

      {/* Mark Attendance button — show for active state or demo mode */}
      {(effectiveState === 'active') && (
        <TouchableOpacity
          style={styles.markButton}
          onPress={() => onMarkAttendance(period)}
          activeOpacity={0.8}
        >
          <Text style={styles.markButtonText}>Mark Attendance</Text>
          <Text style={styles.markButtonArrow}>→</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeContainer: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  timeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  subjectName: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  courseCode: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    color: Colors.emerald400,
    marginBottom: Spacing.md,
  },
  detailsRow: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  detailText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  markedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: Colors.successBg,
    padding: 10,
    borderRadius: BorderRadius.sm,
  },
  markedIcon: {
    fontSize: 16,
    color: Colors.success,
    fontWeight: '700',
    marginRight: 8,
  },
  markedText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.success,
  },
  markButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.emerald500,
    borderRadius: BorderRadius.md,
    padding: 14,
    marginTop: Spacing.lg,
    shadowColor: Colors.emerald500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  markButtonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  markButtonArrow: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginLeft: 8,
  },
});
