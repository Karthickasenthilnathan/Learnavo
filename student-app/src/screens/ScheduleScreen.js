/**
 * ScheduleScreen — Today's timetable with period cards
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { studentApi, demoApi } from '../api/client';
import PeriodCard from '../components/PeriodCard';
import { Colors, FontSizes, Spacing, BorderRadius } from '../theme/colors';

export default function ScheduleScreen() {
  const [periods, setPeriods] = useState([]);
  const [date, setDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigation = useNavigation();

  const fetchSchedule = useCallback(async () => {
    try {
      let data;
      try {
        const res = await studentApi.getScheduleToday();
        data = res.data;
      } catch {
        // Fallback to demo
        const res = await demoApi.getScheduleToday();
        data = res.data;
      }
      setPeriods(data.periods || []);
      setDate(data.date || new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.warn('Schedule fetch error:', err);
      // Offline fallback
      setPeriods(getOfflinePeriods());
      setDate(new Date().toISOString().split('T')[0]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();

    // Re-evaluate card states every 30 seconds
    const interval = setInterval(() => {
      setPeriods(prev => prev.map(p => ({
        ...p,
        state: recalculateState(p),
      })));
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSchedule]);

  const recalculateState = (period) => {
    if (period.state === 'marked') return 'marked';

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = period.startTime.split(':').map(Number);
    const [eh, em] = period.endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (currentTime >= endMins) return 'absent';
    if (currentTime >= startMins) return 'active';
    return 'upcoming';
  };

  const handleMarkAttendance = (period) => {
    navigation.navigate('AttendanceFlow', { period });
  };

  // Listen for attendance success and update card
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSchedule();
    });
    return unsubscribe;
  }, [navigation, fetchSchedule]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedule();
  };



  const today = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hello, {user?.name?.split(' ')[0] || 'Student'} 👋
          </Text>
          <Text style={styles.dateText}>
            {dayNames[today.getDay()]}, {today.getDate()} {monthNames[today.getMonth()]} {today.getFullYear()}
          </Text>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0) || 'S'}
          </Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{periods.length}</Text>
          <Text style={styles.summaryLabel}>Classes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.emerald400 }]}>
            {periods.filter(p => p.state === 'active').length}
          </Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.success }]}>
            {periods.filter(p => p.state === 'marked').length}
          </Text>
          <Text style={styles.summaryLabel}>Marked</Text>
        </View>
      </View>

      {/* Period cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.emerald500}
            colors={[Colors.emerald500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>TODAY'S SCHEDULE</Text>

        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⏳</Text>
            <Text style={styles.emptyText}>Loading schedule...</Text>
          </View>
        ) : periods.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>No classes today!</Text>
            <Text style={styles.emptySubtext}>Enjoy your free day.</Text>
          </View>
        ) : (
          periods.map((period, idx) => (
            <PeriodCard
              key={period.id || idx}
              period={period}
              isDemo={idx === 0}
              onMarkAttendance={handleMarkAttendance}
            />
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getOfflinePeriods() {
  const now = new Date();
  const hour = now.getHours();
  return [
    { id: 1, courseId: 1, classroomId: 1, staffId: 1, subjectName: 'Data Structures & Algorithms', courseCode: 'CS301', classroomName: 'CS Lab 101', building: 'Block A', roomNumber: '101', staffName: 'Dr. Ananya Sharma', startTime: '09:00', endTime: '10:00', state: hour >= 10 ? 'absent' : hour >= 9 ? 'active' : 'upcoming', markedAt: null },
    { id: 2, courseId: 2, classroomId: 2, staffId: 1, subjectName: 'Database Management Systems', courseCode: 'CS302', classroomName: 'Lecture Hall B', building: 'Block B', roomNumber: '201', staffName: 'Dr. Ananya Sharma', startTime: '10:15', endTime: '11:15', state: hour >= 11 ? 'absent' : hour >= 10 ? 'active' : 'upcoming', markedAt: null },
    { id: 3, courseId: 3, classroomId: 3, staffId: 2, subjectName: 'Operating Systems', courseCode: 'CS303', classroomName: 'Seminar Room C', building: 'Block A', roomNumber: '305', staffName: 'Dr. Rajesh Kumar', startTime: '11:30', endTime: '12:30', state: hour >= 12 ? 'absent' : hour >= 11 ? 'active' : 'upcoming', markedAt: null },
    { id: 4, courseId: 1, classroomId: 1, staffId: 1, subjectName: 'DSA Lab', courseCode: 'CS301', classroomName: 'CS Lab 101', building: 'Block A', roomNumber: '101', staffName: 'Dr. Ananya Sharma', startTime: '14:00', endTime: '15:00', state: hour >= 15 ? 'absent' : hour >= 14 ? 'active' : 'upcoming', markedAt: null },
  ];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.emerald500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
  },

  summaryBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCount: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.bgCardBorder,
    marginVertical: 4,
  },
  scrollView: {
    flex: 1,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
